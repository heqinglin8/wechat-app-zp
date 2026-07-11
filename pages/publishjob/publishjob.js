// pages/award/award.js
// JobInfo（Bmob）：控制台 Class 须含 contact recoJobIntent
// photoImgs（多张图 URL 半角 | 拼接）、commitNickname（提交人姓名）、commitUid（提交人 objectId）。
// 配图：最多 3 张；单张 ≤3MB（≤3145728 字节）；扩展名 jpg/jpeg/png/gif/webp/bmp；支持替换与删除；即选即传。

var Bmob = wx.Bmob;
var util = require('../../utils/util.js');
var city = require('../../utils/city.js');
var imageUpload = require('../../utils/imageUpload.js');
var userRole = require('../../utils/userRole.js');

var MAX_RECOMMEND_PHOTOS = 3;
var MAX_PHOTO_BYTES = 3145728;
var WX_CHOOSE_IMAGE_MAX = 9;
var ALLOWED_IMAGE_EXT = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'];
var LAST_PUBLISHED_COMPANY_KEY = 'lastPublishedCompanyForJob';

function toNumberOrZero(value) {
  var n = Number(value);
  return isNaN(n) ? 0 : n;
}

function parsePositiveNumber(value) {
  var text = String(value || '').trim();
  if (!text) return NaN;
  var n = Number(text);
  return isNaN(n) ? NaN : n;
}

