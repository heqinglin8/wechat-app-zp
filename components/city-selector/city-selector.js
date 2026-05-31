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
        wx.showToast({
          title: '暂时还没有开放当前城市业务',
          icon: 'none',
          duration: 2000,
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
