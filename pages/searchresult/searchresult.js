// pages/searchinfor/searchresult.js
var Bmob = wx.Bmob;
var util = require('../../utils/util');
var city = require('../../utils/city');

function firstText() {
  for (var i = 0; i < arguments.length; i++) {
    var value = arguments[i];
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return String(value).trim();
    }
  }
  return '';
}

function salaryText(item) {
  var unit = firstText(item.payType) === '1' ? '元/天' : '元/月';
  var min = Number(firstText(item.detPayMin));
  var max = Number(firstText(item.detPayMax));
  var hasMin = !isNaN(min) && min > 0;
  var hasMax = !isNaN(max) && max > 0;
  var formatMonthly = function (value) {
    if (value >= 1000) {
      var k = value / 1000;
      return (k % 1 === 0 ? String(k) : String(Number(k.toFixed(1)))) + 'k';
    }
    return String(value);
  };
  if (hasMin && hasMax) {
    if (max >= 10000 && min < 1000) return formatMonthly(max) + unit;
    return formatMonthly(min) + '-' + formatMonthly(max) + unit;
  }
  if (hasMax) return formatMonthly(max) + unit;
  if (hasMin) return formatMonthly(min) + unit;
  return '待补充薪资';
}

function compactTags(tags) {
  return tags.filter(function (tag) {
    return tag && String(tag).trim();
  });
}

function splitTags(value) {
  var text = firstText(value);
  if (!text) return [];
  return text.split('|').map(function (tag) {
    return String(tag).trim();
  }).filter(function (tag) {
    return !!tag;
  });
}

function splitPhotoUrls(value) {
  var text = firstText(value);
  if (!text) return [];
  return text.split('|').map(function (photo) {
    return util.toDisplayUrl(String(photo).trim());
  }).filter(function (photo) {
    return !!photo;
  }).slice(0, 3);
}

function decorateJobCard(item) {
  var recruiter = firstText(item.commitUsername, '未写招聘者姓名');
  var recruiterRole = firstText(item.commitJobRole, '未写招聘者职位');
  var jobDirections = splitTags(item.jobDirection);
  item.cardTitle = firstText(item.title, '未写标题');
  item.cardSalary = salaryText(item);
  item.cardCompany = firstText(item.companyName, '未写公司名称');
  item.cardCompanySize = firstText(item.companyPeople, '未写规模');
  item.cardFinancing = firstText(item.financeStage, '未写融资');
  item.cardExperience = firstText(item.experience, '未写经验');
  item.cardEducation = firstText(item.education, '未写学历');
  item.cardDirection = firstText(jobDirections[0], '未写方向');
  item.cardTags = compactTags([
    item.cardExperience,
    item.cardEducation
  ].concat(jobDirections));
  item.cardRecruiter = recruiter
    ? recruiter + ' · ' + recruiterRole
    : '未写招聘者 · ' + recruiterRole;
  item.cardLocation = firstText(item.cityDisplayName, item.cityName, '未写地点');
  item.cardBadge = item.payType == 1 ? '临' : '';
  item.avatar = util.toDisplayUrl(item.commitAvatar) ? util.toDisplayUrl(item.commitAvatar) : item.firstPhoto;
  return item;
}

