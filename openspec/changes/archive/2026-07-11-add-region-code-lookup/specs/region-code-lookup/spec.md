## ADDED Requirements

### Requirement: 本地标准地区编码数据

系统 MUST 使用项目内 `assets/pca-code.json` 作为小程序本地标准全国省、市、区/县三级行政区划编码数据快照；该文件的数据来源 MUST 采用国家统计局《统计用区划代码和城乡划分代码》，用于离线查询区码对应的完整地区信息。

#### Scenario: 离线使用地区编码数据
- **WHEN** 小程序运行环境无法访问网络或 Bmob
- **THEN** 系统必须仍可使用本地数据执行区码反查

#### Scenario: 数据来源可追踪
- **WHEN** 开发者查看本地地区编码数据
- **THEN** 系统必须记录本地数据文件路径 `assets/pca-code.json`
- **AND** 系统必须提供可追踪的数据来源名称
- **AND** 系统必须记录来源入口
- **AND** 系统必须记录实际采用的快照年份

#### Scenario: 使用国家统计局数据源
- **WHEN** 开发者查看本地地区编码数据的数据源元信息
- **THEN** 系统必须标明数据源为国家统计局《统计用区划代码和城乡划分代码》

#### Scenario: 使用项目内 pca-code 文件
- **WHEN** 系统执行区码反查
- **THEN** 系统必须从项目内 `assets/pca-code.json` 读取或引用地区编码数据

### Requirement: 根据区码查询完整省市区信息

系统 MUST 提供 `findByDistrictCode(districtCode)` 方法，根据 6 位区/县级行政区划代码查询并返回完整省、市、区/县信息。

#### Scenario: 查询广州市天河区
- **WHEN** 调用 `findByDistrictCode('440106')`
- **THEN** 系统必须返回 `provinceCode` 为 `440000`
- **AND** 返回 `provinceName` 为 `广东省`
- **AND** 返回 `cityCode` 为 `440100`
- **AND** 返回 `cityName` 为 `广州市`
- **AND** 返回 `districtCode` 为 `440106`
- **AND** 返回 `districtName` 为 `天河区`

#### Scenario: 父级编码补齐为 6 位
- **WHEN** `assets/pca-code.json` 中省级编码为 `44` 且市级编码为 `4401`
- **THEN** 查询 `440106` 的结果必须返回 `provinceCode` 为 `440000`
- **AND** 返回 `cityCode` 为 `440100`

#### Scenario: 入参包含首尾空白
- **WHEN** 调用 `findByDistrictCode(' 440106 ')`
- **THEN** 系统必须按 `440106` 查询并返回天河区对应的完整省市区信息

#### Scenario: 入参格式无效
- **WHEN** 调用 `findByDistrictCode` 且入参不是 6 位数字行政区划代码
- **THEN** 系统必须返回 `null`

#### Scenario: 区码不存在
- **WHEN** 调用 `findByDistrictCode('999999')` 且本地标准数据中不存在该区码
- **THEN** 系统必须返回 `null`
- **AND** 系统不得返回默认城市或猜测出的地区信息

### Requirement: 地区编码查询独立于开放城市限制

系统 MUST 将全国标准地区编码查询能力与现有开放城市业务限制分离，使查询工具可以覆盖全国数据，而当前城市选择仍按既有开放城市规则执行。

#### Scenario: 查询未开放业务城市的区码
- **WHEN** 调用 `findByDistrictCode` 查询一个本地标准数据中存在但不属于当前开放业务城市的区码
- **THEN** 系统必须返回该区码对应的完整省市区信息

#### Scenario: 当前城市选择规则不变
- **WHEN** 用户通过现有微信地区选择入口选择未开放业务城市
- **THEN** 系统必须继续按既有规则拒绝该城市
- **AND** 系统不得因新增地区编码查询能力而放开业务城市限制

### Requirement: 查询结果不可污染后续查询

系统 MUST 防止调用方修改一次查询结果后污染地区编码缓存或后续查询结果。

#### Scenario: 修改返回对象后再次查询
- **WHEN** 调用方获取 `findByDistrictCode('440106')` 的返回对象并修改其中的 `provinceName`、`cityName` 或 `districtName`
- **THEN** 后续再次调用 `findByDistrictCode('440106')` 时，系统必须仍返回本地标准数据中的原始省市区名称
