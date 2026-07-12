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

const ALL_JOB_TYPE_CODE = '000'

const JOB_TYPE_CATEGORIES = [
  {
    code: '100',
    name: '计算机/互联网',
    groups: [
      {
        code: '110',
        name: '计算机硬件',
        children: [
          { code: '110', name: '全部' },
          { code: '111', name: '硬件工程师' },
          { code: '112', name: '高级硬件工程师' },
          { code: '113', name: '嵌入式硬件工程师' },
          { code: '114', name: '硬件测试工程师' },
          { code: '119', name: '其他' },
        ],
      },
      {
        code: '120',
        name: '计算机软件',
        children: [
          { code: '120', name: '全部' },
          { code: '121', name: '需求工程师' },
          { code: '122', name: '系统集成工程师' },
          { code: '123', name: '系统分析员' },
          { code: '124', name: '系统工程师' },
          { code: '125', name: '数据库工程师/管理员' },
          { code: '126', name: '计算机辅助设计工程师' },
          { code: '127', name: 'ERP技术开发' },
        ],
      },
      {
        code: '130',
        name: '互联网产品',
        children: [
          { code: '130', name: '全部' },
          { code: '131', name: '产品经理' },
          { code: '132', name: '网页产品经理' },
          { code: '133', name: '移动产品经理' },
          { code: '134', name: '电商产品经理' },
        ],
      },
      {
        code: '140',
        name: '互联网技术',
        children: [
          { code: '140', name: '全部' },
          { code: '141', name: '前端开发工程师' },
          { code: '142', name: '后端开发工程师' },
          { code: '143', name: 'Java开发工程师' },
          { code: '144', name: 'PHP开发工程师' },
          { code: '145', name: '小程序开发工程师' },
          { code: '146', name: '测试工程师' },
        ],
      },
    ],
  },
  {
    code: '200',
    name: '通信/电子',
    groups: [
      {
        code: '210',
        name: '半导体/仪器',
        children: [
          { code: '210', name: '全部' },
          { code: '211', name: '电子技术研发工程师' },
          { code: '212', name: '电子/电器工程师' },
          { code: '213', name: '电路工程师' },
          { code: '214', name: '测试工程师' },
          { code: '215', name: '仪器/仪表工程师' },
        ],
      },
      {
        code: '220',
        name: '通信',
        children: [
          { code: '220', name: '全部' },
          { code: '221', name: '通信技术工程师' },
          { code: '222', name: '无线通信工程师' },
          { code: '223', name: '移动通信工程师' },
          { code: '224', name: '网络优化工程师' },
        ],
      },
    ],
  },
  {
    code: '300',
    name: '客服/运营',
    groups: [
      {
        code: '310',
        name: '客服',
        children: [
          { code: '310', name: '全部' },
          { code: '311', name: '客服专员' },
          { code: '312', name: '客服主管' },
          { code: '313', name: '售前/售后技术支持' },
          { code: '314', name: '电话客服' },
        ],
      },
      {
        code: '320',
        name: '运营',
        children: [
          { code: '320', name: '全部' },
          { code: '321', name: '运营专员' },
          { code: '322', name: '内容运营' },
          { code: '323', name: '用户运营' },
          { code: '324', name: '新媒体运营' },
        ],
      },
    ],
  },
  {
    code: '400',
    name: '销售',
    groups: [
      {
        code: '410',
        name: '销售',
        children: [
          { code: '410', name: '全部' },
          { code: '411', name: '销售专员' },
          { code: '412', name: '销售经理' },
          { code: '413', name: '电话销售' },
          { code: '414', name: '渠道销售' },
          { code: '415', name: '大客户代表' },
        ],
      },
    ],
  },
  {
    code: '500',
    name: '人力/行政/法务',
    groups: [
      {
        code: '510',
        name: '人力资源',
        children: [
          { code: '510', name: '全部' },
          { code: '511', name: '人事专员' },
          { code: '512', name: '招聘专员' },
          { code: '513', name: '薪酬绩效' },
        ],
      },
      {
        code: '520',
        name: '行政/法务',
        children: [
          { code: '520', name: '全部' },
          { code: '521', name: '行政专员' },
          { code: '522', name: '前台' },
          { code: '523', name: '法务专员' },
        ],
      },
    ],
  },
  {
    code: '600',
    name: '财务/审计/税务',
    groups: [
      {
        code: '610',
        name: '财务',
        children: [
          { code: '610', name: '全部' },
          { code: '611', name: '会计' },
          { code: '612', name: '出纳' },
          { code: '613', name: '财务主管' },
        ],
      },
      {
        code: '620',
        name: '审计/税务',
        children: [
          { code: '620', name: '全部' },
          { code: '621', name: '审计专员' },
          { code: '622', name: '税务专员' },
        ],
      },
    ],
  },
  {
    code: '700',
    name: '生产制造',
    groups: [
      {
        code: '710',
        name: '生产制造',
        children: [
          { code: '710', name: '全部' },
          { code: '711', name: '普工/操作工' },
          { code: '712', name: '生产主管' },
          { code: '713', name: '质检员' },
          { code: '714', name: '工艺工程师' },
        ],
      },
    ],
  },
  {
    code: '800',
    name: '零售/生活服务',
    groups: [
      {
        code: '810',
        name: '零售',
        children: [
          { code: '810', name: '全部' },
          { code: '811', name: '店员/营业员' },
          { code: '812', name: '店长' },
          { code: '813', name: '导购' },
        ],
      },
      {
        code: '820',
        name: '生活服务',
        children: [
          { code: '820', name: '全部' },
          { code: '821', name: '服务员' },
          { code: '822', name: '收银员' },
          { code: '823', name: '配送员' },
          { code: '824', name: '保洁' },
        ],
      },
    ],
  },
]

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

module.exports = {
  formatTime: formatTime,
  formatList: formatList,
  extFromPath: extFromPath,
  extractRelativePathFromUrl: extractRelativePathFromUrl,
  toDisplayUrl: toDisplayUrl,
  uploadAndSaveUserAvatar: uploadAndSaveUserAvatar,
  jobType: jobType
}
