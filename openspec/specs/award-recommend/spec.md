# award-recommend 规格说明

## Purpose

由变更 recommend-job-seeker 归档生成；描述招聘小程序「推荐求职者」页（`pages/award/award`）的表单能力、默认值及写入 Bmob `JobSeeker` 的行为。
## Requirements
### Requirement: 推荐表单采集求职者档案字段

系统 MUST 提供推荐表单，包含：标题、称呼、学历（单选）、电话、微信号、求职意向、工种（单选）、期望薪资范围、摘要、自我介绍及图片。

#### Scenario: 用户在奖励/推荐页看到全部表单项

- **WHEN** 用户打开 `pages/pubilshJobSeek/pubilshJobSeek`
- **THEN** 界面 MUST 提供标题、称呼、学历、电话、微信号、求职意向、工种、期望薪资、摘要、自我介绍与图片输入能力。

#### Scenario: 用户切换工种后看到对应薪资单位提示

- **WHEN** 用户在工种中选择 `payType=0`（普通月结）
- **THEN** 薪资输入行右侧 MUST 展示 `/月`

- **WHEN** 用户在工种中选择 `payType=1`（临时工）
- **THEN** 薪资输入行右侧 MUST 展示 `/天`

---

### Requirement: 推荐配图上传前校验体积与类型

系统 MUST 在用户将每张本地临时文件上传至 Bmob 之前完成校验：单文件大小须 **严格小于 3MB**（小于等于 `3145728` 字节）；文件类型须为图片类型（实现 MUST 拒绝非图片类型，例如基于扩展名白名单 `jpg`/`jpeg`/`png`/`gif`/`webp`/`bmp` 或小写等价形式，或与小程序可得元数据一致）。

#### Scenario: 单张文件超过大小上限

- **WHEN** 用户选定一张或多张本地文件准备上传且其中某一文件体积不小于 3MB
- **THEN** 客户端 MUST 拒绝为该文件发起上传并以清晰文案提示用户（例如「单张图片须小于 3MB」）；未超限的文件实现可以继续上传或与产品约定中止整批。

#### Scenario: 文件类型不是图片

- **WHEN** 用户准备的本地路径对应的类型校验结果表明不是允许的图片类型
- **THEN** 客户端 MUST 拒绝上传该文件并提示用户。

#### Scenario: 校验通过后上传

- **WHEN** 每张待上传文件的体积小于 3MB 且类型校验通过
- **THEN** 客户端 MUST 允许对该文件执行后续 `Bmob.File` 上传流程。

---

### Requirement: 根据当前登录用户预填姓名与联系方式

在成功加载当前登录用户数据后，系统 MUST 用 `_User` 中的 `username` 与 `userphone` 预填求职者的姓名与联系方式字段。

#### Scenario: 已登录用户看到默认值

- **WHEN** 对 `_User` 的查询返回当前会话用户的记录
- **THEN** 姓名字段**须**初始化为该用户的 `username`，联系方式**须**初始化为该用户的 `userphone`，除非用户在同一会话中已编辑过这些字段（实现**可以**按产品选择在每次加载时重置；首次加载时**须**完成预填）。

---

### Requirement: 确认后将数据持久化到 JobSeeker

当用户确认提交（例如点击主要「确定/提交」控件）时，系统 MUST 将完整表单写入 Bmob 表 `JobSeeker`，包含提交人 `commitUsername`/`commitUid`、当前城市信息以及变更设计中约定的全部求职者相关字段。当前城市信息 MUST 包含省、市、区/县名称和省码、市码、区码，并具体到区/县。

#### Scenario: 提交成功

- **WHEN** 用户点击确认控件且校验通过
- **THEN** 客户端 MUST 写入一条 `JobSeeker` 记录（或按设计决策更新已有记录），至少包含：`title`、`recoName`、`recoEducation`、`recoContact`、`wxid`、`recoJobIntent`、`payType`、`detPayMin`、`detPayMax`、`summary`、`recoIntro`、`photoImgs`、`active`、`commitUsername`、`commitUid`，并与实现所选的去重/更新规则一致。

### Requirement: 学历为单选

学历字段 MUST NOT 支持多项同时选中；系统 MUST 通过单一选择控件约束选择行为（例如 `picker` 的 `selector` 模式）。

#### Scenario: 用户选择学历

- **WHEN** 用户在学历列表中选择一项
- **THEN** 该次提交**须**有且仅有一个存储值表示学历。

### Requirement: 推荐求职发布页展示当前城市
系统 MUST 在推荐求职发布页展示当前城市信息，并禁止用户在该发布页内更改城市。

#### Scenario: 用户看到只读城市信息
- **WHEN** 用户打开 `pages/pubilshJobSeek/pubilshJobSeek`
- **THEN** 页面 MUST 展示当前省、市、区/县信息，并展示小字提醒只能发布本城市的信息

#### Scenario: 用户不能在发布页修改城市
- **WHEN** 用户在推荐求职发布页填写求职信息
- **THEN** 页面 MUST NOT 提供表单内城市修改入口
