# 项目上下文：韶关打工信息网（微信小程序）

面向求职者的招聘信息展示与报名小程序。**「韶关打工信息网」**（`app.json` 全局标题），核心业务是浏览岗位、按条件筛选与搜索、一键报名，以及门店/电话联系与推广奖励录入。

---

## 1. 技术栈与工程形态

| 维度 | 说明 |
|------|------|
| 运行环境 | 微信原生小程序（`compileType: miniprogram`） |
| 语言与模块 | ES6 + CommonJS `require`，无根目录 `package.json` 的前端工程式构建 |
| 后端 / 数据 | **Bmob**（后端即服务：`utils/Bmob-2.5.30.min.js`），在 `app.js` 中 `Bmob.initialize` 并挂到 `wx.Bmob` |
| 云服务 | `pages/personal` 中调用 `Bmob.functions('code2Session', { code })`，与小程序 `wx.login` 换取的 `code` 联动，用于登录态 |
| 工具库 | `utils/util.js`（时间格式化）；`utils/underscore.js`；自定义搜索 UI `wxSearchView/wxSearchView.js` |
| OpenSpec | `openspec/config.yaml` 使用 `schema: spec-driven`，本文件服务于后续规格与任务的领域上下文 |

---

## 2. 目录与架构职责

```
app.js / app.json     → 全局入口、路由表、tabBar、主题色与 `globalData`
pages/*               → 各页面 JS + JSON + WXML + WXSS（按页面拆分，无共享业务层封装）
utils/                → Bmob SDK、工具函数
wxSearchView/          → 搜索框组件逻辑（热搜、历史、匹配联想）
images/               → 静态图标与图片资源
```

- **无独立 API 封装层**：各 Page 直接使用 `wx.Bmob` / `Bmob.Query` / `Bmob.User`。
- **`App.globalData`**：`tabid`（跳转「今日招聘」tab 的子分类）；`userInfo`（头像等，注册/旧接口使用）。

---

## 3. Bmob 数据表（代码中出现的类名）

以下为逻辑模型，字段以代码使用情况为准：

| 表名 | 用途 |
|------|------|
| `DetailInfo` | 招聘岗位主体：列表、详情、`payType`、`detPayMax`、`entNum`、`detAddr`、`updatedAt`、`detName`、`detSrc` 等 |
| `SwiperImgSrc` | 首页轮播图数据（字段如 `swiperImgSrc`） |
| `_User` | Bmob 内置用户：`username`、`userphone`、`objectId`、`imgSrc`、`regtime` 等 |
| `MyJoinInfo` | 用户报名记录：`userName`、`userPhone`、`myJoinName`、`detSrc` |
| `MyRecommend` | 推广/推荐：`userName`、`recoName` 及求职者档案字段（与推荐录入、列表展示关联） |

**岗位分类规则（首页 / 今日招聘一致）**

- Tab 0 全部：`order('-updatedAt')`
- Tab 1 高薪资：`payType == 0`，`order('-detPayMax')`
- Tab 2 临时工：`payType == 1`，`order('-detPayMax')`
- Tab 3 推荐：`order('-entNum')`

分页：每页 10 条，`skip(page_index * 10)`，触底加载更多。

---

## 4. 页面结构与导航关系

### 4.1 `tabBar`（四主入口）

| Tab | 路由 | 职责 |
|-----|------|------|
| 首页 | `pages/index/index` | 搜索入口、轮播、快捷入口、「全部职位」列表与子 tab 同上 |
| 今日招聘 | `pages/today/today` | 与首页同构的职位列表逻辑；可被 `globalData.tabid` 预选子 tab |
| 推荐奖励 | `pages/award/award` | 填写推荐信息并写入 `MyRecommend` |
| 个人中心 | `pages/personal/personal` | 登录、`token`/`objectId` 缓存、跳转我的报名 / 求职热线 / 地图 / 资料修改 |

### 4.2 非 tab 页面（节选）

