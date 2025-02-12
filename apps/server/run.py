import sys
import os
from pathlib import Path

# Add the autocomplete/src directory to the Python path
current_dir = Path(__file__).parent
src_path = current_dir / "autocomplete" / "src"
sys.path.append(str(src_path))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", port=8000, reload=True)
