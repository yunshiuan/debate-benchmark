import argparse
import xlsxwriter
import pandas as pd
import os
import math
import glob
import re

# This is only for loading indiv bootstrap data, for main data, these args aren't really used
parser = argparse.ArgumentParser(description="Generate metrics tables in Excel format.")
parser.add_argument("--iteration", "-i", type=int, default=0, help="Type of split to use (default: round).")
parser.add_argument("--bootstrap", "-b", action="store_true", help="use bootstrap data")
args = parser.parse_args()

split_type = "round"  # or "round" or "topic"

# if golden, use v3 data solely, if not then mean data will be from v2
filter_type = "golden_groups"  # golden_players, golden_groups, none

# Output file
if not os.path.exists("bootstrap_tables"):
    os.makedirs("bootstrap_tables")
filename = f"bootstrap_tables/metrics_tables_bootstrap_iter{str(args.iteration).zfill(4)}.xlsx"

if not args.bootstrap:
    filename = f"metrics_tables.xlsx"

if filter_type != "none":
    filename = filename.replace(".xlsx", f"_{filter_type}.xlsx")
workbook = xlsxwriter.Workbook(filename)
worksheet = workbook.add_worksheet("Metrics")

if os.path.exists(filename):
    os.remove(filename)

# Set column widths + enable text wrapping
wrap_format = workbook.add_format({'text_wrap': True})
worksheet.set_column(0, 0, 25, wrap_format)  # Model column
for col in range(1, 23):  # Metric columns (now without separate SD columns)
    worksheet.set_column(col, col, 18, wrap_format)  # Wider to accommodate "score ± sd" format

# Base metric titles (we'll create headers with standard deviation columns)
base_metrics_message = [
    "semantic_similarity_mean", "likert_diff_mean", "n_word_diff_mean", "n_word_abs_diff_mean",
    "rouge_1_mean", "rouge_2_mean", "rouge_L_mean", "rouge_L_sum_mean", "bleu_mean", "valid_response_rate"
]

base_metrics_round = [
    "semantic_similarity_mean",
    "semantic_similarity_bipartite",

    "likert_diff_mean", 
    "likert_diff_bipartite", 
    "likert_diff_js", 

    "n_word_diff_mean",
    "n_word_diff_bipartite",
    "n_word_diff_js",

    "n_word_abs_diff_mean",
    "n_word_abs_diff_bipartite",
    "n_word_abs_diff_js",

    "rouge_1_mean",
    "rouge_2_mean", 
    "rouge_L_mean",
    "rouge_L_sum_mean",
    "bleu_mean",
    "rouge_1_bipartite",
    "rouge_2_bipartite", 
    "rouge_L_bipartite",
    "rouge_L_sum_bipartite",
    "bleu_bipartite",

    "valid_response_rate"
]

# Create headers (no longer need separate SD columns)
metric_headers_message = base_metrics_message  # Just use the base metrics as headers
metric_headers_round = base_metrics_round  # Just use the base metrics as headers


# Simulation versions
versions = [
    "Simulation Mode 1: Next Message Prediction (v2)",
    "Simulation Mode 2: Tweet-guided Conversation Simulation (v1)", 
    "Simulation Mode 3: Full Conversation Simulation (v0)"
]


