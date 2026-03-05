# Daily Brief Global

## Current State

- Visitors can submit videos (URL, title, view count, thumbnail) via a modal form.
- `submitVideo` on the backend immediately stores videos as live/published.
- `getVideos` and `getFeaturedVideo` return all stored videos regardless of any status.
- There is no admin concept, no role-based access, and no moderation workflow.
- The `Video` type has no `status` or `approved` field.
- Frontend uses `useSubmitVideo` mutation that calls `actor.submitVideo(...)` directly.

## Requested Changes (Diff)

### Add
- `status` field to `Video` type: `"pending"` | `"approved"` | `"rejected"`.
- `submitVideo` sets `status = "pending"` — video is NOT visible in the public feed.
- Admin-only backend functions: `getPendingVideos`, `approveVideo`, `rejectVideo`, with caller-based admin guard.
- A hardcoded admin principal stored in the backend (set to the deployer's principal on first call, or a fixed principal).
- Admin dashboard page/panel in the frontend (accessible via a hidden route or secret header button) showing pending videos with Approve / Reject actions.
- Toast/confirmation feedback for admin actions.
- Visitor submit form: after submission shows a "Your video has been submitted for review" success message instead of immediately appearing in the feed.

### Modify
- `getVideos` — filter to only return videos where `status == "approved"`.
- `getFeaturedVideo` — filter to only return approved videos.
- `VideoSubmitModal` success message: change from "Video submitted successfully!" to "Submitted for review! Your clip will appear once approved."
- Backend `submitVideo` — set `status = "pending"` on new submissions.

### Remove
- Nothing removed from public API surface.

## Implementation Plan

1. **Backend**: Add `status` variant type to `Video`. Update `submitVideo` to set `status = #pending`. Update `getVideos` and `getFeaturedVideo` to filter `#approved` only. Add `getPendingVideos`, `approveVideo`, `rejectVideo` functions with admin principal guard. Admin principal is set to the first caller of `setAdmin` or hardcoded as the canister deployer.
2. **Frontend hooks**: Add `useGetPendingVideos`, `useApproveVideo`, `useRejectVideo` mutations in `useQueries.ts`.
3. **Frontend Admin Panel**: Create `AdminPanel.tsx` component — shows a list of pending videos with thumbnail, title, URL, and Approve/Reject buttons. Accessible by clicking the site logo 5 times or via `?admin=1` query param.
4. **Frontend Submit Modal**: Update success toast message to indicate pending review.
5. **App.tsx**: Wire AdminPanel into the app (hidden access via query param `?admin=1`).
