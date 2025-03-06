import logging

import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from database import supabase_client

from routes import generate, store, vector_query, search


# Load environment variables
load_dotenv()

# Logging setup
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    # Close Supabase connection
    supabase_client.postgrest.aclose()
    logging.info("Supabase connection closed successfully")


app = FastAPI(
    title="Autocomplete API",
    description="This is the Autocomplete API",
    lifespan=lifespan,
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


if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000)
