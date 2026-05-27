/**
 * analytics.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Thin wrapper around PostHog for capturing custom events, identifying users,
 * and resetting sessions on logout.
 *
 * Usage (client components only):
 *   import { analytics } from '@/lib/analytics'
 *   analytics.capture('button_clicked', { button: 'upgrade' })
 *   analytics.identify('user-id-123', { email: 'user@example.com', plan: 'pro' })
 *   analytics.reset() // call on logout
 */

import posthog from 'posthog-js'

type EventProperties = Record<string, unknown>

export const analytics = {
  /**
   * Track a custom event.
   * @param event   Snake-case event name  e.g. 'job_card_created'
   * @param props   Optional key-value metadata
   */
  capture(event: string, props?: EventProperties) {
    posthog.capture(event, props)
  },

  /**
   * Identify a logged-in user so their events are linked across sessions.
   * Call this right after sign-in.
   * @param distinctId   Unique user identifier (e.g. database user ID)
   * @param userProps    Profile properties (name, email, plan, role, etc.)
   */
  identify(distinctId: string, userProps?: EventProperties) {
    posthog.identify(distinctId, userProps)
  },

  /**
   * Reset the PostHog identity — call this on sign-out so the next
   * anonymous session isn't attributed to the previous user.
   */
  reset() {
    posthog.reset()
  },

  /**
   * Set persistent super-properties that are sent with every subsequent event.
   * Useful for workspace/plan/role context.
   */
  setProperties(props: EventProperties) {
    posthog.register(props)
  },

  /**
   * Remove a previously registered super-property.
   */
  unsetProperty(key: string) {
    posthog.unregister(key)
  },
}
