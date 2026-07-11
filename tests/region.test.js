var assert = require('assert');
var region = require('../utils/region.js');

var result = region.findByDistrictCode('110102');

assert.deepStrictEqual(result, {
  provinceCode: '110000',
  provinceName: '北京市',
  cityCode: '110100',
  cityName: '市辖区',
  districtCode: '110102',
  districtName: '西城区',
});

var displayResult = region.findDisplayByDistrictCode('110102');

assert.deepStrictEqual(displayResult, {
  provinceCode: '110000',
  provinceName: '北京市',
  cityCode: '110100',
  cityName: '北京市',
  districtCode: '110102',
  districtName: '西城区',
});

assert.deepStrictEqual(region.findDisplayByDistrictCode('500101'), {
  provinceCode: '500000',
  provinceName: '重庆市',
  cityCode: '500100',
  cityName: '重庆市',
  districtCode: '500101',
  districtName: '万州区',
});

assert.deepStrictEqual(region.findDisplayByDistrictCode('150103'), {
  provinceCode: '150000',
  provinceName: '内蒙古',
  cityCode: '150100',
  cityName: '呼和浩特市',
  districtCode: '150103',
  districtName: '回民区',
});

assert.deepStrictEqual(region.findDisplayByDistrictCode('659001'), {
  provinceCode: '650000',
  provinceName: '新疆',
  cityCode: '659000',
  cityName: '自治区直辖县级行政区划',
  districtCode: '659001',
  districtName: '石河子市',
});

assert.deepStrictEqual(region.findDisplayByDistrictCode('450102'), {
  provinceCode: '450000',
  provinceName: '广西',
  cityCode: '450100',
  cityName: '南宁市',
  districtCode: '450102',
  districtName: '兴宁区',
});

assert.deepStrictEqual(region.findDisplayByDistrictCode('540102'), {
  provinceCode: '540000',
  provinceName: '西藏',
  cityCode: '540100',
  cityName: '拉萨市',
  districtCode: '540102',
  districtName: '城关区',
});

assert.deepStrictEqual(region.findDisplayByDistrictCode('640104'), {
  provinceCode: '640000',
  provinceName: '宁夏',
  cityCode: '640100',
  cityName: '银川市',
  districtCode: '640104',
  districtName: '兴庆区',
});

assert.ok(region.districtCodesByCityCode('440100').indexOf('440106') !== -1);
assert.ok(region.districtCodesByCityCode('441900').indexOf('441900003') !== -1);

console.log('region.findByDistrictCode("110102") passed');
console.log('region.findDisplayByDistrictCode("110102") passed');
console.log('region.findDisplayByDistrictCode("500101") passed');
console.log('region.findDisplayByDistrictCode("150103") passed');
console.log('region.findDisplayByDistrictCode("659001") passed');
console.log('region.findDisplayByDistrictCode("450102") passed');
console.log('region.findDisplayByDistrictCode("540102") passed');
console.log('region.findDisplayByDistrictCode("640104") passed');
console.log('region.districtCodesByCityCode passed');