Page({
  data: {
    title: '',
    contact: '',
    wxid: '',
    payType: '0',
    payTypeOptions: ['普通月结', '临时工'],
    payTypeIndex: 0,
    recoJobIntent: '',
    experience: '',
    jobDirection: '',
    summary: '',
    jobDescription: '',
    detPayMin: '',
    detPayMax: '',
    companies: [],
    selectedCompanyIndex: 0,
    selectedCompanyId: '',
    selectedCompanyName: '',
    selectedCompany: null,
    companySelectorVisible: false,
    pendingCompanyIndex: -1,
    educationOptions: ['初中及以下', '中专 / 高中', '大专', '本科', '硕士及以上'],
    educationIndex: 2,
    userLoaded: false,
    /** @type {{ url: string, tempPath: string, uploading: boolean }[]} */
    recommendPhotos: [],
    replacePhotoIndex: -1,
    formSubmitting: false,
    chooseImageBusy: false,
    currentCity: city.DEFAULT_CITY,
    currentCityText: city.fullDisplayText(city.DEFAULT_CITY),
    currentUserRole: '',
  },

  onTitleInput: function (e) {
    this.setData({ title: (e.detail && e.detail.value) || '' });
  },
  onContactInput: function (e) {
    this.setData({ contact: (e.detail && e.detail.value) || '' });
  },
  onWxidInput: function (e) {
    this.setData({ wxid: (e.detail && e.detail.value) || '' });
  },
  onCompanyNameInput: function (e) {
    this.setData({ companyName: (e.detail && e.detail.value) || '' });
  },
  onDetAddrInput: function (e) {
    this.setData({ detAddr: (e.detail && e.detail.value) || '' });
  },
  
  onDetPayMinInput: function (e) {
    this.setData({ detPayMin: (e.detail && e.detail.value) || '' });
  },
  onDetPayMaxInput: function (e) {
    this.setData({ detPayMax: (e.detail && e.detail.value) || '' });
  },
  onJobDescriptionInput: function (e) {
    this.setData({ jobDescription: (e.detail && e.detail.value) || '' });
  },
  onExperienceInput: function (e) {
    this.setData({ experience: (e.detail && e.detail.value) || '' });
  },
  onJobDirectionInput: function (e) {
    var value = (e.detail && e.detail.value) || '';
    this.setData({
      jobDirection: value,
      recoJobIntent: value,
    });
  },
  onSummaryInput: function (e) {
    var value = (e.detail && e.detail.value) || '';
    value = String(value).replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    var lines = value.split('\n');
    if (lines.length > 2) {
      value = lines.slice(0, 2).join('\n');
    }
    if (value.length > 40) {
      value = value.slice(0, 40);
    }
    this.setData({ summary: value });
  },
  onJobRequirementsInput: function (e) {
    this.setData({ jobRequirements: (e.detail && e.detail.value) || '' });
  },
  onEducationChange: function (e) {
    var idx = parseInt(e.detail.value, 10);
    if (isNaN(idx)) return;
    this.setData({ educationIndex: idx });
  },
  onPayTypeChange: function (e) {
    var idx = parseInt(e.detail.value, 10);
    if (isNaN(idx)) return;
    this.setData({
      payTypeIndex: idx,
      payType: idx === 1 ? '1' : '0',
    });
  },

  onLoad: function () {
    this.refreshCurrentCity();
    this.loadCompanyOptions();
  },

  onShow: function () {
    var currentUser = Bmob.User.current();
    if (!currentUser) {
      this.handleUnloginRedirect('onShow !currentUser');
      return;
    }
    this.consumeLastPublishedCompany();
    this.loadCompanyOptions();
  },

  refreshCurrentCity: function () {
    var currentCity = city.initCurrentCity();
    this.setData({
      currentCity: currentCity,
      currentCityText: city.fullDisplayText(currentCity),
    });
    return currentCity;
  },

  companyDisplayName: function (company) {
    var name = company && company.name ? String(company.name).trim() : '';
    var address = company ? city.fullDisplayText(company) : '';
    return address ? name + '（' + address + '）' : name;
  },

  normalizeCompany: function (row) {
    return {
      objectId: row.objectId || '',
      name: row.name || '',
      companyPeople: toNumberOrZero(row.companyPeople),
      financeStage: row.financeStage || '',
      logo: row.logo || '',
      photoImgs: row.photoImgs || '',
      provinceName: row.provinceName || city.DEFAULT_CITY.provinceName,
      cityName: row.cityName || city.DEFAULT_CITY.cityName,
      districtName: row.districtName || city.DEFAULT_CITY.districtName,
      provinceCode: String(row.provinceCode || city.DEFAULT_CITY.provinceCode),
      cityCode: String(row.cityCode || city.DEFAULT_CITY.cityCode),
      districtCode: String(row.districtCode || city.DEFAULT_CITY.districtCode),
      cityDisplayName: row.cityDisplayName || city.DEFAULT_CITY.cityDisplayName,
    };
  },

  loadCompanyOptions: function () {
    var that = this;
    var currentUser = Bmob.User.current();
    if (!currentUser) {
      this.setData({
        companies: [],
        selectedCompanyIndex: 0,
      });
      return;
    }
    var query = Bmob.Query('CompanyInfo');
    query.equalTo('commitUid', '==', currentUser.objectId);
    query.order('-updatedAt');
    query.find().then(function (results) {
      var companies = (results || []).map(function (row) {
        return that.normalizeCompany(row);
      });
      var selectedCompanyId = that.data.selectedCompanyId;
      var selectedCompanyIndex = companies.length;
      var selectedCompany = that.data.selectedCompany;
      var selectedCompanyName = that.data.selectedCompanyName;
      for (var i = 0; i < companies.length; i++) {
        if (companies[i].objectId && companies[i].objectId === selectedCompanyId) {
          selectedCompanyIndex = i;
          selectedCompany = companies[i];
          selectedCompanyName = companies[i].name;
          break;
        }
      }
      that.setData({
        companies: companies,
        selectedCompanyIndex: selectedCompanyIndex,
        selectedCompany: selectedCompany,
        selectedCompanyName: selectedCompanyName,
      });
    }).catch(function () {
      wx.showToast({ title: '公司列表加载失败', icon: 'none', duration: 2000 });
    });
  },

  selectCompany: function (company, index) {
    if (!company) return;
    this.setData({
      selectedCompanyIndex: index,
      selectedCompanyId: company.objectId || '',
      selectedCompanyName: company.name || '',
      selectedCompany: company,
      currentCity: city.normalizeCity(company),
      currentCityText: city.fullDisplayText(company),
    });
  },

  openCompanySelector: function () {
    this.setData({
      companySelectorVisible: true,
      pendingCompanyIndex: this.data.selectedCompany ? this.data.selectedCompanyIndex : -1,
    });
    this.loadCompanyOptions();
  },

  closeCompanySelector: function () {
    this.setData({
      companySelectorVisible: false,
      pendingCompanyIndex: -1,
    });
  },

  onCompanyCandidateTap: function (e) {
    var index = parseInt(e.currentTarget.dataset.index, 10);
    if (isNaN(index) || index < 0) return;
    this.setData({ pendingCompanyIndex: index });
  },

  confirmCompanySelection: function () {
    var index = this.data.pendingCompanyIndex;
    if (index < 0 || index >= this.data.companies.length) {
      wx.showToast({ title: '请选择公司', icon: 'none', duration: 2000 });
      return;
    }
    this.selectCompany(this.data.companies[index], index);
    this.closeCompanySelector();
  },

  goPublishCompany: function () {
    this.closeCompanySelector();
    wx.navigateTo({ url: '../publishcompany/publishcompany' });
  },

  consumeLastPublishedCompany: function () {
    var company = null;
    try {
      company = wx.getStorageSync(LAST_PUBLISHED_COMPANY_KEY);
      if (company) wx.removeStorageSync(LAST_PUBLISHED_COMPANY_KEY);
    } catch (e) {}
    if (!company || !company.name) return;
    var normalized = this.normalizeCompany(company);
    var companies = this.data.companies.slice();
    var index = -1;
    for (var i = 0; i < companies.length; i++) {
      if (companies[i].objectId && companies[i].objectId === normalized.objectId) {
        index = i;
        companies[i] = normalized;
        break;
      }
    }
    if (index < 0) {
      companies.unshift(normalized);
      index = 0;
    }
    this.setData({
      companies: companies,
    });
    this.selectCompany(normalized, index);
  },

  onReady: function () {
    var that = this;
    var currentUser = Bmob.User.current();
    if (!currentUser) {
      that.handleUnloginRedirect('onReady !currentUser');
      return;
    }
    // console.log('onReady currentUser:',currentUser)
    var userId = currentUser.objectId;
    var query = Bmob.Query('_User');
    console.log('onReady userId:',userId)
    query.equalTo('objectId', '==', userId);
    query.find().then(function (results) {
      if (!results.length) {
        wx.showToast({ title: '未找到用户信息，请先登录', icon: 'none', duration: 2000 });
        that.handleUnloginRedirect('onReady !results.length');
        return;
      }
      var u = results[0];
      console.log('onReady u:',u)
      var role = u.role == null ? '' : String(u.role).trim();
      if (!that.isAllowedPublisherRole(role)) {
        that.handlePublisherRoleDenied();
        return;
      }
      var phone = u.mobilePhoneNumber != null ? String(u.mobilePhoneNumber).trim() : '';
      if (!phone && u.userphone != null) {
        phone = String(u.userphone).trim();
      }
      console.log('setData userId:',userId,' role:',role)
      that.setData({
        contact: phone,
        userLoaded: true,
        currentUserRole: role,
      });
      that._userId = userId;
      that._nickname = u.nickname || '';
      that._avatarPath = u.avatarPath || '';
      that._jobRole = u.jobRole || '';
    }).catch(function (error) {
      console.error('onReady 用户信息加载失败 objectId:',objectId,'error:',error)
      wx.showToast({ title: '用户信息加载失败', icon: 'none', duration: 2000 });
      that.handleUnloginRedirect('onReady 用户信息加载失败');
    });
  },

  onShareAppMessage: function () {},

  noop: function () {},

  isAllowedPublisherRole: function (role) {
    return userRole.canPublishRecruit(role);
  },
  resolvePublishActive: function () {
    return userRole.resolvePublishActive(this.data.currentUserRole);
  },

  handlePublisherRoleDenied: function () {
    var that = this;
    if (that._isHandlingRoleDenied) {
      return;
    }
    that._isHandlingRoleDenied = true;
    wx.showToast({
      title: '招聘者才能发布招聘信息',
      icon: 'none',
      duration: 2000
    });
    setTimeout(function () {
      var pages = getCurrentPages();
      if (pages.length > 1) {
        wx.navigateBack({
          delta: 1,
          complete: function () {
            that._isHandlingRoleDenied = false;
          }
        });
        return;
      }
      that._isHandlingRoleDenied = false;
      wx.switchTab({
        url: '/pages/index/index'
      });
    }, 1000);
  },

  handleUnloginRedirect: function (caller) {
    console.log('handleUnloginRedirect caller：'+caller)
    var that = this;
    if (that._isHandlingLoginRedirect) {
      return;
    }
    that._isHandlingLoginRedirect = true;
    wx.showModal({
      title: '提示',
      content: '当前用户未登录，跳转到个人中心',
      showCancel: false,
      confirmText: '确定',
      success: function () {
        var pages = getCurrentPages();
        if (pages.length > 1) {
          wx.navigateBack({
            delta: 1,
            complete: function () {
              wx.switchTab({
                url: '/pages/personal/personal'
              });
            }
          });
          return;
        }
        wx.switchTab({
          url: '/pages/personal/personal'
        });
      },
      complete: function () {
        that._isHandlingLoginRedirect = false;
      }
    });
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

  /** Upload single temp file; returns promise with remote url */
  uploadOnePhotoFile: function (imageInfo, slotIndex) {
    var that = this;
    return imageUpload.uploadPreparedImage({
      Bmob: Bmob,
      imageInfo: imageInfo,
      prefix: 'rec',
      slotIndex: slotIndex
    }).then(function (photo) {
      var list = that.data.recommendPhotos.slice();
      var cur = list[slotIndex];
      if (!cur) return Promise.reject(new Error('slot'));
      list[slotIndex] = { url: photo.url, path: photo.path, tempPath: '', uploading: false };
      that.setData({ recommendPhotos: list });
      return photo.url;
    });
  },

  /** Run validations then upload for slot at index */
  startUploadForSlot: function (slotIndex, filePath, rollbackUrl) {
    var that = this;
    return this.validatePhotoPath(filePath)
      .then(function (imageInfo) {
        return that.uploadOnePhotoFile(imageInfo, slotIndex);
      })
      .catch(function () {
        var list = that.data.recommendPhotos.slice();
        var cur = list[slotIndex];
        if (!cur) return;
        if (rollbackUrl) {
          list[slotIndex] = { url: rollbackUrl, tempPath: '', uploading: false };
        } else {
          list.splice(slotIndex, 1);
        }
        that.setData({ recommendPhotos: list });
      });
  },

  appendPhotosAfterChoose: function (paths) {
    var that = this;
    var replaceIdx = this.data.replacePhotoIndex;
    var seq = Promise.resolve();

    if (replaceIdx >= 0) {
      var rp = paths[0];
      if (!rp) {
        this.setData({ replacePhotoIndex: -1, chooseImageBusy: false });
        return Promise.resolve();
      }
      var prevUrl = (this.data.recommendPhotos[replaceIdx] && this.data.recommendPhotos[replaceIdx].url) || '';
      var list = this.data.recommendPhotos.slice();
      list[replaceIdx] = { url: prevUrl, tempPath: rp, uploading: true };
      this.setData({ recommendPhotos: list, replacePhotoIndex: -1 });
      seq = seq.then(function () {
        return that.startUploadForSlot(replaceIdx, rp, prevUrl);
      });
      return seq.then(function () {}, function () {}).then(function () {
        that.setData({ chooseImageBusy: false });
      });
    }
    console.log('appendPhotosAfterChoose photos', paths);
    var remain = MAX_RECOMMEND_PHOTOS - this.data.recommendPhotos.length;
    var take = paths.slice(0, Math.max(0, remain));
    if (!take.length) {
      this.setData({ chooseImageBusy: false });
      return Promise.resolve();
    }
    take.forEach(function (p) {
      seq = seq.then(function () {
        return that.validatePhotoPath(p).then(function (imageInfo) {
          var next = that.data.recommendPhotos.concat([
            { url: '', tempPath: p, uploading: true },
          ]);
          var idx = next.length - 1;
          that.setData({ recommendPhotos: next });
          return that.uploadOnePhotoFile(imageInfo, idx).catch(function (error) {
            console.error('uploadOnePhotoFile fail!error:',error);
            var ls = that.data.recommendPhotos.slice();
            ls.splice(idx, 1);
            that.setData({ recommendPhotos: ls });
            wx.showToast({ title: '图片上传失败', icon: 'none', duration: 2000 });
          });
        });
      });
    });

    return seq.then(function () {}, function () {}).then(function () {
      that.setData({ chooseImageBusy: false });
    });
  },

  openChooseImage: function (count) {
    var that = this;
    if (this.data.chooseImageBusy) return;
    this.setData({ chooseImageBusy: true });
    wx.chooseImage({
      count: count,
      sizeType: ['compressed', 'original'],
      sourceType: ['album', 'camera'],
      success: function (res) {
        console.log('choose image success', res);
        var paths = res.tempFilePaths || [];
        that.appendPhotosAfterChoose(paths);
      },
      fail: function () {
        console.error('choose image fail');
        that.setData({ chooseImageBusy: false, replacePhotoIndex: -1 });
      },
    });
  },

  onAddPhotos: function () {
    if (this.data.chooseImageBusy) return;
    var n = this.data.recommendPhotos.length;
    if (n >= MAX_RECOMMEND_PHOTOS) {
      wx.showToast({ title: '最多 3 张图片', icon: 'none', duration: 2000 });
      return;
    }
    this.setData({ replacePhotoIndex: -1 });
    var pick = Math.min(WX_CHOOSE_IMAGE_MAX, MAX_RECOMMEND_PHOTOS - n);
    this.openChooseImage(pick);
  },

  onReplacePhoto: function (e) {
    if (this.data.chooseImageBusy) return;
    var idx = parseInt(e.currentTarget.dataset.index, 10);
    if (isNaN(idx) || idx < 0) return;
    this.setData({ replacePhotoIndex: idx });
    this.openChooseImage(1);
  },

  onRemovePhoto: function (e) {
    if (this.data.chooseImageBusy) return;
    var idx = parseInt(e.currentTarget.dataset.index, 10);
    if (isNaN(idx) || idx < 0) return;
    var cur = this.data.recommendPhotos[idx];
    if (cur && cur.uploading) {
      wx.showToast({ title: '上传完成后可删除', icon: 'none', duration: 2000 });
      return;
    }
    var list = this.data.recommendPhotos.slice();
    list.splice(idx, 1);
    this.setData({ recommendPhotos: list });
  },

  validateForm: function () {
    var d = this.data;
    if (!d.selectedCompany) {
      wx.showToast({ title: '请选择公司', image: '../../images/warning.png', duration: 2000 });
      return false;
    }
    if (!(d.title && String(d.title).trim())) {
      wx.showToast({ title: '请填写标题', image: '../../images/warning.png', duration: 2000 });
      return false;
    }
    if (!(d.contact && String(d.contact).trim())) {
      wx.showToast({ title: '请填写电话', image: '../../images/warning.png', duration: 2000 });
      return false;
    }
    var contact = String(d.contact || '').trim();
    var mobileReg = /^1[3-9]\d{9}$/;
    var landlineReg = /^0\d{2,3}-?\d{7,8}(?:-\d{1,6})?$/;
    if (!mobileReg.test(contact) && !landlineReg.test(contact)) {
      wx.showToast({ title: '手机号或固话不正确', image: '../../images/warning.png', duration: 2000 });
      return false;
    }
    if (!(d.wxid && String(d.wxid).trim())) {
      wx.showToast({ title: '请填写微信号', image: '../../images/warning.png', duration: 2000 });
      return false;
    }
    if (!(d.jobDirection && String(d.jobDirection).trim())) {
      wx.showToast({ title: '请填写职位方向', image: '../../images/warning.png', duration: 2000 });
      return false;
    }
    
    var payMin = parsePositiveNumber(d.detPayMin);
    var payMax = parsePositiveNumber(d.detPayMax);
    if (isNaN(payMin) || isNaN(payMax) || payMin <= 0 || payMax <= 0) {
      wx.showToast({ title: '请填写薪资范围', icon:  'none', duration: 2000 });
      return false;
    }
    if (payMin >= payMax) {
      wx.showToast({ title: '最低薪资须小于最高', icon: 'none', duration: 2000 });
      return false;
    }
    return true;
  },

  educationLabel: function () {
    var opts = this.data.educationOptions;
    var i = this.data.educationIndex;
    if (i < 0 || i >= opts.length) return '';
    return opts[i];
  },

  buildPhotoImgsField: function () {
    var parts = [];
    this.data.recommendPhotos.forEach(function (p) {
      if (p.path) parts.push(p.path);
    });
    return parts.join('|');
  },

  photosReadyForSubmit: function () {
    var photos = this.data.recommendPhotos;
    for (var i = 0; i < photos.length; i++) {
      if (photos[i].uploading) return false;
      if (photos[i].tempPath && !photos[i].path) return false;
    }
    return true;
  },

  onRecoJobIntentInput: function (e) {
    this.setData({ recoJobIntent: (e.detail && e.detail.value) || '' });
  },

  applyJobSeekerFields: function (row) {
    console.log("applyJobSeekerFields row:",row);
    var d = this.data;
    var edu = this.educationLabel();
    var summaryText = String(d.summary || '').trim();
    var jobDescriptionText = String(d.jobDescription || '').trim();
    if (!summaryText && jobDescriptionText) {
      summaryText = jobDescriptionText.slice(0, 40);
    }
    console.log('_nickname',this._nickname)
    row.set('commitNickname', this._nickname);
    row.set('commitUid', this._userId || '');
    row.set('commitAvatar', this._avatarPath || '');
    row.set('commitJobRole', this._jobRole || '');
    row.set('title', String(d.title).trim());
    row.set('education', edu);
    row.set('contact', String(d.contact).trim());
    row.set('wxid', String(d.wxid).trim());
    row.set('experience', String(d.experience || '').trim());
    row.set('summary', summaryText);
    row.set('jobDescription', jobDescriptionText);
    row.set('jobDirection', String(d.jobDirection || '').trim());
    row.set('companyId', d.selectedCompanyId || '');
    row.set('detPayMin', parsePositiveNumber(d.detPayMin));
    row.set('detPayMax', parsePositiveNumber(d.detPayMax));
    row.set('payType', Number(d.payType || '0'));
    row.set('photoImgs', this.buildPhotoImgsField());
    row.set('active', this.resolvePublishActive());
    var currentCity = city.normalizeCity(d.selectedCompany || d.currentCity);
    row.set('districtName', currentCity.districtName);
    row.set('districtCode', currentCity.districtCode);
  },

  put_infor: function () {
    var that = this;
    if (that.data.formSubmitting) return;
    console.log('userLoaded:',that.data.userLoaded,' userId:',that._userId)
    if (!that.data.userLoaded || !that._userId) {
      wx.showToast({ title: '请先登录后再推荐', image: '../../images/warning.png', duration: 2000 });
      return;
    }
    if (!that.validateForm()) {
      return;
    }
    if (!that.photosReadyForSubmit()) {
      wx.showToast({ title: '请等待图片上传完成', icon: 'none', duration: 2000 });
      return;
    }

    that.setData({ formSubmitting: true });

    var query = Bmob.Query('JobInfo');
    query.equalTo('commitUid', '==', that._userId);
    query.equalTo('title', '==', String(that.data.title).trim());
    query.equalTo('active', '==', 1);

    query.find().then(function (results) {
      if (!results.length) {
        var created = Bmob.Query('JobInfo');
        that.applyJobSeekerFields(created);
        return created.save().then(function () {
          var isPendingReview = that.resolvePublishActive() === 0;
          wx.switchTab({ url: '../index/index' });
          setTimeout(function () {
            wx.showToast({
              title: isPendingReview ? '发布成功，将审核后展示' : '发布成功',
              icon: 'success',
              duration: 2000
            });
          }, 320);
        });
      }
      var row = results[0];
      return new Promise(function (resolve, reject) {
        wx.showModal({
          title: '提示',
          content: '你已经提交过该条记录，你确认要更新？',
          confirmText: '确认',
          cancelText: '取消',
          success: function (res) {
            if (res.confirm) {
              resolve();
              return;
            }
            reject(new Error('cancel_update'));
          },
          fail: function (err) {
            reject(err || new Error('modal_fail'));
          },
        });
      }).then(function () {
        var updatedQuery = Bmob.Query('JobInfo');
        return updatedQuery.get(row.objectId).then(function (existing) {
          if (String(existing.commitUid || '').trim() !== that._userId) {
            wx.showToast({
              title: '无权编辑该招聘',
              icon: 'none',
              duration: 1500
            });
            throw new Error('permission_denied');
          }
          that.applyJobSeekerFields(existing);
          return existing.save();
        });
      }).then(function () {
        var isPendingReview = that.resolvePublishActive() === 0;
        wx.switchTab({ url: '../index/index' });
        setTimeout(function () {
          wx.showToast({
            title: isPendingReview ? '发布成功，将审核后展示' : '档案已更新',
            icon: 'success',
            duration: 2000
          });
        }, 320);
      });
    }).catch(function (e) {
      if (e && (e.message === 'cancel_update' || e.message === 'permission_denied')) {
        return;
      }
      console.error("提交失败,e:",e)
      wx.showToast({
        title: '提交失败，请稍后重试',
        icon: 'none',
        duration: 2000,
      });
    }).then(function () {
      that.setData({ formSubmitting: false });
    });
  },
  

});
