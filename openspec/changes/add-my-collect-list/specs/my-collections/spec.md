## ADDED Requirements

### Requirement: 个人中心收藏入口进入我的收藏页

系统 MUST 在登录用户的个人中心提供“我的收藏”入口，并在点击后打开我的收藏列表页。

#### Scenario: 登录用户点击我的收藏

- **WHEN** 登录用户在 `pages/personal/personal` 点击“我的收藏”
- **THEN** 系统 MUST 跳转到我的收藏列表页

### Requirement: 我的收藏页按招聘和求职分类展示

我的收藏列表页 MUST 在列表顶部展示两个 tab：“招聘”和“求职”，且 tabbar 视觉 MUST 与 `zhiyan-tabbar` 保持一致。

#### Scenario: 用户打开我的收藏页

- **WHEN** 用户进入我的收藏列表页
- **THEN** 页面顶部 MUST 展示“招聘”和“求职”两个 tab

#### Scenario: 用户切换收藏分类

- **WHEN** 用户点击“招聘”或“求职”tab
- **THEN** 页面 MUST 切换到对应类型的收藏列表并高亮当前 tab

### Requirement: 招聘收藏列表使用 MyCollectInfo type=1 和 JobInfo 渲染

系统 MUST 从 `MyCollectInfo` 查询当前登录用户 `type=1` 的收藏记录，并使用每条收藏记录的 `jobId` 查询 `JobInfo` 后展示招聘信息。招聘收藏 item 的 UI MUST 与“我的报名”的 item 样式保持一致。

#### Scenario: 展示招聘收藏

- **WHEN** 当前登录用户打开“招聘”收藏 tab
- **THEN** 系统 MUST 查询 `MyCollectInfo.userId` 为当前用户且 `type=1` 的记录
- **THEN** 系统 MUST 使用收藏记录的 `jobId` 查询 `JobInfo`
- **THEN** 页面 MUST 使用“我的报名”item 风格展示查询到的招聘信息

#### Scenario: 招聘目标信息不存在

- **WHEN** 某条 `type=1` 收藏记录的 `jobId` 无法查询到对应 `JobInfo`
- **THEN** 页面 MUST NOT 展示损坏的空白招聘卡片

### Requirement: 求职收藏列表使用 MyCollectInfo type=2 和 JobSeeker 渲染

系统 MUST 从 `MyCollectInfo` 查询当前登录用户 `type=2` 的收藏记录，并使用每条收藏记录的 `jobId` 查询 `JobSeeker` 后展示求职信息。求职收藏 item 的 UI MUST 与“我的求职”的 item 样式保持一致。

#### Scenario: 展示求职收藏

- **WHEN** 当前登录用户打开“求职”收藏 tab
- **THEN** 系统 MUST 查询 `MyCollectInfo.userId` 为当前用户且 `type=2` 的记录
- **THEN** 系统 MUST 使用收藏记录的 `jobId` 查询 `JobSeeker`
- **THEN** 页面 MUST 使用“我的求职”item 风格展示查询到的求职信息

#### Scenario: 求职目标信息不存在

- **WHEN** 某条 `type=2` 收藏记录的 `jobId` 无法查询到对应 `JobSeeker`
- **THEN** 页面 MUST NOT 展示损坏的空白求职卡片

### Requirement: 求职收藏记录统一写入 jobId

系统 MUST 将新的求职收藏记录写入 `MyCollectInfo.jobId`，并以 `type=2` 表示该 `jobId` 指向 `JobSeeker.objectId`。

#### Scenario: 用户收藏求职信息

- **WHEN** 用户在求职详情页收藏某条 `JobSeeker`
- **THEN** 系统 MUST 创建或保留一条 `MyCollectInfo` 记录，其中 `userId` 为当前用户、`type=2`、`jobId` 为该 `JobSeeker.objectId`

#### Scenario: 用户取消收藏求职信息

- **WHEN** 用户在求职详情页取消收藏某条 `JobSeeker`
- **THEN** 系统 MUST 删除当前用户 `type=2` 且 `jobId` 为该 `JobSeeker.objectId` 的 `MyCollectInfo` 记录

### Requirement: 收藏卡片提供底部操作弹窗

每个收藏卡片 MUST 在薪水文本右侧展示竖向三点操作入口。点击入口后，页面 MUST 从底部弹出操作面板，面板包含“编辑”和“删除”两个全宽横条选项，并在右上角提供关闭按钮。

#### Scenario: 打开操作弹窗

- **WHEN** 用户点击收藏卡片薪水右侧的竖向三点
- **THEN** 页面 MUST 从底部弹出操作面板
- **THEN** 操作面板 MUST 展示“编辑”和“删除”选项
- **THEN** 操作面板 MUST 展示右上角关闭按钮

#### Scenario: 关闭操作弹窗

- **WHEN** 用户点击操作面板右上角关闭按钮
- **THEN** 页面 MUST 关闭操作面板且不执行编辑或删除操作

### Requirement: 删除操作取消收藏记录

在我的收藏页点击“删除” MUST 删除当前选中卡片对应的 `MyCollectInfo` 收藏记录，而不是删除 `JobInfo` 或 `JobSeeker` 原始信息。

#### Scenario: 删除招聘收藏

- **WHEN** 用户在招聘收藏卡片的操作面板点击“删除”并确认
- **THEN** 系统 MUST 删除对应 `type=1` 的 `MyCollectInfo` 收藏记录
- **THEN** 页面 MUST 从招聘收藏列表移除该卡片

#### Scenario: 删除求职收藏

- **WHEN** 用户在求职收藏卡片的操作面板点击“删除”并确认
- **THEN** 系统 MUST 删除对应 `type=2` 的 `MyCollectInfo` 收藏记录
- **THEN** 页面 MUST 从求职收藏列表移除该卡片

### Requirement: 编辑操作不得允许编辑他人信息

在我的收藏页点击“编辑”时，系统 MUST 校验当前登录用户是否为原始信息发布者。若不是发布者，系统 MUST 阻止编辑并提示用户无权编辑。

#### Scenario: 用户编辑自己发布的收藏信息

- **WHEN** 用户在自己发布的招聘或求职收藏卡片操作面板点击“编辑”
- **THEN** 系统 MUST 允许进入对应编辑流程或打开支持编辑的发布页面

#### Scenario: 用户编辑他人发布的收藏信息

- **WHEN** 用户在他人发布的招聘或求职收藏卡片操作面板点击“编辑”
- **THEN** 系统 MUST 阻止编辑
- **THEN** 系统 MUST 提示用户无权编辑该信息
