var STORAGE_KEY = 'companyInfoCache';
var memoryList = null;
var memoryIndex = null;
var preloadPromise = null;
var remoteLoaded = false;

function normalizeText(value) {
  return value === undefined || value === null ? '' : String(value).trim();
}

function normalizeCompany(row) {
  row = row || {};
  return {
    objectId: normalizeText(row.objectId),
    companyName: normalizeText(row.name || row.companyName),
    companyPeople: row.companyPeople === undefined || row.companyPeople === null ? '' : row.companyPeople,
    financeStage: normalizeText(row.financeStage),
  };
}

function buildIndex(list) {
  var index = {};
  (list || []).forEach(function (company) {
    if (company && company.objectId) {
      index[company.objectId] = company;
    }
  });
  return index;
}

function saveStorage(list) {
  if (typeof wx === 'undefined' || !wx.setStorageSync) return;
  try {
    wx.setStorageSync(STORAGE_KEY, list);
  } catch (error) {
    console.log('CompanyInfo 缓存写入失败:', error);
  }
}

function setCompanies(rows) {
  memoryList = (rows || []).map(normalizeCompany).filter(function (company) {
    return !!company.objectId;
  });
  memoryIndex = buildIndex(memoryList);
  saveStorage(memoryList);
  return memoryList;
}

function getCompanies() {
  if (memoryList) return memoryList;
  if (typeof wx === 'undefined' || !wx.getStorageSync) {
    memoryList = [];
    memoryIndex = {};
    return memoryList;
  }
  var stored = [];
  try {
    stored = wx.getStorageSync(STORAGE_KEY);
  } catch (error) {
    console.log('CompanyInfo 缓存读取失败:', error);
  }
  memoryList = Array.isArray(stored) ? stored.map(normalizeCompany) : [];
  memoryIndex = buildIndex(memoryList);
  return memoryList;
}

function getCompanyById(companyId) {
  var id = normalizeText(companyId);
  if (!id) return null;
  if (!memoryIndex) getCompanies();
  return memoryIndex[id] || null;
}

function upsertCompany(row) {
  var company = normalizeCompany(row);
  if (!company.objectId) return getCompanies();
  var list = getCompanies().filter(function (item) {
    return item.objectId !== company.objectId;
  });
  list.push(company);
  return setCompanies(list);
}

function fetchCompanyPage(Bmob, pageIndex, acc) {
  var pageSize = 100;
  var query = Bmob.Query('CompanyInfo');
  query.limit(pageSize);
  query.skip((pageIndex || 0) * pageSize);
  return query.find().then(function (rows) {
    var list = (acc || []).concat(rows || []);
    if (rows && rows.length === pageSize) {
      return fetchCompanyPage(Bmob, (pageIndex || 0) + 1, list);
    }
    return list;
  });
}

// 启动时预加载公司信息，供职位卡片按 companyId 补齐公司字段。
function preload(Bmob) {
  if (!Bmob) return Promise.resolve(getCompanies());
  if (remoteLoaded) return Promise.resolve(memoryList || []);
  if (preloadPromise) return preloadPromise;
  preloadPromise = fetchCompanyPage(Bmob, 0, []).then(function (rows) {
    remoteLoaded = true;
    return setCompanies(rows);
  }).catch(function (error) {
    console.log('CompanyInfo 缓存加载失败:', error);
    return getCompanies();
  }).then(function (list) {
    preloadPromise = null;
    return list;
  });
  return preloadPromise;
}

function ensureLoaded(Bmob) {
  if (remoteLoaded || (memoryList && memoryList.length)) {
    return Promise.resolve(memoryList || []);
  }
  return preload(Bmob);
}

module.exports = {
  STORAGE_KEY: STORAGE_KEY,
  setCompanies: setCompanies,
  getCompanies: getCompanies,
  getCompanyById: getCompanyById,
  upsertCompany: upsertCompany,
  preload: preload,
  ensureLoaded: ensureLoaded,
};
