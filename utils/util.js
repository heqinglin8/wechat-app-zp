const formatTime = date => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  return [year, month, day].map(formatNumber).join('/') + ' ' + [hour, minute, second].map(formatNumber).join(':')
}

const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : '0' + n
}

const formatList = results => {
  return (results || []).map(item => {
    const photoImgs = item.photoImgs || ''
    item.firstPhoto = (typeof photoImgs === 'string' && photoImgs.length > 0)
      ? photoImgs.split('|')[0]
      : ''
    item.firstPhoto = toDisplayUrl(item.firstPhoto)
    return item
  })
}

const extFromPath = path => {
  const m = /\.([^.\\/]+)$/i.exec(path || '')
  return m ? m[1].toLowerCase() : ''
}

const extractRelativePathFromUrl = url => {
  if (!url) return ''
  const clean = String(url).split('?')[0].split('#')[0]
  const m = /^https?:\/\/[^/]+\/(.+)$/.exec(clean)
  return m ? m[1] : clean.replace(/^\/+/, '')
}

const toDisplayUrl = value => {
  if (!value) return ''
  if (/^https?:\/\//i.test(value)) return value
  return 'http://files.yueqiu.me/' + String(value).replace(/^\/+/, '')
}

const uploadAndSaveUserAvatar = ({ Bmob, objectId, avatarUrl }) => {
  if (!Bmob) {
    return Promise.reject(new Error('no bmob sdk'))
  }
  if (!objectId) {
    return Promise.reject(new Error('no objectId'))
  }
  if (!avatarUrl) {
    return Promise.reject(new Error('no avatar url'))
  }

  var ext = extFromPath(avatarUrl) || 'jpg'
  var fileName = 'avatar-' + objectId + '-' + Date.now() + '.' + ext
  var file = new Bmob.File(fileName, avatarUrl)

  return file.save().then(saved => {
    var uploadedUrl = ''
    if (saved && saved[0] && saved[0].url) {
      uploadedUrl = saved[0].url
    } else if (saved && saved._url) {
      uploadedUrl = saved._url
    }

    if (!uploadedUrl) {
      return Promise.reject(new Error('no uploaded url'))
    }
    var avatarPath = extractRelativePathFromUrl(uploadedUrl)
    if (!avatarPath) {
      return Promise.reject(new Error('no avatar path'))
    }

    var query = Bmob.Query('_User')
    return query.get(objectId).then(userObj => {
      userObj.set('avatarPath', avatarPath)
      return userObj.save().then(() => ({
        avatarPath: avatarPath,
        avatarUrl: toDisplayUrl(avatarPath)
      }))
    })
  })
}

module.exports = {
  formatTime: formatTime,
  formatList: formatList,
  extFromPath: extFromPath,
  extractRelativePathFromUrl: extractRelativePathFromUrl,
  toDisplayUrl: toDisplayUrl,
  uploadAndSaveUserAvatar: uploadAndSaveUserAvatar
}
