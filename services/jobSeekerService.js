var city = require('../utils/city');
var util = require('../utils/util');
var cardFormatter = require('../utils/cardFormatter');

var TAB_PRESETS = {
  today: [
    { order: '-collectNum' },
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
  var preset = (TAB_PRESETS[presetName] || TAB_PRESETS.today)[normalizeTab(tab)] || TAB_PRESETS.today[0];
  if (preset.payType !== undefined) {
    query.equalTo('payType', '==', preset.payType);
  }
  query.order(preset.order);
  return query;
}

function buildActiveJobSeekerQuery(options) {
  var Bmob = getBmob(options);
  var query = Bmob.Query('JobSeeker');
  query.equalTo('active', '==', 1);
  applyPreset(query, options && options.preset, options && options.tab);
  city.applyJobSeekerFilter(query, options && options.currentCity);
  return query;
}

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
