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
  return 'https://files.yueqiu.me/' + String(value).replace(/^\/+/, '')
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

const jobTypeData = require('./jobTypeData')
const ALL_JOB_TYPE_CODE = jobTypeData.ALL_JOB_TYPE_CODE

const JOB_TYPE_CATEGORIES = jobTypeData.categories

const padJobTypeCode = value => {
  let text = String(value || '').trim()
  if (!/^\d+$/.test(text)) return ALL_JOB_TYPE_CODE
  while (text.length < 3) text = '0' + text
  return text
}

const normalizeJobTypeCode = value => {
  return padJobTypeCode(value).slice(0, 3)
}

const getDefaultJobTypeCategoryCode = () => {
  return JOB_TYPE_CATEGORIES[0].code
}

const findJobTypeCategory = code => {
  const normalized = normalizeJobTypeCode(code)
  for (let i = 0; i < JOB_TYPE_CATEGORIES.length; i++) {
    if (JOB_TYPE_CATEGORIES[i].code === normalized) return JOB_TYPE_CATEGORIES[i]
  }
  return null
}

const getJobTypeCategoryCode = code => {
  const normalized = normalizeJobTypeCode(code)
  if (normalized === ALL_JOB_TYPE_CODE) return getDefaultJobTypeCategoryCode()
  const categoryCode = normalized.charAt(0) + '00'
  return findJobTypeCategory(categoryCode) ? categoryCode : getDefaultJobTypeCategoryCode()
}

const getJobTypeGroupsByCategory = code => {
  const category = findJobTypeCategory(code) || JOB_TYPE_CATEGORIES[0]
  return category.groups || []
}

const getJobTypeLabelByCode = code => {
  const normalized = normalizeJobTypeCode(code)
  if (normalized === ALL_JOB_TYPE_CODE) return '工种'
  for (let i = 0; i < JOB_TYPE_CATEGORIES.length; i++) {
    const category = JOB_TYPE_CATEGORIES[i]
    if (category.code === normalized) return category.name
    const groups = category.groups || []
    for (let j = 0; j < groups.length; j++) {
      const group = groups[j]
      if (group.code === normalized) return group.name
      const children = group.children || []
      for (let k = 0; k < children.length; k++) {
        if (children[k].code === normalized) return children[k].name
      }
    }
  }
  return '工种'
}

const getJobTypeFilterRange = code => {
  const normalized = normalizeJobTypeCode(code)
  if (normalized === ALL_JOB_TYPE_CODE) return null
  const start = Number(normalized)
  let end = start + 1
  if (normalized.charAt(1) === '0' && normalized.charAt(2) === '0') {
    end = start + 100
  } else if (normalized.charAt(2) === '0') {
    end = start + 10
  }
  return {
    start: start,
    end: end,
    startCode: padJobTypeCode(start),
    endCode: padJobTypeCode(end),
  }
}

const jobTypeRangeCondition = (start, end) => {
  return { $gte: start, $lt: end }
}

const applyJobTypeFilter = (query, code) => {
  const range = getJobTypeFilterRange(code)
  if (!range) return query

  if (typeof query.or === 'function') {
    const numericCondition = {}
    const stringCondition = {}
    numericCondition.jobType = jobTypeRangeCondition(range.start, range.end)
    stringCondition.jobType = jobTypeRangeCondition(range.startCode, range.endCode)
    query.or(numericCondition, stringCondition)
    return query
  }

  query.equalTo('jobType', '>=', range.start)
  query.equalTo('jobType', '<', range.end)
  return query
}

const jobType = {
  ALL_JOB_TYPE_CODE: ALL_JOB_TYPE_CODE,
  categories: JOB_TYPE_CATEGORIES,
  normalizeCode: normalizeJobTypeCode,
  getDefaultCategoryCode: getDefaultJobTypeCategoryCode,
  getCategoryCodeForJobType: getJobTypeCategoryCode,
  getGroupsByCategory: getJobTypeGroupsByCategory,
  getLabelByCode: getJobTypeLabelByCode,
  getFilterRange: getJobTypeFilterRange,
  applyJobTypeFilter: applyJobTypeFilter,
}

const FILTER_ALL_VALUE = 'all'

const normalizeFilterValue = value => {
  const text = value === undefined || value === null ? FILTER_ALL_VALUE : String(value).trim()
  return text || FILTER_ALL_VALUE
}

const normalizeJobFilters = filters => {
  const next = filters || {}
  return {
    salary: normalizeFilterValue(next.salary),
    payType: normalizeFilterValue(next.payType),
    education: normalizeFilterValue(next.education),
    companySize: normalizeFilterValue(next.companySize),
  }
}

const applyJobFilterQuery = (query, filters) => {
  const next = normalizeJobFilters(filters)
  if (next.salary !== FILTER_ALL_VALUE) {
    const salary = Number(next.salary)
    if (!isNaN(salary) && salary > 0) {
      query.equalTo('detPayMin', '>=', salary)
    }
  }
  if (next.payType !== FILTER_ALL_VALUE) {
    const payType = Number(next.payType)
    if (!isNaN(payType)) {
      query.equalTo('payType', '==', payType)
    }
  }
  if (next.education !== FILTER_ALL_VALUE) {
    query.equalTo('education', '==', next.education)
  }
  return query
}

const companyMatchesSize = (companyPeople, companySize) => {
  const size = normalizeFilterValue(companySize)
  if (size === FILTER_ALL_VALUE) return true
  const count = Number(companyPeople)
  if (isNaN(count) || count <= 0) return false
  if (size === 'under20') return count <= 20
  if (size === '20-99') return count >= 20 && count <= 99
  if (size === '100-499') return count >= 100 && count <= 499
  if (size === '500-999') return count >= 500 && count <= 999
  if (size === '1000-9999') return count >= 1000 && count <= 9999
  if (size === '10000') return count >= 10000
  return true
}

const companyIdsBySize = (companies, companySize) => {
  const size = normalizeFilterValue(companySize)
  if (size === FILTER_ALL_VALUE) return null
  return (companies || []).filter(company => {
    return company && company.objectId && companyMatchesSize(company.companyPeople, size)
  }).map(company => company.objectId)
}

const jobFilter = {
  ALL_VALUE: FILTER_ALL_VALUE,
  normalize: normalizeJobFilters,
  applyQuery: applyJobFilterQuery,
  companyMatchesSize: companyMatchesSize,
  companyIdsBySize: companyIdsBySize,
}

module.exports = {
  formatTime: formatTime,
  formatList: formatList,
  extFromPath: extFromPath,
  extractRelativePathFromUrl: extractRelativePathFromUrl,
  toDisplayUrl: toDisplayUrl,
  uploadAndSaveUserAvatar: uploadAndSaveUserAvatar,
  jobType: jobType,
  jobFilter: jobFilter
}
