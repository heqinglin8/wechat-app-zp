var util = require('./util.js');
var city = require('./city.js');

var Bmob = wx.Bmob;

var MESSAGE_CLASS = 'MessageBoardMessage';
var CONFIG_CLASS = 'MessageBoardConfig';
var SENSITIVE_WORD_CLASS = 'MessageBoardSensitiveWord';
var MUTED_USER_CLASS = 'MessageBoardMutedUser';

var PAGE_SIZE = 10;
var MAX_IMAGE_WIDTH = 1080;
var MAX_IMAGE_HEIGHT = 960;
var MAX_IMAGE_BYTES = 1048576;

var FIELD_SCHEMA = {
  message: {
    targetType: 'job | job_seek | future detail module key',
    targetId: 'bound business record objectId',
    parentId: 'empty for main messages; main message objectId for first-level replies',
    authorId: '_User objectId',
    authorName: 'display name from _User.nickname',
    authorAvatarPath: 'relative Bmob avatar path',
    authorCity: 'city/province/location text shown beside time',
    displayCityName: 'city name displayed in message list',
    content: 'text with emoji characters',
    imagePath: 'relative Bmob file path',
    imageUrl: 'display URL for the selected single image',
    isHidden: 'true excludes the message from all mini-program users',
    isFeatured: 'visual featured badge',
    isPinned: 'main-message sorting flag; replies always false',
    hiddenReason: 'sensitive_word or database governance reason',
    clientCreatedAt: 'legacy optional timestamp; new writes rely on Bmob createdAt',
  },
  config: {
    key: 'globalMessageBoardEnabled or detailMessageEnabled',
    targetType: 'optional detail target type',
    targetId: 'optional detail objectId',
    enabled: 'boolean switch value',
  },
  sensitiveWord: {
    word: 'single sensitive word',
    words: 'optional array or newline/comma separated batch import field',
    enabled: 'only enabled=true records are used',
  },
  mutedUser: {
    userId: '_User objectId',
    enabled: 'enabled=true means muted unless muted=false is explicitly set',
    muted: 'optional explicit mute flag',
  },
};

function toBool(value, fallback) {
  if (value === true || value === 'true' || value === 1 || value === '1') return true;
  if (value === false || value === 'false' || value === 0 || value === '0') return false;
  return fallback;
}

function configValue(row, fallback) {
  if (!row) return fallback;
  if (row.enabled !== undefined) return toBool(row.enabled, fallback);
  if (row.value !== undefined) return toBool(row.value, fallback);
  if (row.globalMessageBoardEnabled !== undefined) {
    return toBool(row.globalMessageBoardEnabled, fallback);
  }
  if (row.detailMessageEnabled !== undefined) return toBool(row.detailMessageEnabled, fallback);
  return fallback;
}

function readGlobalEnabled() {
  var query = Bmob.Query(CONFIG_CLASS);
  query.equalTo('key', '==', 'globalMessageBoardEnabled');
  query.limit(1);
  return query.find().then(function (rows) {
    return rows && rows.length ? configValue(rows[0], true) : true;
  }).catch(function () {
    return true;
  });
}

function readDetailEnabled(targetType, targetId, fallback) {
  var fallbackEnabled = toBool(fallback, true);
  if (!targetType || !targetId) return Promise.resolve(fallbackEnabled);

  var query = Bmob.Query(CONFIG_CLASS);
  query.equalTo('targetType', '==', targetType);
  query.equalTo('targetId', '==', targetId);
  query.limit(1);
  return query.find().then(function (rows) {
    return rows && rows.length ? configValue(rows[0], fallbackEnabled) : fallbackEnabled;
  }).catch(function () {
    return fallbackEnabled;
  });
}

function readSwitches(targetType, targetId, detailFallback) {
  return Promise.all([
    readGlobalEnabled(),
    readDetailEnabled(targetType, targetId, detailFallback),
  ]).then(function (values) {
    return {
      globalMessageBoardEnabled: values[0],
      detailMessageEnabled: values[1],
      finalEnabled: values[0] && values[1],
    };
  });
}

function splitWords(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return String(value).split(/[\n,，;；|]/);
}

