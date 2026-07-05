var util = require('../utils/util');

var POST_CLASS = 'Post';
var POST_LIKE_CLASS = 'PostLike';
var MESSAGE_CLASS = 'MessageBoardMessage';
var DEFAULT_AVATAR = '/images/default_user_avatar.jpeg';

// Bmob schema used by 职言:
// Post: title, content, commitUid, photoImgs, optional active.
// PostLike: postId, userId.

function getBmob(options) {
  return (options && options.Bmob) || (typeof wx !== 'undefined' && wx.Bmob);
}

function firstText() {
  for (var i = 0; i < arguments.length; i++) {
    var value = arguments[i];
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return String(value).trim();
    }
  }
  return '';
}

function withFallback(value, label) {
  return firstText(value) || (label + '未填写');
}

function toDisplayUrl(value) {
  var text = firstText(value);
  if (!text) return '';
  return util.toDisplayUrl(text);
}

function splitImages(value) {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map(toDisplayUrl).filter(function (url) { return !!url; });
  }
  return String(value)
    .split('|')
    .map(function (path) { return toDisplayUrl(path); })
    .filter(function (url) { return !!url; });
}

function resolvePhotoList(row) {
  if (!row) return [];
  if (row.photoImgs) return splitImages(row.photoImgs);
  if (row.images) return splitImages(row.images);
  if (row.imageUrls) return splitImages(row.imageUrls);
  if (row.photos) return splitImages(row.photos);
  return [];
}

function displayAvatar(user) {
  if (!user) return DEFAULT_AVATAR;
  return toDisplayUrl(firstText(
    user.avatarPath,
    user.imgSrc,
    user.avatarUrl,
    user.userPic,
    user.authorAvatarPath
  )) || DEFAULT_AVATAR;
}

function normalizeAuthor(user, uid) {
  var profile = user || {};
  var name = withFallback(firstText(profile.nickname, profile.username, profile.nickName), '昵称');
  var role = withFallback(firstText(profile.jobRole, profile.commitJobRole, profile.position, profile.roleName), '职位');
  var years = withFallback(firstText(profile.workYears, profile.experience, profile.years), '年限');
  var company = firstText(profile.companyName, profile.company);
  var metaParts = [];
  if (role) metaParts.push(role);
  if (years) metaParts.push(years);
  return {
    objectId: firstText(profile.objectId, uid),
    name: name,
    avatar: displayAvatar(profile),
    role: role,
    years: years,
    company: company,
    metaText: metaParts.join(' · ') || '职业信息未填写',
  };
}

function formatTimeText(value) {
  if (!value) return '';
  var date = value instanceof Date ? value : new Date(String(value).replace(/-/g, '/'));
  if (!date || isNaN(date.getTime())) return String(value).slice(0, 10);
  var now = new Date();
  var diff = now.getTime() - date.getTime();
  if (diff >= 0 && diff < 60000) return '刚刚';
  if (diff >= 0 && diff < 3600000) return Math.floor(diff / 60000) + '分钟前';
  if (diff >= 0 && diff < 86400000) return Math.floor(diff / 3600000) + '小时前';
  if (diff >= 0 && diff < 2592000000) return Math.floor(diff / 86400000) + '天前';
  var month = date.getMonth() + 1;
  var day = date.getDate();
  return (month < 10 ? '0' + month : month) + '-' + (day < 10 ? '0' + day : day);
}

function isActivePost(row) {
  if (!row) return false;
  if (row.active === undefined && row.isActive === undefined) return true;
  return row.active !== false && row.active !== 0 && row.active !== '0' &&
    row.isActive !== false && row.isActive !== 0 && row.isActive !== '0';
}

function getCurrentUserId(Bmob) {
  var currentUser = Bmob && Bmob.User && Bmob.User.current ? Bmob.User.current() : null;
  var currentId = currentUser && currentUser.objectId;
  if (currentId) return currentId;
  if (typeof wx !== 'undefined' && wx.getStorageSync) {
    return firstText(wx.getStorageSync('objectId'));
  }
  return '';
}

function fetchAuthor(Bmob, uid) {
  if (!uid) return Promise.resolve(null);
  var query = Bmob.Query('_User');
  query.equalTo('objectId', '==', uid);
  query.limit(1);
  return query.find().then(function (rows) {
    return rows && rows.length ? rows[0] : null;
  }).catch(function () {
    return null;
  });
}