| 路由 | 职责 |
|------|------|
| `detail` | 单条 `DetailInfo`；报名写 `MyJoinInfo` 并 `entNum+1`；未注册用户会被重定向到个人中心一侧流程 |
| `search` / `searchresult` | 搜索页跳转结果：`detAddr == 搜索关键词` |
| `register` | `Bmob.User.register`，校验手机与密码，查重 `_User.userphone` |
| `setinfor` | 修改用户名/手机，`_User.get`/`save`，换号时防重复注册 |
| `myjoin` / `myaward` | 报名列表、`MyRecommend` 以 `recoName` 与用户名的查询（推荐侧展示） |
| `servicephone` | 内置多个经理称呼与电话号码，`wx.makePhoneCall` |
| `map` | `wx.getLocation` 后 `wx.openLocation`，展示固定门店文案（韶关地区人力资源公司地址） |

> 项目中存在未在 `app.json` `pages` 中注册的页面目录（若有），则微信无法路由到，归档时以供对照。

---

## 5. 核心业务流

### 5.1 浏览与跳转

1. **首页**：拉取轮播 `SwiperImgSrc`；首屏加载 `DetailInfo` 十条；滑动子 tab / 触底分页。
2. **今日招聘**：`onShow` 若存在 `app.globalData.tabid` 则同步 `currentTab` 并 `switchTabLoad`；从首页不同快捷入口会先设 `tabid` 再 `switchTab`。

### 5.2 搜索

搜索页初始化 `WxSearch`，确认后跳到 `searchresult?searchValue=...`，服务端条件为 **`detAddr` 精确等于** 关键词。

### 5.3 报名（详情页）

前置：通过 `_User.objectId == wx.getStorageSync('objectId')` 判定用户是否存在；长度为 0 会 `redirectTo` 个人中心路由。

对已登录用户：`MyJoinInfo` 同一 `userPhone` + `myJoinName` 去重；成功则递增该条 `DetailInfo.entNum`。

### 5.4 注册与登录两条线

- **注册**（`/pages/register/register`）：表单 + 微信用户信息拿头像 `avatarUrl`，`Bmob.User.register`。
- **个人中心一键登录**：`wx.login` → `code2Session` 云函数；成功写入 `userInfo`、`token`、`objectId`；退出时清空存储并 `Bmob.User.logout()`。

两处共同依赖 **`wx.getStorageSync('objectId')`** 等与 Bmob 用户的关联。

### 5.5 推荐奖励

`award`：`onReady` 用当前 `_User` 带出 `userName`、手机号用于预填联系方式；提交时按 `userName` + `recoName` 查 `MyRecommend` 去重更新，再 `switchTab` 回首页。

### 5.6 能力与占位

多处「微信咨询」「bindViewXWZX」：`wx.showToast` 提示暂未启用。

---

## 6. 关键跨页变量与存储键

| 键 / 变量 | 用途 |
|-----------|------|
| `app.globalData.tabid` | 0–3，控制今日招聘默认 tab |
| `wx.setStorageSync('objectId'\|'token'\|'userInfo')` | 登录与身份识别 |
| 详情路由参数 `objectId` | `DetailInfo` 主键 |

---

## 7. 非功能关注点（从技术债角度）

- 敏感凭据：**Bmob `Application Id` / `REST API Key`** 暴露在客户端 `app.js`（行业标准做法为服务端代理或密钥轮换 + 云端规则）。
- 缺少统一请求封装与错误兜底，分页逻辑在多处重复。
- 部分布尔命名（如详情页 `isfist` / `isFist`）不一致，易产生分支判断问题。

---

## 8. 一句话定位

本项目是一个 **地域性打工招聘微信小程序**，使用 **Bmob** 托管数据与用户能力，前台以 **首页 + 今日招聘双列表引擎**、`DetailInfo` **详情报名**、`MyJoinInfo`/`MyRecommend` **记录行为**，并辅以 **热搜搜索、电话联系、门店地图**。
