const POSTHOG_PROJECT_TOKEN = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com'
const POSTHOG_SNIPPET_SRC = `${POSTHOG_HOST}/static/array.js`
const POSTHOG_SCRIPT_ID = 'posthog-js'

type PostHogQueue = Array<unknown> & {
  __loaded?: boolean
  init?: (token: string, config: Record<string, unknown>) => void
}

declare global {
  interface Window {
    posthog?: PostHogQueue
  }
  interface Document {
    __SV?: number
  }
}

function ensureSnippetLoaded() {
  if (document.getElementById(POSTHOG_SCRIPT_ID)) return

  const script = document.createElement('script')
  script.id = POSTHOG_SCRIPT_ID
  script.async = true
  script.crossOrigin = 'anonymous'
  script.src = POSTHOG_SNIPPET_SRC

  const firstScript = document.getElementsByTagName('script')[0]
  if (firstScript?.parentNode) {
    firstScript.parentNode.insertBefore(script, firstScript)
    return
  }

  document.head.appendChild(script)
}

function initQueue() {
  const posthog = (window.posthog = window.posthog || [])
  if (posthog.__loaded) return

  posthog.__loaded = true
  document.__SV = 1.2

  posthog.init = (token: string, config: Record<string, unknown>) => {
    posthog.push(['init', token, config])
  }

  posthog.init(POSTHOG_PROJECT_TOKEN!, {
    api_host: POSTHOG_HOST,
    defaults: '2026-01-30',
    capture_pageview: false,
  })
}

export function register() {
  if (typeof window === 'undefined' || !POSTHOG_PROJECT_TOKEN) return

  ensureSnippetLoaded()
  initQueue()
}
