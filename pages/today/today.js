//引入SDK
var Bmob = wx.Bmob;
var city = require('../../utils/city');
var userRole = require('../../utils/userRole');
var util = require('../../utils/util');
var jobTypeData = require('../../utils/jobTypeData');
var jobType = util.jobType;
var jobService = require('../../services/jobService');
var jobSeekerService = require('../../services/jobSeekerService');
var app = getApp();
var DEFAULT_JOB_TYPE_CATEGORY_CODE = jobType.getDefaultCategoryCode();
var FILTER_ALL_VALUE = util.jobFilter.ALL_VALUE;
var DEFAULT_FILTERS = {
  salary: FILTER_ALL_VALUE,
  payType: FILTER_ALL_VALUE,
  education: FILTER_ALL_VALUE,
  companySize: FILTER_ALL_VALUE
};
var FILTER_CONFIG = [
  {
    key: 'salary',
    title: '薪资要求',
    options: [
      { label: '全部', value: FILTER_ALL_VALUE },
      { label: '2000以上', value: '2000' },
      { label: '4000以上', value: '4000' },
      { label: '6000以上', value: '6000' },
      { label: '8000以上', value: '8000' },
      { label: '10000以上', value: '10000' }
    ]
  },
  {
    key: 'payType',
    title: '结算方式',
    options: [
      { label: '全部', value: FILTER_ALL_VALUE },
      { label: '月结', value: '0' },
      { label: '临时工', value: '1' }
    ]
  },
  {
    key: 'education',
    title: '学历要求',
    options: [
      { label: '全部', value: FILTER_ALL_VALUE },
      { label: '初中及以下', value: '初中及以下' },
      { label: '中专 / 高中', value: '中专 / 高中' },
      { label: '大专', value: '大专' },
      { label: '本科', value: '本科' },
      { label: '硕士及以上', value: '硕士及以上' }
    ]
  },
  {
    key: 'companySize',
    title: '公司规模',
    options: [
      { label: '全部', value: FILTER_ALL_VALUE },
      { label: '20人以下', value: 'under20' },
      { label: '20-99人', value: '20-99' },
      { label: '100-499人', value: '100-499' },
      { label: '500-999人', value: '500-999' },
      { label: '1000-9999人', value: '1000-9999' },
      { label: '10000人以上', value: '10000' }
    ]
  }
];

/**
 * 将 tab 参数标准化为数字，非法值统一回退到第一个 tab。
 */
function normalizeTab(tab) {
  var n = Number(tab);
  return isNaN(n) ? 0 : n;
}

function cloneFilters(filters) {
  var next = filters || {};
  return {
    salary: next.salary || FILTER_ALL_VALUE,
    payType: next.payType || FILTER_ALL_VALUE,
    education: next.education || FILTER_ALL_VALUE,
    companySize: next.companySize || FILTER_ALL_VALUE
  };
}

function buildFilterSections(filters, isJobSeekerMode) {
  var next = cloneFilters(filters);
  return FILTER_CONFIG.filter(function (section) {
    return !(isJobSeekerMode && section.key === 'companySize');
  }).map(function (section) {
    return {
      key: section.key,
      title: section.title,
      options: section.options.map(function (option) {
        return {
          label: option.label,
          value: option.value,
          selected: option.value === next[section.key]
        };
      })
    };
  });
}

function filtersChanged(a, b) {
  var left = cloneFilters(a);
  var right = cloneFilters(b);
  return left.salary !== right.salary ||
    left.payType !== right.payType ||
    left.education !== right.education ||
    left.companySize !== right.companySize;
}

function hasActiveFilters(filters) {
  var next = cloneFilters(filters);
  return next.salary !== FILTER_ALL_VALUE ||
    next.payType !== FILTER_ALL_VALUE ||
    next.education !== FILTER_ALL_VALUE ||
    next.companySize !== FILTER_ALL_VALUE;
}

