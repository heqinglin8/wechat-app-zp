## MODIFIED Requirements

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

### Requirement: 确认后将数据持久化到 JobSeeker

当用户确认提交（例如点击主要「确定/提交」控件）时，系统 MUST 将完整表单写入 Bmob 表 `JobSeeker`，包含提交人 `commitUsername`/`commitUid`、当前城市信息以及变更设计中约定的全部求职者相关字段。当前城市信息 MUST 包含省、市、区/县名称和省码、市码、区码，并具体到区/县。

#### Scenario: 提交成功

- **WHEN** 用户点击确认控件且校验通过
- **THEN** 客户端 MUST 写入一条 `JobSeeker` 记录（或按设计决策更新已有记录），至少包含：`title`、`recoName`、`recoEducation`、`recoContact`、`wxid`、`recoJobIntent`、`payType`、`detPayMin`、`detPayMax`、`summary`、`recoIntro`、`photoImgs`、`active`、`commitUsername`、`commitUid`，并与实现所选的去重/更新规则一致。
