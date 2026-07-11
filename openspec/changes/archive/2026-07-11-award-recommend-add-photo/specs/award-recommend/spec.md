## ADDED Requirements

### Requirement: 推荐配图上传前校验体积与类型

系统 MUST 在用户将每张本地临时文件上传至 Bmob 之前完成校验：单文件大小须 **严格小于 3MB**（小于等于 `3145728` 字节）；文件类型须为图片类型（实现 MUST 拒绝非图片类型，例如基于扩展名白名单 `jpg`/`jpeg`/`png`/`gif`/`webp`/`bmp` 或小写等价形式，或与小程序可得元数据一致）。

#### Scenario: 单张文件超过大小上限

- **WHEN** 用户选定一张或多张本地文件准备上传且其中某一文件体积不小于 3MB
- **THEN** 客户端**须**拒绝为该文件发起上传并以清晰文案提示用户（例如「单张图片须小于 3MB」）；未超限的文件实现**可以**继续上传或与产品约定中止整批。

#### Scenario: 文件类型不是图片

- **WHEN** 用户准备的本地路径对应的类型校验结果表明不是允许的图片类型
- **THEN** 客户端**须**拒绝上传该文件并提示用户。

#### Scenario: 校验通过后上传

- **WHEN** 每张待上传文件的体积小于 3MB 且类型校验通过
- **THEN** 客户端**须**允许对该文件执行后续 `Bmob.File` 上传流程。

---

## MODIFIED Requirements

### Requirement: 推荐表单采集求职者档案字段

系统 MUST 提供推荐表单，包含：学历（单选）、联系方式（与交互一致的文本或电话输入）、求职意向、期望薪资范围、期望薪资下方的多图上传（选填，支持一次选择多张本地图片）、自我介绍及补充说明。

#### Scenario: 用户在奖励/推荐页看到全部表单项

- **WHEN** 用户打开 `pages/award/award`
- **THEN** 除求职者姓名字段外，界面**须**提供学历、联系方式、求职意向、期望薪资、期望薪资下方的多图上传、自我介绍与补充说明等输入控件。

---

### Requirement: 确认后将数据持久化到 JobSeeker

当用户确认提交（例如点击主要「确定/提交」控件）时，系统 MUST 将完整表单写入 Bmob 表 `JobSeeker`，包含提交人 `userName`、提交用户标识 `commitUid`（当前登录用户 `objectId`）、多张图 URL 经半角字符 `|` 拼接后的 `photoImgs`，以及变更设计中约定的其余求职者相关字段。

#### Scenario: 提交成功

- **WHEN** 用户点击确认控件且校验通过
- **THEN** 客户端**须**写入一条 `JobSeeker` 记录（或按设计决策更新已有记录），至少包含：提交人 `userName`，当前登录用户的 `objectId` 作为 `commitUid`，求职者身份字段（已实现的 `recoName`、`recoEducation`、`recoContact`、`recoJobIntent`、`recoSalaryRange`、`recoIntro`、`recoExtra`），以及将多张已上传图片的 URL 使用半角字符 `|` 拼接后的 `photoImgs` 字段（若无图片则 `photoImgs` 为空字符串或与实现对可选字段的空值策略一致），并与实现所选的去重/更新规则一致。
