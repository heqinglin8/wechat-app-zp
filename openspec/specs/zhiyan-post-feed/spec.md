# zhiyan-post-feed 规格说明

## Purpose

描述招聘小程序“职言”帖子 feed 与详情能力，包括原生 tabBar 入口、帖子列表、搜索、分享、评论、点赞、详情展示，以及基于 Bmob `Post`、`PostLike` 和 `MessageBoardMessage` 的数据绑定规则。

## Requirements

### Requirement: 职言帖子列表页面结构
系统 SHALL 提供一个职言帖子列表页面，页面包含搜索行、单类目 tabbar 和职场帖子列表，整体视觉风格 SHALL 贴近 `local_source/zhiyan-list.jpg` 的白色卡片、浅色背景、作者信息和底部互动栏布局。

#### Scenario: 首屏展示列表结构
- **WHEN** 用户进入职言帖子列表页面
- **THEN** 系统必须展示一个搜索框、搜索框右侧的圆形发布入口、仅包含“职言”的类目 tabbar，以及帖子列表区域

#### Scenario: 类目 tabbar 只有职言
- **WHEN** 用户查看职言页面的类目 tabbar
- **THEN** 系统必须只展示“职言”一个类目，并将其作为当前选中类目

### Requirement: app.json 职言入口
系统 SHALL 在 `app.json` 的原生底部 tabBar 中新增一个名为“职言”的入口，该入口 SHALL 位于“今日招聘”右侧，并打开职言帖子列表页面。新增后的 tabBar 展示顺序 MUST 为：首页、今日招聘、职言、个人中心。

#### Scenario: 底部导航进入职言
- **WHEN** 用户点击底部 tabBar 中的“职言”入口
- **THEN** 系统必须打开职言帖子列表页面，并展示帖子列表内容

#### Scenario: 底部导航顺序
- **WHEN** 小程序展示原生底部 tabBar
- **THEN** tabBar 入口必须按：首页、今日招聘、职言、个人中心 的顺序展示

#### Scenario: app.json 路由配置
- **WHEN** 小程序读取 `app.json` 配置
- **THEN** `pages/zhiyan/zhiyan` 必须注册在 `pages` 中，且“职言”tabBar 项的 `pagePath` 必须指向 `pages/zhiyan/zhiyan`

### Requirement: 发布入口
系统 SHALL 在搜索框同一行右侧展示一个圆形发布图标，图标中间 SHALL 为加号，并作为发布帖子的入口。点击该入口 MUST 打开真实的职言帖子发布页面。

#### Scenario: 点击发布入口
- **WHEN** 用户点击搜索框右侧的发布图标
- **THEN** 系统必须打开 `pages/publishPost/publishPost` 职言帖子发布页面

#### Scenario: 发布成功后刷新列表
- **WHEN** 用户从职言帖子发布页面发布成功并返回职言列表页面
- **THEN** 系统必须刷新职言帖子列表，使新发布的帖子可以出现在列表中

### Requirement: 帖子列表数据绑定
系统 SHALL 从 Bmob 数据表 `Post` 加载帖子列表，帖子基础展示数据 MUST 包含 `title`、`content` 和 `commitUid`，并使用 `commitUid` 查询 `_User` 表获取发布者信息。

#### Scenario: 加载帖子和发布者信息
- **WHEN** `Post` 表返回包含 `title`、`content`、`commitUid` 和 `objectId` 的帖子记录
- **THEN** 系统必须根据 `commitUid` 查询 `_User.objectId` 对应的用户信息，并在帖子卡片顶部展示发布者信息

#### Scenario: 发布者或帖子字段缺失
- **WHEN** 帖子或发布者信息缺少某个用于展示的字段
- **THEN** 系统必须使用形如 `<字段名>未填写` 的文本兜底，而不是展示空白、`undefined` 或 `null`

#### Scenario: 列表按时间展示
- **WHEN** 用户首次进入职言帖子列表页面
- **THEN** 系统必须按帖子更新时间或创建时间倒序展示帖子，并支持分页加载更多

### Requirement: 帖子列表搜索
系统 SHALL 支持在职言列表页按关键词搜索帖子，搜索范围 MUST 至少包含帖子标题 `title` 和帖子内容 `content`。

#### Scenario: 搜索匹配帖子
- **WHEN** 用户输入关键词并确认搜索
- **THEN** 系统必须展示 `title` 或 `content` 命中该关键词的帖子

#### Scenario: 搜索无结果
- **WHEN** 用户搜索的关键词没有匹配任何帖子
- **THEN** 系统必须展示空状态提示，并允许用户清空或重新搜索

### Requirement: 帖子列表卡片展示规则
系统 SHALL 以卡片形式展示每条帖子，卡片底部 MUST 包含分享、评论、点赞按钮。

#### Scenario: 展示帖子文本
- **WHEN** 帖子包含标题和内容
- **THEN** 系统必须在列表卡片中展示帖子标题和帖子内容摘要