# Model data (just model names now)
model_names = [
    "gpt-4o-mini-2024-07-18",
    # "gpt-4.1-mini-2025-04-14",
    # "gpt-4.1-nano-2025-04-14",
    # "gpt-4o-mini-2024-07-18-ablation",
    # "gpt-4o-mini-2024-07-18-ablation-v2",
    # "gpt-4o-mini-2024-07-18-ablation-v3",
    # "gpt-4o-mini-2024-07-18-ablation-v4",
    # "ft:gpt-4o-mini-2024-07-18:camer:group-split-all:BOvZjzvU",
    # "ft:gpt-4o-mini-2024-07-18:camer:round-split-all:BOvS862Y",
    # "ft:gpt-4o-mini-2024-07-18:camer:topic-split-all:BOqtcdMB",
    # "ft:gpt-4o-mini-2024-07-18:camer:round-split-valid:BRTJQLtG",
    "Llama-3.1-Tulu-3-8B-SFT",
    "Llama-3.1-8B-Instruct",
    "Llama-3.1-70B-Instruct",
    "Mistral-7B-Instruct-v0.3",
    "Qwen2.5-32B-Instruct"

    # "ft:Llama-3.1-8B-Instruct-DPO-20250919:depth-group-5epochs",
    # "ft:Llama-3.1-8B-Instruct-DPO-20250919:depth-round-5epochs",
    # "ft:Llama-3.1-8B-Instruct-DPO-20250919:depth-topic-5epochs"
    # "ft:gpt-4o-mini-2024-07-18:camer:sft-20251117-breadth-round-5epochs:Cco9WAxa",
    # "ft:gpt-4o-mini-2024-07-18:camer:sft-20251117-depth-group-5epochs:Cco3rccz",
    # "ft:gpt-4o-mini-2024-07-18:camer:sft-20251117-breadth-topic-5epochs:CcohY7h9",
    # "ft:gpt-4o-mini-2024-07-18:camer:sft-20251117-depth-topic-5epochs:Cco2uo9h",
    # "ft:gpt-4o-mini-2024-07-18:camer:sft-20251117-depth-round-5epochs:CcnvTYtM",

]

# sample_data = [
#     ["Instruct", "gpt-4o-mini-2024-07-18", "ft:gpt-4o-mini-2024-07-18:camer:group-split-all:BOvZjzvU", "placeholder", 0.47],
#     ["Base", "gpt-4o-mini-2024-07-18", "ft:gpt-4o-mini-2024-07-18:camer:round-split-all:BOvS862Y", "placeholder", 0.41],
#     ["SFT", "gpt-4o-mini-2024-07-18", "ft:gpt-4o-mini-2024-07-18:camer:topic-split-all:BOqtcdMB", "placeholder", 0.40],
#     ["DPO", "gpt-4o-mini-2024-07-18", "ft:gpt-4o-mini-2024-07-18:camer:round-split-valid:BRTJQLtG", "placeholder", 0.39],
#     ["RLVR", "Llama-3.1-8B-Instruct-SFT", "ft:Llama-3.1-8B-Instruct-SFT-20250711:group-5epochs", "placeholder", 0.48],
#     ["Instruct", "Llama-3.1-8B-Instruct-SFT", "ft:Llama-3.1-8B-Instruct-SFT-20250710:round-5epochs", "placeholder", 0.40],
#     ["Instruct", "Llama-3.1-8B-Instruct-SFT", "ft:Llama-3.1-8B-Instruct-SFT-20250710:topic-5epochs", "placeholder", 0.47],
#     ["Instruct", "Qwen2.5-32B-Instruct", "ft:Qwen2.5-32B-Instruct-SFT-20250710:round-5epochs", "placeholder", 0.40],
#     ["Instruct", "Mistral-7B-Instruct-v0.3", "ft:Mistral-7B-Instruct-v0.3-SFT-20250710:round-5epochs", "placeholder", 0.40],
# ]

# Extract all unique models from sample data
# all_models = list(set([row[2] for row in sample_data]))

# Function to load bootstrap data with standard deviations
def load_bootstrap_data(version, collection_type="depth"):
    """Load bootstrap data for a specific version and return dictionaries mapping model->metric->score/standard_deviation."""
    csv_path = f"result/eval_v2/human_llm/bootstrap_final_aggregated_results_{version}-{collection_type}.csv"
    
    if not os.path.exists(csv_path):
        print(f"Warning: Bootstrap CSV file not found for version {version}: {csv_path}")
        return {"message": {}, "round": {}}, {"message": {}, "round": {}}
    
    try:
        df = pd.read_csv(csv_path)
        
        # Separate message and round data
        df_message = df[df['type'].str.endswith('_message', na=False)]
        df_round = df[df['type'].str.endswith('_round', na=False)]
        
        # Filter out unwanted round metrics that have additional suffixes
        df_round_filtered = df_round[~df_round['type'].str.contains('_round_.*_', na=False)]
        
        # Create nested dictionaries: model -> metric -> score/standard_deviation
        message_scores = {}
        message_stds = {}
        round_scores = {}
        round_stds = {}
        
        # Process message data
        for _, row in df_message.iterrows():
            if pd.notna(row['score']) and pd.notna(row['standard_deviation']):
                model = row['model']
                metric_name = row['type'].replace('_message', '')
                
                if model not in message_scores:
                    message_scores[model] = {}
                    message_stds[model] = {}
                message_scores[model][metric_name] = row['score']
                message_stds[model][metric_name] = row['standard_deviation']
        
        # Process round data
        for _, row in df_round_filtered.iterrows():
            if pd.notna(row['score']) and pd.notna(row['standard_deviation']):
                model = row['model']
                metric_name = row['type'].replace('_round', '')
                
                if model not in round_scores:
                    round_scores[model] = {}
                    round_stds[model] = {}
                round_scores[model][metric_name] = row['score']
                round_stds[model][metric_name] = row['standard_deviation']
        
        return {"message": message_scores, "round": round_scores}, {"message": message_stds, "round": round_stds}
    except Exception as e:
        print(f"Error loading bootstrap CSV for version {version}: {e}")
        return {"message": {}, "round": {}}, {"message": {}, "round": {}}

