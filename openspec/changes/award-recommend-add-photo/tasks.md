## 1. 后端 / Bmob 配置

- [ ] 1.1 在 Bmob 控制台为 `MyRecommend` 配置列：`commitUsername`（String，提交人姓名）、`photoImgs`、`commitUid`；若仍存在仅用于提交人的旧列 `userName`，按需迁移数据后改为使用 **`commitUsername`**。

## 2. 页面结构与样式

- [ ] 2.1 在 `pages/award/award.wxml` 中，于「期望薪资」对应的 `award-list-name` 区块下方新增「上传图片」区域：列表至多 **6** 槽位；每张缩略图提供 **替换**（及可选删除）；添加按钮在已满 6 张时禁用或隐藏。
- [ ] 2.2 在 `pages/award/award.wxss` 中为上传区域与缩略图网格补充样式，与现有 `award-*` 视觉一致。

## 3. 选择与上传逻辑

- [ ] 3.1 在 `pages/award/award.js` 中定义常量 **`MAX_RECOMMEND_PHOTOS = 6`**，并在 `data` 中维护配图列表（每项区分本地临时路径 / 上传中 / 已得 URL 等状态，以实现替换与拼接）。
- [ ] 3.2 调用 `wx.chooseImage` 时：`count` 取 **`Math.min(接口上限, MAX_RECOMMEND_PHOTOS - 当前列表长度)`**（若为替换单槽模式则一般为 `1`）；已达 6 张且非替换场景不再调起选图。
- [ ] 3.3 对每张待上传路径 **先于上传** 调用 `wx.getFileSystemManager().getFileInfo`（或等价方式）校验体积 **小于等于 3MB**（**`<= 3145728`** 字节），并用扩展名白名单等方式校验 **仅为图片类型**；不通过则 `wx.showToast` 且不调用 `Bmob.File.save()`。
- [ ] 3.4 校验通过后 **逐项**创建 `Bmob.File`、`save()` 并更新对应槽位 URL（避免示例代码仅保留最后一个 file）。
- [ ] 3.5 **替换**：点击某槽位「替换」时携带槽位索引调起选图（通常 `count: 1`）；成功后对该索引覆盖并重走校验与上传；若旧任务未完成应妥善处理避免重复写入列表。
- [ ] 3.6 上传过程中展示 loading / 防抖重复提交；失败 Toast；支持删除槽位（删除后允许再次添加至未满 6 张）。

## 4. 提交与持久化

- [ ] 4.1 在 `applyMyRecommendFields` 中 `row.set('photoImgs', ...)`：将当前列表中有效 URL **按顺序**用半角 `|` 拼接；无图为空字符串（或与可选字段一致）。
- [ ] 4.2 在 `applyMyRecommendFields` 中 `row.set('commitUsername', …)`：写入提交人姓名（与现有页面数据来源一致，可与 `_User.username` 预填同源）；**不再**向 `MyRecommend` 写入列名 `userName`。
- [ ] 4.3 在 `applyMyRecommendFields` 中 `row.set('commitUid', objectId)`：与登录同源；新建与更新均写入。
- [ ] 4.4 调整 `put_infor` 及查询：`equalTo` 等与「提交人」相关的条件改为字段 **`commitUsername`**（及业务所需的 `recoName` 等）；提交前确保无未完成上传（若采用即选即传）；防止重复提交。
- [ ] 4.5 更新 `award.js` 文件头注释：`photoImgs`、`commitUsername`、`commitUid`、`|`、**最多 6 张**、替换行为、校验规则。

## 5. 验证

- [ ] 5.1 真机或开发者工具验证：0～6 张、`|` 分隔、`commitUsername` / `commitUid` 写入正确。
- [ ] 5.2 第 7 张无法添加；已达 6 时 UI 符合预期。
- [ ] 5.3 **替换**：待上传槽位替换、已上传 URL 槽位替换后，提交数据中 `photoImgs` 仅为最新列表。
- [ ] 5.4 **超过 3MB**（**`> 3145728`** 字节）或非图片被拒；**恰好 `3145728` 字节**须通过。
- [ ] 5.5 回归：必填校验、去重更新、登录预填不受影响。
