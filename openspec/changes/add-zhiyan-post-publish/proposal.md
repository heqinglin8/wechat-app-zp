## Why

职言列表已经有发布入口，但当前没有真实帖子发布页面，用户无法从“职言”完成发帖闭环。新增发布页可以承接列表页圆形加号入口，让用户输入正文、可选标题和图片后写入 Bmob `Post` 表，并在发布成功后回到职言 feed。

## What Changes

- 新增职言帖子发布页面，视觉风格参考 `local_source/post-publish.jpg`，包含顶部关闭/标题/发布按钮、发布者信息、标题输入、正文输入、图片区和底部工具栏。
- 标题 `title` 为选填，最多 20 字，并显示字数计数。
- 正文 `content` 为必填，未填写正文时禁止发布并提示用户。
- 图片为选填，最多 6 张，支持通过微信图片能力从相册选择或拍照；图片上传后写入 `photoImgs`，沿用多图 `|` 拼接格式。
- 支持在正文中插入表情，复用简单 emoji 面板交互。
- 隐藏截图中的“切换”身份入口，不支持身份切换；仅展示当前登录用户信息。
- 隐藏截图中的模板、话题、标签入口，不实现模板、话题、标签发布能力。
- 发布成功后创建 `Post` 记录，并返回职言列表，使列表刷新后可看到新帖子。
- 修改职言列表页发布入口，使其打开真实的 `pages/publishPost/publishPost` 发布页。

## Capabilities

### New Capabilities
- `zhiyan-post-publish`: 职言帖子发布页面能力，覆盖发布页 UI、标题/正文输入、图片选择上传、表情插入、登录校验和写入 `Post`。

### Modified Capabilities
- `zhiyan-post-feed`: 职言列表发布入口从“发布页未实现时提示”调整为打开真实帖子发布页面，并在发布成功返回后刷新列表。

## Impact

- 新增页面：`pages/publishPost/publishPost`。
- 修改路由：`app.json` 需要注册 `pages/publishPost/publishPost`。
- 修改职言列表页：`pages/zhiyan/zhiyan` 的发布入口需要进入真实发布页，并在发布成功后刷新。
- 数据表：写入 Bmob `Post` 表，字段至少包含 `title`、`content`、`photoImgs`、`commitUid`，建议同时写入 `commitUsername`、`active`。
- 复用工具：`utils/imageUpload.js` 处理图片校验、压缩和 Bmob 上传；复用现有用户读取方式获取 `_User` 信息。
