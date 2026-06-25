var Bmob = wx.Bmob;
var util = require('../../utils/util.js');
var city = require('../../utils/city.js');
var imageUpload = require('../../utils/imageUpload.js');

var MAX_COMPANY_PHOTOS = 6;
var MAX_PHOTO_BYTES = 3145728;
var WX_CHOOSE_IMAGE_MAX = 9;
var ALLOWED_IMAGE_EXT = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'];
var LAST_PUBLISHED_COMPANY_KEY = 'lastPublishedCompanyForJob';

function emptyPhoto() {
  return { url: '', path: '', tempPath: '', uploading: false };
}

function parseCompanyPeople(value) {
  var text = String(value || '').trim();
  if (!text) return NaN;
  return Number(text);
}

Page({
  data: {
    name: '',
    companyPeople: '',
    financeStage: '',
    currentCity: city.DEFAULT_CITY,
    regionValue: city.regionValue(city.DEFAULT_CITY),
    companyAddressText: city.fullDisplayText(city.DEFAULT_CITY),
    logoPhoto: emptyPhoto(),
    companyPhotos: [],
    replaceCompanyPhotoIndex: -1,
    chooseImageBusy: false,
    formSubmitting: false,
    userLoaded: false,
    userName: '',
    uid: '',
  },

  onLoad: function () {
    this.refreshCompanyCity();
  },

  onReady: function () {
    this.loadCurrentUser();
  },

  refreshCompanyCity: function () {
    var currentCity = city.initCurrentCity();
    this.setData({
      currentCity: currentCity,
      regionValue: city.regionValue(currentCity),
      companyAddressText: city.fullDisplayText(currentCity),
    });
    return currentCity;
  },

  onRegionChange: function (e) {
    var nextCity = city.normalizeRegion(e.detail.value, e.detail.code);
    if (!city.isOpenCity(nextCity)) {
      wx.showModal({
        title: '提示',
        content: '仅有广州、深圳、佛山、韶关、东莞、珠海开放业务，申请开放请微信咨询',
        showCancel: false,
        confirmText: '我知道了',
      });
      this.refreshCompanyCity();
      return;
    }
    this.setData({
      currentCity: nextCity,
      regionValue: city.regionValue(nextCity),
      companyAddressText: city.fullDisplayText(nextCity),
    });
  },

  loadCurrentUser: function () {
    var that = this;
    var currentUser = Bmob.User.current();
    if (!currentUser) {
      wx.showToast({ title: '请先登录后再录入', icon: 'none', duration: 2000 });
      return;
    }
    var objectId = currentUser.objectId;
    var query = Bmob.Query('_User');
    query.equalTo('objectId', '==', objectId);
    query.find().then(function (results) {
      if (!results.length) {
        wx.showToast({ title: '未找到用户信息，请先登录', icon: 'none', duration: 2000 });
        return;
      }
      that.setData({
        userName: results[0].username || '',
        uid: objectId,
        userLoaded: true,
      });
    }).catch(function () {
      wx.showToast({ title: '用户信息加载失败', icon: 'none', duration: 2000 });
    });
  },

  onNameInput: function (e) {
    this.setData({ name: (e.detail && e.detail.value) || '' });
  },

  onCompanyPeopleInput: function (e) {
    this.setData({ companyPeople: (e.detail && e.detail.value) || '' });
  },

  onFinanceStageInput: function (e) {
    this.setData({ financeStage: (e.detail && e.detail.value) || '' });
  },

  validatePhotoPath: function (filePath) {
    return imageUpload.prepareImage(filePath, {
      maxBytes: MAX_PHOTO_BYTES,
      allowedExt: ALLOWED_IMAGE_EXT
    }).catch(function (error) {
      imageUpload.showImageError(error);
      return Promise.reject(error);
    });
  },

  uploadOnePhotoFile: function (imageInfo, prefix, slotIndex) {
    return imageUpload.uploadPreparedImage({
      Bmob: Bmob,
      imageInfo: imageInfo,
      prefix: prefix,
      slotIndex: slotIndex
    });
  },

  chooseImage: function (count, success) {
    var that = this;
    if (this.data.chooseImageBusy) return;
    this.setData({ chooseImageBusy: true });
    wx.chooseImage({
      count: count,
      sizeType: ['compressed', 'original'],
      sourceType: ['album', 'camera'],
      success: function (res) {
        success(res.tempFilePaths || []);
      },
      fail: function () {
        that.setData({
          chooseImageBusy: false,
          replaceCompanyPhotoIndex: -1,
        });
      },
    });
  },

  onChooseLogo: function () {
    var that = this;
    this.chooseImage(1, function (paths) {
      var filePath = paths[0];
      if (!filePath) {
        that.setData({ chooseImageBusy: false });
        return;
      }
      var prevLogo = that.data.logoPhoto;
      that.setData({ logoPhoto: { url: prevLogo.url, path: prevLogo.path, tempPath: filePath, uploading: true } });
      that.validatePhotoPath(filePath)
        .then(function (imageInfo) {
          return that.uploadOnePhotoFile(imageInfo, 'company-logo', 0);
        })
        .then(function (photo) {
          that.setData({ logoPhoto: { url: photo.url, path: photo.path, tempPath: '', uploading: false } });
        })
        .catch(function () {
          that.setData({ logoPhoto: prevLogo && prevLogo.url ? prevLogo : emptyPhoto() });
        })
        .then(function () {
          that.setData({ chooseImageBusy: false });
        });
    });
  },

  onRemoveLogo: function () {
    if (this.data.logoPhoto.uploading) {
      wx.showToast({ title: '上传完成后可删除', icon: 'none', duration: 2000 });
      return;
    }
    this.setData({ logoPhoto: emptyPhoto() });
  },

  onAddCompanyPhotos: function () {
    var that = this;
    var n = this.data.companyPhotos.length;
    if (n >= MAX_COMPANY_PHOTOS) {
      wx.showToast({ title: '最多 6 张图片', icon: 'none', duration: 2000 });
      return;
    }
    this.setData({ replaceCompanyPhotoIndex: -1 });
    this.chooseImage(Math.min(WX_CHOOSE_IMAGE_MAX, MAX_COMPANY_PHOTOS - n), function (paths) {
      that.appendCompanyPhotos(paths);
    });
  },

  appendCompanyPhotos: function (paths) {
    var that = this;
    var replaceIdx = this.data.replaceCompanyPhotoIndex;
    var seq = Promise.resolve();

    if (replaceIdx >= 0) {
      var replacePath = paths[0];
      if (!replacePath) {
        this.setData({ replaceCompanyPhotoIndex: -1, chooseImageBusy: false });
        return;
      }
      var prev = this.data.companyPhotos[replaceIdx] || emptyPhoto();
      var list = this.data.companyPhotos.slice();
      list[replaceIdx] = { url: prev.url, path: prev.path, tempPath: replacePath, uploading: true };
      this.setData({ companyPhotos: list, replaceCompanyPhotoIndex: -1 });
      this.uploadCompanyPhotoAt(replaceIdx, replacePath, prev);
      return;
    }

    var remain = MAX_COMPANY_PHOTOS - this.data.companyPhotos.length;
    paths.slice(0, Math.max(0, remain)).forEach(function (filePath) {
      seq = seq.then(function () {
        return that.validatePhotoPath(filePath).then(function (imageInfo) {
          var next = that.data.companyPhotos.concat([{ url: '', path: '', tempPath: filePath, uploading: true }]);
          var idx = next.length - 1;
          that.setData({ companyPhotos: next });
          return that.uploadCompanyPhotoAt(idx, imageInfo, emptyPhoto());
        });
      });
    });
    seq.then(function () {}, function () {}).then(function () {
      that.setData({ chooseImageBusy: false });
    });
  },

  uploadCompanyPhotoAt: function (idx, filePath, rollbackPhoto) {
    var that = this;
    var imageInfoPromise = typeof filePath === 'string' ? this.validatePhotoPath(filePath) : Promise.resolve(filePath);
    return imageInfoPromise
      .then(function (imageInfo) {
        return that.uploadOnePhotoFile(imageInfo, 'company-photo', idx);
      })
      .then(function (photo) {
        var list = that.data.companyPhotos.slice();
        if (!list[idx]) return;
        list[idx] = { url: photo.url, path: photo.path, tempPath: '', uploading: false };
        that.setData({ companyPhotos: list });
      })
      .catch(function () {
        var list = that.data.companyPhotos.slice();
        if (rollbackPhoto && rollbackPhoto.url) {
          list[idx] = rollbackPhoto;
        } else {
          list.splice(idx, 1);
        }
        that.setData({ companyPhotos: list });
      })
      .then(function () {
        that.setData({ chooseImageBusy: false });
      });
  },

  onReplaceCompanyPhoto: function (e) {
    var idx = parseInt(e.currentTarget.dataset.index, 10);
    if (isNaN(idx) || idx < 0 || this.data.chooseImageBusy) return;
    this.setData({ replaceCompanyPhotoIndex: idx });
    var that = this;
    this.chooseImage(1, function (paths) {
      that.appendCompanyPhotos(paths);
    });
  },

  onRemoveCompanyPhoto: function (e) {
    if (this.data.chooseImageBusy) return;
    var idx = parseInt(e.currentTarget.dataset.index, 10);
    if (isNaN(idx) || idx < 0) return;
    var cur = this.data.companyPhotos[idx];
    if (cur && cur.uploading) {
      wx.showToast({ title: '上传完成后可删除', icon: 'none', duration: 2000 });
      return;
    }
    var list = this.data.companyPhotos.slice();
    list.splice(idx, 1);
    this.setData({ companyPhotos: list });
  },

  photosReadyForSubmit: function () {
    if (this.data.logoPhoto.uploading) return false;
    for (var i = 0; i < this.data.companyPhotos.length; i++) {
      if (this.data.companyPhotos[i].uploading) return false;
      if (this.data.companyPhotos[i].tempPath && !this.data.companyPhotos[i].path) return false;
    }
    return true;
  },

  buildPhotoImgsField: function () {
    var parts = [];
    this.data.companyPhotos.forEach(function (p) {
      if (p.path) parts.push(p.path);
    });
    return parts.join('|');
  },

  validateForm: function () {
    var d = this.data;
    if (!(d.name && String(d.name).trim())) {
      wx.showToast({ title: '请填写公司名', icon: 'none', duration: 2000 });
      return false;
    }
    if (!(d.companyPeople && String(d.companyPeople).trim())) {
      wx.showToast({ title: '请填写公司规模', icon: 'none', duration: 2000 });
      return false;
    }
    if (isNaN(parseCompanyPeople(d.companyPeople)) || parseCompanyPeople(d.companyPeople) <= 0) {
      wx.showToast({ title: '公司规模需填写数字', icon: 'none', duration: 2000 });
      return false;
    }
    if (!(d.financeStage && String(d.financeStage).trim())) {
      wx.showToast({ title: '请填写融资阶段', icon: 'none', duration: 2000 });
      return false;
    }
    if (!(d.logoPhoto && d.logoPhoto.path)) {
      wx.showToast({ title: '请上传公司logo', icon: 'none', duration: 2000 });
      return false;
    }
    return true;
  },

  applyCompanyFields: function (row) {
    var d = this.data;
    var companyPeople = parseCompanyPeople(d.companyPeople);
    row.set('name', String(d.name).trim());
    row.set('companyPeople', companyPeople);
    row.set('financeStage', String(d.financeStage).trim());
    row.set('logo', d.logoPhoto.path || '');
    row.set('photoImgs', this.buildPhotoImgsField());
    row.set('commitUsername', d.userName || '');
    row.set('commitUid', d.uid || '');
    city.applyCityFields(row, d.currentCity);
  },

  buildCompanySelection: function (objectId) {
    var d = this.data;
    var currentCity = city.normalizeCity(d.currentCity);
    var companyPeople = parseCompanyPeople(d.companyPeople);
    return {
      objectId: objectId || '',
      name: String(d.name).trim(),
      companyPeople: companyPeople,
      financeStage: String(d.financeStage).trim(),
      logo: d.logoPhoto.path || '',
      photoImgs: this.buildPhotoImgsField(),
      provinceName: currentCity.provinceName,
      cityName: currentCity.cityName,
      districtName: currentCity.districtName,
      provinceCode: currentCity.provinceCode,
      cityCode: currentCity.cityCode,
      districtCode: currentCity.districtCode,
      cityDisplayName: currentCity.cityDisplayName,
    };
  },

  submitCompany: function () {
    var that = this;
    if (that.data.formSubmitting) return;
    if (!that.data.userLoaded) {
      wx.showToast({ title: '请先登录后再录入', icon: 'none', duration: 2000 });
      return;
    }
    if (!that.validateForm()) return;
    if (!that.photosReadyForSubmit()) {
      wx.showToast({ title: '请等待图片上传完成', icon: 'none', duration: 2000 });
      return;
    }
    that.setData({ formSubmitting: true });
    var query = Bmob.Query('CompanyInfo');
    query.equalTo('commitUid', '==', that.data.uid);
    query.equalTo('name', '==', String(that.data.name).trim());
    query.find().then(function (results) {
      if (!results.length) {
        var created = Bmob.Query('CompanyInfo');
        that.applyCompanyFields(created);
        return created.save().then(function (saved) {
          return that.buildCompanySelection((saved && saved.objectId) || created.objectId);
        });
      }
      return Bmob.Query('CompanyInfo').get(results[0].objectId).then(function (existing) {
        that.applyCompanyFields(existing);
        return existing.save().then(function (saved) {
          return that.buildCompanySelection((saved && saved.objectId) || existing.objectId || results[0].objectId);
        });
      });
    }).then(function (company) {
      try {
        wx.setStorageSync(LAST_PUBLISHED_COMPANY_KEY, company);
      } catch (e) {}
      wx.showToast({ title: '保存成功', icon: 'success', duration: 2000 });
      setTimeout(function () {
        wx.navigateBack({ delta: 1 });
      }, 500);
    }).catch(function (e) {
      console.error('保存公司信息失败', e);
      wx.showToast({ title: '保存失败，请稍后重试', icon: 'none', duration: 2000 });
    }).then(function () {
      that.setData({ formSubmitting: false });
    });
  },
});
