var city = require('../../utils/city.js');

Component({
  data: {
    currentCity: city.DEFAULT_CITY,
    cityText: city.displayText(city.DEFAULT_CITY),
    regionValue: city.regionValue(city.DEFAULT_CITY),
  },

  lifetimes: {
    attached: function () {
      this.refreshCity();
    },
  },

  pageLifetimes: {
    show: function () {
      this.refreshCity();
    },
  },

  methods: {
    refreshCity: function () {
      var currentCity = city.initCurrentCity();
      this.setData({
        currentCity: currentCity,
        cityText: city.displayText(currentCity),
        regionValue: city.regionValue(currentCity),
      });
    },

    onRegionChange: function (e) {
      var value = (e.detail && e.detail.value) || [];
      var code = (e.detail && e.detail.code) || [];
      var nextCity = city.normalizeRegion(value, code);
      if (!city.isOpenCity(nextCity)) {
        wx.showModal({
          title: '提示',
          content: '仅有广州、深圳、佛山、韶关、东莞、珠海开放业务，申请开放请微信咨询',
          showCancel: false,
          confirmText: '我知道了',
        });
        this.refreshCity();
        return;
      }
      nextCity = city.setCurrentCity(nextCity);
      this.setData({
        currentCity: nextCity,
        cityText: city.displayText(nextCity),
        regionValue: city.regionValue(nextCity),
      });
      this.triggerEvent('change', { city: nextCity });
    },
  },
});
