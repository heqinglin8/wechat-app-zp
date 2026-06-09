## Why

`seekerDetail` currently uses an older layout and renders raw fields directly, causing inconsistent information hierarchy versus `jobDetail` and weak fallback behavior when data is missing. We need a unified detail-page presentation with explicit "未填写" defaults so job seeker records remain readable and consistent.

## What Changes

- Redesign `seekerDetail` page UI to align with `jobDetail` visual structure (hero, top summary, grouped detail sections, and message board spacing).
- Introduce a structured view-data mapping layer for `seekerDetail` so display fields are normalized before rendering.
- Bind existing `JobSeeker` fields wherever possible (`title`, `recoName`, `recoEducation`, `recoContact`, `wxid`, `recoJobIntent`, `detPayMin`, `detPayMax`, `payType`, `summary`, `recoIntro`, `photoImgs`, `commitUsername`, `collectNum`, city fields).
- Enforce unified fallback copy format: `xxx未填写` when no matching field value exists.
- Remove "其他(recoExtra)" display and remove company-domain display from `seekerDetail`.

## Capabilities

### New Capabilities
- `jobseek-detail-display`: Standardized job seeker detail rendering model with `jobDetail`-style layout and mandatory per-field fallback behavior.

### Modified Capabilities
- `award-recommend`: Ensure published job seeker data model and detail rendering expectations remain aligned for fields displayed in seeker detail pages.

## Impact

- Affected pages: `pages/seekerDetail/seekerDetail.wxml`, `pages/seekerDetail/seekerDetail.js`, `pages/seekerDetail/seekerDetail.wxss`.
- Data presentation logic changes from direct `content` binding to normalized display mapping.
- No new backend dependency; relies on existing `JobSeeker` fields and current message-board integration.
