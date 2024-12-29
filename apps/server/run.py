import sys
import os
import uvicorn

# Add the autocomplete directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), "autocomplete"))

if __name__ == "__main__":
    uvicorn.run("autocomplete.main:app", port=8000, reload=True)
