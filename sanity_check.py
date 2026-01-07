import csv
from collections import Counter

csv_path = (
    'result/eval_v3/validity/'
    '20250307_012440_A_"body_cleanse,"_in_which_you_consume_only_particular_kinds_of_nutrients_over_1-3_days,_helps_your_body_to_eliminate_toxins_01JNQ1111QV26WKRF8M8GPVRJZ'
    '/gpt-4o-mini-2024-07-18/simulation-llm-v0.csv'
)

rounds_of_interest = ["1.0", "2.0", "3.0"]

# For each round, store counts per worker_id
round_counts = {r: Counter() for r in rounds_of_interest}

with open(csv_path, newline="", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    for row in reader:
        if row.get("event_type") != "message_sent":
            continue

        round_id = row.get("chat_round_order")
        if round_id not in round_counts:
            continue

        worker_id = row.get("worker_id")
        if not worker_id:
            continue

        round_counts[round_id][worker_id] += 1

# Pretty-print results
for round_id in rounds_of_interest:
    print(f"Round {round_id}:")
    if not round_counts[round_id]:
        print("  (no message_sent events)")
        continue
    for worker_id, count in round_counts[round_id].items():
        print(f"  worker_id={worker_id}: {count}")