# Next.js template

This is a Next.js template with shadcn/ui.

## Adding components

To add components to your app, run the following command:

```bash
npx shadcn@latest add button
```

This will place the ui components in the `components` directory.

## Using components

To use the components in your app, import them as follows:

```tsx
import { Button } from "@/components/ui/button";
```

## PostHog setup (manual)

1. Install package (when registry/network access is available):

```bash
npm install posthog-js
```

2. Copy env values and update them:

```bash
cp .env.local.example .env.local
```

Required variables:

- `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN`
- `NEXT_PUBLIC_POSTHOG_HOST`

3. Restart your dev server.

The app already includes a client provider (`app/providers.tsx`) that initializes PostHog and captures `$pageview` events on route changes.

### Verify installation ("Waiting for events" troubleshooting)

If PostHog shows **Waiting for events**:

- Confirm `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` is a real project token, not the placeholder.
- Confirm `NEXT_PUBLIC_POSTHOG_HOST` matches your PostHog region (US: `https://us.i.posthog.com`).
- Restart the Next.js server after changing `.env.local`.
- Open browser DevTools Network and verify requests are sent to `/e/` on your PostHog host.
- Navigate between a few pages to trigger `$pageview` events.


### Vercel build + "Waiting for connection" quick fixes

- In **Vercel Project Settings → Environment Variables**, set:
  - `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN`
  - `NEXT_PUBLIC_POSTHOG_HOST` (US: `https://us.i.posthog.com`, EU: `https://eu.i.posthog.com`)
- Redeploy after saving env vars (old deployments keep old env values).
- Ensure AdBlock/privacy extensions are disabled while testing (they often block analytics hosts).
- In browser DevTools, check for requests to `${NEXT_PUBLIC_POSTHOG_HOST}/e/` and `${NEXT_PUBLIC_POSTHOG_HOST}/static/array.js`.
- If your token is wrong or empty, PostHog may stay on "Waiting for connection/events".
