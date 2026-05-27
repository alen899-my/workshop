'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { register } from '@/instrumentation-client'

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  useEffect(() => {
    register()
  }, [])

  useEffect(() => {
    const posthog = window.posthog
    if (!posthog || !pathname) return

    const currentUrl = `${window.location.pathname}${window.location.search}`

    posthog.push([
      'capture',
      '$pageview',
      {
        $current_url: window.location.origin + currentUrl,
      },
    ])
  }, [pathname])

  return <>{children}</>
}