function readEnabledSensitiveWords() {
  var query = Bmob.Query(SENSITIVE_WORD_CLASS);
  query.equalTo('enabled', '==', true);
  query.limit(500);
  return query.find().then(function (rows) {
    var words = [];
    (rows || []).forEach(function (row) {
      if (row.word) words.push(row.word);
      splitWords(row.words).forEach(function (word) {
        words.push(word);
      });
    });
    return words.map(function (word) {
      return String(word || '').trim().toLowerCase();
    }).filter(function (word, index, arr) {
      return word && arr.indexOf(word) === index;
    });
  }).catch(function () {
    return [];
  });
}

function hitSensitiveWord(content, words) {
  var text = String(content || '').toLowerCase();
  for (var i = 0; i < words.length; i++) {
    if (words[i] && text.indexOf(words[i]) !== -1) return words[i];
  }
  return '';
}

function isMutedUser(userId) {
  if (!userId) return Promise.resolve(false);
  var query = Bmob.Query(MUTED_USER_CLASS);
  query.equalTo('userId', '==', userId);
  query.limit(10);
  return query.find().then(function (rows) {
    return (rows || []).some(function (row) {
      return row.enabled !== false && row.muted !== false;
    });
  }).catch(function () {
    return false;
  });
}

function getCurrentUserProfile() {
  var currentUser = Bmob.User.current();
  if (!currentUser || !currentUser.objectId) return Promise.resolve(null);

  var query = Bmob.Query('_User');
  query.equalTo('objectId', '==', currentUser.objectId);
  query.limit(1);
  return query.find().then(function (rows) {
    return rows && rows.length ? rows[0] : currentUser;
  }).catch(function () {
    return currentUser;
  });
}

function isAdminUser(user) {
  if (!user) return false;
  if (user.isAdmin === true || user.admin === true) return true;
  if (String(user.role || '').toLowerCase() === 'admin') return true;
  if (Array.isArray(user.roles) && user.roles.indexOf('admin') !== -1) return true;
  return false;
}

