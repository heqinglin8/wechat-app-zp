var city = require('../utils/city');
var util = require('../utils/util');
var cardFormatter = require('../utils/cardFormatter');

var TAB_PRESETS = {
  home: [
    { order: '-updatedAt' },
    { payType: 0, order: '-detPayMax' },
    { payType: 1, order: '-detPayMax' },
    { order: '-collectNum' },
  ],
  today: [
    { order: '-collectNum' },
    { order: '-updatedAt' },
    { payType: 0, order: '-detPayMax' },
    { payType: 1, order: '-detPayMax' },
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
 * 根据页面场景和 tab 下标给查询追加筛选条件与排序规则。
 */
function applyPreset(query, presetName, tab) {
  var presetList = TAB_PRESETS[presetName] || TAB_PRESETS.today;
  var preset = presetList[normalizeTab(tab)] || presetList[0];
  if (preset.payType !== undefined) {
    query.equalTo('payType', '==', preset.payType);
  }
  query.order(preset.order);
  return query;
}

/**
 * 构建只查询有效求职信息的基础查询，并叠加 tab 规则与城市过滤。
 */
function buildActiveJobSeekerQuery(options) {
  var Bmob = getBmob(options);
  var query = Bmob.Query('JobSeeker');
  query.equalTo('active', '==', 1);
  applyPreset(query, options && options.preset, options && options.tab);
  util.jobType.applyJobTypeFilter(query, options && options.jobType);
  city.applyJobSeekerFilter(query, options && options.currentCity);
  return query;
}

/**
 * 分页加载公开求职列表，并格式化成列表卡片可直接使用的数据结构。
 */
function loadJobSeekers(options) {
  var opts = options || {};
  var pageSize = opts.pageSize || 10;
  var pageIndex = opts.pageIndex || 0;
  var query = buildActiveJobSeekerQuery(opts);
  query.limit(pageSize);
  query.skip(pageIndex * pageSize);
  return query.find().then(function (rows) {
    var formatted = cardFormatter.decorateJobSeekerCards(util.formatList(rows || []));
    return {
      rows: rows || [],
      list: formatted,
      hasMore: (rows || []).length >= pageSize,
    };
  });
}

/**
 * 加载指定用户自己发布的有效求职信息，用于“我的求职”等个人列表。
 */
function loadOwnedJobSeekers(options) {
  var opts = options || {};
  var Bmob = getBmob(opts);
  var query = Bmob.Query('JobSeeker');
  query.equalTo('commitUid', '==', opts.userId);
  query.equalTo('active', '==', 1);
  query.order('-updatedAt');
  return query.find().then(function (rows) {
    return cardFormatter.decorateJobSeekerCards(util.formatList(rows || []));
  });
}

module.exports = {
  loadJobSeekers: loadJobSeekers,
  loadOwnedJobSeekers: loadOwnedJobSeekers,
  buildActiveJobSeekerQuery: buildActiveJobSeekerQuery,
};
