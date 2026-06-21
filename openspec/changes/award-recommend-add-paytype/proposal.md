## Why

当前推荐求职发布页缺少“工种”字段，`payType` 无法被用户明确设置，导致薪资单位语义在发布页、列表页、详情页之间不一致（存在“元/小时”等历史口径）。该变更用于统一“临时工/普通月结”的录入与展示规则，减少用户理解和运营审核成本。

## What Changes

- 在 `pages/pubilshJobSeek/pubilshJobSeek` 的“求职意向”区域新增“工种”单选项，交互与“学历”一致（picker selector）。
- 工种选项固定为：
  - `普通月结`（`payType=0`）
  - `临时工`（`payType=1`）
- 发布页“薪资”输入行右侧新增动态单位提示：
  - `payType=0` 显示 `/月`
  - `payType=1` 显示 `/天`
- 提交 `JobSeeker` 时持久化 `payType` 字段，保证录入值进入后续查询与展示链路。
- 统一所有“临时工”展示位的薪资单位语义：
  - `payType=1` 展示为 `元/天`
  - 其他情况展示为 `元/月`
- 同步更新 OpenSpec 中“临时工按小时语义”的历史描述为“按天语义”。

## Capabilities

### New Capabilities

- `paytype-salary-display`: 统一 `payType` 到薪资单位的映射规则，并约束岗位/求职卡片与详情页的薪资展示口径。

### Modified Capabilities

- `award-recommend`: 推荐求职发布表单新增“工种”录入，提交时写入 `payType`，并在薪资行按工种展示 `/月` 或 `/天`。
- `jobseek-detail-display`: 临时工薪资语义由“按小时”调整为“按天”，并保持工种与薪资文案一致性。

## Impact

- **页面与逻辑**
  - `pages/pubilshJobSeek/pubilshJobSeek.wxml`
  - `pages/pubilshJobSeek/pubilshJobSeek.js`
  - `pages/pubilshJobSeek/pubilshJobSeek.wxss`
  - `pages/seekerDetail/seekerDetail.js`
  - 岗位/求职相关列表与详情中的薪资格式化函数（如 `pages/index/index.js`、`pages/today/today.js`、`pages/todayjobseek/todayjobseek.js`、`pages/searchresult/searchresult.js`、`pages/myjoin/myjoin.js`、`pages/myjobseeks/myjobseeks.js`、`pages/jobDetail/jobDetail.js`）。
- **数据**
  - `JobSeeker.payType` 将由发布页显式写入并参与后续展示映射。
- **规格**
  - 新增 `paytype-salary-display` 能力规格。
  - 更新 `award-recommend`、`jobseek-detail-display` 的需求描述与场景约束。
