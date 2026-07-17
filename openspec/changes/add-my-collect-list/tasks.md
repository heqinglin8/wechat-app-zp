## 1. Routing and Data Contract

- [x] 1.1 Register `pages/mycollect/mycollect` in `app.json` with an appropriate navigation title.
- [x] 1.2 Update `pages/personal/personal` so the “我的收藏” row navigates to the new page for logged-in users.
- [x] 1.3 Update `pages/seekerDetail/seekerDetail` so `type=2` collection create/status/cancel queries use `MyCollectInfo.jobId` pointing to `JobSeeker.objectId`.

## 2. Collection Page Data Loading

- [x] 2.1 Create `pages/mycollect` page files with state for current tab, loading, empty state, active popup item, and current user id.
- [x] 2.2 Implement loading current user's `MyCollectInfo` rows by active tab type (`1` for 招聘, `2` for 求职) ordered by newest collection first.
- [x] 2.3 Hydrate `type=1` rows by querying `JobInfo` with `jobId` and format cards with the recruitment card fields used by “我的报名”.
- [x] 2.4 Hydrate `type=2` rows by querying `JobSeeker` with `jobId` and format cards with the seeker card fields used by “我的求职”.
- [x] 2.5 Filter out collection rows whose target `JobInfo` or `JobSeeker` no longer exists so broken blank cards are not rendered.

## 3. Collection Page UI

- [x] 3.1 Build the top “招聘 / 求职” tabbar using the same visual treatment as `zhiyan-tabbar`.
- [x] 3.2 Render recruitment collection cards using the “我的报名” item structure without checkbox selection controls.
- [x] 3.3 Render job seeker collection cards using the “我的求职” item structure without checkbox selection controls.
- [x] 3.4 Add detail navigation when tapping a card: recruitment cards open `jobDetail`, job seeker cards open `seekerDetail`.
- [x] 3.5 Add a vertical three-dot action entry to the right of `cardSalary` and prevent it from triggering card detail navigation.

## 4. Popup Actions

- [x] 4.1 Implement a bottom popup with mask, two full-width options (“编辑”, “删除”), and a right-top close button.
- [x] 4.2 Implement close behavior for the popup without side effects.
- [x] 4.3 Implement “删除” as cancel-collection: confirm, delete the selected `MyCollectInfo` row, close popup, and refresh the active list.
- [x] 4.4 Implement “编辑” ownership checks against the target record's `commitUid`; block and toast when the current user is not the publisher.
- [x] 4.5 Implement safe edit behavior for owned records by using the available publish/edit flow or showing a clear unsupported-edit message if direct edit-by-id is not supported.

## 5. Verification

- [x] 5.1 Verify personal center “我的收藏” opens the new page.
- [x] 5.2 Verify “招聘” tab loads `type=1` `MyCollectInfo.jobId -> JobInfo` cards and opens job details.
- [x] 5.3 Verify “求职” tab loads `type=2` `MyCollectInfo.jobId -> JobSeeker` cards and opens seeker details.
- [x] 5.4 Verify seeker detail collection writes, status checks, and cancellation all use `jobId` for new `type=2` records.
- [x] 5.5 Verify the three-dot popup opens/closes correctly and “删除” removes only the collection row.
