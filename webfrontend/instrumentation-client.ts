import posthog from 'posthog-js'

posthog.init(process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN!, {
  api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
  defaults: '2026-01-30',
  // Capture pageviews automatically on route changes
  capture_pageview: 'history_change',
  // Disable in development to avoid polluting analytics
  loaded: (ph) => {
    if (process.env.NODE_ENV === 'development') {
      ph.opt_out_capturing()
    }
  },
})
