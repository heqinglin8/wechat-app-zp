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

const toAvatarDisplayUrl = value => {
  if (!value) return ''
  if (/^https?:\/\//i.test(value)) return value
  return 'http://files.yueqiu.me/' + String(value).replace(/^\/+/, '')
}

module.exports = {
  formatTime: formatTime,
  formatList: formatList,
  extFromPath: extFromPath,
  extractRelativePathFromUrl: extractRelativePathFromUrl,
  toAvatarDisplayUrl: toAvatarDisplayUrl
}
