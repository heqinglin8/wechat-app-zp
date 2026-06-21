# paytype-salary-display Specification

## Purpose
TBD - created by syncing change award-recommend-add-paytype.

## Requirements
### Requirement: 薪资单位展示由 payType 统一驱动
系统 MUST 在岗位与求职相关展示位中以 `payType` 作为薪资单位语义来源：`payType=1` 显示 `元/天`，其余情况显示 `元/月`。

#### Scenario: 临时工展示位统一显示按天单位
- **WHEN** 任一岗位或求职数据项 `payType=1`
- **THEN** 对应列表卡片与详情页薪资展示 MUST 使用 `元/天` 语义

#### Scenario: 非临时工展示位统一显示按月单位
- **WHEN** 任一岗位或求职数据项 `payType` 不为 `1`
- **THEN** 对应列表卡片与详情页薪资展示 MUST 使用 `元/月` 语义

### Requirement: 禁止临时工展示按小时口径
系统 MUST NOT 在“临时工”相关展示位输出 `元/小时` 或“按小时薪资”文案。

#### Scenario: 页面渲染临时工薪资文本
- **WHEN** 页面渲染 `payType=1` 的薪资字段
- **THEN** 页面 MUST NOT 输出 `元/小时`，且 MUST 输出与 `元/天` 一致的薪资单位文案
