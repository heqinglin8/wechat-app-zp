## Context

The personal center already displays a “我的收藏” row, but its click handler currently does not navigate to a collection list. Recruitment collections are written to `MyCollectInfo` with `type=1` and `jobId` pointing to `JobInfo.objectId`. Job seeker collections are currently written from `seekerDetail` with `type=2` and `jobSeekId`, while this change standardizes new job seeker collection records on `jobId` pointing to `JobSeeker.objectId`.

The UI has reusable card patterns:

- `pages/myjoin` provides the recruitment card visual style requested for “招聘” collections.
- `pages/myjobseeks` provides the job seeker card visual style requested for “求职” collections.
- `pages/zhiyan` provides the tabbar visual style requested for the new page.

## Goals / Non-Goals

**Goals:**

- Add a routed “我的收藏” page reachable from `pages/personal/personal`.
- Let logged-in users switch between “招聘” and “求职” tabs.
- Load collection rows from `MyCollectInfo` by current user and tab type, then hydrate cards from `JobInfo` or `JobSeeker`.
- Reuse existing card formatting conventions from `utils/cardFormatter` wherever possible.
- Add a salary-side vertical ellipsis action entry and bottom operation popup with “编辑” and “删除”.
- Make “删除” remove the collection record, not the original job or job seeker record.
- Update new job seeker collection writes and reads to use `MyCollectInfo.jobId`.

**Non-Goals:**

- No “加精” option in this change.
- No batch select/delete mode for the new collection list.
- No backend schema migration job for historical `jobSeekId` data unless explicitly added later.
- No redesign of `myjoin`, `myjobseeks`, `jobDetail`, or `seekerDetail` outside collection-related behavior.

## Decisions

### Decision: Create a dedicated `pages/mycollect` page

Use a new page instead of folding collection mode into `myjoin` or `myjobseeks`.

Rationale: the new page combines two data sources and two card types behind a shared tabbar and action popup. Keeping it dedicated avoids adding conditional collection behavior into existing personal-list pages.

Alternative considered: reuse `myjoin` for recruitment collections and `myjobseeks` for job seeker collections separately. This would fragment the requested tabbed experience and duplicate navigation behavior.

### Decision: Store all collection targets in `MyCollectInfo.jobId`

For `type=1`, `jobId` points to `JobInfo.objectId`. For `type=2`, `jobId` points to `JobSeeker.objectId`.

Rationale: the requested data contract says both types use `jobId`, with `type` determining which target table to query. This also gives the collection page one lookup path per tab.

Alternative considered: keep `jobSeekId` for `type=2`. This preserves existing implementation detail but conflicts with the requested contract and would force special-case logic into the collection page.

### Decision: Treat delete as “取消收藏”

The popup “删除” action deletes the `MyCollectInfo` row for the selected card.

Rationale: users are viewing their own collection list. Deleting from this context should remove the saved collection, not destroy the original `JobInfo` or `JobSeeker` content, which may belong to another user.

Alternative considered: delete the underlying job/seeker record when owned by the current user. This is risky and inconsistent with a collection-management page.

### Decision: Gate edit by ownership

The popup “编辑” action should only proceed when the selected underlying record belongs to the current user. For recruitment records, compare `JobInfo.commitUid`; for job seeker records, compare `JobSeeker.commitUid`.

Rationale: users may collect other people’s posts, and collection ownership is not content ownership.

Alternative considered: always show and navigate edit. That risks exposing edit flows for records the user does not own.

### Decision: Use a local bottom popup instead of introducing a new package dependency

Implement the operation sheet with WXML/WXSS using WeChat mini program primitives and the project’s existing styling conventions. The sheet should mimic the requested bottom action panel: full-width rows, mask, and top-right close control using a cross image/shape.

Rationale: the repository does not currently configure the official extended WeUI component library or a package manager. Adding a new dependency solely for this sheet would increase setup complexity.

Alternative considered: use `wx.showActionSheet`. It provides native action rows but cannot satisfy the requested custom close button and bottom panel layout.

## Risks / Trade-offs

- **[Risk] Existing `type=2` collection rows may only have `jobSeekId`.** → **Mitigation:** The implementation can optionally read `jobId || jobSeekId` during hydration for compatibility, while all new writes use `jobId`.
- **[Risk] Publish pages do not have explicit record-id edit mode.** → **Mitigation:** Implement edit navigation conservatively. If direct edit-by-id is not available, show a clear “暂不支持编辑该信息” message rather than silently failing.
- **[Risk] N+1 lookups from collection rows to target records can be slow for many collections.** → **Mitigation:** Keep the first implementation simple with per-row promises and order by collection time; optimize with batched lookup only if Bmob SDK support and performance require it.
- **[Risk] Deleting a collection while popup is open can leave stale UI state.** → **Mitigation:** Close the popup after success and reload the active tab list.

## Migration Plan

1. Register the new page and route personal center “我的收藏” to it.
2. Update `seekerDetail` collection write/read/cancel logic to use `MyCollectInfo.jobId` for `type=2`.
3. Build the collection list page using existing formatter utilities and card styles.
4. Deploy without destructive data changes. Historical `jobSeekId` rows can remain; compatibility read support may keep them visible.

## Open Questions

- Should historical `MyCollectInfo.type=2.jobSeekId` records be backfilled server-side later, or is read-time compatibility enough?
- Should edit navigation become a full edit-by-id flow in `publishjob` and `pubilshJobSeek`, or should the collection page only expose edit for records already supported by existing update behavior?
