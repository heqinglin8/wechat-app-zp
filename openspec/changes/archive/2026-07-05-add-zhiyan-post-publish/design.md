## Context

职言 feed 已经通过 `pages/zhiyan/zhiyan` 展示 `Post` 数据，并且发布入口当前导航到 `/pages/publishPost/publishPost`，但该页面尚未存在。归档后的 `zhiyan-post-feed` 主规格中，发布入口仍允许在发布页未实现时展示兜底提示；本变更需要把该入口接到真实发布页。

项目已有可复用基础：
- `utils/imageUpload.js` 支持图片校验、必要压缩、Bmob 文件上传和生成展示 URL。
- `pages/pubilshJobSeek` / `pages/publishjob` 已有最多 6 张图片、上传中状态、删除/替换和 `photoImgs` 拼接模式。
- `components/message-board` 已有简单 emoji 面板和点击插入文本的交互。
- `services/postService.js` 已集中封装 `Post` 的读取、作者补全、点赞和评论统计，可扩展发帖写入能力。

## Goals / Non-Goals

**Goals:**
- 新增 `pages/publishPost/publishPost`，视觉上贴近 `local_source/post-publish.jpg` 的轻量编辑器页面。
- 标题选填，最多 20 字，并显示字数计数。
- 正文必填；图片可选；图片最多 6 张，支持相册和拍照。
- 支持通过 emoji 面板向正文插入表情。
- 发布时写入 Bmob `Post`，并在发布成功后返回职言列表刷新。
- 隐藏身份“切换”、模板、话题、标签等截图中存在但本期不做的入口。

**Non-Goals:**
- 不实现多身份切换。
- 不实现模板、话题、标签、@ 用户、链接、投票等高级编辑器能力。
- 不实现草稿箱、自动保存、编辑已发布帖子或发布后的审核后台。
- 不变更 `Post` 列表和详情的展示规则，除发布入口和成功刷新外。

## Decisions

### 1. 新增独立发布页，保留自定义顶部栏

发布页使用 `navigationStyle: "custom"` 或等效页面内顶部栏，自己渲染关闭按钮、标题“发帖子”和发布按钮。这样更接近截图，也能让发布按钮根据正文、上传状态和提交状态实时置灰。

备选方案：使用原生导航栏右上角按钮。该方式实现更少，但小程序原生导航不适合放置动态发布按钮，也不贴近截图。

### 2. 以 `content` 作为发布门槛，`title` 和图片为可选

用户确认：标题选填，正文必须有内容；图片可以有也可以没有。发布按钮的 enabled 状态应由 `content.trim()`、图片上传完成状态和 `submitting` 共同决定。

建议校验：
- `title.trim().length <= 20`
- `content.trim().length > 0`
- 所有图片均已上传完成
- 用户已登录且存在 `_User.objectId`

### 3. 图片采用“即选即传”的本地状态模型

图片状态沿用现有发布页模式：

```text
chooseImage
  -> tempPath
  -> prepareImage
  -> uploadPreparedImage
  -> { path, url, uploading:false }
```

页面保存 `postPhotos` 数组，每项包含 `url`、`path`、`tempPath`、`uploading`。提交时只把 `path` 拼成 `photoImgs`。选择入口使用 `wx.chooseImage({ sourceType: ['album', 'camera'] })`，这满足“从相册选择和拍照”的要求，并优先使用微信控件/API。

备选方案：提交时统一上传所有图片。该方式可以减少中间状态，但提交时等待更长，失败后用户难以知道是哪张图片失败；项目现有模式已经偏向即选即传。

### 4. 表情使用轻量 emoji 面板并插入正文尾部

复用留言板中的 emoji 列表思路，在底部工具栏提供表情按钮，点击展开面板；点击某个 emoji 后追加到 `content`。这符合“支持插入表情”的要求，也不引入复杂富文本编辑器。

备选方案：使用富文本编辑器或自定义光标插入。富文本会显著增加复杂度；本期只需要文本正文和 emoji 字符即可。

### 5. 写入逻辑放到 `postService`

在 `services/postService.js` 增加创建帖子的方法，例如 `createPost({ title, content, photoImgs, user })`。页面负责 UI 状态和校验，service 负责 Bmob `Post` 写入，保持读写逻辑集中。

写入字段建议：
- `title`: 选填标题，trim 后保存
- `content`: 必填正文，trim 后保存
- `photoImgs`: 图片 path 以 `|` 拼接
- `commitUid`: 当前登录用户 `objectId`
- `commitUsername`: 当前用户显示名
- `active`: 沿用当前 feed 的有效过滤逻辑，建议默认 `1`

### 6. 发布成功通过上一页实例刷新列表

发布成功后优先使用 `getCurrentPages()` 找到上一页，如果上一页是 `pages/zhiyan/zhiyan`，设置 `_needRefreshOnShow = true` 或直接调用 `loadFirstPage()`，然后 `wx.navigateBack()`。这样和当前列表页已有 `onShow` 刷新机制兼容。

备选方案：用全局事件或 storage 标记。全局事件引入额外机制；storage 标记需要额外清理。当前页面实例标记足够简单。

## Risks / Trade-offs

- [Risk] 图片上传中用户点击发布，可能写入缺失图片。-> 发布按钮和提交逻辑都必须检查 `photosReadyForSubmit()`。
- [Risk] Bmob 当前用户对象缺失或本地登录状态异常。-> 发布页加载时刷新当前用户；提交时再次检查 `commitUid`，失败则提示登录。
- [Risk] 标题计数和输入限制不一致。-> 使用 `maxlength="20"` 并基于当前 `title.length` 展示字数。
- [Risk] 表情追加到正文尾部，不支持按光标插入。-> 本期接受轻量实现，后续若需要再升级编辑器。
- [Risk] 发布成功后列表未刷新。-> 使用上一页 `_needRefreshOnShow` 机制，并验证返回后列表重新加载。
- [Risk] `active` 默认值与角色审核策略不一致。-> 当前发帖默认 `active=1`，如果后续需要审核，可在 `postService.createPost` 内集中调整。
