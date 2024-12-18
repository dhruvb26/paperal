# Search

This is a monorepo containing multiple applications and packages for the project, managed using pnpm workspaces and Turborepo.

## Repository Structure

The repository is organized into the following main directories:

- `apps/` - Contains standalone applications

  - `web/` - Next.js web application hosted on Cloudflare Workers
    - Uses Wrangler to manage Cloudflare bindings and deployments

- `packages/` - Can be created in the future to contain shared libraries and utilities used across applications

- `turbo.json` - Turborepo configuration file (TODO: add tasks for the Python backend)
