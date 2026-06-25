var util = require('./util');

var DEFAULT_MAX_BYTES = 3145728;
var DEFAULT_ALLOWED_EXT = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'];

function imageError(code, detail) {
  var err = new Error(code);
  err.code = code;
  err.detail = detail || null;
  return err;
}

function normalizeExt(value) {
  var text = String(value || '').toLowerCase();
  if (text === 'jpeg') return 'jpg';
  return text;
}

function getFileSize(filePath, fallbackSize) {
  return new Promise(function (resolve, reject) {
    wx.getFileSystemManager().getFileInfo({
      filePath: filePath,
      success: function (res) {
        resolve(res.size || 0);
      },
      fail: function (err) {
        if (typeof fallbackSize === 'number') {
          resolve(fallbackSize);
          return;
        }
        reject(imageError('image_read_failed', err));
      },
    });
  });
}

function getImageInfo(filePath) {
  return new Promise(function (resolve, reject) {
    wx.getImageInfo({
      src: filePath,
      success: resolve,
      fail: function (err) {
        reject(imageError('image_read_failed', err));
      },
    });
  });
}

function compressImage(filePath, quality) {
  if (!wx.compressImage) return Promise.reject(imageError('compress_unavailable'));
  return new Promise(function (resolve, reject) {
    wx.compressImage({
      src: filePath,
      quality: quality || 72,
      success: function (res) {
        resolve(res.tempFilePath || filePath);
      },
      fail: function (err) {
        reject(imageError('compress_failed', err));
      },
    });
  });
}

function inspectImage(filePath, fallbackSize) {
  return Promise.all([getFileSize(filePath, fallbackSize), getImageInfo(filePath)]).then(function (values) {
    var info = values[1] || {};
    var type = normalizeExt(info.type || util.extFromPath(filePath));
    return {
      path: filePath,
      size: values[0] || 0,
      width: info.width || 0,
      height: info.height || 0,
      type: type,
      ext: type || normalizeExt(util.extFromPath(filePath)),
    };
  });
}

function assertAllowedImage(info, options) {
  var opts = options || {};
  var allowed = (opts.allowedExt || DEFAULT_ALLOWED_EXT).map(normalizeExt);
  var ext = normalizeExt(info.type || info.ext || util.extFromPath(info.path));
  if (!ext || allowed.indexOf(ext) === -1) {
    return Promise.reject(imageError('type', info));
  }
  if (info.size > (opts.maxBytes || DEFAULT_MAX_BYTES)) {
    return Promise.reject(imageError('size', info));
  }
  return Promise.resolve(info);
}

function prepareImage(filePath, options) {
  var opts = options || {};
  return inspectImage(filePath, opts.fallbackSize).then(function (info) {
    return assertAllowedImage(info, opts).catch(function (err) {
      if (err.code !== 'size') return Promise.reject(err);
      return compressImage(filePath, opts.quality).then(function (compressedPath) {
        return inspectImage(compressedPath).then(function (nextInfo) {
          nextInfo.originalPath = filePath;
          nextInfo.wasCompressed = compressedPath !== filePath;
          return assertAllowedImage(nextInfo, opts);
        });
      });
    });
  });
}

function extractSavedUrl(saved) {
  var url = saved && saved[0] && saved[0].url ? saved[0].url : '';
  if (!url && saved && saved._url) url = saved._url;
  return url;
}

function uploadPreparedImage(options) {
  var opts = options || {};
  if (!opts.Bmob) return Promise.reject(imageError('no_bmob'));
  if (!opts.imageInfo || !opts.imageInfo.path) return Promise.reject(imageError('image_read_failed'));
  var ext = normalizeExt(opts.imageInfo.ext || opts.imageInfo.type || util.extFromPath(opts.imageInfo.path)) || 'jpg';
  var prefix = opts.prefix || 'img';
  var slot = opts.slotIndex === undefined ? 0 : opts.slotIndex;
  var fileName = prefix + '-' + Date.now() + '-' + slot + '-' + Math.floor(Math.random() * 10000) + '.' + ext;
  var file = new opts.Bmob.File(fileName, opts.imageInfo.path);
  return file.save().then(function (saved) {
    var url = extractSavedUrl(saved);
    if (!url) return Promise.reject(imageError('upload_failed', saved));
    var relativePath = util.extractRelativePathFromUrl(url);
    var displayUrl = util.toDisplayUrl(relativePath);
    var fileQuery = opts.Bmob.Query(opts.metaClass || 'file');
    fileQuery.set('name', fileName);
    fileQuery.set('path', relativePath);
    fileQuery.set('type', ext);
    fileQuery.set('size', opts.imageInfo.size || 0);
    fileQuery.set('width', opts.imageInfo.width || 0);
    fileQuery.set('height', opts.imageInfo.height || 0);
    return fileQuery.save().then(function () {
      return {
        url: displayUrl,
        path: relativePath,
        fileName: fileName,
        type: ext,
        size: opts.imageInfo.size || 0,
        width: opts.imageInfo.width || 0,
        height: opts.imageInfo.height || 0,
      };
    }).catch(function () {
      return {
        url: displayUrl,
        path: relativePath,
        fileName: fileName,
        type: ext,
        size: opts.imageInfo.size || 0,
        width: opts.imageInfo.width || 0,
        height: opts.imageInfo.height || 0,
      };
    });
  });
}

function showImageError(error) {
  var code = error && error.code;
  var title = '图片处理失败';
  if (code === 'size') title = '单张图片不能超过 3MB';
  if (code === 'type') title = '仅支持常见图片格式';
  if (code === 'upload_failed') title = '图片上传失败';
  wx.showToast({
    title: title,
    icon: 'none',
    duration: 2000,
  });
}

module.exports = {
  DEFAULT_MAX_BYTES: DEFAULT_MAX_BYTES,
  DEFAULT_ALLOWED_EXT: DEFAULT_ALLOWED_EXT.slice(),
  getFileSize: getFileSize,
  getImageInfo: getImageInfo,
  compressImage: compressImage,
  inspectImage: inspectImage,
  prepareImage: prepareImage,
  uploadPreparedImage: uploadPreparedImage,
  showImageError: showImageError,
};
