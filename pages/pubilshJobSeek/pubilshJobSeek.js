// pages/award/award.js
// JobSeeker（Bmob）：控制台 Class 须含 title recoEducation recoContact recoJobIntent recoIntro summary
// photoImgs（多张图 URL 半角 | 拼接）、commitUsername（提交人姓名）、commitUid（提交人 objectId）。
// 配图：最多 6 张；单张 ≤3MB（≤3145728 字节）；扩展名 jpg/jpeg/png/gif/webp/bmp；支持替换与删除；即选即传。

var Bmob = wx.Bmob;
var util = require('../../utils/util.js');
var city = require('../../utils/city.js');

var MAX_RECOMMEND_PHOTOS = 6;
var MAX_PHOTO_BYTES = 3145728;
var WX_CHOOSE_IMAGE_MAX = 9;
var ALLOWED_IMAGE_EXT = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'];

Page({
  data: {
    userName: '',
    title: '',
    recoName: '',
    recoContact: '',
    wxid: '',
    recoJobIntent: '',
    detPayMin: '',
    detPayMax: '',
    recoIntro: '',
    summary: '',
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
    this.setData({ recoName: (e.detail && e.detail.value) || '' });
  },
  onTitleInput: function (e) {
    this.setData({ title: (e.detail && e.detail.value) || '' });
  },
  onRecoContactInput: function (e) {
    this.setData({ recoContact: (e.detail && e.detail.value) || '' });
  },
  onWxidInput: function (e) {
    this.setData({ wxid: (e.detail && e.detail.value) || '' });
  },
  onRecoJobIntentInput: function (e) {
    this.setData({ recoJobIntent: (e.detail && e.detail.value) || '' });
  },

  onDetPayMinInput: function (e) {
    this.setData({ detPayMin: (e.detail && e.detail.value) || '' });
  },
  onDetPayMaxInput: function (e) {
    this.setData({ detPayMax: (e.detail && e.detail.value) || '' });
  },
  onRecoIntroInput: function (e) {
    this.setData({ recoIntro: (e.detail && e.detail.value) || '' });
  },
  onSummaryInput: function (e) {
    this.setData({ summary: (e.detail && e.detail.value) || '' });
  },
  onEducationChange: function (e) {
    var idx = parseInt(e.detail.value, 10);
    if (isNaN(idx)) return;
    this.setData({ educationIndex: idx });
  },

  onLoad: function () {
    this._objectId = '';
    this.refreshCurrentCity();
  },

  onShow: function () {
    var currentUser = Bmob.User.current();
    if (!currentUser) {
      this.handleUnloginRedirect();
      return;
    }
    this.refreshCurrentCity();
    this.loadCurrentUserProfile(currentUser.objectId);
  },

  refreshCurrentCity: function () {
    var currentCity = city.initCurrentCity();
    this.setData({
      currentCity: currentCity,
      currentCityText: city.fullDisplayText(currentCity),
    });
    return currentCity;
  },

  onReady: function () {
    
  },

  onShareAppMessage: function () {},

  isAllowedJobSeekerRole: function (role) {
    var roleText = role == null ? '' : String(role).trim();
    return roleText === '2' || roleText === '100' || roleText === '1000';
  },

  handleUnloginRedirect: function () {
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

  handleJobSeekerRoleDenied: function () {
    var that = this;
    if (that._isHandlingRoleDenied) {
      return;
    }
    that._isHandlingRoleDenied = true;
    wx.showToast({
      title: '求职者才能发布求职信息',
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

  loadCurrentUserProfile: function (objectId) {
    var that = this;
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
      if (!that.isAllowedJobSeekerRole(role)) {
        that.setData({
          userLoaded: false
        });
        that.handleJobSeekerRoleDenied();
        return;
      }
      var phone = u.userphone != null ? String(u.userphone).trim() : '';
      var uname = u.username || '';
      that.setData({
        userName: uname,
        recoName: uname,
        recoContact: phone,
        userLoaded: true,
        currentUserRole: role,
      });
      that._objectId = objectId;
    }).catch(function () {
      wx.showToast({ title: '用户信息加载失败', icon: 'none', duration: 2000 });
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
      var saveUrl = saved[0].url;
      if (!saveUrl && saved._url) saveUrl = saved._url;
      if (!saveUrl) return Promise.reject(new Error('no url'));
      
      var relativePath = util.extractRelativePathFromUrl(saveUrl);
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
      that.setData({ 
        recommendPhotos: list,
       });
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
      wx.showToast({ title: '最多 6 张图片', icon: 'none', duration: 2000 });
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
    if (!(d.title && String(d.title).trim())) {
      wx.showToast({ title: '请填写标题', image: '../../images/warning.png', duration: 2000 });
      return false;
    }
    if (!(d.recoName && String(d.recoName).trim())) {
      wx.showToast({ title: '请填写称呼', image: '../../images/warning.png', duration: 2000 });
      return false;
    }
    if (!(d.recoContact && String(d.recoContact).trim())) {
      wx.showToast({ title: '请填写电话', image: '../../images/warning.png', duration: 2000 });
      return false;
    }
    var phone = String(d.recoContact || '').trim();
    var mobileReg = /^1[3-9]\d{9}$/;
    var landlineReg = /^0\d{2,3}-?\d{7,8}(?:-\d{1,6})?$/;
    if (!mobileReg.test(phone) && !landlineReg.test(phone)) {
      wx.showToast({ title: '请填写正确的手机号或固话', image: '../../images/warning.png', duration: 2000 });
      return false;
    }
    if (!(d.wxid && String(d.wxid).trim())) {
      wx.showToast({ title: '请填写微信号', image: '../../images/warning.png', duration: 2000 });
      return false;
    }
    if (!(d.recoJobIntent && String(d.recoJobIntent).trim())) {
      wx.showToast({ title: '请填写求职意向', image: '../../images/warning.png', duration: 2000 });
      return false;
    }
    
    var payMin = String(d.detPayMin || '').trim();
    var payMax = String(d.detPayMax || '').trim();
    if (!payMin || !payMax) {
      wx.showToast({ title: '请填写薪资范围', icon:  'none', duration: 2000 });
      return false;
    }
    if (Number(payMin) >= Number(payMax)) {
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
  resolvePublishActive: function () {
    var roleText = String(this.data.currentUserRole || '').trim();
    return (roleText === '100' || roleText === '1000') ? 1 : 0;
  },

  applyJobSeekerFields: function (row) {
    console.log("applyJobSeekerFields row:",row);
    var d = this.data;
    var edu = this.educationLabel();
    row.set('commitUsername', d.userName);
    row.set('commitUid', this._objectId || '');
    row.set('title', String(d.title).trim());
    row.set('recoName', String(d.recoName).trim());
    row.set('recoEducation', edu);
    row.set('recoContact', String(d.recoContact).trim());
    row.set('wxid', String(d.wxid).trim());
    row.set('recoJobIntent', String(d.recoJobIntent).trim());
    row.set('detPayMin', Number(d.detPayMin || ''));
    row.set('detPayMax', Number(d.detPayMax || ''));
    row.set('recoIntro', (d.recoIntro && String(d.recoIntro).trim()) || '');
    row.set('summary', (d.summary && String(d.summary).trim()) || '');
    row.set('photoImgs', this.buildPhotoImgsField());
    row.set('active', this.resolvePublishActive());
    city.applyCityFields(row, this.refreshCurrentCity());
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

    var query = Bmob.Query('JobSeeker');
    query.equalTo('commitUsername', '==', that.data.userName);
    query.equalTo('recoName', '==', String(that.data.recoName).trim());
    query.equalTo('active', '==', 1);

    query.find().then(function (results) {
      console.log("查询 JobSeeker results:",results,!results.length);
      if (!results.length) {
        console.log("查询 JobSeeker 无记录，创建新推荐");
        var created = Bmob.Query('JobSeeker');
        that.applyJobSeekerFields(created);
        return created.save().then(function () {
          var isPendingReview = that.resolvePublishActive() === 0;
          wx.switchTab({ url: '../index/index' });
          setTimeout(function () {
            wx.showToast({
              title: isPendingReview ? '发布成功，将在审核后展示' : '推荐成功',
              icon: 'success',
              duration: 2000
            });
          }, 320);
        });
      }
      console.log("查询 JobSeeker 有记录，更新档案");
      var row = results[0];
      return new Promise(function (resolve, reject) {
        wx.showModal({
          title: '提示',
          content: '已经有该条记录，你确认要更新？',
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
        var updatedQuery = Bmob.Query('JobSeeker');
        return updatedQuery.get(row.objectId).then(function (existing) {
          that.applyJobSeekerFields(existing);
          return existing.save();
        });
      }).then(function () {
        var isPendingReview = that.resolvePublishActive() === 0;
        wx.switchTab({ url: '../index/index' });
        setTimeout(function () {
          wx.showToast({
            title: isPendingReview ? '发布成功，将在审核后展示' : '档案已更新',
            icon: 'success',
            duration: 2000
          });
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
