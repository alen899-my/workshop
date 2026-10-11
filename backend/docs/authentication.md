# Authentication repair

## Phone contract

The Expo auth input holds a national number plus an independent ISO phone country. India (+91) is the initial default. A pasted valid international number selects its country automatically. Workshop country and currency are independent of the owner's phone country.

Both app and server validate with libphonenumber-js/max. The app submits a single E.164 string, for example +919876543210. The server repeats validation and stores the canonical string in users.phone and shops.phone. Account create/update endpoints also validate phone numbers. Never concatenate callingCode onto an already international number. Extensions and repeated plus prefixes in new requests are rejected. Formatting validation does not verify possession of a phone number; SMS verification has not been added.

The country cache now indexes the library's array by ISO code. Previously country lookups used array['IN'], which explains missing codes and currency/name lookup failures.

## Registration and login

Registration validates every field, trims names/email, lowercases email, and hashes passwords with bcrypt. New/reset passwords require 15 characters and at most 72 UTF-8 bytes (bcrypt's limit); existing shorter passwords remain usable for login. All registration queries and BEGIN/COMMIT/ROLLBACK use one checked-out PostgreSQL client. Advisory locks serialize equivalent identity registrations; unique constraint failures return 409. Shop names are not account identifiers and are no longer globally blocked by a preflight name check.

Signup keeps the existing three-step UI and returns to login without creating and immediately deleting a local session. Errors are visible on the current step and server field errors select the relevant step. Coordinate values are now included in the request.

Login uses generic credential failures, removes phone/account logging, rejects disabled/deleted users and shops, and refuses ambiguous legacy matches. Duplicate submissions are guarded. The app commits a complete identity/token pair and rolls back partial storage failures. A startup session check removes expired sessions while retaining sessions during connectivity failures. Protected API 401s return the Expo app to login. RBAC permissions are cleared before reloading a different account.

## Existing data and rollout

Deploy backend and updated Expo client together. All sessions issued before this change must log in again: new JWTs carry a password-hash version. Current account status, role, shop membership and password version are checked on every authenticated API call. Password changes invalidate existing tokens. JWT expiry remains seven days; there is no refresh-token or server-side logout revocation store in this change.

Legacy phone records containing formatting, no leading plus (international digits), or the prior +91+91... bug can still match login through a normalized comparison. Multiple matches fail closed. Local-only or otherwise ambiguous records are not guessed, merged or rewritten. Run the read-only audit with npm run audit:auth in backend against the intended database. It outputs account IDs and issue categories, not phone/email data. It exits nonzero when review is needed. Verify flagged records with account owners before a separate backed-up migration; resolve phone and case-insensitive email collisions before introducing canonical expression indexes. No production data was read or changed for this repair.

Backend changes also affect the existing web client: new passwords must follow the server policy and old sessions require login. Existing web password reset links are invalidated by the move to hashed reset tokens; request a new link.

## Recovery and deployment configuration

The login screen's reset action now opens an email form and calls the existing recovery endpoint. Responses do not reveal account existence. Reset tokens are random, stored as SHA-256 digests, expire after one hour, and are consumed by a conditional update. FRONTEND_URL must point to the deployed website with its /reset-password route. Configure the existing SMTP/Gmail environment values for actual delivery. No email was sent during tests.

Login, registration and reset endpoints have IP-based rate limits. The default store is per Node process. Multi-instance deployments need a shared limiter store or equivalent gateway enforcement. Configure Express trust proxy only for the deployment's actual trusted proxy addresses/hops; this change does not trust arbitrary forwarded IP headers. Serve production traffic over HTTPS. Native tokens use Expo SecureStore; the existing web fallback still uses localStorage and would need a separate HttpOnly-cookie design for stronger browser session isolation.

## Validation

- backend: npm run test:auth (mocked database/mail, real bcrypt/JWT and phone metadata)
- repairo-app: npm run test:auth (phone validation and storage/session regressions)
- repairo-app: node node_modules/typescript/bin/tsc --noEmit
- Targeted ESLint and Expo web export

Tests cover phone formatting/duplicate prefixes, national trunk prefixes, Unicode bcrypt limits, registration transaction rollback, identity conflicts, disabled/ambiguous logins, generic failures, hashed single-use resets, session version checks, storage failures and retryable connectivity errors. Mocked SQL tests do not replace PostgreSQL integration tests or a device/email-provider smoke test.

Design references: [phone parsing](https://github.com/catamphetamine/libphonenumber-js), [PostgreSQL transaction connection requirements](https://node-postgres.com/features/transactions), [OWASP authentication guidance](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html).
