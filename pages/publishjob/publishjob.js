// pages/award/award.js
// JobInfo（Bmob）：控制台 Class 须含 companyPeople financeStage recoEducation recoContact recoJobIntent recoIntro recoExtra、
// photoImgs（多张图 URL 半角 | 拼接）、commitUsername（提交人姓名）、commitUid（提交人 objectId）。
// 配图：最多 3 张；单张 ≤3MB（≤3145728 字节）；扩展名 jpg/jpeg/png/gif/webp/bmp；支持替换与删除；即选即传。

var Bmob = wx.Bmob;
var util = require('../../utils/util.js');
var city = require('../../utils/city.js');

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
    userName: '',
    title: '',
    recoName: '',
    recoContact: '',
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
    recoIntro: '',
    recoExtra: '',
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

  onRecoNameInput: function (e) {
    this.setData({ title: (e.detail && e.detail.value) || '' });
  },
  onRecoContactInput: function (e) {
    this.setData({ recoContact: (e.detail && e.detail.value) || '' });
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

  onLoad: function () {
    this.refreshCurrentCity();
    this.loadCompanyOptions();
  },

  onShow: function () {
    var currentUser = Bmob.User.current();
    if (!currentUser) {
      this.handleUnloginRedirect();
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
      that.handleUnloginRedirect();
      return;
    }
    var objectId = currentUser.objectId;
    var query = Bmob.Query('_User');
    query.equalTo('objectId', '==', objectId);
    query.find().then(function (results) {
      if (!results.length) {
        wx.showToast({ title: '未找到用户信息，请先登录', icon: 'none', duration: 2000 });
        that.handleUnloginRedirect();
        return;
      }
      var u = results[0];
      var role = u.role == null ? '' : String(u.role).trim();
      if (!that.isAllowedPublisherRole(role)) {
        that.handlePublisherRoleDenied();
        return;
      }
      var phone = u.userphone != null ? String(u.userphone).trim() : '';
      var uname = u.username || '';
      that.setData({
        userName: uname,
        recoContact: phone,
        userLoaded: true,
        uid: objectId,
        currentUserRole: role,
      });
    }).catch(function () {
      wx.showToast({ title: '用户信息加载失败', icon: 'none', duration: 2000 });
      that.handleUnloginRedirect();
    });
  },

  onShareAppMessage: function () {},

  noop: function () {},

  isAllowedPublisherRole: function (role) {
    var roleText = role == null ? '' : String(role).trim();
    return roleText === '1' || roleText === '100' || roleText === '1000';
  },
  resolvePublishActive: function () {
    var roleText = String(this.data.currentUserRole || '').trim();
    return (roleText === '100' || roleText === '1000') ? 1 : 0;
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

  handleUnloginRedirect: function () {
    console.log('handleUnloginRedirect()')
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

  /** @returns {Promise<number>} file size in bytes */
  getFileSize: function (filePath) {
    return new Promise(function (resolve, reject) {
      wx.getFileSystemManager().getFileInfo({
        filePath: filePath,
        success: function (res) {
          resolve(res.size);
        },
        fail: reject,
      });
    });
  },

  validatePhotoPath: function (filePath) {
    var that = this;
    return this.getFileSize(filePath).then(function (size) {
      if (size > MAX_PHOTO_BYTES) {
        wx.showToast({ title: '单张图片不能超过 3MB', icon: 'none', duration: 2000 });
        return Promise.reject(new Error('size'));
      }
      var ext = util.extFromPath(filePath);
      if (!ext || ALLOWED_IMAGE_EXT.indexOf(ext) === -1) {
        wx.showToast({ title: '仅支持常见图片格式', icon: 'none', duration: 2000 });
        return Promise.reject(new Error('type'));
      }
      return Promise.resolve();
    });
  },

  /** Upload single temp file; returns promise with remote url */
  uploadOnePhotoFile: function (filePath, slotIndex) {
    var that = this;
    var ext = util.extFromPath(filePath) || 'jpg';
    var fileName = 'rec-' + Date.now() + '-' + slotIndex + '-' + Math.floor(Math.random() * 10000) + '.' + ext;
    var file = new Bmob.File(fileName, filePath);
    console.log("uploadOnePhotoFile slotIndex:",slotIndex," filePath",filePath," file",file);
    return file.save().then(function (saved) {
      // var url = typeof saved.url === 'function' ? saved.url() : '';
      var url = saved[0].url;
      if (!url && saved._url) url = saved._url;
      if (!url) return Promise.reject(new Error('no url'));
      var relativePath = util.extractRelativePathFromUrl(url);
      var replace_url = util.toDisplayUrl(relativePath);
      var type = ext || util.extFromPath(relativePath) || 'unknown';

      // 保存文件元信息到 file 表，不阻断主上传流程
      var fileQuery = Bmob.Query('file');
      fileQuery.set('name', fileName);
      fileQuery.set('path', relativePath);
      fileQuery.set('type', type);

      var list = that.data.recommendPhotos.slice();
      var cur = list[slotIndex];
      if (!cur) return Promise.reject(new Error('slot'));
      list[slotIndex] = { url: replace_url, path: relativePath, tempPath: '', uploading: false };
      that.setData({ recommendPhotos: list });
      return fileQuery.save().then(function (res) {
        console.log('save file meta success', res);
        return replace_url;
      }).catch(function (err) {
        console.log('save file meta fail', err);
        return replace_url;
      });
    });
  },

  /** Run validations then upload for slot at index */
  startUploadForSlot: function (slotIndex, filePath, rollbackUrl) {
    var that = this;
    return this.validatePhotoPath(filePath)
      .then(function () {
        return that.uploadOnePhotoFile(filePath, slotIndex);
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
        return that.validatePhotoPath(p).then(function () {
          var next = that.data.recommendPhotos.concat([
            { url: '', tempPath: p, uploading: true },
          ]);
          var idx = next.length - 1;
          that.setData({ recommendPhotos: next });
          return that.uploadOnePhotoFile(p, idx).catch(function (error) {
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
    if (!(d.selectedCompany && d.selectedCompanyName)) {
      wx.showToast({ title: '请选择公司', image: '../../images/warning.png', duration: 2000 });
      return false;
    }
    if (!(d.title && String(d.title).trim())) {
      wx.showToast({ title: '请填写标题', image: '../../images/warning.png', duration: 2000 });
      return false;
    }
    if (!(d.recoContact && String(d.recoContact).trim())) {
      wx.showToast({ title: '请填写联系方式', image: '../../images/warning.png', duration: 2000 });
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
    row.set('commitUsername', d.userName);
    row.set('commitUid', d.uid || '');
    row.set('title', String(d.title).trim());
    row.set('recoName', String(d.title).trim());
    row.set('education', edu);
    row.set('recoEducation', edu);
    row.set('recoContact', String(d.recoContact).trim());
    row.set('experience', String(d.experience || '').trim());
    row.set('jobIntent', String(d.jobDirection || '').trim());
    row.set('summary', summaryText);
    row.set('jobRequirements', jobDescriptionText);
    row.set('jobDescription', jobDescriptionText);
    row.set('recoJobIntent', String(d.jobDirection || d.recoJobIntent || '').trim());
    row.set('companyId', d.selectedCompanyId || '');
    row.set('companyName', d.selectedCompanyName || '');
    row.set('companyPeople', toNumberOrZero(d.selectedCompany && d.selectedCompany.companyPeople));
    row.set('financeStage', String((d.selectedCompany && d.selectedCompany.financeStage) || '').trim());
    row.set('companyLogo', (d.selectedCompany && d.selectedCompany.logo) || '');
    row.set('detPayMin', parsePositiveNumber(d.detPayMin));
    row.set('detPayMax', parsePositiveNumber(d.detPayMax));
    row.set('recoIntro', (d.recoIntro && String(d.recoIntro).trim()) || '');
    row.set('recoExtra', (d.recoExtra && String(d.recoExtra).trim()) || '');
    row.set('photoImgs', this.buildPhotoImgsField());
    row.set('active', this.resolvePublishActive());
    city.applyCityFields(row, d.selectedCompany || d.currentCity);
  },

  put_infor: function () {
    var that = this;
    if (that.data.formSubmitting) return;
    if (!that.data.userLoaded || !that.data.userName) {
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
    query.equalTo('commitUsername', '==', that.data.userName);
    query.equalTo('title', '==', String(that.data.title).trim());
    query.equalTo('active', '==', 1);

    query.find().then(function (results) {
      if (!results.length) {
        var created = Bmob.Query('JobInfo');
        that.applyJobSeekerFields(created);
        return created.save().then(function () {
          wx.switchTab({ url: '../index/index' });
          setTimeout(function () {
            wx.showToast({ title: '推荐成功', icon: 'success', duration: 2000 });
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
          that.applyJobSeekerFields(existing);
          return existing.save();
        });
      }).then(function () {
        wx.switchTab({ url: '../index/index' });
        setTimeout(function () {
          wx.showToast({ title: '档案已更新', icon: 'success', duration: 2000 });
        }, 320);
      });
    }).catch(function (e) {
      if (e && e.message === 'cancel_update') {
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
