var pcaCode = require('../assets/pca-code.json.js');

var metadata = {
  localFile: 'assets/pca-code.json.js',
  sourceName: '国家统计局 统计用区划代码和城乡划分代码',
  sourceUrl: 'https://www.stats.gov.cn/sj/tjbz/tjyqhdmhcxhfdm/',
  snapshotYear: '2023',
  level: 'province-city-district',
};

var districtIndex = null;

var AUTONOMOUS_REGION_DISPLAY_NAMES = {
  '新疆维吾尔自治区': '新疆',
  '内蒙古自治区': '内蒙古',
  '广西壮族自治区': '广西',
  '西藏自治区': '西藏',
  '宁夏回族自治区': '宁夏',
};

function normalizeInputCode(value) {
  return String(value || '').trim();
}

function normalizeLevelCode(code) {
  var text = normalizeInputCode(code);
  if (!/^\d{2,6}$/.test(text)) return '';
  return (text + '000000').slice(0, 6);
}

function cloneRegion(region) {
  if (!region) return null;
  return {
    provinceCode: region.provinceCode,
    provinceName: region.provinceName,
    cityCode: region.cityCode,
    cityName: region.cityName,
    districtCode: region.districtCode,
    districtName: region.districtName,
  };
}

function buildDistrictIndex() {
  var index = {};

  (pcaCode || []).forEach(function (province) {
    var provinceCode = normalizeLevelCode(province && province.code);
    var provinceName = (province && province.name) || '';
    if (!provinceCode || !provinceName) return;

    (province.children || []).forEach(function (city) {
      var cityCode = normalizeLevelCode(city && city.code);
      var cityName = (city && city.name) || '';
      if (!cityCode || !cityName) return;

      (city.children || []).forEach(function (district) {
        var districtCode = normalizeInputCode(district && district.code);
        var districtName = (district && district.name) || '';
        if (!/^\d{6}$/.test(districtCode) || !districtName) return;

        index[districtCode] = {
          provinceCode: provinceCode,
          provinceName: provinceName,
          cityCode: cityCode,
          cityName: cityName,
          districtCode: districtCode,
          districtName: districtName,
        };
      });
    });
  });

  return index;
}

function getDistrictIndex() {
  if (!districtIndex) {
    districtIndex = buildDistrictIndex();
  }
  return districtIndex;
}

function findByDistrictCode(districtCode) {
  var code = normalizeInputCode(districtCode);
  if (!/^\d{6}$/.test(code)) return null;
  return cloneRegion(getDistrictIndex()[code]);
}

// 根据城市编码返回该城市下所有区县/街道编码。
function districtCodesByCityCode(cityCode) {
  var normalizedCityCode = normalizeLevelCode(cityCode);
  if (!normalizedCityCode) return [];

  var provinces = pcaCode || [];
  for (var i = 0; i < provinces.length; i++) {
    var cities = (provinces[i] && provinces[i].children) || [];
    for (var j = 0; j < cities.length; j++) {
      var currentCity = cities[j] || {};
      if (normalizeLevelCode(currentCity.code) === normalizedCityCode) {
        return (currentCity.children || []).map(function (district) {
          return normalizeInputCode(district && district.code);
        }).filter(function (districtCode) {
          return /^\d+$/.test(districtCode);
        });
      }
    }
  }

  return [];
}

function findDisplayByDistrictCode(districtCode) {
  var region = findByDistrictCode(districtCode);
  if (region && /自治区$/.test(region.provinceName)) {
    region.provinceName = AUTONOMOUS_REGION_DISPLAY_NAMES[region.provinceName] || region.provinceName;
  }
  if (region && region.cityName === '市辖区') {
    region.cityName = region.provinceName;
  }
  return region;
}

module.exports = {
  metadata: metadata,
  findByDistrictCode: findByDistrictCode,
  findDisplayByDistrictCode: findDisplayByDistrictCode,
  districtCodesByCityCode: districtCodesByCityCode,
};
