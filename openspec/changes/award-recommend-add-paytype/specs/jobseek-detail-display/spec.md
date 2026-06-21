## MODIFIED Requirements

### Requirement: 工种与薪资展示遵循 payType 语义
系统 MUST 使用 `payType` 决定工种与薪资语义：`0` 表示“月结”，`1` 表示“临时工”；当工种或薪资所需字段不足时，系统 MUST 返回对应“未填写”文案。

#### Scenario: 月结求职信息展示
- **WHEN** `payType` 为 `0` 且薪资字段完整
- **THEN** 页面 MUST 展示“月结”并按 `元/月` 语义展示期望薪资

#### Scenario: 临时工求职信息展示
- **WHEN** `payType` 为 `1` 且薪资字段完整
- **THEN** 页面 MUST 展示“临时工”并按 `元/天` 语义展示期望薪资

#### Scenario: payType 缺失时按月单位回退
- **WHEN** `payType` 缺失或值不在约定范围内
- **THEN** 页面薪资展示 MUST 使用 `元/月` 语义，且 MUST NOT 使用“元/小时”文案
