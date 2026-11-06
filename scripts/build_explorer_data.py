"""Export compact website views from the public, pinned DEBATE release.

Only published event text, cached labels and survey fields are exported. Prompts,
judge explanations and timing metadata are omitted. No model text is invented.
"""
from __future__ import annotations

import argparse
import ast
from collections import Counter
import csv
import gzip
import hashlib
import json
import math
from pathlib import Path
import shutil

DATASET_COMMIT = "39ae48ab86048a4c480e224c9a6badfabde79a39"
MODES = {"v0": "Full Dynamics Simulation", "v1_5": "Next Message Prediction"}
EVENTS = {"Initial Opinion", "tweet", "message_sent", "Post Opinion"}
FIELDS = ["age", "gender", "ethnicity", "education", "income", "occupation", "politicalIdentity", "politicalViews", "bibleBelief", "evangelical", "religion", "maritalStatus", "childrenSchool", "residence", "origin", "residency"]
BASE = [("gpt-5-mini", "gpt-5-mini"), ("gpt-4o-mini", "gpt-4o-mini-2024-07-18"), ("gemini-flash-lite", "gemini-2.5-flash-lite"), ("mistral-7b", "Mistral-7B-Instruct-v0.3"), ("qwen-32b", "Qwen2.5-32B-Instruct"), ("llama-70b", "Llama-3.1-70B-Instruct"), ("llama-8b", "Llama-3.1-8B-Instruct")]
MODELS = [{"id": key, "label": name, "root": "base", "source_model": name, "mask_source": "main"} for key, name in BASE]
MODELS += [{"id": "qwen-4b", "label": "Qwen3.5-4B", "root": "qwen", "source_model": "Qwen3.5-4B", "mask_source": "qwen"}]
for split in ("group", "topic"):
    MODELS += [
        {"id": f"llama-sft-{split}", "label": f"Llama-3.1-8B SFT ({split} split)", "root": "llama", "source_model": f"ft:Llama-3.1-8B-Instruct-SFT-20260608-bd-real:bd-{split}-5epochs", "mask_source": "main", "training_split": split},
        {"id": f"qwen-sft-{split}", "label": f"Qwen3.5-4B SFT ({split} split)", "root": "qwen", "source_model": f"ft:Qwen3.5-4B-SFT-20260724:both-{split}-3epochs-unsloth", "mask_source": "qwen", "training_split": split},
        {"id": f"mistral-sft-{split}", "label": f"Mistral-7B SFT ({split} split)", "root": "mistral", "source_model": f"ft:Mistral-7B-Instruct-v0.3-SFT-20260725-bd-unsloth:bd-{split}-3epochs", "mask_source": "main", "training_split": split},
    ]


def encode(value):
    return json.dumps(value, ensure_ascii=False, separators=(",", ":"), allow_nan=False).encode()


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def rows(path):
    with path.open(newline="", encoding="utf-8") as handle:
        return list(csv.DictReader(handle))


def number(value):
    try:
        value = float(value)
        return value if math.isfinite(value) else None
    except (TypeError, ValueError):
        return None


def choices(value):
    value = str(value or "").strip()
    if value.lower() in {"", "nan", "null"}:
        return []
    if value.startswith("["):
        parsed = ast.literal_eval(value)
        if not isinstance(parsed, (list, tuple)):
            raise ValueError("Expected a list-encoded survey answer")
        return list(dict.fromkeys(str(v).strip() for v in parsed if str(v).strip()))
    return [value]


def participant_map(raw):
    ids = sorted({row["worker_id"].strip() for row in raw if row.get("worker_id", "").strip()})
    mapping = {}
    for index, worker in enumerate(ids, 1):
        short = worker[:5]
        if short in mapping:
            raise ValueError("Truncated participant IDs collide within a session")
        mapping[short] = f"p{index}"
    return mapping


