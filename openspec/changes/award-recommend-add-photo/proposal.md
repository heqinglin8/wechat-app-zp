## Why

推荐表单目前仅能录入文本信息；业务希望在期望薪资下方补充求职者相关图片（如证件照、作品截图），便于用人单位直观评估。在微信小程序侧使用 Bmob 文件上传能力与既有 `JobSeeker` 写入流程对齐即可落地。

## What Changes

- 在 `pages/award/award` 推荐页「期望薪资」表单项下方增加多图上传区域：同一表单提交前配图总数 **不得超过 6 张**；新增图片时分批选择仍受此上限约束。
- 每张配图（无论仍为本地待上传或已取得云端 URL）在用户点击表单「确定」提交整条推荐之前，**须**支持 **替换**（重新选图并走校验与上传流程，覆盖该槽位）。
- 选用图片后在上传前校验：单张 **小于等于 3MB**（**≤ `3145728`** 字节）；类型须为图片（拒绝非图片）。通过后按 Bmob `wx.chooseImage` + `Bmob.File` + `save()` 上传；将返回的多条 URL 用半角竖线 `|` 拼接成单个字符串。
- 提交推荐时将该字符串写入 Bmob `JobSeeker` 表的 `photoImgs` 字段（需在控制台为该 Class 新增列）；与新建/更新已有推荐记录的逻辑保持一致。
- 提交时在 `JobSeeker` 写入提交人姓名字段 **`commitUsername`**（值为当前登录用户在表单中所用的提交人名字串，与同会话 `_User.username` 预填同源）；同时写入 `commitUid`（`_User.objectId`，与登录态校验同源）。
- 图片字段为选填：未上传则不写入或写入空字符串（与实现对空字段的一致策略）。

## Capabilities

### New Capabilities

（无独立新能力域；行为归入既有「有奖职位推荐」规格。）

### Modified Capabilities

- `award-recommend`: 表单增加薪资下方的多图上传（**最多 6 张**、支持槽位替换、含上传前大小与类型校验）；持久化要求扩展为包含 `photoImgs`、`commitUid`、`commitUsername`（提交人姓名列名；替代原 `userName` 字段名的语义）。

## Impact

- **前端**：`pages/award/award.wxml`、`award.wxss`、`award.js`（状态、选图与 **`MAX_RECOMMEND_PHOTOS = 6`**、槽位替换、上传前校验、上传、`|` 拼接、`applyJobSeekerFields`）。
- **Bmob**：`JobSeeker` 使用 **`commitUsername`**（String）存提交人姓名；新增 **`photoImgs`**（String）、**`commitUid`**（String，`objectId`）。若表中曾为提交人使用列名 `userName`，实现侧须改为读写 **`commitUsername`**（含控制台列配置与查询条件）；依赖既有 Bmob SDK 与小程序相册/存储权限。
- **可选**：若 `pages/myaward` 等处展示推荐详情，可按产品决定是否展示图片列表（本变更以表单录入与写入为主）。