# Function to load validity CSV data for a specific version
def load_validity_data(version):
    global filter_type
    """Load validity CSV data for a specific version and return a dictionary mapping model->valid_response_rate."""
    # csv_path = f"result/eval/validity/llm-{version}-{split_type}.csv"
    csv_path = f"result/eval_v3/validity_rate_{version}.csv"

    
    if not os.path.exists(csv_path):
        print(f"Warning: Validity CSV file not found for version {version}: {csv_path}")
        return {}
    
    try:
        df = pd.read_csv(csv_path)
        
        # Create dictionary: model -> valid_response_rate (1 - invalid_rate)
        validity_scores = {}
        
        # for _, row in df.iterrows():
        #     if pd.notna(row['combined']) and pd.notna(row['model']):
        #         model = row['model']
        #         invalid_rate = row['combined']
        #         valid_rate = 1 - invalid_rate  # Convert to valid response rate
        #         validity_scores[model] = valid_rate

        for _, row in df.iterrows():
            if pd.notna(row['rate_validity']) and pd.notna(row['model']):
                model = row['model']
                valid_rate = row['rate_validity']
                # valid_rate = 1 - invalid_rate  # Convert to valid response rate
                validity_scores[model] = valid_rate
        
        return validity_scores
    except Exception as e:
        print(f"Error loading validity CSV for version {version}: {e}")
        return {}

def load_informative_data(version):
    """Load validity CSV data for a specific version and return a dictionary mapping model->valid_response_rate for both train and test."""
    csv_path = f"result/eval/validity/llm-{version}-{split_type}.csv"
    
    if not os.path.exists(csv_path):
        print(f"Warning: Validity CSV file not found for version {version}: {csv_path}")
        return {"train": {}, "test": {}}
    
    try:
        df = pd.read_csv(csv_path)
        
        # Create dictionary: model -> valid_response_rate (1 - invalid_rate)
        informative_scores = {}
        
        for _, row in df.iterrows():
            if pd.notna(row['uninformative_combined']) and pd.notna(row['model']):
                model = row['model']
                uninformative_rate = row['uninformative_combined']
                informative_rate = 1 - uninformative_rate  # Convert to valid response rate
                informative_scores[model] = informative_rate
            # if pd.notna(row['uninformative_combined']) and pd.notna(row['model']):
            #     model = row['model']
            #     invalid_rate = row['uninformative_combined']
            #     valid_rate = 1 - invalid_rate  # Convert to valid response rate
            #     validity_scores[model] = valid_rate
        
        return informative_scores
    except Exception as e:
        print(f"Error loading validity CSV for version {version}: {e}")
        return {}