def display_rows(records, mapping, source):
    exported = []
    for row in records:
        event = row.get("event_type")
        if event not in EVENTS:
            continue
        worker = (row.get("worker_id") or row.get("sender_id") or "").strip()
        if worker[:5] not in mapping:
            raise ValueError(f"Unknown participant key in {event}")
        round_number = number(row.get("chat_round_order"))
        text = row.get("text", "") if source == "human" else row.get("llm_text", "")
        same_text = " ".join((text or "").split()) == " ".join(row.get("text", "").split())
        conditioned_stage = event == "Initial Opinion" or (event == "tweet" and round_number == 1)
        conditioned = source == "model" and conditioned_stage and (not (text or "").strip() or same_text)
        # Some historical caches contain distinct generated text even at a
        # normally conditioned stage. Preserve that text and its paired label.
        # Blank model text always remains blank, including conditioned inputs.
        label = row.get("label_pred", "").strip()
        stance = number(row.get("likert_pred"))
        participant_rating = number(row.get("sliderValue")) if source == "human" else None
        validity = (row.get("human_validity" if source == "human" else "llm_validity") or row.get("validity") or "").strip().upper()
        recipient = (row.get("recipient_id") or "").strip()
        exported.append({
            "participant": mapping[worker[:5]], "recipient": mapping.get(recipient[:5]),
            "event": event, "round": round_number, "order": number(row.get("event_order")),
            "text": text or "", "stance": stance, "stance_label": label,
            "participant_rating": participant_rating, "validity": validity or None,
            "conditioned": conditioned,
        })
    return exported