function fetchAuthors(Bmob, posts) {
  var ids = [];
  (posts || []).forEach(function (row) {
    var uid = firstText(row && row.commitUid);
    if (uid && ids.indexOf(uid) === -1) ids.push(uid);
  });
  var map = {};
  var tasks = ids.map(function (uid) {
    return fetchAuthor(Bmob, uid).then(function (user) {
      map[uid] = user;
    });
  });
  return Promise.all(tasks).then(function () {
    return map;
  });
}

function countLikes(Bmob, postId) {
  if (!postId) return Promise.resolve(0);
  var query = Bmob.Query(POST_LIKE_CLASS);
  query.equalTo('postId', '==', postId);
  return query.count().then(function (count) {
    var total = Number(count);
    return isNaN(total) ? 0 : total;
  }).catch(function () {
    return 0;
  });
}

function findLike(Bmob, postId, userId) {
  if (!postId || !userId) return Promise.resolve([]);
  var query = Bmob.Query(POST_LIKE_CLASS);
  query.equalTo('postId', '==', postId);
  query.equalTo('userId', '==', userId);
  query.limit(10);
  return query.find().catch(function () {
    return [];
  });
}

function hasLiked(Bmob, postId, userId) {
  // 点赞亮色只以当前登录用户在 PostLike 中是否存在记录为准。
  if (!userId) return Promise.resolve(false);
  return findLike(Bmob, postId, userId).then(function (rows) {
    return !!(rows && rows.length);
  });
}

function countComments(Bmob, postId) {
  if (!postId) return Promise.resolve(0);
  var query = Bmob.Query(MESSAGE_CLASS);
  query.equalTo('targetType', '==', 'post');
  query.equalTo('targetId', '==', postId);
  query.equalTo('parentId', '==', '');
  query.equalTo('isHidden', '==', false);
  return query.count().then(function (count) {
    var total = Number(count);
    return isNaN(total) ? 0 : total;
  }).catch(function () {
    return 0;
  });
}

function normalizePost(row, authorMap, options) {
  var opts = options || {};
  var userId = opts.currentUserId || '';
  var uid = firstText(row && row.commitUid);
  var photos = resolvePhotoList(row);
  var title = withFallback(row && row.title, '标题');
  var content = withFallback(row && row.content, '内容');
  var postId = firstText(row && row.objectId);
  var fallbackOverflow = title.length > 48;
  return {
    objectId: postId,
    titleText: title,
    contentText: content,
    commitUid: uid,
    author: normalizeAuthor(authorMap && authorMap[uid], uid),
    allPhotos: photos,
    listPhotos: photos.slice(0, 3),
    detailPhotos: photos.slice(0, 6),
    createdAt: row && row.createdAt,
    updatedAt: row && row.updatedAt,
    timeText: formatTimeText(firstText(row && row.updatedAt, row && row.createdAt)),
    likeCount: Number(opts.likeCount) || 0,
    commentCount: Number(opts.commentCount) || 0,
    liked: !!opts.liked,
    currentUserId: userId,
    showTitleFullAction: fallbackOverflow,
  };
}

function enrichPosts(Bmob, rows, options) {
  var opts = options || {};
  var filteredRows = (rows || []).filter(isActivePost);
  return fetchAuthors(Bmob, filteredRows).then(function (authorMap) {
    var tasks = filteredRows.map(function (row) {
      var postId = firstText(row && row.objectId);
      return Promise.all([
        countLikes(Bmob, postId),
        hasLiked(Bmob, postId, opts.currentUserId),
        countComments(Bmob, postId),
      ]).then(function (values) {
        return normalizePost(row, authorMap, {
          currentUserId: opts.currentUserId,
          likeCount: values[0],
          liked: values[1],
          commentCount: values[2],
        });
      });
    });
    return Promise.all(tasks);
  });
}

function loadPosts(options) {
  var opts = options || {};
  var Bmob = getBmob(opts);
  var pageSize = opts.pageSize || 10;
  var pageIndex = opts.pageIndex || 0;
  var query = Bmob.Query(POST_CLASS);
  query.order('-updatedAt,-createdAt');
  query.limit(pageSize);
  query.skip(pageIndex * pageSize);
  return query.find().then(function (rows) {
    return enrichPosts(Bmob, rows || [], {
      currentUserId: getCurrentUserId(Bmob),
    }).then(function (list) {
      return {
        rows: rows || [],
        list: list,
        hasMore: (rows || []).length >= pageSize,
      };
    });
  });
}

