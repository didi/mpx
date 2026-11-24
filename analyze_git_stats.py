import subprocess
import sys
import argparse
from collections import defaultdict
from datetime import datetime

def analyze_git_stats():
    # Parse command line arguments
    parser = argparse.ArgumentParser(description='Analyze git contribution stats.')
    parser.add_argument('--since', type=str, default="1 year ago", 
                        help='Start time period to analyze (e.g. "1 year ago", "2023-01-01")')
    parser.add_argument('--until', type=str, default=None,
                        help='End time period to analyze (e.g. "now", "1 month ago", "2024-01-01"). Defaults to now.')
    args = parser.parse_args()

    # Configuration
    since_date = args.since
    until_date = args.until

    # Author Alias Mapping
    # Format: 'Alias Name': 'Canonical Name'
    AUTHOR_MAPPINGS = {
        'wangshunnn': 'Soon Wang',
        'mackwang112': 'mackwang',
        'wangxiaokou': 'wangcuijuan',
        'dongxingxingdong': 'WX-DongXing',
        'yandadaFreedom': 'lareinayanyu'
        # Add more mappings here as needed
    }
    
    # Using 'git log' to get the data
    # --numstat: shows added/deleted lines
    # --no-merges: optional, generally we want to count actual code contributions, not merge commits
    # --pretty=format:"AUTHOR:%aN": helps us identify who made the commit
    cmd = [
        "git", "log",
        f"--since={since_date}",
        "--numstat",
        "--pretty=format:AUTHOR:%aN",
        "--no-merges" 
    ]
    
    if until_date:
        cmd.append(f"--until={until_date}")

    try:
        # Run the command with utf-8 encoding errors ignored to prevent crashing on binary filenames or weird author names
        process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, errors='replace')
        stdout, stderr = process.communicate()
        
        if process.returncode != 0:
            print(f"Error executing git command: {stderr}")
            return

    except FileNotFoundError:
        print("Error: 'git' command not found. Please ensure git is installed.")
        return

    # Data structure: 
    # stats = {
    #    author: {
    #        'total': {'added': 0, 'deleted': 0, 'commits': 0},
    #        'lt_1000': {'added': 0, 'deleted': 0, 'commits': 0},
    #        'lt_5000': {'added': 0, 'deleted': 0, 'commits': 0}
    #    }
    # }
    stats = defaultdict(lambda: {
        'total': {'added': 0, 'deleted': 0, 'commits': 0},
        'lt_1000': {'added': 0, 'deleted': 0, 'commits': 0},
        'lt_5000': {'added': 0, 'deleted': 0, 'commits': 0}
    })
    
    lines = stdout.split('\n')
    
    pending_author = None
    pending_commit_stats = {'added': 0, 'deleted': 0}
    
    def finalize_commit(author, commit_stats):
        if not author:
            return
            
        added = commit_stats['added']
        deleted = commit_stats['deleted']
        total_change = added + deleted
        
        # Add to Total
        stats[author]['total']['added'] += added
        stats[author]['total']['deleted'] += deleted
        stats[author]['total']['commits'] += 1
        
        # Add to < 5000
        if total_change < 5000:
            stats[author]['lt_5000']['added'] += added
            stats[author]['lt_5000']['deleted'] += deleted
            stats[author]['lt_5000']['commits'] += 1
            
        # Add to < 1000
        if total_change < 1000:
            stats[author]['lt_1000']['added'] += added
            stats[author]['lt_1000']['deleted'] += deleted
            stats[author]['lt_1000']['commits'] += 1

    for line in lines:
        line = line.strip()
        if not line:
            continue
            
        if line.startswith("AUTHOR:"):
            # Finish previous commit
            finalize_commit(pending_author, pending_commit_stats)
            
            # Start new commit
            raw_author = line.split("AUTHOR:", 1)[1].strip()
            pending_author = AUTHOR_MAPPINGS.get(raw_author, raw_author)
            pending_commit_stats = {'added': 0, 'deleted': 0}
        else:
            # It's a numstat line: "added  deleted  filepath"
            parts = line.split(maxsplit=2)
            if len(parts) == 3:
                added, deleted, _ = parts
                
                # Handle binary files or other non-numeric entries
                if added == '-' or deleted == '-':
                    continue
                    
                try:
                    pending_commit_stats['added'] += int(added)
                    pending_commit_stats['deleted'] += int(deleted)
                except ValueError:
                    continue

    # Finalize the last commit
    finalize_commit(pending_author, pending_commit_stats)

    # Output formatting
    def print_table(title, key_type):
        print(f"\n{title}")
        print(f"{'Author':<30} | {'Added':<10} | {'Deleted':<10} | {'Total Lines':<12} | {'Commits':<8}")
        print("-" * 80)
        
        # Convert to list for sorting
        results = []
        for author, data in stats.items():
            category_data = data[key_type]
            total_changed = category_data['added'] + category_data['deleted']
            # Only include if they have commits in this category
            if category_data['commits'] > 0:
                results.append({
                    'author': author,
                    'added': category_data['added'],
                    'deleted': category_data['deleted'],
                    'total': total_changed,
                    'commits': category_data['commits']
                })
        
        # Sort by total lines changed (descending)
        results.sort(key=lambda x: x['total'], reverse=True)
        
        total_added_all = 0
        total_deleted_all = 0
        total_commits_all = 0
        
        for r in results:
            print(f"{r['author']:<30} | {r['added']:<10} | {r['deleted']:<10} | {r['total']:<12} | {r['commits']:<8}")
            total_added_all += r['added']
            total_deleted_all += r['deleted']
            total_commits_all += r['commits']

        print("-" * 80)
        print(f"{'TOTAL':<30} | {total_added_all:<10} | {total_deleted_all:<10} | {total_added_all+total_deleted_all:<12} | {total_commits_all:<8}")

    print_table("=== ALL COMMITS ===", 'total')
    print_table("=== COMMITS < 5000 LINES ===", 'lt_5000')
    print_table("=== COMMITS < 1000 LINES ===", 'lt_1000')

if __name__ == "__main__":
    analyze_git_stats()
