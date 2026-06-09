## 1. 展示数据模型改造

- [ ] 1.1 在 `pages/seekerDetail/seekerDetail.js` 新增 `buildViewData` 及字段格式化函数（工种、薪资、城市、兜底文案）。
- [ ] 1.2 将详情页数据设置从直接 `content` 渲染切换为 `content + viewData` 双层结构。
- [ ] 1.3 为所有展示位补齐 `xxx未填写` 兜底规则并统一中文字段名。

## 2. 页面结构与样式对齐

- [ ] 2.1 重构 `pages/seekerDetail/seekerDetail.wxml` 为 `jobDetail` 风格分区（头图、顶部主信息、求职信息、个人详情、留言板）。
- [ ] 2.2 在页面中移除 `recoExtra` 展示块与公司域展示块。
- [ ] 2.3 调整 `pages/seekerDetail/seekerDetail.wxss`，对齐分区间距、标题层级、信息行样式与留言板分割线。

## 3. 交互与兼容性回归

- [ ] 3.1 验证收藏、取消收藏、留言板和底部导航在新布局下行为不变。
- [ ] 3.2 验证 `payType=0/1/缺失` 三种场景下工种与薪资显示符合规格。
- [ ] 3.3 验证字段缺失场景（电话/微信/学历/摘要/自我介绍/城市等）均展示对应 `xxx未填写`。
