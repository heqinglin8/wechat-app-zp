// pages/award/award.js
// MyRecommend（Bmob）：控制台 Class 须含 recoEducation recoContact recoJobIntent recoIntro recoExtra、
// photoImgs（多张图 URL 半角 | 拼接）、commitUsername（提交人姓名）、commitUid（提交人 objectId）。
// 配图：最多 6 张；单张 ≤3MB（≤3145728 字节）；扩展名 jpg/jpeg/png/gif/webp/bmp；支持替换与删除；即选即传。

var Bmob = wx.Bmob;

var MAX_RECOMMEND_PHOTOS = 6;
var MAX_PHOTO_BYTES = 3145728;
var WX_CHOOSE_IMAGE_MAX = 9;
var ALLOWED_IMAGE_EXT = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'];

function extFromPath(path) {
  var m = /\.([^.\\/]+)$/i.exec(path || '');
  return m ? m[1].toLowerCase() : '';
}

function extractRelativePathFromUrl(url) {
  if (!url) return '';
  var clean = String(url).split('?')[0].split('#')[0];
  var m = /^https?:\/\/[^/]+\/(.+)$/.exec(clean);
  return m ? m[1] : clean.replace(/^\/+/, '');
}

Page({
  data: {
    userName: '',
    recoName: '',
    recoContact: '',
    recoJobIntent: '',
    detPayMin: '',
    detPayMax: '',
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
  },

  onRecoNameInput: function (e) {
    this.setData({ recoName: (e.detail && e.detail.value) || '' });
  },
  onRecoContactInput: function (e) {
    this.setData({ recoContact: (e.detail && e.detail.value) || '' });
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
  onRecoExtraInput: function (e) {
    this.setData({ recoExtra: (e.detail && e.detail.value) || '' });
  },
  onEducationChange: function (e) {
    var idx = parseInt(e.detail.value, 10);
    if (isNaN(idx)) return;
    this.setData({ educationIndex: idx });
  },

  onLoad: function () {},

  onReady: function () {
    var that = this;
    var objectId = wx.getStorageSync('objectId');
    if (!objectId) {
      wx.showToast({ title: '请先登录后再推荐', icon: 'none', duration: 2000 });
      return;
    }
    var query = Bmob.Query('_User');
    query.equalTo('objectId', '==', objectId);
    query.find().then(function (results) {
      if (!results.length) {
        wx.showToast({ title: '未找到用户信息，请先登录', icon: 'none', duration: 2000 });
        return;
      }
      var u = results[0];
      var phone = u.userphone != null ? String(u.userphone).trim() : '';
      var uname = u.username || '';
      that.setData({
        userName: uname,
        recoName: uname,
        recoContact: phone,
        userLoaded: true,
      });
    }).catch(function () {
      wx.showToast({ title: '用户信息加载失败', icon: 'none', duration: 2000 });
    });
  },

  onShareAppMessage: function () {},

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
      var ext = extFromPath(filePath);
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
    var ext = extFromPath(filePath) || 'jpg';
    var fileName = 'rec-' + Date.now() + '-' + slotIndex + '-' + Math.floor(Math.random() * 10000) + '.' + ext;
    var file = new Bmob.File(fileName, filePath);
    console.log("uploadOnePhotoFile slotIndex:",slotIndex," filePath",filePath," file",file);
    return file.save().then(function (saved) {
      // var url = typeof saved.url === 'function' ? saved.url() : '';
      var url = saved[0].url;
      if (!url && saved._url) url = saved._url;
      if (!url) return Promise.reject(new Error('no url'));
      var replace_url = that.replaceDomain(url);
      var relativePath = extractRelativePathFromUrl(url);
      var type = ext || extFromPath(relativePath) || 'unknown';

      // 保存文件元信息到 file 表，不阻断主上传流程
      var fileQuery = Bmob.Query('file');
      fileQuery.set('name', fileName);
      fileQuery.set('path', relativePath);
      fileQuery.set('type', type);

      var list = that.data.recommendPhotos.slice();
      var cur = list[slotIndex];
      if (!cur) return Promise.reject(new Error('slot'));
      list[slotIndex] = { url: replace_url, tempPath: '', uploading: false };
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
    if (!(d.recoName && String(d.recoName).trim())) {
      wx.showToast({ title: '请填写求职者姓名', image: '../../images/warning.png', duration: 2000 });
      return false;
    }
    if (!(d.recoContact && String(d.recoContact).trim())) {
      wx.showToast({ title: '请填写联系方式', image: '../../images/warning.png', duration: 2000 });
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
      if (p.url) parts.push(p.url);
    });
    return parts.join('|');
  },

  photosReadyForSubmit: function () {
    var photos = this.data.recommendPhotos;
    for (var i = 0; i < photos.length; i++) {
      if (photos[i].uploading) return false;
      if (photos[i].tempPath && !photos[i].url) return false;
    }
    return true;
  },

  applyMyRecommendFields: function (row) {
    console.log("applyMyRecommendFields row:",row);
    var d = this.data;
    var edu = this.educationLabel();
    row.set('commitUsername', d.userName);
    row.set('commitUid', wx.getStorageSync('objectId') || '');
    row.set('recoName', String(d.recoName).trim());
    row.set('recoEducation', edu);
    row.set('recoContact', String(d.recoContact).trim());
    row.set('recoJobIntent', String(d.recoJobIntent).trim());
    row.set('detPayMin', String(d.detPayMin || '').trim());
    row.set('detPayMax', String(d.detPayMax || '').trim());
    row.set('recoIntro', (d.recoIntro && String(d.recoIntro).trim()) || '');
    row.set('recoExtra', (d.recoExtra && String(d.recoExtra).trim()) || '');
    row.set('photoImgs', this.buildPhotoImgsField());
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

    var query = Bmob.Query('MyRecommend');
    query.equalTo('commitUsername', '==', that.data.userName);
    query.equalTo('recoName', '==', String(that.data.recoName).trim());

    query.find().then(function (results) {
      if (!results.length) {
        var created = Bmob.Query('MyRecommend');
        that.applyMyRecommendFields(created);
        return created.save().then(function () {
          wx.switchTab({ url: '../index/index' });
          setTimeout(function () {
            wx.showToast({ title: '推荐成功', icon: 'success', duration: 2000 });
          }, 320);
        });
      }
      var row = results[0];
      var updated = Bmob.Query('MyRecommend');
      updated.id = row.objectId;
      that.applyMyRecommendFields(updated);
      return updated.save().then(function () {
        wx.switchTab({ url: '../index/index' });
        setTimeout(function () {
          wx.showToast({ title: '档案已更新', icon: 'success', duration: 2000 });
        }, 320);
      });
    }).catch(function (e) {
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
  /** 示例：
 * http://abc.com/2026/05/08/a.png
 * =>
 * http://files.yueqiu.me/2026/05/08/a.png
 */
 replaceDomain:function(url) {
  if (!url) return url;
  return url.replace(
    /^https?:\/\/[^/]+\//,
    'http://files.yueqiu.me/'
  );
}
  

});