# Function to load CSV data for a specific version
def load_csv_data(version):
    """Load CSV data for a specific version and return a dictionary mapping model->metric->score for both message and round levels."""
    csv_path = f"result/eval_v2/human_llm/llm_report_{version}_depth.csv"
    
    if not os.path.exists(csv_path):
        print(f"Warning: CSV file not found for version {version}: {csv_path}")
        return {"message": {}, "round": {}}
    
    try:
        df = pd.read_csv(csv_path)
        
        # Separate message and round data
        df_message = df[df['type'].str.endswith('_message', na=False)]
        df_round = df[df['type'].str.endswith('_round', na=False)]
        
        # Filter out unwanted round metrics that have additional suffixes
        df_round_filtered = df_round[~df_round['type'].str.contains('_round_.*_', na=False)]
        
        # Create nested dictionaries: model -> metric -> score
        message_scores = {}
        round_scores = {}
        
        # Process message data
        for _, row in df_message.iterrows():
            if pd.notna(row['score']):
                model = row['model']
                metric_name = row['type'].replace('_message', '')
                metric_name = metric_name + "_mean"  # Append _mean for message metrics
                
                if model not in message_scores:
                    message_scores[model] = {}
                message_scores[model][metric_name] = row['score']
        
        # Process round data
        for _, row in df_round_filtered.iterrows():
            if pd.notna(row['score']):
                model = row['model']
                metric_name = row['type'].replace('_round', '')
                metric_name = metric_name + "_mean"
                
                if model not in round_scores:
                    round_scores[model] = {}
                round_scores[model][metric_name] = row['score']
        
        return {"message": message_scores, "round": round_scores}
    except Exception as e:
        print(f"Error loading CSV for version {version}: {e}")
        return {"message": {}, "round": {}}
    

v3_round_metric_name = [
        "semantic_similarity_mean", "semantic_similarity_bipartite",
        "likert_diff_mean", "likert_diff_js", "likert_diff_bipartite",
        "rouge_1_mean", "rouge_2_mean", "rouge_L_mean", "rouge_L_sum_mean", "bleu_mean",
        "rouge_1_bipartite", "rouge_2_bipartite", "rouge_L_bipartite", "rouge_L_sum_bipartite", "bleu_bipartite",
    ]

if filter_type != "none":
    v3_round_metric_name += [
        "n_word_diff_mean", "n_word_diff_js", "n_word_diff_bipartite",
        "n_word_abs_diff_mean", "n_word_abs_diff_js", "n_word_abs_diff_bipartite",
    ]

v3_message_metric_name = [
        "semantic_similarity_mean",
        "likert_diff_mean",
        "rouge1_mean", "rouge2_mean", "rougeL_mean", "rougeLsum_mean", "bleu_mean",
    ]

if filter_type != "none":
    v3_message_metric_name += [
        "n_word_diff_mean",
        "n_word_abs_diff_mean",
    ]

def load_v3_data(version):
    """Load CSV data for a specific version and return a dictionary mapping model->metric->score for both message and round levels."""
    csv_path = f"result/eval/human_llm/llm_report_{version}_depth.csv"

    if filter_type != "none":
        csv_path = f"result/eval/human_llm/llm_report_{version}_depth_{filter_type}.csv"
    
    if not os.path.exists(csv_path):
        print(f"Warning: CSV file not found for version {version}: {csv_path}")
        return {"message": {}, "round": {}}
    
    try:
        df = pd.read_csv(csv_path)
        
        # Separate message and round data
        df_message = df[df['type'].str.endswith('_message', na=False)]
        df_round = df[df['type'].str.endswith('_round', na=False)]
        
        # Filter out unwanted round metrics that have additional suffixes
        df_round_filtered = df_round[~df_round['type'].str.contains('_round_.*_', na=False)]
        
        # Create nested dictionaries: model -> metric -> score
        message_scores = {}
        round_scores = {}

        
        # Process message data
        for _, row in df_message.iterrows():
            if pd.notna(row['score']):
                model = row['model']
                metric_name = row['type'].replace('_message', '')

                # if metric_name+"_mean" not in v3_message_metric_name:
                #     print(metric_name)
                #     continue
                
                if model not in message_scores:
                    message_scores[model] = {}
                message_scores[model][metric_name+"_mean"] = row['score']
        
        # Process round data
        for _, row in df_round_filtered.iterrows():
            if pd.notna(row['score']):
                model = row['model']
                metric_name = row['type'].replace('_round', '')

                # if metric_name not in v3_round_metric_name:
                #     continue
                
                if model not in round_scores:
                    round_scores[model] = {}
                round_scores[model][metric_name] = row['score']

        print({"message": message_scores, "round": round_scores})
        
        return {"message": message_scores, "round": round_scores}
    except Exception as e:
        print(f"Error loading CSV for version {version}: {e}")
        return {"message": {}, "round": {}}

