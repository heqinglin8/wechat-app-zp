## 1. Bmob 与字段

- [x] 1.1 在 Bmob 控制台 `MyRecommend` Class 中新增列：`recoEducation`、`recoContact`、`recoJobIntent`、`recoSalaryRange`、`recoIntro`、`recoExtra`（类型与最长文本需在控制台确认）。
- [x] 1.2 与后端/运营确认：`recoContact` 与账号 `userPhone` 是否允许不一致；若不允许多路径，表单上改为只读或可编辑策略。

## 2. 页面结构与样式

- [x] 2.1 更新 `pages/award/award.wxml`：增加学历 `picker`、联系方式、求职意向、期待薪资、自我介绍（`textarea`）、其他补充 inputs；文案与占位符对齐产品。
- [x] 2.2 更新 `pages/award/award.wxss`（或共用样式）：保证表单滚动、可读性与主按钮「确定」可点区域。

## 3. 数据与默认值

- [x] 3.1 在 `award.js` `data` 中声明新增字段绑定；实现 `recoName`/姓名与联系方式在用户记录加载成功后 `setData` 预填为 `_User.username` / `userphone`。
- [x] 3.2 绑定各输入、`picker change`、必要时 `blur`/`input` 事件，保持表单状态与校验（空项提醒、手机号格式若需要）。

## 4. 提交与去重逻辑

- [x] 4.1 在确认提交函数中：`set`/`save` 所有需写入字段到 `MyRecommend`，包含原有 `userPhone`、`userName`、`recoName` 及新增列。
- [x] 4.2 按设计确定并实现去重：**更新已有**或「禁止完全重复联合键」；处理成功与失败 Toast，与原 `award.js` UX 保持一致或提升。
- [x] 4.3 若需兼容 `pages/myaward`：`recoName` 语义保持不变；自测自荐数据仍能被查询维度命中。

## 5. 回归与自检

- [x] 5.1 小程序开发者工具中联调：登录用户预填、`MyRecommend` 后台可见新字段、异常与空表单路径。
- [x] 5.2 走查 `award`/`myaward`/个人退出登录链路，确认无破坏性 JS 错误。
