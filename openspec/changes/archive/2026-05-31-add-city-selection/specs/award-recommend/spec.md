## ADDED Requirements

### Requirement: 推荐求职发布页展示当前城市
系统 MUST 在推荐求职发布页展示当前城市信息，并禁止用户在该发布页内更改城市。

#### Scenario: 用户看到只读城市信息
- **WHEN** 用户打开 `pages/pubilshJobSeek/pubilshJobSeek`
- **THEN** 页面 MUST 展示当前省、市、区/县信息，并展示小字提醒只能发布本城市的信息

#### Scenario: 用户不能在发布页修改城市
- **WHEN** 用户在推荐求职发布页填写求职信息
- **THEN** 页面 MUST NOT 提供表单内城市修改入口

## MODIFIED Requirements

### Requirement: 确认后将数据持久化到 JobSeeker

当用户确认提交（例如点击主要「确定/提交」控件）时，系统 MUST 将完整表单写入 Bmob 表 `JobSeeker`，包含提交人 `userName`、当前城市信息以及变更设计中约定的全部求职者相关字段。当前城市信息 MUST 包含省、市、区/县名称和省码、市码、区码，并具体到区/县。

#### Scenario: 提交成功

- **WHEN** 用户点击确认控件且校验通过
- **THEN** 客户端**须**写入一条 `JobSeeker` 记录（或按设计决策更新已有记录），至少包含：提交人 `userName`，求职者身份字段（已实现的 `recoName`、`recoEducation`、`recoContact`、`recoJobIntent`、`recoSalaryRange`、`recoIntro`、`recoExtra`），当前城市字段（`provinceName`、`cityName`、`districtName`、`provinceCode`、`cityCode`、`districtCode`、`cityDisplayName`），并与实现所选的去重/更新规则一致。