def load_indiv_bootstrap_data(version):
    """Load CSV data for a specific version and return a dictionary mapping model->metric->score for both message and round levels."""
    
    csv_dir = f"bootstrap_results/depth/iteration_{str(args.iteration).zfill(4)}/bootstrap_iter_{str(args.iteration).zfill(4)}_*_{version}.csv"
    csv_files = glob.glob(csv_dir)
    print(csv_dir)

    print(csv_files)

    # Create nested dictionaries: model -> metric -> score
    message_scores = {}
    round_scores = {}

    for csv_path in csv_files:
        try:
            df = pd.read_csv(csv_path)
            
            # Separate message and round data
            df_message = df[df['type'].str.endswith('_message', na=False)]
            df_round = df[df['type'].str.endswith('_round', na=False)]
            
            # Filter out unwanted round metrics that have additional suffixes
            df_round_filtered = df_round[~df_round['type'].str.contains('_round_.*_', na=False)]
            
            
            # Process message data
            for _, row in df_message.iterrows():
                if pd.notna(row['score']):
                    model = row['model']
                    metric_name = row['type'].replace('_message', '')
                    
                    if model not in message_scores:
                        message_scores[model] = {}
                    message_scores[model][metric_name] = row['score']
            
            # Process round data
            for _, row in df_round_filtered.iterrows():
                if pd.notna(row['score']):
                    model = row['model']
                    metric_name = row['type'].replace('_round', '')
                    
                    if model not in round_scores:
                        round_scores[model] = {}
                    round_scores[model][metric_name] = row['score']
        except Exception as e:
            print(f"Error loading CSV for version {version}: {e}")
            return {"message": {}, "round": {}}
        
    return {"message": message_scores, "round": round_scores}

def merge_with_selection(v2_data, v3_data, message_select: dict, round_select: dict):
    """
    Merge two eval dictionaries using explicit selection of sources per metric.

    - v2_data/v3_data structure: { 'message': {model: {metric: val}}, 'round': {model: {metric: val}} }
    - message_select:  mapping of TARGET metric name -> 'v2'|'v3'
      e.g., {'semantic_similarity_mean': 'v2', 'rouge1_mean': 'v2', 'bleu_mean': 'v3'}
    - round_select:    mapping of TARGET metric name -> 'v2'|'v3'
      e.g., {'semantic_similarity_mean': 'v2', 'semantic_similarity_bipartite': 'v3', ...}

    Notes:
    - For v2 message and round "mean" metrics, the source keys have no suffix; we map to *_mean.
    - For v3 message metrics, the keys already include *_mean.
    - For *_bipartite and *_js, only v3 is expected to have values; selecting 'v2' will simply skip if absent.
    """
    merged = {'message': {}, 'round': {}}

    models = set()
    models.update(v2_data.get('message', {}).keys())
    models.update(v2_data.get('round', {}).keys())
    models.update(v3_data.get('message', {}).keys())
    models.update(v3_data.get('round', {}).keys())

    for model in models:
        merged['message'][model] = {}
        merged['round'][model] = {}

        # Message-level
        for target_metric, source in message_select.items():
            if source == 'v2':
                base = target_metric
                val = v2_data.get('message', {}).get(model, {}).get(base, None)
            else:  # 'v3'
                val = v3_data.get('message', {}).get(model, {}).get(target_metric, None)
            if isinstance(val, (int, float)):
                merged['message'][model][target_metric] = val

        # Round-level
        for target_metric, source in round_select.items():
            if source == 'v2':
                # Only *_mean can be mapped from v2; others likely absent
                if target_metric.endswith('_mean'):
                    base = target_metric
                    val = v2_data.get('round', {}).get(model, {}).get(base, None)
                else:
                    val = None
            else:  # 'v3'
                val = v3_data.get('round', {}).get(model, {}).get(target_metric, None)
            if isinstance(val, (int, float)):
                merged['round'][model][target_metric] = val

    return merged


