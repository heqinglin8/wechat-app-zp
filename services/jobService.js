var city = require('../utils/city');
var util = require('../utils/util');
var cardFormatter = require('../utils/cardFormatter');
var companyCache = require('../utils/companyCache');

var TAB_PRESETS = {
  home: [
    { order: '-updatedAt' },
    { order: '-entNum' },
    { payType: 1, order: '-updatedAt' },
    { order: '-detPayMax' },
  ],
  today: [
    { order: '-updatedAt' },
    { order: '-entNum' },
    { payType: 1, order: '-updatedAt' },
    { order: '-detPayMax' },
  ],
};

/**
 * 获取 Bmob 实例，优先使用调用方传入的实例，便于页面和测试复用。
 */
function getBmob(options) {
  return (options && options.Bmob) || (typeof wx !== 'undefined' && wx.Bmob);
}

/**
 * 将 tab 值标准化为数字，下标非法时回退到第一个 tab。
 */
function normalizeTab(tab) {
  var n = Number(tab);
  return isNaN(n) ? 0 : n;
}

/**
 * 根据页面场景和 tab 下标给查询追加排序规则。
 */
function applyPreset(query, presetName, tab) {
  var preset = (TAB_PRESETS[presetName] || TAB_PRESETS.home)[normalizeTab(tab)] || TAB_PRESETS.home[0];
  if (preset.payType !== undefined) {
    query.equalTo('payType', '==', preset.payType);
  }
  query.order(preset.order);
  return query;
}

/**
 * 构建只查询有效招聘信息的基础查询，并叠加工种、全部筛选与城市过滤。
 */
function buildActiveJobQuery(options) {
  var Bmob = getBmob(options);
  var query = Bmob.Query('JobInfo');
  query.equalTo('active', '==', 1);
  applyPreset(query, options && options.preset, options && options.tab);
  util.jobType.applyJobTypeFilter(query, options && options.jobType);
  util.jobFilter.applyQuery(query, options && options.filters);
  city.applyJobInfoFilter(query, options && options.currentCity);
  return query;
}

function applyCompanySizeFilter(query, companies, filters) {
  var nextFilters = util.jobFilter.normalize(filters);
  var companyIds = util.jobFilter.companyIdsBySize(companies, nextFilters.companySize);
  if (!companyIds) return query;
  query.containedIn('companyId', companyIds.length ? companyIds : ['__NO_MATCH_COMPANY__']);
  return query;
}

/**
 * 分页加载公开招聘列表，并格式化成列表卡片可直接使用的数据结构。
 */
function loadJobs(options) {
  var opts = options || {};
  var pageSize = opts.pageSize || 10;
  var pageIndex = opts.pageIndex || 0;
  var Bmob = getBmob(opts);
  return companyCache.ensureLoaded(Bmob).then(function (companies) {
    var query = buildActiveJobQuery(opts);
    applyCompanySizeFilter(query, companies, opts.filters);
    query.limit(pageSize);
    query.skip(pageIndex * pageSize);
    return query.find().then(function (rows) {
      return {
        rows: rows || [],
        companies: companies || []
      };
    });
  }).then(function (result) {
    var rows = result.rows || [];
    var formatted = cardFormatter.decorateJobCards(util.formatList(rows || []));
    return {
      rows: rows || [],
      list: formatted,
      hasMore: (rows || []).length >= pageSize,
    };
  });
}

module.exports = {
  loadJobs: loadJobs,
  buildActiveJobQuery: buildActiveJobQuery,
};
