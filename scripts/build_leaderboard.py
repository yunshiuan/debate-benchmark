"""Export the website leaderboard from verified DEBATE reproduction outputs.

Run after `debate reproduce all`; no model calls or metric recomputation occur.
"""
import argparse
import csv
import hashlib
import json
import math
from pathlib import Path
import shutil

METRICS = [
    ("public_stance_alignment_abs", "Public", "Single-opinion", "public_alignment_count", "predictions"),
    ("public_stance_change_error_abs", "Public", "Opinion-update", "public_change_count", "participants"),
    ("public_opinion_convergence_error", "Public", "Opinion-convergence", "public_group_count", "groups"),
    ("private_stance_alignment_abs", "Private", "Single-opinion", "private_alignment_count", "predictions"),
    ("private_stance_change_error_abs", "Private", "Opinion-update", "private_change_count", "participants"),
    ("private_opinion_convergence_error", "Private", "Opinion-convergence", "private_group_count", "groups"),
]
PIN = "39ae48ab86048a4c480e224c9a6badfabde79a39"
ASSETS = {
    "group-errors": "primary/group_test_set/M1",
    "group-convergence": "primary/group_test_set/M3",
    "group-partner-gap": "primary/group_test_set/M5",
    "group-text": "primary/group_test_set/A1",
    "topic-errors": "primary/topic_test_set/A3",
    "topic-convergence": "primary/topic_test_set/A5",
    "topic-partner-gap": "primary/topic_test_set/A9",
    "topic-text": "primary/topic_test_set/A2",
}


def read_csv(path):
    with path.open(newline="", encoding="utf-8") as handle:
        return list(csv.DictReader(handle))


def number(value):
    parsed = float(value)
    if not math.isfinite(parsed):
        raise ValueError(f"Nonfinite leaderboard value: {value}")
    return parsed


def write_json(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2, ensure_ascii=False, allow_nan=False) + "\n")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--reproduction-root", type=Path, required=True)
    parser.add_argument("--site-root", type=Path, default=Path(__file__).resolve().parents[1])
    parser.add_argument("--experiment-png", type=Path, help="Optional current paper experiment diagram to copy without alteration")
    args = parser.parse_args()
    source = args.reproduction_root
    target = args.site_root
    for name in ("verification.json", "tables/dataset_verification.json", "tables/cross_model_verification.json"):
        report = json.loads((source / name).read_text())
        if not report.get("passed"):
            raise ValueError(f"Numeric reproduction verification did not pass: {name}")
    inputs = ["primary/csv/summary_metrics.csv", "tables/cross_model_private_errors.csv", "tables/cross_model_convergence.csv", "tables/dataset_totals.json"]
    metrics = [{"id": key, "channel": channel, "label": label, "countUnit": unit} for key,channel,label,_,unit in METRICS]
    results = []
    for row in read_csv(source / inputs[0]):
        model = row["model"]
        label = "Llama-3.1-8B SFT" if model.startswith("ft:") else row["model_label"]
        results.append({
            "modelId": model, "label": label, "partition": row["partition"], "mode": row["simulation_version"],
            "kind": "sft" if model.startswith("ft:") else "baseline" if model == "DeGroot fit" else "base",
            "availableGroups": int(row["prefixes_ok"]), "missingGroups": int(row["prefixes_missing"]),
            "metrics": {key: {"value": number(row[key]), "ciLow": number(row[key+"_ci_low"]),
                              "ciHigh": number(row[key+"_ci_high"]), "count": int(row[count])}
                        for key,_,_,count,_ in METRICS},
        })
    if len(results) != 36 or len({(r["modelId"],r["partition"],r["mode"]) for r in results}) != 36:
        raise ValueError("Expected 36 unique model/partition/mode rows")
    for partition in ("group_test", "topic_test"):
        for mode in ("v0", "v1_5"):
            subset = [row for row in results if row["partition"] == partition and row["mode"] == mode]
            if len(subset) != 9:
                raise ValueError(f"Expected nine models in {partition}/{mode}")
    private = read_csv(source / inputs[1])
    convergence = read_csv(source / inputs[2])
    comparisons = []
    for family,label in (("Llama","Llama-3.1-8B"),("Qwen","Qwen3.5-4B"),("Mistral","Mistral-7B")):
        for partition in ("group_test", "topic_test"):
            errors = {r["role"]: r for r in private if r["family"] == family and r["split"] == partition}
            deltas = {channel: {r["role"]: number(r["mean_delta_sd"]) for r in convergence
                               if r["family"] == family and r["split"] == partition and r["channel"] == channel}
                      for channel in ("public", "private")}
            comparisons.append({"family": family, "label": label, "partition": partition,
                "errors": {key: {role: number(errors[role][key]) for role in ("base","SFT")} for key,channel,_,_,_ in METRICS if channel == "Private"},
                "convergence": deltas})
    document = {"schemaVersion": 1, "releaseDate": "2026-11-06", "datasetRevision": PIN,
                "metrics": metrics, "results": results, "crossModel": comparisons,
                "inventory": json.loads((source / inputs[3]).read_text()),
                "partitions": {"group_test": {"label":"Group generalization", "description":"Unseen participant groups", "requestedGroups":135},
                               "topic_test": {"label":"Topic generalization", "description":"Unseen discussion topics", "requestedGroups":197}},
                "modes": {"v0":"Full Dynamics Simulation", "v1_5":"Next Message Prediction"}}
    write_json(target / "public/release/leaderboard.json", document)
    output_dir = target / "public/camera-ready"
    output_dir.mkdir(parents=True, exist_ok=True)
    sources = []
    for name in inputs:
        path = source / name
        record = {"source":name,"sha256":hashlib.sha256(path.read_bytes()).hexdigest()}
        if name.startswith("tables/cross_model_"):
            destination = target / "public/release" / path.name
            shutil.copyfile(path, destination)
            record["website"] = destination.relative_to(target).as_posix()
        sources.append(record)
    for name, relative in ASSETS.items():
        for extension in ("png","pdf","csv"):
            original = source / f"{relative}.{extension}"
            destination = output_dir / f"{name}.{extension}"
            shutil.copyfile(original, destination)
            sources.append({"source":f"{relative}.{extension}", "website":destination.relative_to(target).as_posix(),
                            "sha256":hashlib.sha256(original.read_bytes()).hexdigest()})
    if args.experiment_png:
        shutil.copyfile(args.experiment_png, output_dir / "experiment.png")
    experiment = output_dir / "experiment.png"
    if experiment.exists():
        sources.append({"source":"Current paper experiment diagram", "website":"public/camera-ready/experiment.png",
                        "sha256":hashlib.sha256(experiment.read_bytes()).hexdigest()})
    write_json(target / "public/release/leaderboard-provenance.json", {"datasetRevision":PIN,"sourceFiles":sources})
    print(f"Exported {len(results)} result rows, {len(comparisons)} within-family comparisons, and {len(ASSETS)} figure families.")


if __name__ == "__main__":
    main()
