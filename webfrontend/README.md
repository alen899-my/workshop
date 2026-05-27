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

Because automated wizard install may be blocked in restricted environments, this project includes a manual PostHog client bootstrap in `instrumentation-client.ts`.

1. Copy env values:

```bash
cp .env.local.example .env.local
```

2. Ensure these keys are set in `.env.local` and your deployment provider:

- `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN`
- `NEXT_PUBLIC_POSTHOG_HOST`

3. Replace the placeholder token with your real PostHog project token.

4. Restart your dev server.

After that, PostHog initializes on the client automatically through Next.js instrumentation.
