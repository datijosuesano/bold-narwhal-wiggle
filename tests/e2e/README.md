# End-to-end tests

The main lifecycle test is `work-order-lifecycle.spec.ts`.

## Environment

Set these variables locally or in CI; never commit real credentials:

- `E2E_EMAIL`
- `E2E_PASSWORD`
- `PLAYWRIGHT_BASE_URL` (optional; defaults to `http://127.0.0.1:8080`)

## Run

```bash
npm install
npx playwright install chromium
npm run test:e2e
```

The test creates a real work order in the configured Supabase environment, so use a dedicated test account/environment when possible.
