## Server

The server is a FastAPI application that serves as the backend for the web application. It uses Uvicorn to manage server and endpoints.

This uses python version 3.13 as of now (latest stable version).

### Usage

To start the development server, run the following command at the root of the repository:

```bash
pip install -r requirements.txt
```

Then run the following command to start the server:

```bash
uvicorn agents:app --reload

or

pnpm dev
```

This will start the server and the endpoints will be available at `http://localhost:8000`.
