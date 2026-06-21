## 1. 发布页工种录入与提交链路

- [ ] 1.1 在 `pages/pubilshJobSeek/pubilshJobSeek.wxml` 新增“工种”行，使用与学历一致的 picker 交互并提供“普通月结/临时工”两项。
- [ ] 1.2 在 `pages/pubilshJobSeek/pubilshJobSeek.js` 增加 `payTypeOptions`、`payTypeIndex`、`payType` 及 `onPayTypeChange`，默认值设为普通月结（`payType=0`）。
- [ ] 1.3 在薪资输入区右侧增加单位提示展示状态（`/月` 或 `/天`），并在 `pubilshJobSeek.wxss` 完成对应布局样式。
- [ ] 1.4 在 `applyJobSeekerFields` 中写入 `row.set('payType', ...)`，保证提交/更新都持久化工种值。

## 2. 薪资单位口径统一（列表与详情）

- [ ] 2.1 更新 `pages/seekerDetail/seekerDetail.js` 的薪资格式化逻辑：`payType=1` 显示 `元/天`，其他显示 `元/月`，并移除“元/小时”路径。
- [ ] 2.2 更新岗位详情 `pages/jobDetail/jobDetail.js` 的薪资显示逻辑，确保 `payType=1` 与其他工种使用统一单位映射规则。
- [ ] 2.3 更新岗位列表相关页面的 `salaryText`（`pages/index/index.js`、`pages/today/today.js`、`pages/searchresult/searchresult.js`、`pages/myjoin/myjoin.js`）统一单位语义。
- [ ] 2.4 更新求职列表相关页面的 `salaryText`（`pages/todayjobseek/todayjobseek.js`、`pages/myjobseeks/myjobseeks.js`）统一单位语义。

## 3. 规格与回归验证

- [ ] 3.1 确认 `award-recommend`、`jobseek-detail-display` 与 `paytype-salary-display` 的变更规格与实现一致。
- [ ] 3.2 手工验证 `payType=1`、`payType=0`、`payType` 缺省三类数据在发布页、列表页、详情页的薪资文案。
- [ ] 3.3 全仓检索并确认不再存在“临时工”薪资使用 `元/小时` 的展示文案。
