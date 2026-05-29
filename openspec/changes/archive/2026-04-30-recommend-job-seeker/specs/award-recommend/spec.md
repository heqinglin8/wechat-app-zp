# award-recommend 规格说明

## Purpose

由变更 recommend-job-seeker 归档生成；描述招聘小程序「推荐求职者」页（`pages/award/award`）的表单能力、默认值及写入 Bmob `JobSeeker` 的行为。

## Requirements

### Requirement: 推荐表单采集求职者档案字段

系统 MUST 提供推荐表单，包含：学历（单选）、联系方式（与交互一致的文本或电话输入）、求职意向、期望薪资范围、自我介绍及补充说明。

#### Scenario: 用户在奖励/推荐页看到全部表单项

- **WHEN** 用户打开 `pages/award/award`
- **THEN** 除求职者姓名字段外，界面**须**提供学历、联系方式、求职意向、期望薪资、自我介绍与补充说明等输入控件。

---

### Requirement: 根据当前登录用户预填姓名与联系方式

在成功加载当前登录用户数据后，系统 MUST 用 `_User` 中的 `username` 与 `userphone` 预填求职者的姓名与联系方式字段。

#### Scenario: 已登录用户看到默认值

- **WHEN** 对 `_User` 的查询返回当前会话用户的记录
- **THEN** 姓名字段**须**初始化为该用户的 `username`，联系方式**须**初始化为该用户的 `userphone`，除非用户在同一会话中已编辑过这些字段（实现**可以**按产品选择在每次加载时重置；首次加载时**须**完成预填）。

---

### Requirement: 确认后将数据持久化到 JobSeeker

当用户确认提交（例如点击主要「确定/提交」控件）时，系统 MUST 将完整表单写入 Bmob 表 `JobSeeker`，包含提交人 `userName` 以及变更设计中约定的全部求职者相关字段。

#### Scenario: 提交成功

- **WHEN** 用户点击确认控件且校验通过
- **THEN** 客户端**须**写入一条 `JobSeeker` 记录（或按设计决策更新已有记录），至少包含：提交人 `userName`，求职者身份字段（已实现的 `recoName`、`recoEducation`、`recoContact`、`recoJobIntent`、`recoSalaryRange`、`recoIntro`、`recoExtra`），并与实现所选的去重/更新规则一致。

---

### Requirement: 学历为单选

学历字段 MUST NOT 支持多项同时选中；系统 MUST 通过单一选择控件约束选择行为（例如 `picker` 的 `selector` 模式）。

#### Scenario: 用户选择学历

- **WHEN** 用户在学历列表中选择一项
- **THEN** 该次提交**须**有且仅有一个存储值表示学历。