# Load data for all versions
version_data = {}
validity_data = {}
bootstrap_data = {}
bootstrap_stds = {}
informative_data = {}
for version in ['v2', 'v1', 'v0']:
    if not args.bootstrap:
        v2_data = load_csv_data(version)
        v3_data = load_v3_data(version)

        # Default selection (preserves previous behavior when filter_type == 'none'):
        # - message: take all *_mean from v2
        # - round:   take *_mean from v2 and *_bipartite/*_js from v3
        message_select = {
            'semantic_similarity_mean': 'v3',
            'likert_diff_mean': 'v3',
            'rouge1_mean': 'v3',
            'rouge2_mean': 'v3',
            'rougeL_mean': 'v3',
            'rougeLsum_mean': 'v3',
            'bleu_mean': 'v3',
            'n_word_diff_mean': 'v3',
            'n_word_abs_diff_mean': 'v3',
        }
        round_select = {
            'semantic_similarity_mean': 'v3',
            'semantic_similarity_bipartite': 'v3',

            'likert_diff_mean': 'v3',
            'likert_diff_bipartite': 'v3',
            'likert_diff_js': 'v3',

            'n_word_diff_mean': 'v3',
            'n_word_diff_bipartite': 'v3',
            'n_word_diff_js': 'v3',

            'n_word_abs_diff_mean': 'v3',
            'n_word_abs_diff_bipartite': 'v3',
            'n_word_abs_diff_js': 'v3',

            'rouge1_mean': 'v3',
            'rouge2_mean': 'v3',
            'rougeL_mean': 'v3',
            'rougeLsum_mean': 'v3',
            'bleu_mean': 'v3',
            'rouge1_bipartite': 'v3',
            'rouge2_bipartite': 'v3',
            'rougeL_bipartite': 'v3',
            'rougeLsum_bipartite': 'v3',
            'bleu_bipartite': 'v3',
        }

        # If using golden filters, prefer v3 for n_word *_mean if available
        if filter_type != 'none':
            for k in ['n_word_diff_mean', 'n_word_abs_diff_mean']:
                message_select[k] = 'v3'
                round_select[k] = 'v3'

        version_data[version] = merge_with_selection(v2_data, v3_data, message_select, round_select)

                        
    else:
        version_data[version] = load_indiv_bootstrap_data(version)

    validity_data[version] = load_validity_data(version)
    # informative_data[version] = load_informative_data(version)
    # bootstrap_data[version], bootstrap_stds[version] = load_bootstrap_data(version)
# Formats
header_format = workbook.add_format({'bold': True, 'bg_color': '#D9D9D9', 'border': 1, 'text_wrap': True})
score_format_up = workbook.add_format({'bg_color': '#C6EFCE', 'border': 1})
score_format_down = workbook.add_format({'bg_color': '#F4CCCC', 'border': 1})
default_border_format = workbook.add_format({'border': 1, 'text_wrap': True})
version_format = workbook.add_format({
    'bold': True,
    'bg_color': '#D9D9D9',
    'font_color': 'black',
    'align': 'left',
    'font_size': 12
})
section_format = workbook.add_format({
    'bold': True,
    'bg_color': '#D9D9D9',
    'font_color': 'black',
    'align': 'left',
    'font_size': 12
})

# Row offset tracker
current_row = 0