function decorateJobSeekerCard(item) {
  var recoName = firstText(item.recoName, '未写发布人');
  var recruiterRole = firstText(item.commitJobRole, '');
  item.cardTitle = firstText(item.title, item.recoJobIntent, '未写标题');
  item.cardSalary = salaryText(item);
  item.cardSummary = firstText(item.summary, '未写摘要');
  item.cardFinancing = firstText(item.recoEducation, '未写学历');
  item.cardTags = compactTags([
    firstText(item.recoEducation, '')
  ].concat(splitTags(item.recoJobIntent)));
  item.cardSeeker = recruiterRole ? recoName + ' · ' + recruiterRole : recoName;
  item.cardLocation = firstText(item.cityDisplayName, item.cityName, '未写地点');
  item.cardBadge = item.payType == 1 ? '临' : '';
  item.cardPhotos = splitPhotoUrls(item.photoImgs);
  item.avatar = util.toDisplayUrl(item.seekerAvatar) ? util.toDisplayUrl(item.seekerAvatar) : item.firstPhoto;
  return item;
}
Page({

  /**
   * 页面的初始数据
   */
  data: {
    searchValue: '',
    searchResults: [],
    isnull: -1,
    loadingTip: '',
    currentCityCode: city.DEFAULT_CITY.cityCode,
    
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.refreshCityState();
    // 搜索
    if (options && options.searchValue) {
      //console.log('onload' + options.searchValue)
      this.setData({
        searchValue: options.searchValue
      });
     this.loadinfor();
    }
  
  },
  refreshCityState: function () {
    var currentCity = city.initCurrentCity();
    var changed = this.data.currentCityCode &&
      this.data.currentCityCode !== currentCity.cityCode;
    this.setData({ currentCityCode: currentCity.cityCode });
    return changed;
  },
  loadCurrentCityJobs: function (pageIndex, acc) {
    var query = Bmob.Query("JobInfo");
    query.equalTo("active", "==", 1);
    city.applyJobInfoFilter(query);
    query.order('-updatedAt');
    query.limit(100);
    query.skip((pageIndex || 0) * 100);
    return query.find().then(function (rows) {
      var list = (acc || []).concat(rows || []);
      if (rows && rows.length === 100) {
        return this.loadCurrentCityJobs((pageIndex || 0) + 1, list);
      }
      return list;
    }.bind(this));
  },
  loadCurrentCitySeekers: function (pageIndex, acc) {
    var query = Bmob.Query("JobSeeker");
    query.equalTo("active", "==", 1);
    city.applyJobSeekerFilter(query);
    query.order('-updatedAt');
    query.limit(100);
    query.skip((pageIndex || 0) * 100);
    return query.find().then(function (rows) {
      var list = (acc || []).concat(rows || []);
      if (rows && rows.length === 100) {
        return this.loadCurrentCitySeekers((pageIndex || 0) + 1, list);
      }
      return list;
    }.bind(this));
  },
  markResultType: function (rows, resultType) {
    return util.formatList(rows || []).map(function (row) {
      row.resultType = resultType;
      row.resultKey = resultType + '_' + row.objectId;
      if (resultType === 'jobSeeker') {
        decorateJobSeekerCard(row);
      } else {
        decorateJobCard(row);
      }
      return row;
    });
  },
  sortSearchResults: function (rows) {
    return (rows || []).sort(function (a, b) {
      var at = Date.parse(a.updatedAt || a.createdAt || '') || 0;
      var bt = Date.parse(b.updatedAt || b.createdAt || '') || 0;
      return bt - at;
    });
  },
  //查询搜索结果是否存在
  loadinfor: function(){
    var that=this;
    var keyword = String(that.data.searchValue || '').trim();
    that.setData({
      searchResults: [],
      isnull: -1,
      loadingTip: ''
    });
    wx.showToast({
      title: "正在查询",
      icon: 'loading',
      duration: 1500
    });
    Promise.all([
      that.loadCurrentCityJobs(0, []),
      that.loadCurrentCitySeekers(0, [])
    ]).then(function(results) {
      var jobs = results[0] || [];
      var seekers = results[1] || [];
      var filteredJobs = jobs.filter(function (row) {
        return city.rowMatchesKeyword(row, keyword, ['title', 'jobDescription', 'companyName']);
      });
      var filteredSeekers = seekers.filter(function (row) {
        return city.rowMatchesKeyword(row, keyword, ['title', 'recoJobIntent']);
      });
      var mixedResults = that.sortSearchResults(
        that.markResultType(filteredJobs, 'jobInfo')
          .concat(that.markResultType(filteredSeekers, 'jobSeeker'))
      );
      //console.log("查询到的信息 " + mixedResults.length + "条记录");
      that.setData({
        searchResults: mixedResults,
        isnull: mixedResults.length ? 1 : 0,
        loadingTip: mixedResults.length ? '没有更多内容' : ''
      });
    }).catch(function(error) {
      //console.log("查询失败: " + error.code + " " + error.message);
      that.setData({
        searchResults: [],
        isnull: 0,
        loadingTip: ''
      });
    });

  },
  scrolltolower: function () {},
  //点击招聘列表页面跳转，页面传参
  showDetail: function (e) {
    var that = this;
    // 获取wxml元素绑定的index值
    var index = e.currentTarget.dataset.index;
    var item = that.data.searchResults[index];
    if (!item) return;
    if (item.resultType === 'jobSeeker') {
      wx.navigateTo({
        url: '../seekerDetail/seekerDetail?jobSeekId=' + item.objectId
      });
      return;
    }
    wx.navigateTo({
      url: '../jobDetail/jobDetail?jobId=' + item.objectId
    });
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
  
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    if (this.refreshCityState() && this.data.searchValue) {
      this.loadinfor();
    }
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
  
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
  
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
  
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
  
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
  
  }
})
