import gzip
import hashlib
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("exporter", ROOT / "scripts/build_explorer_data.py")
exporter = importlib.util.module_from_spec(spec)
spec.loader.exec_module(exporter)


class ExportSemantics(unittest.TestCase):
    def row(self, **updates):
        return {"event_type": "tweet", "chat_round_order": "1.0", "worker_id": "abcdeXYZ", "text": "human statement", "llm_text": "generated statement", "likert_pred": "5", "llm_validity": "INVALID", **updates}

    def test_generated_text_and_label_remain_paired_at_conditioned_stages(self):
        for event in ("Initial Opinion", "tweet"):
            result = exporter.display_rows([self.row(event_type=event)], {"abcde": "p1"}, "model")[0]
            self.assertEqual(result["text"], "generated statement")
            self.assertEqual(result["stance"], 5)
            self.assertEqual(result["validity"], "INVALID")
            self.assertFalse(result["conditioned"])

    def test_blank_model_text_is_never_replaced_with_human_text(self):
        for round_number in ("1", "2", "3"):
            result = exporter.display_rows([self.row(llm_text="", chat_round_order=round_number)], {"abcde": "p1"}, "model")[0]
            self.assertEqual(result["text"], "")
            self.assertEqual(result["conditioned"], round_number == "1")

    def test_conditioned_input_is_identified_without_rewriting_text(self):
        result = exporter.display_rows([self.row(llm_text="human  statement")], {"abcde": "p1"}, "model")[0]
        self.assertTrue(result["conditioned"])
        self.assertEqual(result["text"], "human  statement")

    def test_participant_truncation_collisions_are_rejected(self):
        with self.assertRaises(ValueError):
            exporter.participant_map([{"worker_id": "abcdeONE"}, {"worker_id": "abcdeTWO"}])
        with self.assertRaises(ValueError):
            exporter.display_rows([self.row(worker_id="zzzzz")], {"abcde": "p1"}, "model")

    def test_human_reference_does_not_fall_back_to_another_model(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            other = root / "base/human_llm/session/Llama-3.1-8B-Instruct"
            other.mkdir(parents=True)
            (other / "opinion_human_memory_gpt-5-mini_v0.csv").write_text("not the paired reference")
            model = {"root": "base", "source_model": "gpt-5-mini"}
            self.assertIsNone(exporter.human_path(root, "session", model, "v0"))


class ReleaseInventory(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.root = ROOT / "data/explorers"
        cls.index = json.loads((cls.root / "index.json").read_text())
        cls.demographics = json.loads((cls.root / "demographics.json").read_text())

    def test_inventory_and_persona_denominators(self):
        self.assertEqual(self.index["counts"], {"sessions": 697, "participants": 2788, "topics": 107})
        self.assertEqual(len(self.index["sessions"]), 697)
        self.assertEqual(len(self.index["topics"]), 107)
        self.assertEqual(len(self.demographics["personas"]), 2788)
        self.assertEqual(self.demographics["recorded_sessions"], 708)
        self.assertEqual(self.demographics["participant_records"], 2832)
        self.assertEqual(self.demographics["survey_respondents"], 2640)
        identities = {(p["session"], p["id"]) for p in self.demographics["personas"]}
        self.assertEqual(len(identities), 2788)
        self.assertEqual(set(self.index["modes"]), {"v0", "v1_5"})
        models = {m["id"] for m in self.index["models"]}
        self.assertIn("gpt-5-mini", models)
        self.assertTrue({"llama-sft-group", "llama-sft-topic", "qwen-sft-group", "mistral-sft-topic"}.issubset(models))
        self.assertFalse(any("tulu" in name for name in models))

    def test_every_exported_file_has_the_declared_checksum(self):
        manifest = json.loads((self.root / "manifest_20261106.json").read_text())
        self.assertEqual(manifest["dataset_commit"], exporter.DATASET_COMMIT)
        for item in manifest["files"]:
            path = self.root / item["path"]
            self.assertEqual(path.stat().st_size, item["size_bytes"], item["path"])
            self.assertEqual(hashlib.sha256(path.read_bytes()).hexdigest(), item["sha256"], item["path"])

    def test_all_sessions_and_model_runs_use_local_participant_ids(self):
        for session in self.index["sessions"]:
            payload = json.loads(gzip.decompress((self.root / "sessions" / (session["id"] + ".json.gz")).read_bytes()))
            people = {p["id"] for p in payload["participants"]}
            self.assertEqual(people, {"p1", "p2", "p3", "p4"})
            self.assertEqual(set(payload["runs"]), set(session["available"]))
            for run in payload["runs"].values():
                self.assertIn(run["human_reference"], payload["human"])
                for row in run["rows"]:
                    self.assertIn(row["participant"], people)
                    self.assertTrue(row["recipient"] is None or row["recipient"] in people)
                self.assertIn("/" + payload["prefix"] + "/", run["source"])
                self.assertIn("/" + payload["prefix"] + "/", run["human_source"])


if __name__ == "__main__":
    unittest.main()
