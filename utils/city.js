var STORAGE_KEY = 'currentCity';
var regionUtil = null;

var DEFAULT_CITY = {
  provinceName: '广东省',
  cityName: '广州市',
  districtName: '天河区',
  provinceCode: '440000',
  cityCode: '440100',
  districtCode: '440106',
  cityDisplayName: '广州',
};

var OPEN_CITY_NAMES = ['广州', '佛山', '韶关', '深圳', '东莞', '珠海'];

function clone(obj) {
  var next = {};
  Object.keys(obj || {}).forEach(function (key) {
    next[key] = obj[key];
  });
  return next;
}

function stripCitySuffix(value) {
  var text = String(value || '').trim();
  return text.replace(/市$/, '');
}

function truncateCityName(value) {
  var text = String(value || '').trim();
  return text.length > 4 ? text.slice(0, 4) + '...' : text;
}

// 延迟加载地区工具，避免页面初始化时提前加载完整地区数据。
function getRegionUtil() {
  if (!regionUtil) {
    regionUtil = require('./region');
  }
  return regionUtil;
}

function normalizeCity(input) {
  var city = input || {};
  var cityName = city.cityName || DEFAULT_CITY.cityName;
  var displayName = stripCitySuffix(city.cityDisplayName || city.displayCityName || cityName);
  return {
    provinceName: city.provinceName || DEFAULT_CITY.provinceName,
    cityName: cityName,
    districtName: city.districtName || DEFAULT_CITY.districtName,
    provinceCode: String(city.provinceCode || DEFAULT_CITY.provinceCode),
    cityCode: String(city.cityCode || DEFAULT_CITY.cityCode),
    districtCode: String(city.districtCode || DEFAULT_CITY.districtCode),
    cityDisplayName: displayName || DEFAULT_CITY.cityDisplayName,
  };
}

function normalizeRegion(value, code) {
  var names = value || [];
  var codes = code || [];
  return normalizeCity({
    provinceName: names[0],
    cityName: names[1],
    districtName: names[2],
    provinceCode: codes[0],
    cityCode: codes[1],
    districtCode: codes[2],
  });
}

function isOpenCity(city) {
  var displayName = stripCitySuffix((city && (city.cityDisplayName || city.cityName)) || '');
  return OPEN_CITY_NAMES.indexOf(displayName) !== -1;
}

function isValidCity(city) {
  return !!(city && city.provinceName && city.cityName && city.districtName &&
    city.provinceCode && city.cityCode && city.districtCode && isOpenCity(city));
}

function getStoredCity() {
  if (typeof wx === 'undefined' || !wx.getStorageSync) return null;
  try {
    var stored = wx.getStorageSync(STORAGE_KEY);
    return isValidCity(stored) ? normalizeCity(stored) : null;
  } catch (e) {
    return null;
  }
}

function getCurrentCity() {
  return getStoredCity() || normalizeCity(DEFAULT_CITY);
}

function syncGlobalCity(city) {
  if (typeof getApp !== 'function') return;
  try {
    var app = getApp();
    if (app && app.globalData) {
      app.globalData.currentCity = normalizeCity(city);
    }
  } catch (e) {}
}

function initCurrentCity() {
  var city = getCurrentCity();
  syncGlobalCity(city);
  return city;
}

function setCurrentCity(city) {
  var next = normalizeCity(city);
  if (!isOpenCity(next)) return null;
  if (typeof wx !== 'undefined' && wx.setStorageSync) {
    wx.setStorageSync(STORAGE_KEY, next);
  }
  syncGlobalCity(next);
  return next;
}

function cityChanged(prev, next) {
  var a = prev || {};
  var b = next || {};
  return String(a.cityCode || '') !== String(b.cityCode || '');
}

function regionValue(city) {
  var next = normalizeCity(city);
  return [next.provinceName, next.cityName, next.districtName];
}

function displayText(city) {
  return truncateCityName(normalizeCity(city).cityDisplayName);
}

function fullDisplayText(city) {
  var next = normalizeCity(city);
  return next.provinceName + ' ' + next.cityName + ' ' + next.districtName;
}

// 按当前城市下所有 districtCode 过滤记录。
function applyCityDistrictFilter(query, city) {
  var next = normalizeCity(city || getCurrentCity());
  query.containedIn('districtCode', getRegionUtil().districtCodesByCityCode(next.cityCode));
  return query;
}

// 按当前城市下所有 districtCode 过滤招聘信息。
function applyJobInfoFilter(query, city) {
  return applyCityDistrictFilter(query, city);
}

// 按当前城市下所有 districtCode 过滤求职信息。
function applyJobSeekerFilter(query, city) {
  return applyCityDistrictFilter(query, city);
}

function applyCityFields(row, city, options) {
  var next = normalizeCity(city || getCurrentCity());
  var opts = options || {};
  row.set('provinceName', next.provinceName);
  row.set('cityName', next.cityName);
  row.set('districtName', next.districtName);
  row.set('provinceCode', next.provinceCode);
  row.set('cityCode', next.cityCode);
  row.set('districtCode', next.districtCode);
  row.set(opts.displayField || 'cityDisplayName', next.cityDisplayName);
  return row;
}

function rowMatchesKeyword(row, keyword, fields) {
  var text = String(keyword || '').trim().toLowerCase();
  if (!text) return true;
  return (fields || []).some(function (field) {
    return String((row && row[field]) || '').toLowerCase().indexOf(text) !== -1;
  });
}

module.exports = {
  STORAGE_KEY: STORAGE_KEY,
  DEFAULT_CITY: clone(DEFAULT_CITY),
  OPEN_CITY_NAMES: OPEN_CITY_NAMES.slice(),
  normalizeCity: normalizeCity,
  normalizeRegion: normalizeRegion,
  isOpenCity: isOpenCity,
  getCurrentCity: getCurrentCity,
  initCurrentCity: initCurrentCity,
  setCurrentCity: setCurrentCity,
  cityChanged: cityChanged,
  regionValue: regionValue,
  displayText: displayText,
  fullDisplayText: fullDisplayText,
  applyJobInfoFilter: applyJobInfoFilter,
  applyJobSeekerFilter: applyJobSeekerFilter,
  applyCityFields: applyCityFields,
  rowMatchesKeyword: rowMatchesKeyword,
};
