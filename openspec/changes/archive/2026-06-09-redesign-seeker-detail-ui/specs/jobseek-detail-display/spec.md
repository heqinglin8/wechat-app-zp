## ADDED Requirements

### Requirement: 求职者详情页采用统一分区布局
系统 MUST 将 `pages/seekerDetail/seekerDetail` 渲染为统一详情页结构，包含头图区域、顶部主信息区、求职信息区、个人详情区和留言板区，并与现有 `jobDetail` 的信息层级保持一致。

#### Scenario: 用户打开求职者详情页
- **WHEN** 用户进入 `pages/seekerDetail/seekerDetail`
- **THEN** 页面 MUST 按预定义分区顺序展示内容，而非直接堆叠原始字段块

### Requirement: 页面展示优先绑定 JobSeeker 现有字段
系统 MUST 优先使用 `JobSeeker` 中现有字段进行展示映射，包括但不限于：`title`、`recoName`、`recoEducation`、`recoContact`、`wxid`、`recoJobIntent`、`detPayMin`、`detPayMax`、`payType`、`summary`、`recoIntro`、`photoImgs`、`commitUsername`、`collectNum` 及城市字段。

#### Scenario: 详情页构建展示数据
- **WHEN** 客户端拿到 `JobSeeker` 记录
- **THEN** 客户端 MUST 先将现有字段映射到页面展示模型后再渲染

### Requirement: 无匹配值时必须展示“xxx未填写”
对每个展示位，若找不到可用字段值，系统 MUST 显示 `xxx未填写`，其中 `xxx` 为该展示位对应中文字段名（如“学历未填写”“微信未填写”）。

#### Scenario: 学历字段缺失
- **WHEN** 记录中学历字段为空或不存在
- **THEN** 页面 MUST 展示“学历未填写”

#### Scenario: 微信字段缺失
- **WHEN** 记录中 `wxid` 为空或不存在
- **THEN** 页面 MUST 展示“微信未填写”

### Requirement: 工种与薪资展示遵循 payType 语义
系统 MUST 使用 `payType` 决定工种与薪资语义：`0` 表示“月结”，`1` 表示“临时工”；当工种或薪资所需字段不足时，系统 MUST 返回对应“未填写”文案。

#### Scenario: 月结求职信息展示
- **WHEN** `payType` 为 `0` 且薪资字段完整
- **THEN** 页面 MUST 展示“月结”并按月薪格式展示期望薪资

#### Scenario: 临时工求职信息展示
- **WHEN** `payType` 为 `1` 且薪资字段完整
- **THEN** 页面 MUST 展示“临时工”并按天薪资语义展示期望薪资

### Requirement: 页面不得展示 recoExtra 与公司域信息
`seekerDetail` 页面 MUST NOT 渲染 `recoExtra` 区块，也 MUST NOT 渲染公司域展示区块（如公司卡片、公司名/行业/融资/规模）。

#### Scenario: 用户浏览个人详情区
- **WHEN** 用户查看详情页的文本内容区
- **THEN** 页面 MUST 仅展示求职信息与个人详情，不展示“其他(recoExtra)”或公司域模块
