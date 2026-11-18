"""Run each retained iteration in its own process to isolate module names."""
from pathlib import Path
import subprocess
import sys

if __name__ == "__main__":
    statuses = [subprocess.run([
        sys.executable, "-m", "unittest", "discover", "-s", str(iteration),
        "-p", "test_*.py", "-v",
    ]).returncode for iteration in sorted(Path(__file__).parent.glob("iteration-*"))
        if iteration.is_dir()]
    raise SystemExit(int(not statuses or any(statuses)))
