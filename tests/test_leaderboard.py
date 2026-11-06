"""Regression checks between the browser data and the paper's figure/table CSVs."""
import csv
import hashlib
import json
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
DATA = json.loads((ROOT / "public/release/leaderboard.json").read_text())


def csv_rows(relative):
    with (ROOT / relative).open(newline="", encoding="utf-8") as handle:
        return list(csv.DictReader(handle))


class LeaderboardTests(unittest.TestCase):
    def test_split_mode_coverage_and_inventory(self):
        self.assertEqual(len(DATA["results"]), 36)
        for partition in ("group_test", "topic_test"):
            for mode in ("v0", "v1_5"):
                selected = [r for r in DATA["results"] if (r["partition"],r["mode"]) == (partition,mode)]
                self.assertEqual(len(selected), 9)
                self.assertEqual([r["kind"] for r in selected], ["base"]*7 + ["sft","baseline"])
        self.assertEqual(DATA["inventory"]["available_groups"], 697)
        self.assertEqual(DATA["inventory"]["subjects"], 2788)
        self.assertEqual(DATA["inventory"]["topics"], 107)

    def test_all_errors_and_intervals_match_paper_figure_inputs(self):
        count_fields = {
            "public_stance_alignment_abs":"public_alignment_count", "private_stance_alignment_abs":"private_alignment_count",
            "public_stance_change_error_abs":"public_change_count", "private_stance_change_error_abs":"private_change_count",
            "public_opinion_convergence_error":"public_group_count", "private_opinion_convergence_error":"private_group_count",
        }
        for prefix in ("group", "topic"):
            figures = csv_rows(f"public/camera-ready/{prefix}-errors.csv")
            expected = {(row["model"],row["simulation_version"]): row for row in figures}
            for row in DATA["results"]:
                if row["partition"] != f"{prefix}_test":
                    continue
                reference = expected[(row["modelId"],row["mode"])]
                for field,result in row["metrics"].items():
                    self.assertEqual(result["value"], float(reference[field]))
                    self.assertEqual(result["ciLow"], float(reference[field+"_ci_low"]))
                    self.assertEqual(result["ciHigh"], float(reference[field+"_ci_high"]))
                    self.assertEqual(result["count"], int(reference[count_fields[field]]))

    def test_all_cross_model_values_match_paper_tables(self):
        errors = csv_rows("public/release/cross_model_private_errors.csv")
        convergence = csv_rows("public/release/cross_model_convergence.csv")
        compared = 0
        for row in DATA["crossModel"]:
            for role in ("base","SFT"):
                reference = next(r for r in errors if (r["family"],r["split"],r["role"]) == (row["family"],row["partition"],role))
                for field,result in row["errors"].items():
                    self.assertEqual(result[role], float(reference[field]))
                    compared += 1
            for channel,values in row["convergence"].items():
                for role,value in values.items():
                    reference = next(r for r in convergence if (r["family"],r["split"],r["role"],r["channel"]) == (row["family"],row["partition"],role,channel))
                    self.assertEqual(value, float(reference["mean_delta_sd"]))
                    compared += 1
        self.assertEqual(compared, 72)

    def test_published_assets_keep_recorded_hashes(self):
        manifest = json.loads((ROOT / "public/release/leaderboard-provenance.json").read_text())
        self.assertEqual(manifest["datasetRevision"], DATA["datasetRevision"])
        for entry in manifest["sourceFiles"]:
            if "website" in entry:
                self.assertEqual(hashlib.sha256((ROOT / entry["website"]).read_bytes()).hexdigest(), entry["sha256"])


if __name__ == "__main__":
    unittest.main()
