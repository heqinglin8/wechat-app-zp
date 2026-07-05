## MODIFIED Requirements

### Requirement: 发布入口
系统 SHALL 在搜索框同一行右侧展示一个圆形发布图标，图标中间 SHALL 为加号，并作为发布帖子的入口。点击该入口 MUST 打开真实的职言帖子发布页面。

#### Scenario: 点击发布入口
- **WHEN** 用户点击搜索框右侧的发布图标
- **THEN** 系统必须打开 `pages/publishPost/publishPost` 职言帖子发布页面

#### Scenario: 发布成功后刷新列表
- **WHEN** 用户从职言帖子发布页面发布成功并返回职言列表页面
- **THEN** 系统必须刷新职言帖子列表，使新发布的帖子可以出现在列表中
