## Why

个人中心的“我的收藏”当前没有进入收藏列表，用户收藏招聘或求职信息后缺少统一查看与管理入口。需要补齐收藏中心，让登录用户能按“招聘 / 求职”分类查看已收藏内容，并对收藏项进行基础操作。

## What Changes

- 新增“我的收藏”页面，并从个人中心“我的收藏”入口跳转进入。
- 页面顶部提供两个 tab：“招聘”和“求职”，视觉风格与 `zhiyan-tabbar` 保持一致。
- “招聘”tab 展示当前登录用户在 `MyCollectInfo` 中 `type=1` 的收藏记录，并通过 `jobId` 查询 `JobInfo` 渲染招聘卡片。
- “求职”tab 展示当前登录用户在 `MyCollectInfo` 中 `type=2` 的收藏记录，并通过 `jobId` 查询 `JobSeeker` 渲染求职卡片。
- 招聘收藏项复用“我的报名”列表 item 的视觉结构；求职收藏项复用“我的求职”列表 item 的视觉结构。
- 收藏项薪水右侧展示竖向三点入口，点击后从底部弹出操作面板，提供“编辑”和“删除”选项，并带右上角关闭按钮。
- 统一求职收藏记录的数据口径：`MyCollectInfo.type=2` 使用 `jobId` 指向 `JobSeeker.objectId`，不再使用 `jobSeekId` 作为新写入字段。
- 暂不提供“加精”选项。

## Capabilities

### New Capabilities

- `my-collections`: 登录用户按招聘/求职分类查看和管理收藏信息。

### Modified Capabilities

- None.

## Impact

- Affected pages: `pages/personal/personal`, new `pages/mycollect/*`, `pages/seekerDetail/seekerDetail`.
- Affected data: Bmob `MyCollectInfo`, `JobInfo`, `JobSeeker`.
- Affected routing: `app.json` page registration for the new collection page.
- Affected UI patterns: `zhiyan-tabbar` style, `myjoin` recruitment card item, `myjobseeks` job seeker card item, bottom operation popup.
