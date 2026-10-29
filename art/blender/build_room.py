"""Production room entry point; previous blockout was replaced by the night lounge."""
import runpy
from pathlib import Path
runpy.run_path(str(Path(__file__).with_name('build_night_lounge.py')), run_name='__main__')
