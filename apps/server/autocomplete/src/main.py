import logging
import sys
from pathlib import Path

import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from database import supabase_client

from routes import generate, store, vector_query, search

# Configure logging with more detailed format
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler("app.log")
    ]
)

logger = logging.getLogger(__name__)

# Load environment variables
try:
    load_dotenv()
    logger.info("Environment variables loaded successfully")
except Exception as e:
    logger.error(f"Failed to load environment variables: {e}")
    raise

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting up FastAPI application")
    try:
        yield
        # Close Supabase connection
        await supabase_client.postgrest.aclose()
        logger.info("Supabase connection closed successfully")
    except Exception as e:
        logger.error(f"Error during application lifecycle: {e}")
        raise

app = FastAPI(
    title="Autocomplete API",
    description="This is the Autocomplete API",
    lifespan=lifespan,
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers with error handling
try:
    app.include_router(search.router, prefix="/api")
    app.include_router(generate.router, prefix="/api")
    app.include_router(store.router, prefix="/api")
    app.include_router(vector_query.router, prefix="/api")
    logger.info("All routers included successfully")
except Exception as e:
    logger.error(f"Failed to include routers: {e}")
    raise

@app.get("/")
async def root():
    try:
        return {"message": "Hello World", "status": "healthy"}
    except Exception as e:
        logger.error(f"Error in root endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    try:
        uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
    except Exception as e:
        logger.error(f"Failed to start server: {e}")
        raise