# Function to create table for a specific level (message or round)
def create_table_for_level(level_name, level_data_key):
    base_metrics = base_metrics_message if level_data_key == "message" else base_metrics_round
    metric_headers = metric_headers_message if level_data_key == "message" else metric_headers_round

    global current_row
    
    # Write section heading
    worksheet.merge_range(current_row, 0, current_row, len(metric_headers), level_name, section_format)
    current_row += 1
    
    # Loop over versions
    for version_idx, version in enumerate(versions):
        # Extract version number (v2, v1, v0) from the descriptive text
        version_num = version.split('(')[1].replace(')', '')  # Extract "v2" from "(v2)"
        
        # Write version label row
        worksheet.merge_range(current_row, 0, current_row, len(metric_headers), version, version_format)
        current_row += 1
        
        # Write table headers
        headers = ["Model"] + metric_headers
        for col, header in enumerate(headers):
            display = header if header == "Model" else header.replace('_', ' ')
            worksheet.write(current_row, col, display, header_format)
        current_row += 1
        
        # Write data rows for each model
        for model_name in model_names:
            # Write model name
            worksheet.write(current_row, 0, model_name, default_border_format)
            
            # Write metric values with standard deviations in "score ± sd" format
            col = 1  # Start after model name column
            for base_metric in base_metrics:
                # Initialize values
                val = ""
                sd_val = ""
                formatted_value = ""
                
                # Handle valid_response_rate from validity data (no standard deviation available)
                if base_metric == "valid_response_rate":
                    if (version_num in validity_data and 
                        model_name in validity_data[version_num]):
                        val = validity_data[version_num][model_name]
                        if isinstance(val, (int, float)):
                            formatted_value = round(val, 2)  # Store as float rounded to 2 decimal places
                elif base_metric == "informative_response_rate":
                    if (version_num in informative_data and 
                        model_name in informative_data[version_num]):
                        val = informative_data[version_num][model_name]
                        print(val)
                        if isinstance(val, (int, float)):
                            formatted_value = round(val, 2)  # Store as float rounded to 2 decimal places
                else:
                    # Map metric names to CSV column names for other metrics
                    
                    metric_mapping = {
                        "semantic_similarity_mean": "semantic_similarity_mean",
                        "semantic_similarity_bipartite": "semantic_similarity_bipartite",

                        "likert_diff_mean": "likert_diff_mean", 
                        "likert_diff_bipartite": "likert_diff_bipartite", 
                        "likert_diff_js": "likert_diff_js", 
                        "likert_diff": "likert_diff", 

                        "n_word_diff_mean": "n_word_diff_mean",
                        "n_word_diff_bipartite": "n_word_diff_bipartite",
                        "n_word_diff_js": "n_word_diff_js",
                        "n_word_diff": "n_word_diff",

                        "n_word_abs_diff_mean": "n_word_abs_diff_mean",
                        "n_word_abs_diff_bipartite": "n_word_abs_diff_bipartite",
                        "n_word_abs_diff_js": "n_word_abs_diff_js",
                        "n_word_abs_diff": "n_word_abs_diff",

                        "rouge_1_mean": "rouge1_mean",
                        "rouge_2_mean": "rouge2_mean", 
                        "rouge_L_mean": "rougeL_mean",
                        "rouge_L_sum_mean": "rougeLsum_mean",
                        "bleu_mean": "bleu_mean",
                        "rouge_1_bipartite": "rouge1_bipartite",
                        "rouge_2_bipartite": "rouge2_bipartite", 
                        "rouge_L_bipartite": "rougeL_bipartite",
                        "rouge_L_sum_bipartite": "rougeLsum_bipartite",
                        "bleu_bipartite": "bleu_bipartite",
                    }
                    
                    csv_metric = metric_mapping.get(base_metric)
                    
                    # First try to get from bootstrap data (preferred)
                    if (version_num in bootstrap_data and 
                        model_name in bootstrap_data[version_num][level_data_key] and 
                        csv_metric and 
                        csv_metric in bootstrap_data[version_num][level_data_key][model_name]):
                        val = bootstrap_data[version_num][level_data_key][model_name][csv_metric]
                        # Get corresponding standard deviation
                        if (model_name in bootstrap_stds[version_num][level_data_key] and 
                            csv_metric in bootstrap_stds[version_num][level_data_key][model_name]):
                            sd_val = bootstrap_stds[version_num][level_data_key][model_name][csv_metric]
                    # Fallback to original CSV data if bootstrap not available
                    elif (version_num in version_data and 
                          model_name in version_data[version_num][level_data_key] and 
                          csv_metric and 
                          csv_metric in version_data[version_num][level_data_key][model_name]):
                        if level_data_key == "message":
                            print("csv metric")
                            print(csv_metric)
                        val = version_data[version_num][level_data_key][model_name][csv_metric]
                        # No standard deviation available for fallback data
                        sd_val = ""
                    
                    # Format as "score ± sd" if both values are available, otherwise just score
                    if isinstance(val, (int, float)):
                        if isinstance(sd_val, (int, float)) and sd_val != "":
                            rounded_sd = math.ceil(sd_val * 100) / 100  # Round up standard deviation
                            formatted_value = f"{val:.2f} ± {rounded_sd:.2f}"  # Normal rounding for score
                        else:
                            formatted_value = f"{val:.2f}"  # Just the score without standard deviation
                
                # Apply default formatting for all cells (no color coding)
                cell_format = default_border_format
                
                # Write the formatted value
                display_value = formatted_value if formatted_value else val
                worksheet.write(current_row, col, display_value, cell_format)
                col += 1
            
            current_row += 1
        
        # Add spacing between versions
        current_row += 1

# Add spacing between sections
current_row += 2

# Create Round Level Metrics table
create_table_for_level("Round Level Metrics", "round")

# Create Message Level Metrics table
create_table_for_level("Message Level Metrics", "message")

# Save
workbook.close()
print(f"Excel file saved as {filename}")