#### Scenario: 标题超过三行
- **WHEN** 帖子标题在列表卡片中渲染后超过三行
- **THEN** 系统必须将标题显示限制为最多三行，并展示省略号和“全文”入口

#### Scenario: 点击全文入口
- **WHEN** 用户点击列表卡片中的“全文”入口
- **THEN** 系统必须跳转到该帖子的职言详情页面

#### Scenario: 标题未超过三行
- **WHEN** 帖子标题在列表卡片中未超过三行
- **THEN** 系统必须不展示“全文”入口

#### Scenario: 列表图片超过三张
- **WHEN** 帖子包含超过三张图片
- **THEN** 系统必须在列表卡片中最多展示前三张图片

### Requirement: 列表互动行为
系统 SHALL 支持在每条帖子列表卡片底部执行分享、评论和点赞操作。

#### Scenario: 点击分享
- **WHEN** 用户点击列表卡片底部的分享按钮
- **THEN** 系统必须打开微信原生分享弹窗，并分享当前帖子

#### Scenario: 点击评论
- **WHEN** 用户点击列表卡片底部的评论按钮
- **THEN** 系统必须跳转到该帖子的职言详情页面

#### Scenario: 列表评论数量展示
- **WHEN** 某条帖子没有评论
- **THEN** 列表卡片底部必须展示评论图标和文本“评论”
- **WHEN** 某条帖子存在评论
- **THEN** 列表卡片底部必须展示评论图标和文本“评论：<评论数>”

#### Scenario: 根据 PostLike 判断当前用户点赞状态
- **WHEN** 系统展示列表卡片点赞状态
- **THEN** 系统必须直接查询 `PostLike` 表中当前帖子 `postId` 和当前登录用户 `userId` 对应的点赞记录

#### Scenario: 未点赞状态展示
- **WHEN** 当前登录用户尚未点赞某条帖子
- **THEN** 系统必须使用浅灰色展示该帖子的点赞图标或点赞状态

#### Scenario: 已点赞状态展示
- **WHEN** 当前登录用户已点赞某条帖子
- **THEN** 系统必须使用 `#fc3` 展示该帖子的点赞图标或点赞状态

#### Scenario: 点赞和取消点赞
- **WHEN** 已登录用户点击某条帖子的点赞按钮
- **THEN** 系统必须在点赞和取消点赞之间切换，并持久化当前用户对该帖子的点赞状态

#### Scenario: 未登录用户点赞
- **WHEN** 未登录用户点击某条帖子的点赞按钮
- **THEN** 系统必须提示用户先登录，且不得改变该帖子的点赞状态

### Requirement: 职言详情页面内容
系统 SHALL 提供职言详情页面，页面视觉风格 SHALL 贴近 `local_source/zhiyan-detail.jpg`，并展示帖子发布者信息、帖子标题、帖子完整内容和帖子图片。

#### Scenario: 打开职言详情
- **WHEN** 用户从列表页进入某条帖子的职言详情页面
- **THEN** 系统必须根据当前帖子的 `objectId` 加载 `Post` 记录，并展示发布者信息、帖子标题和完整 `content`

#### Scenario: 详情图片最多六张
- **WHEN** 帖子包含超过六张图片
- **THEN** 系统必须在详情页最多展示前六张图片

#### Scenario: 详情字段缺失
- **WHEN** 详情页所需的帖子或发布者字段缺失
- **THEN** 系统必须使用形如 `<字段名>未填写` 的文本兜底，而不是展示空白、`undefined` 或 `null`

### Requirement: 详情互动和评论列表
系统 SHALL 在职言详情页展示分享、评论和点赞图标，并在互动图标下方展示该帖子的评论列表。

#### Scenario: 详情页分享
- **WHEN** 用户点击职言详情页的分享图标
- **THEN** 系统必须打开微信原生分享弹窗，并分享当前帖子详情

#### Scenario: 详情页点赞
- **WHEN** 已登录用户点击职言详情页的点赞图标
- **THEN** 系统必须在点赞和取消点赞之间切换，并使用 `#fc3` 表示已点赞、浅灰色表示未点赞

#### Scenario: 详情页评论数量展示
- **WHEN** 当前帖子没有评论
- **THEN** 详情页互动栏必须展示评论图标和文本“评论”
- **WHEN** 当前帖子存在评论
- **THEN** 详情页互动栏必须展示评论图标和文本“评论：<评论数>”

#### Scenario: 加载帖子评论
- **WHEN** 职言详情页加载当前帖子评论
- **THEN** 系统必须查询 `MessageBoardMessage` 中 `targetType` 等于 `post` 且 `targetId` 等于当前帖子 `objectId` 的评论数据

#### Scenario: 评论列表位置
- **WHEN** 职言详情页展示分享、评论和点赞图标
- **THEN** 系统必须在这些互动图标下方展示评论列表
