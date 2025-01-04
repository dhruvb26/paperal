import logging


from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware


from apps.server.autocomplete.src.routes import search
from routes import generate, store, vector_query


# Load environment variables
load_dotenv()

# Logging setup
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)


app = FastAPI(
    title="Autocomplete API",
    description="This is the Autocomplete API",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(search.router)
app.include_router(generate.router)
app.include_router(store.router)
app.include_router(vector_query.router)


@app.get("/")
async def root():
    return {"message": "Hello World"}


# Example usage
if __name__ == "__main__":
    logging.info("Starting example usage.")

    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
