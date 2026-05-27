'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'
import { register } from '@/instrumentation-client'

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    register()
  }, [])

  useEffect(() => {
    const posthog = window.posthog
    if (!posthog || !pathname) return

    const query = searchParams.toString()
    const currentUrl = query ? `${pathname}?${query}` : pathname

    posthog.push([
      'capture',
      '$pageview',
      {
        $current_url: window.location.origin + currentUrl,
      },
    ])
  }, [pathname, searchParams])

  return <>{children}</>
}