function displayImageUrl(value) {
  if (!value) return '';
  if (/^https?:\/\//i.test(value) || String(value).charAt(0) === '/') return value;
  return util.toDisplayUrl(value);
}

function displayAvatar(userOrMessage) {
  var value = userOrMessage && userOrMessage.authorAvatarPath;
  return displayImageUrl(value);
}

function displayName(user) {
  if (!user) return '';
  return user.nickname || '';
}

function displayLocation(user) {
  if (!user) return '';
  return user.authorCity || user.city || user.province || user.location || user.address || '';
}

function formatTimeText(value) {
  if (!value) return '';
  var date = value instanceof Date ? value : new Date(String(value).replace(/-/g, '/'));
  if (!date || isNaN(date.getTime())) return String(value).slice(0, 16);
  var now = new Date();
  var diff = now.getTime() - date.getTime();
  if (diff >= 0 && diff < 60000) return '刚刚';
  if (diff >= 0 && diff < 3600000) return Math.floor(diff / 60000) + '分钟前';
  if (diff >= 0 && diff < 86400000) return Math.floor(diff / 3600000) + '小时前';
  return util.formatTime(date).slice(0, 16);
}

function normalizeMessage(row, currentUserId, admin) {
  var parentId = row.parentId || row.parentMessageId || '';
  var imageUrl = row.imageUrl || displayImageUrl(row.imagePath);
  return {
    objectId: row.objectId,
    targetType: row.targetType || '',
    targetId: row.targetId || '',
    parentId: parentId,
    authorId: row.authorId || '',
    authorName: row.authorName || '',
    authorAvatar: displayAvatar(row),
    authorCity: row.authorCity || row.location || row.ipCity || '',
    displayCityName: row.displayCityName || row.authorCity || row.location || row.ipCity || '',
    content: row.content || '',
    imageUrl: imageUrl,
    imagePath: row.imagePath || '',
    imageWidth: row.imageWidth || 0,
    imageHeight: row.imageHeight || 0,
    isHidden: row.isHidden === true,
    isFeatured: row.isFeatured === true,
    isPinned: parentId ? false : row.isPinned === true,
    createdAt: row.createdAt || '',
    timeText: formatTimeText(row.createdAt),
    canDelete: !!(admin || (currentUserId && row.authorId === currentUserId)),
    replies: [],
    repliesExpanded: false,
  };
}

function queryMainMessages(targetType, targetId, pageIndex, pageSize, currentUserId, admin) {
  var query = Bmob.Query(MESSAGE_CLASS);
  query.equalTo('targetType', '==', targetType);
  query.equalTo('targetId', '==', targetId);
  query.equalTo('parentId', '==', '');
  query.equalTo('isHidden', '==', false);
  query.order('-isPinned,-createdAt');
  query.limit(pageSize || PAGE_SIZE);
  query.skip((pageIndex || 0) * (pageSize || PAGE_SIZE));
  return query.find().then(function (rows) {
    return (rows || []).map(function (row) {
      return normalizeMessage(row, currentUserId, admin);
    }).sort(function (a, b) {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      return new Date(String(b.createdAt).replace(/-/g, '/')).getTime() -
        new Date(String(a.createdAt).replace(/-/g, '/')).getTime();
    });
  });
}

function queryReplies(parentId, currentUserId, admin) {
  if (!parentId) return Promise.resolve([]);
  var query = Bmob.Query(MESSAGE_CLASS);
  query.equalTo('parentId', '==', parentId);
  query.equalTo('isHidden', '==', false);
  query.order('-createdAt');
  query.limit(100);
  return query.find().then(function (rows) {
    return (rows || []).map(function (row) {
      return normalizeMessage(row, currentUserId, admin);
    }).sort(function (a, b) {
      return new Date(String(b.createdAt).replace(/-/g, '/')).getTime() -
        new Date(String(a.createdAt).replace(/-/g, '/')).getTime();
    });
  });
}

function attachReplies(messages, currentUserId, admin) {
  var tasks = (messages || []).map(function (message) {
    return queryReplies(message.objectId, currentUserId, admin).then(function (replies) {
      message.replies = replies;
      message.repliesExpanded = message.authorId === currentUserId || replies.some(function (reply) {
        return reply.authorId === currentUserId;
      });
      return message;
    });
  });
  return Promise.all(tasks);
}

function createMessage(params) {
  var query = Bmob.Query(MESSAGE_CLASS);
  var content = String(params.content || '').trim();
  var user = params.user || {};
  var parentId = params.parentId || '';
  var image = params.image || {};
  var currentCity = city.getCurrentCity();

  query.set('targetType', params.targetType);
  query.set('targetId', params.targetId);
  query.set('parentId', parentId);
  query.set('parentMessageId', parentId);
  query.set('authorId', user.objectId || '');
  query.set('authorName', displayName(user));
  query.set('authorAvatarPath', user.avatarPath || '');
  query.set('authorCity', currentCity.cityDisplayName);
  query.set('content', content);
  query.set('imagePath', image.path || '');
  query.set('imageUrl', image.url || '');
  query.set('imageWidth', image.width || 0);
  query.set('imageHeight', image.height || 0);
  query.set('isHidden', params.isHidden === true);
  query.set('hiddenReason', params.hiddenReason || '');
  query.set('isFeatured', false);
  query.set('isPinned', parentId ? false : params.isPinned === true);
  city.applyCityFields(query, currentCity, { displayField: 'displayCityName' });
  return query.save();
}

function imageError(code, detail) {
  var err = new Error(code);
  err.code = code;
  err.detail = detail || null;
  return err;
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

function compressImage(filePath) {
  if (!wx.compressImage) return Promise.reject(imageError('compress_unavailable'));
  return new Promise(function (resolve, reject) {
    wx.compressImage({
      src: filePath,
      quality: 70,
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
    return {
      path: filePath,
      size: values[0],
      width: values[1].width || 0,
      height: values[1].height || 0,
    };
  });
}

function imageFits(info) {
  return info.width <= MAX_IMAGE_WIDTH &&
    info.height <= MAX_IMAGE_HEIGHT &&
    info.size <= MAX_IMAGE_BYTES;
}

function prepareImage(filePath, fallbackSize) {
  return inspectImage(filePath, fallbackSize).then(function (info) {
    if (imageFits(info)) {
      info.wasCompressed = false;
      return info;
    }
    if (info.width > MAX_IMAGE_WIDTH || info.height > MAX_IMAGE_HEIGHT) {
      return Promise.reject(imageError('image_limit', info));
    }
    return compressImage(filePath).then(function (compressedPath) {
      return inspectImage(compressedPath).then(function (nextInfo) {
        if (!imageFits(nextInfo)) return Promise.reject(imageError('image_limit', nextInfo));
        nextInfo.wasCompressed = compressedPath !== filePath;
        return nextInfo;
      });
    });
  });
}

function uploadImage(imageInfo) {
  var ext = util.extFromPath(imageInfo.path) || 'jpg';
  var fileName = 'msg-' + Date.now() + '-' + Math.floor(Math.random() * 10000) + '.' + ext;
  var file = new Bmob.File(fileName, imageInfo.path);
  return file.save().then(function (saved) {
    var url = saved && saved[0] && saved[0].url ? saved[0].url : '';
    if (!url && saved && saved._url) url = saved._url;
    if (!url) return Promise.reject(imageError('upload_failed', saved));
    var path = util.extractRelativePathFromUrl(url);
    return {
      path: path,
      url: util.toDisplayUrl(path),
      width: imageInfo.width,
      height: imageInfo.height,
      size: imageInfo.size,
    };
  });
}

function destroyRows(rows) {
  var query = Bmob.Query(MESSAGE_CLASS);
  var tasks = (rows || []).map(function (row) {
    return row && row.objectId ? query.destroy(row.objectId) : Promise.resolve();
  });
  return Promise.all(tasks);
}

function deleteMessage(messageId, user) {
  var query = Bmob.Query(MESSAGE_CLASS);
  return query.get(messageId).then(function (row) {
    if (!isAdminUser(user) && row.authorId !== (user && user.objectId)) {
      return Promise.reject(new Error('forbidden'));
    }
    if (row.parentId) return query.destroy(messageId);

    var replyQuery = Bmob.Query(MESSAGE_CLASS);
    replyQuery.equalTo('parentId', '==', messageId);
    replyQuery.limit(100);
    return replyQuery.find().then(function (replies) {
      return destroyRows(replies).then(function () {
        return query.destroy(messageId);
      });
    });
  });
}

function loadAllTargetMessages(targetType, targetId, pageIndex, acc) {
  var query = Bmob.Query(MESSAGE_CLASS);
  query.equalTo('targetType', '==', targetType);
  query.equalTo('targetId', '==', targetId);
  query.limit(100);
  query.skip((pageIndex || 0) * 100);
  return query.find().then(function (rows) {
    var list = (acc || []).concat(rows || []);
    if (rows && rows.length === 100) {
      return loadAllTargetMessages(targetType, targetId, (pageIndex || 0) + 1, list);
    }
    return list;
  });
}

function deleteTargetMessages(targetType, targetId) {
  if (!targetType || !targetId) return Promise.resolve();
  return loadAllTargetMessages(targetType, targetId, 0, []).then(function (rows) {
    return destroyRows(rows);
  });
}

function confirmDeleteTargetWithMessages(targetType, targetId, deleteTargetRecord) {
  return new Promise(function (resolve, reject) {
    wx.showModal({
      title: '确认删除',
      content: '删除该记录会同时删除他的留言信息，确认删除？',
      confirmText: '确认删除',
      cancelText: '取消',
      success: function (res) {
        if (!res.confirm) {
          resolve({ cancelled: true });
          return;
        }
        Promise.resolve()
          .then(deleteTargetRecord)
          .then(function () {
            return deleteTargetMessages(targetType, targetId);
          })
          .then(function () {
            resolve({ cancelled: false });
          })
          .catch(reject);
      },
      fail: reject,
    });
  });
}

module.exports = {
  MESSAGE_CLASS: MESSAGE_CLASS,
  CONFIG_CLASS: CONFIG_CLASS,
  SENSITIVE_WORD_CLASS: SENSITIVE_WORD_CLASS,
  MUTED_USER_CLASS: MUTED_USER_CLASS,
  FIELD_SCHEMA: FIELD_SCHEMA,
  PAGE_SIZE: PAGE_SIZE,
  MAX_IMAGE_WIDTH: MAX_IMAGE_WIDTH,
  MAX_IMAGE_HEIGHT: MAX_IMAGE_HEIGHT,
  MAX_IMAGE_BYTES: MAX_IMAGE_BYTES,
  readSwitches: readSwitches,
  readEnabledSensitiveWords: readEnabledSensitiveWords,
  hitSensitiveWord: hitSensitiveWord,
  isMutedUser: isMutedUser,
  getCurrentUserProfile: getCurrentUserProfile,
  isAdminUser: isAdminUser,
  queryMainMessages: queryMainMessages,
  attachReplies: attachReplies,
  createMessage: createMessage,
  prepareImage: prepareImage,
  uploadImage: uploadImage,
  deleteMessage: deleteMessage,
  deleteTargetMessages: deleteTargetMessages,
  confirmDeleteTargetWithMessages: confirmDeleteTargetWithMessages,
};
