# Search

This is a monorepo containing multiple applications and packages for the project, managed using pnpm workspaces and Turborepo.

## Repository Structure

The repository is organized into the following main directories:

- `apps/` - Contains standalone applications

  - `web/` - Next.js web application hosted on Cloudflare Workers

    - Uses Wrangler to manage Cloudflare bindings and deployments

  - `server/` - FastAPI server application
    - Uses Uvicorn to manage server and agent interactions

- `packages/` - Can be created in the future to contain shared libraries and utilities used across applications

- `turbo.json` - Turborepo configuration file (TODO: add tasks for the Python backend)

## Usage

To start the development server, run the following command at the root of the repository:

```bash
pnpm install
```

Then look at the `package.json` file for the `dev` script.

```bash
pnpm dev
```

This will start the development server and the web application. (**NOTE:** Calls the `dev` script for both the web and server applications).
