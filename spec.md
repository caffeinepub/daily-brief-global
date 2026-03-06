# Daily Brief Global

## Current State
Full viral media website with video submission, admin moderation queue, Instagram embedding, and Internet Identity login. The admin panel is accessed via `?admin=1`. The backend uses `_initializeAccessControlWithSecret` which only grants admin when `adminAssigned = false`. Once admin is claimed by any Internet Identity principal, all other principals are permanently blocked from claiming admin even with the correct token.

## Requested Changes (Diff)

### Add
- New backend function `claimAdminWithToken(token: Text)` that: (1) validates the provided token matches `CAFFEINE_ADMIN_TOKEN`, (2) removes admin role from any existing admin principal, (3) assigns admin to the caller — works regardless of whether admin was previously assigned. This allows the real admin to reclaim access from any Internet Identity.

### Modify
- Frontend `useInitializeAdmin` hook to call `claimAdminWithToken` instead of (or in addition to) `_initializeAccessControlWithSecret`
- `NotAdminGate` component auto-claim logic to use the new function so any logged-in user with the correct token automatically becomes admin

### Remove
- Nothing removed

## Implementation Plan
1. Regenerate backend with new `claimAdminWithToken` public shared function
2. Update `useInitializeAdmin` hook in `useQueries.ts` to call `claimAdminWithToken`
3. Update `AdminPanel.tsx` auto-claim effect to use the updated hook
