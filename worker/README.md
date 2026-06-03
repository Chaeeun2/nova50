# NOVA50 R2 Worker

Admin image uploads go through this Cloudflare Worker and are stored in R2.

## Endpoints

- `GET /health`: health check
- `POST /upload`: multipart upload. Requires a `file` field and optional `metadata` JSON field.
- `GET /files/:key`: serves a stored R2 object.
- `DELETE /files/:key`: deletes a stored R2 object.

Upload responses include `key`, `publicUrl`, `imageUrl`, `fileName`, `size`, and `contentType`.

## Setup

1. Log in to Cloudflare:

   ```sh
   npx wrangler login
   ```

2. Create the R2 bucket if it does not already exist:

   ```sh
   npm run worker:r2:create
   ```

   If you use another bucket name, update `bucket_name` in `worker/wrangler.jsonc`.

3. Optional local secrets:

   ```sh
   cp worker/.dev.vars.example worker/.dev.vars
   ```

   If `ADMIN_UPLOAD_TOKEN` is set in the Worker, set the same value as `VITE_R2_UPLOAD_TOKEN` in the frontend `.env`.

4. Run locally:

   ```sh
   npm run worker:dev
   ```

5. Deploy:

   ```sh
   npm run worker:deploy
   ```

6. Set the deployed Worker URL in the frontend:

   ```env
   VITE_R2_WORKER_URL=https://<worker-name>.<account-subdomain>.workers.dev
   ```

## Production Notes

- Update `ALLOWED_ORIGINS` in `worker/wrangler.jsonc` if the production domain changes.
- For stronger protection, set `ADMIN_UPLOAD_TOKEN` as a Cloudflare secret:

  ```sh
  npx wrangler secret put ADMIN_UPLOAD_TOKEN --config worker/wrangler.jsonc
  ```