function filterLabel(key, value, fallback) {
  for (var i = 0; i < FILTER_CONFIG.length; i++) {
    if (FILTER_CONFIG[i].key !== key) continue;
    for (var j = 0; j < FILTER_CONFIG[i].options.length; j++) {
      if (FILTER_CONFIG[i].options[j].value === value) {
        return value === FILTER_ALL_VALUE ? fallback : FILTER_CONFIG[i].options[j].label;
      }
    }
  }
  return fallback;
}

Page({
  /**
   * 页面的初始数据
   */
  data: {
    loadingTip: "上拉加载更多",
    page_index: 0,
    jobInfo: [],
    isEmpty: false,
    currentCityCode: city.DEFAULT_CITY.cityCode,
    currentRole: '',
    isJobSeekerMode: false,
    jobTypeCategories: jobTypeData.categories,
    jobTypePopupVisible: false,
    appliedJobTypeCode: jobType.ALL_JOB_TYPE_CODE,
    tempJobTypeCode: jobType.ALL_JOB_TYPE_CODE,
    activeJobTypeCategoryCode: DEFAULT_JOB_TYPE_CATEGORY_CODE,
    activeJobTypeGroups: jobType.getGroupsByCategory(DEFAULT_JOB_TYPE_CATEGORY_CODE),
    jobTypeFilterText: '工种',
    filterPopupVisible: false,
    appliedFilters: cloneFilters(DEFAULT_FILTERS),
    tempFilters: cloneFilters(DEFAULT_FILTERS),
    filterSections: buildFilterSections(DEFAULT_FILTERS, false),
    salaryFilterText: '薪资',
    filterActive: false,

    //tab
    winHeight: "",
    currentTab: 0,
    scrollLeft: 0,
  },
  /**
   * 生命周期函数--监听页面加载：初始化城市，列表等待 onShow 获取角色后加载。
   */
  onLoad: function () {
    this.refreshCityState();
  },
  /**
   * 刷新当前城市状态，并返回城市是否发生变化。
   */
  refreshCityState: function () {
    var currentCity = city.initCurrentCity();
    var changed = this.data.currentCityCode &&
      this.data.currentCityCode !== currentCity.cityCode;
    this.setData({ currentCityCode: currentCity.cityCode });
    return changed;
  },
  /**
   * 读取外部指定的 tab，下次进入时避免反复消费同一个全局 tabid。
   */
  resolveCurrentTab: function () {
    if (app.globalData && app.globalData.tabid !== undefined && app.globalData.tabid !== null) {
      var tab = normalizeTab(app.globalData.tabid);
      app.globalData.tabid = undefined;
      return tab;
    }
    return normalizeTab(this.data.currentTab);
  },
  /**
   * 获取当前用户角色，并在角色、城市或 tab 变化时重新加载列表。
   */
  refreshModeAndMaybeLoad: function (options) {
    var that = this;
    var opts = options || {};
    var targetTab = this.resolveCurrentTab();

    app.getCurrentUserRoleInfo().then(function (roleInfo) {
      that.applyRoleMode(roleInfo, targetTab, opts);
    }).catch(function () {
      that.applyRoleMode(userRole.getRoleInfo(''), targetTab, opts);
    });
  },
  /**
   * 应用角色信息：role=2 使用求职模式，其它角色使用招聘模式。
   */
  applyRoleMode: function (roleInfo, targetTab, options) {
    var opts = options || {};
    var nextRole = roleInfo && roleInfo.role ? roleInfo.role : '';
    var nextIsJobSeekerMode = !!(roleInfo && roleInfo.isJobSeeker);
    var nextTab = normalizeTab(targetTab);
    var roleChanged = this.data.currentRole !== nextRole ||
      this.data.isJobSeekerMode !== nextIsJobSeekerMode;
    var tabChanged = normalizeTab(this.data.currentTab) !== nextTab;

    var nextFilters = cloneFilters(this.data.appliedFilters);
    if (nextIsJobSeekerMode) {
      nextFilters.companySize = FILTER_ALL_VALUE;
    }

    this.setData({
      currentRole: nextRole,
      isJobSeekerMode: nextIsJobSeekerMode,
      currentTab: nextTab,
      appliedFilters: nextFilters,
      tempFilters: cloneFilters(nextFilters),
      filterSections: buildFilterSections(nextFilters, nextIsJobSeekerMode),
      filterActive: hasActiveFilters(nextFilters),
      salaryFilterText: filterLabel('salary', nextFilters.salary, '薪资')
    });
    this.updateNavigationTitle(nextIsJobSeekerMode);

    if (opts.force || opts.cityChanged || roleChanged || tabChanged || !this._todayLoaded) {
      this.switchTabLoad(String(nextTab));
    }
  },
  /**
   * 根据当前模式设置页面导航标题。
   */
  updateNavigationTitle: function (isJobSeekerMode) {
    wx.setNavigationBarTitle({
      title: isJobSeekerMode ? '今日求职' : '今日招聘'
    });
  },
  /**
   * 重新加载当前 tab 的列表。
   */
  reloadCurrentTab: function () {
    this.switchTabLoad(String(this.data.currentTab || 0));
  },
  /**
   * 空态页点击“重新刷新”时重试当前列表。
   */
  onRetryLoad: function () {
    this.reloadCurrentTab();
  },
  /**
   * 点击搜索框时跳转到搜索页。
   */
  wxSearchTab: function () {
    wx.redirectTo({
      url: '../search/search'
    });
  },
  /**
   * 根据当前角色选择今日页列表的数据服务。
   */
  getListLoader: function () {
    return this.data.isJobSeekerMode
      ? jobSeekerService.loadJobSeekers
      : jobService.loadJobs;
  },
  /**
   * 加载当前模式下指定分页和 tab 的今日页列表。
   */
  loadCurrentList: function (pageIndex, tab) {
    var loader = this.getListLoader();
    return loader({
      Bmob: Bmob,
      preset: 'today',
      tab: tab === undefined ? this.data.currentTab : tab,
      jobType: this.data.appliedJobTypeCode,
      filters: this.data.appliedFilters,
      pageIndex: pageIndex,
      pageSize: 10
    });
  },
  /**
   * 点击列表卡片时按当前角色跳转到招聘详情或求职详情。
   */
  showDetail: function (e) {
    var index = e.currentTarget.dataset.index;
    var item = this.data.jobInfo[index];
    if (!item || !item.objectId) {
      return;
    }

    wx.navigateTo({
      url: this.data.isJobSeekerMode
        ? '../seekerDetail/seekerDetail?jobSeekId=' + item.objectId
        : '../jobDetail/jobDetail?jobId=' + item.objectId
    });
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {},

  /**
   * 生命周期函数--监听页面显示：刷新城市和角色模式，必要时重新加载列表。
   */
  onShow: function () {
    var cityChanged = this.refreshCityState();
    this.refreshModeAndMaybeLoad({ cityChanged: cityChanged });
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {},

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {},

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {},

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {},

  /**
   * 加载下一页列表，并追加到当前列表后面。
   */
  loadArticle: function () {
    var that = this;
    var requestId = this._listRequestId;

    this.loadCurrentList(this.data.page_index).then(function (result) {
      if (requestId !== that._listRequestId) {
        return;
      }

      var currentList = Array.isArray(that.data.jobInfo) ? that.data.jobInfo : [];
      var nextList = currentList.concat(result.list);
      that.setData({
        jobInfo: nextList,
        isEmpty: nextList.length === 0
      });

      if (!result.hasMore) {
        that.setData({
          loadingTip: '没有更多内容'
        });
      }
    });
  },
  /**
   * 列表滚动到底部时触发分页加载。
   */
  scrolltolower: function () {
    if (this.data.loadingTip == "没有更多内容" || this.data.isEmpty) {
      return;
    }
    this.setData({
      page_index: this.data.page_index + 1
    });
    if (this.data.loadingTip != "没有更多内容") {
      wx.showToast({
        title: "正在加载",
        icon: 'loading',
        duration: 1000
      });
    }
    this.loadArticle();
  },
  /**
   * swiper 滑动切换 tab 时同步当前 tab 并重新加载列表。
   */
  switchTab: function (e) {
    var cur = normalizeTab(e.detail.current);
    if (cur === normalizeTab(this.data.currentTab)) {
      return;
    }
    this.setData({
      currentTab: cur
    });
    this.checkCor();
    this.switchTabLoad(String(cur));
  },
  /**
   * 点击 tab 标题时切换当前 tab 并重新加载列表。
   */
  swichNav: function (e) {
    var cur = normalizeTab(e.currentTarget.dataset.current);
    if (normalizeTab(this.data.currentTab) === cur) {
      return false;
    }
    this.setData({
      currentTab: cur
    });
    this.switchTabLoad(String(cur));
  },
  /**
   * 点击“临时工”时直接按临时工结算方式筛选并刷新列表。
   */
  filterPartTimeJobs: function () {
    var nextFilters = cloneFilters(this.data.appliedFilters);
    nextFilters.payType = '1';
    this.setData({
      appliedFilters: nextFilters,
      tempFilters: cloneFilters(nextFilters),
      filterSections: buildFilterSections(nextFilters, this.data.isJobSeekerMode),
      salaryFilterText: filterLabel('salary', nextFilters.salary, '薪资'),
      filterActive: hasActiveFilters(nextFilters)
    });
    this.reloadCurrentTab();
  },
  /**
   * 打开工种筛选弹窗，并以当前已应用的筛选作为临时选择。
   */
  openJobTypePopup: function () {
    var tempCode = jobType.normalizeCode(this.data.appliedJobTypeCode);
    var categoryCode = jobType.getCategoryCodeForJobType(tempCode);
    this.setData({
      jobTypePopupVisible: true,
      tempJobTypeCode: tempCode,
      activeJobTypeCategoryCode: categoryCode,
      activeJobTypeGroups: jobType.getGroupsByCategory(categoryCode)
    });
  },
  /**
   * 关闭工种筛选弹窗。
   */
  closeJobTypePopup: function () {
    this.setData({ jobTypePopupVisible: false });
  },
  /**
   * 空函数用于弹窗遮罩阻止冒泡和页面滚动。
   */
  noop: function () {},
  /**
   * 切换工种弹窗左侧一级分类。
   */
  selectJobTypeCategory: function (e) {
    var categoryCode = jobType.normalizeCode(e.currentTarget.dataset.code);
    this.setData({
      activeJobTypeCategoryCode: categoryCode,
      activeJobTypeGroups: jobType.getGroupsByCategory(categoryCode)
    });
  },
  /**
   * 选择右侧具体工种，支持 100/110/111 等层级编码。
   */
  selectJobTypeOption: function (e) {
    var code = jobType.normalizeCode(e.currentTarget.dataset.code);
    this.setData({ tempJobTypeCode: code });
  },
  /**
   * 将弹窗临时选择重置为全部。
   */
  resetJobTypeFilter: function () {
    this.setData({
      tempJobTypeCode: jobType.ALL_JOB_TYPE_CODE,
      activeJobTypeCategoryCode: DEFAULT_JOB_TYPE_CATEGORY_CODE,
      activeJobTypeGroups: jobType.getGroupsByCategory(DEFAULT_JOB_TYPE_CATEGORY_CODE)
    });
  },
  /**
   * 应用工种筛选并重新加载当前 tab 列表。
   */
  confirmJobTypeFilter: function () {
    var nextCode = jobType.normalizeCode(this.data.tempJobTypeCode);
    var prevCode = jobType.normalizeCode(this.data.appliedJobTypeCode);
    this.setData({
      jobTypePopupVisible: false,
      appliedJobTypeCode: nextCode,
      jobTypeFilterText: jobType.getLabelByCode(nextCode)
    });
    if (nextCode !== prevCode) {
      this.reloadCurrentTab();
    }
  },
  /**
   * 打开全部筛选弹窗，薪资和筛选入口共用。
   */
  openFilterPopup: function () {
    var tempFilters = cloneFilters(this.data.appliedFilters);
    this.setData({
      filterPopupVisible: true,
      tempFilters: tempFilters,
      filterSections: buildFilterSections(tempFilters, this.data.isJobSeekerMode)
    });
  },
  /**
   * 关闭全部筛选弹窗，不应用临时选择。
   */
  closeFilterPopup: function () {
    this.setData({ filterPopupVisible: false });
  },
  /**
   * 选择一个筛选项。
   */
  selectFilterOption: function (e) {
    var key = e.currentTarget.dataset.key;
    var value = String(e.currentTarget.dataset.value || FILTER_ALL_VALUE);
    if (!key) return;
    var tempFilters = cloneFilters(this.data.tempFilters);
    tempFilters[key] = value;
    this.setData({
      tempFilters: tempFilters,
      filterSections: buildFilterSections(tempFilters, this.data.isJobSeekerMode)
    });
  },
  /**
   * 清除全部筛选弹窗中的临时选择。
   */
  clearFilterPopup: function () {
    var tempFilters = cloneFilters(DEFAULT_FILTERS);
    this.setData({
      tempFilters: tempFilters,
      filterSections: buildFilterSections(tempFilters, this.data.isJobSeekerMode)
    });
  },
  /**
   * 应用全部筛选条件并刷新列表。
   */
  confirmFilterPopup: function () {
    var nextFilters = cloneFilters(this.data.tempFilters);
    var changed = filtersChanged(this.data.appliedFilters, nextFilters);
    this.setData({
      filterPopupVisible: false,
      appliedFilters: nextFilters,
      salaryFilterText: filterLabel('salary', nextFilters.salary, '薪资'),
      filterActive: hasActiveFilters(nextFilters)
    });
    if (changed) {
      this.reloadCurrentTab();
    }
  },
  /**
   * 根据当前 tab 调整 tab 标题横向滚动位置。
   */
  checkCor: function () {
    if (this.data.currentTab > 4) {
      this.setData({
        scrollLeft: 300
      });
    } else {
      this.setData({
        scrollLeft: 0
      });
    }
  },
  /**
   * 清空当前列表并加载指定 tab 的第一页数据。
   */
  switchTabLoad: function (e) {
    var that = this;
    var requestId = (this._listRequestId || 0) + 1;
    var nextTab = normalizeTab(e);
    this._listRequestId = requestId;
    this.cleardata();
    this.setData({
      currentTab: nextTab
    });
    wx.showToast({
      title: "正在加载",
      icon: 'loading',
      duration: 1000
    });

    this.loadCurrentList(0, nextTab).then(function (result) {
      if (requestId !== that._listRequestId) {
        return;
      }

      that._todayLoaded = true;
      that.setData({
        jobInfo: result.list,
        page_index: 0,
        loadingTip: result.hasMore ? "上拉加载更多" : "没有更多内容",
        isEmpty: result.list.length === 0
      });
    }).catch(function () {
      //console.log("查询失败");
    });
  },

  /**
   * 兼容旧调用：加载第一个 tab 的今日页列表。
   */
  qbzwLoad: function () {
    this.switchTabLoad('0');
  },
  /**
   * 清空当前列表数据，切换 tab 或模式前使用。
   */
  cleardata: function () {
    this.setData({
      jobInfo: [],
      isEmpty: false
    });
  }
});
