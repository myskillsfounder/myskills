#!/usr/bin/env bash
# A Python for checking quiz answers by running them: pandas, SciPy, openpyxl,
# and SQLite (built in). Made once, outside the repository, and reused.
#   bash agents/verify/setup.sh      prints the Python to use
set -e
DIR="${MYSKILLS_VERIFY:-$HOME/.myskills-verify}"
PY="$DIR/Scripts/python.exe"; [ -x "$PY" ] || PY="$DIR/bin/python"
if [ ! -x "$PY" ]; then
  python -m venv "$DIR"
  PY="$DIR/Scripts/python.exe"; [ -x "$PY" ] || PY="$DIR/bin/python"
fi
"$PY" -m pip install -q --disable-pip-version-check -r "$(dirname "$0")/requirements.txt"
echo "$PY"