function loadAllPostsForSearch(Bmob, pageIndex, acc) {
  var query = Bmob.Query(POST_CLASS);
  query.order('-updatedAt,-createdAt');
  query.limit(100);
  query.skip((pageIndex || 0) * 100);
  return query.find().then(function (rows) {
    var list = (acc || []).concat(rows || []);
    if (rows && rows.length === 100) {
      return loadAllPostsForSearch(Bmob, (pageIndex || 0) + 1, list);
    }
    return list;
  });
}

function searchPosts(options) {
  var opts = options || {};
  var Bmob = getBmob(opts);
  var keyword = String(opts.keyword || '').trim().toLowerCase();
  if (!keyword) {
    return loadPosts(opts);
  }
  return loadAllPostsForSearch(Bmob, 0, []).then(function (rows) {
    var filtered = (rows || []).filter(function (row) {
      if (!isActivePost(row)) return false;
      return String(row.title || '').toLowerCase().indexOf(keyword) !== -1 ||
        String(row.content || '').toLowerCase().indexOf(keyword) !== -1;
    });
    return enrichPosts(Bmob, filtered, {
      currentUserId: getCurrentUserId(Bmob),
    }).then(function (list) {
      return {
        rows: filtered,
        list: list,
        hasMore: false,
      };
    });
  });
}

function loadPostDetail(options) {
  var opts = options || {};
  var Bmob = getBmob(opts);
  var postId = opts.postId || '';
  if (!postId) return Promise.resolve(null);
  var query = Bmob.Query(POST_CLASS);
  query.equalTo('objectId', '==', postId);
  query.limit(1);
  return query.find().then(function (rows) {
    if (!rows || !rows.length || !isActivePost(rows[0])) return null;
    return enrichPosts(Bmob, [rows[0]], {
      currentUserId: getCurrentUserId(Bmob),
    }).then(function (list) {
      return list && list.length ? list[0] : null;
    });
  });
}

function toggleLike(options) {
  var opts = options || {};
  var Bmob = getBmob(opts);
  var postId = opts.postId || '';
  var userId = opts.userId || getCurrentUserId(Bmob);
  if (!postId) return Promise.reject(new Error('missing_post'));
  if (!userId) return Promise.reject(new Error('not_logged_in'));

  return findLike(Bmob, postId, userId).then(function (rows) {
    if (rows && rows.length) {
      var query = Bmob.Query(POST_LIKE_CLASS);
      var tasks = rows.map(function (row) {
        return row && row.objectId ? query.destroy(row.objectId) : Promise.resolve();
      });
      return Promise.all(tasks).then(function () {
        return countLikes(Bmob, postId).then(function (count) {
          return { liked: false, likeCount: count };
        });
      });
    }
    var like = Bmob.Query(POST_LIKE_CLASS);
    like.set('postId', postId);
    like.set('userId', userId);
    return like.save().then(function () {
      return countLikes(Bmob, postId).then(function (count) {
        return { liked: true, likeCount: count };
      });
    });
  });
}

function refreshPostInteraction(options) {
  var opts = options || {};
  var Bmob = getBmob(opts);
  var postId = opts.postId || '';
  var userId = opts.userId || getCurrentUserId(Bmob);
  return Promise.all([
    countLikes(Bmob, postId),
    hasLiked(Bmob, postId, userId),
    countComments(Bmob, postId),
  ]).then(function (values) {
    return {
      likeCount: values[0],
      liked: values[1],
      commentCount: values[2],
    };
  });
}

module.exports = {
  POST_CLASS: POST_CLASS,
  POST_LIKE_CLASS: POST_LIKE_CLASS,
  MESSAGE_CLASS: MESSAGE_CLASS,
  getCurrentUserId: getCurrentUserId,
  firstText: firstText,
  withFallback: withFallback,
  loadPosts: loadPosts,
  searchPosts: searchPosts,
  loadPostDetail: loadPostDetail,
  toggleLike: toggleLike,
  refreshPostInteraction: refreshPostInteraction,
};