def human_path(inputs, prefix, model, mode):
    filename = f"opinion_human_memory_gpt-5-mini_{mode}.csv"
    root = inputs / model["root"] / "human_llm" / prefix
    path = root / model["source_model"] / filename
    if path.exists():
        return path
    # The learned-model evaluator permits a session-level paired human file,
    # but does not borrow another model's human annotations for this pairing.
    path = root / filename
    return path if path.exists() else None


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--data-root", type=Path, required=True, help="Extracted public DEBATE release root")
    parser.add_argument("--demographics", type=Path, required=True, help="Verified reproduction demographics/aggregates.json")
    parser.add_argument("--output-dir", type=Path, default=Path("data/explorers"))
    args = parser.parse_args()
    inputs = args.data_root.resolve() / "reproduction/inputs"
    output = args.output_dir.resolve()
    (output / "sessions").mkdir(parents=True, exist_ok=True)
    masks = {}
    source_hashes = {}

    def read(path):
        source_hashes[path.relative_to(inputs).as_posix()] = sha(path)
        return rows(path)

    for source, root in (("main", inputs / "llama/data/sft_data/masks"), ("qwen", inputs / "qwen/masks")):
        masks[source] = {}
        for split in ("group", "topic"):
            masks[source][split] = {}
            for partition in ("train", "test"):
                path = root / f"{split}_{partition}_prefixes.txt"
                source_hashes[path.relative_to(inputs).as_posix()] = sha(path)
                for prefix in path.read_text().splitlines():
                    if prefix in masks[source][split]:
                        raise ValueError("Overlapping split masks")
                    masks[source][split][prefix] = partition
    raw_paths = {p.stem: p for p in (inputs / "llama/data/sft_data/group_split_data_bd").glob("*/*.csv")}
    assert len(raw_paths) == 708
    sessions, personas, topics = [], [], {}
    runs_by_model = Counter()
    files = []
    for prefix in sorted(masks["main"]["group"]):
        canonical = inputs / "base/human_llm" / prefix / "Llama-3.1-8B-Instruct/opinion_human_memory_gpt-5-mini_v0.csv"
        if not canonical.exists():
            continue
        raw = read(raw_paths[prefix])
        mapping = participant_map(raw)
        assert len(mapping) == 4
        session_id = hashlib.sha256(prefix.encode()).hexdigest()[:16]
        topic = " ".join(prefix.split("_")[2:-1])
        topic_id = hashlib.sha256(topic.encode()).hexdigest()[:16]
        topics.setdefault(topic_id, {"id": topic_id, "label": topic, "sessions": []})["sessions"].append(session_id)
        people = {person: {"id": person, "label": "Participant " + person[1:], "demographics": {}} for person in mapping.values()}
        for row in raw:
            field = row.get("field")
            if row.get("event_type") != "exit_survey" or field not in FIELDS:
                continue
            person = mapping[row["worker_id"][:5]]
            vals = choices(row.get("text"))
            value = vals if field in {"ethnicity", "childrenSchool"} else (vals[0] if vals else None)
            if field == "age":
                value = number(value)
                value = value if value is not None and 18 <= value <= 120 else None
            old = people[person]["demographics"].get(field)
            if old is not None and old != value:
                raise ValueError("Conflicting demographic answers")
            people[person]["demographics"][field] = value
        canonical_rows = display_rows(read(canonical), mapping, "human")
        human_sets = {"canonical": canonical_rows}
        digest_to_key = {hashlib.sha256(encode(canonical_rows)).hexdigest(): "canonical"}
        runs = {}
        for model in MODELS:
            for mode in MODES:
                llm = inputs / model["root"] / "human_llm" / prefix / model["source_model"] / f"opinion_llm_memory_gpt-5-mini_{mode}.csv"
                if not llm.exists():
                    continue
                human = human_path(inputs, prefix, model, mode)
                if human is None:
                    continue
                model_rows = display_rows(read(llm), mapping, "model")
                if not any(r["text"].strip() for r in model_rows if not r["conditioned"]):
                    continue
                human_rows = display_rows(read(human), mapping, "human")
                digest = hashlib.sha256(encode(human_rows)).hexdigest()
                if digest not in digest_to_key:
                    digest_to_key[digest] = "h" + str(len(digest_to_key))
                    human_sets[digest_to_key[digest]] = human_rows
                key = model["id"] + ":" + mode
                runs[key] = {"human_reference": digest_to_key[digest], "rows": model_rows,
                             "source": llm.relative_to(inputs).as_posix(), "human_source": human.relative_to(inputs).as_posix()}
                runs_by_model[key] += 1
        partitions = {source: {split: masks[source][split].get(prefix) for split in ("group", "topic")} for source in masks}
        session = {"id": session_id, "topic": topic_id, "date": prefix[:8], "label": f"Group {len(sessions)+1:03d}", "partitions": partitions, "available": list(runs)}
        sessions.append(session)
        for person in people.values():
            personas.append({"session": session_id, "topic": topic_id, **person})
        payload = {"id": session_id, "prefix": prefix, "participants": list(people.values()), "human": human_sets, "runs": runs}
        path = output / "sessions" / f"{session_id}.json.gz"
        path.write_bytes(gzip.compress(encode(payload), compresslevel=9, mtime=0))
        files.append({"path": f"sessions/{session_id}.json.gz", "sha256": sha(path), "size_bytes": path.stat().st_size})
        if len(sessions) % 100 == 0:
            print(f"Exported {len(sessions)} sessions", flush=True)
    assert len(sessions) == 697 and len(personas) == 2788 and len(topics) == 107
    demographic_source = json.loads(args.demographics.read_text())
    assert demographic_source["source_files"] == 708 and demographic_source["survey_respondents_any_item"] == 2640
    demographics = {"recorded_sessions": 708, "participant_records": 2832, "survey_respondents": 2640,
                    "survey_participation_percent": demographic_source["survey_participation_percent"],
                    "fields": {field: {key: val for key, val in record.items() if key in {"response_n", "multi_select", "categories", "mean", "sample_sd", "median"}} for field, record in demographic_source["fields"].items()},
                    "personas": personas}
    index = {"schema_version": 1, "dataset_commit": DATASET_COMMIT, "date": "2026-11-06", "counts": {"sessions": len(sessions), "participants": len(personas), "topics": len(topics)},
             "models": [{k: v for k, v in model.items() if k not in {"source_model", "root"}} for model in MODELS],
             "modes": MODES, "topics": sorted(topics.values(), key=lambda item: item["label"]), "sessions": sessions}
    for name, content in (("index.json", index), ("demographics.json", demographics)):
        path = output / name
        path.write_bytes(encode(content))
        files.append({"path": name, "sha256": sha(path), "size_bytes": path.stat().st_size})
    license_path = args.data_root / "licenses/human_inputs.txt"
    if not license_path.exists():
        raise FileNotFoundError("The release component license is required")
    shutil.copyfile(license_path, output / "LICENSE")
    manifest = {"dataset_repo": "seantw/DEBATE_LLM", "dataset_commit": DATASET_COMMIT, "date": "2026-11-06", "counts": index["counts"],
                "runs_by_model_and_mode": dict(runs_by_model), "sources": source_hashes, "files": files,
                "demographic_aggregate_sha256": sha(args.demographics),
                "selection": "697 canonical human-evaluation sessions; all retained model outputs for these sessions. Metric-specific validity exclusions are not applied to the conversation display.",
                "identity": "Session IDs are hashes of released session keys. Participant1–4 labels are scoped to each session; matching uses collision-checked first-five-character source keys.",
                "missing_model_text": "Absent generated text is never replaced with human text. Initial opinions and Round1 tweets are marked conditioned only when cached model text is blank or agrees with the paired human text; historical distinct generated text is preserved.",
                "demographics": "Overview uses all708 recorded sessions, with item-specific response denominators; persona browsing covers697 evaluation sessions."}
    (output / "manifest_20261106.json").write_bytes(encode(manifest))
    print(json.dumps({"counts": index["counts"], "run_count": sum(runs_by_model.values()), "compressed_session_bytes": sum(f["size_bytes"] for f in files if f["path"].endswith(".gz")), "source_files": len(source_hashes)}, indent=2))


if __name__ == "__main__":
    main()
