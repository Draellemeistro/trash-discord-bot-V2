#!/bin/bash

# Absolute path to the directory containing the Python script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Create a virtual environment
python3 -m venv "$SCRIPT_DIR/.venv"

# Activate the virtual environment
source "$SCRIPT_DIR/.venv/bin/activate"

# Install required packages
pip install -r "$SCRIPT_DIR/requirements.txt"

# Run the Python script with the provided arguments
python "$SCRIPT_DIR/putFacesOn.py" "$@"

# Deactivate the virtual environment
deactivate