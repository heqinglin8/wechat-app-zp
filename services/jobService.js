var city = require('../utils/city');
var util = require('../utils/util');
var cardFormatter = require('../utils/cardFormatter');

var TAB_PRESETS = {
  home: [
    { order: '-updatedAt' },
    { payType: 0, order: '-detPayMax' },
    { payType: 1, order: '-detPayMax' },
    { order: '-entNum' },
  ],
  today: [
    { order: '-entNum' },
    { order: '-updatedAt' },
    { payType: 0, order: '-detPayMax' },
    { payType: 1, order: '-detPayMax' },
  ],
};

function getBmob(options) {
  return (options && options.Bmob) || (typeof wx !== 'undefined' && wx.Bmob);
}

function normalizeTab(tab) {
  var n = Number(tab);
  return isNaN(n) ? 0 : n;
}

function applyPreset(query, presetName, tab) {
  var preset = (TAB_PRESETS[presetName] || TAB_PRESETS.home)[normalizeTab(tab)] || TAB_PRESETS.home[0];
  if (preset.payType !== undefined) {
    query.equalTo('payType', '==', preset.payType);
  }
  query.order(preset.order);
  return query;
}

function buildActiveJobQuery(options) {
  var Bmob = getBmob(options);
  var query = Bmob.Query('JobInfo');
  query.equalTo('active', '==', 1);
  applyPreset(query, options && options.preset, options && options.tab);
  city.applyJobInfoFilter(query, options && options.currentCity);
  return query;
}

function loadJobs(options) {
  var opts = options || {};
  var pageSize = opts.pageSize || 10;
  var pageIndex = opts.pageIndex || 0;
  var query = buildActiveJobQuery(opts);
  query.limit(pageSize);
  query.skip(pageIndex * pageSize);
  return query.find().then(function (rows) {
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
