// pages/myjoin/myjoin.js
var Bmob = wx.Bmob;
var util = require('../../utils/util.js');

function pickText(value, fallback) {
  var text = value === undefined || value === null ? '' : String(value).trim();
  return text || fallback;
}

function salaryText(item) {
  var payType = item && item.payType !== undefined && item.payType !== null ? String(item.payType).trim() : '';
  var unit = payType === '1' ? '元/天' : '元/月';
  var min = Number(item.detPayMin);
  var max = Number(item.detPayMax);
  var hasMin = !isNaN(min) && min > 0;
  var hasMax = !isNaN(max) && max > 0;
  var toK = function (value) {
    if (value >= 1000) {
      var k = value / 1000;
      return (k % 1 === 0 ? String(k) : String(Number(k.toFixed(1)))) + 'k';
    }
    return String(value);
  };
  if (hasMin && hasMax) {
    return toK(min) + '-' + toK(max) + unit;
  }
  if (hasMax) {
    return toK(max) + unit;
  }
  if (hasMin) {
    return toK(min) + unit;
  }
  return '薪资未填写';
}

function splitTags(value) {
  var text = value === undefined || value === null ? '' : String(value).trim();
  if (!text) {
    return [];
  }
  return text.split('|').map(function (tag) {
    return String(tag).trim();
  }).filter(function (tag) {
    return !!tag;
  });
}

function decorateJoinCard(jobInfo, joinInfo) {
  var job = jobInfo || {};
  var join = joinInfo || {};
  var directions = splitTags(job.jobDirection);
  var companyName = pickText(job.companyName, pickText(join.joinCompanyName, '公司名称未填写'));
  var experience = pickText(job.experience, '经验未填写');
  var education = pickText(job.education, '学历未填写');
  var direction = directions[0] || '方向未填写';
  var tagList = [experience, education, direction];
  return {
    joinRecordId: pickText(join.objectId, ''),
    objectId: pickText(job.objectId, join.jobId || ''),
    cardTitle: pickText(job.title, '标题未填写'),
    cardSalary: salaryText(job),
    cardCompany: companyName,
    cardCompanySize: pickText(job.companyPeople, '规模未填写'),
    cardFinancing: pickText(job.financeStage, '融资阶段未填写'),
    cardTags: tagList,
    cardRecruiter: pickText(job.commitUsername, '招聘者未填写') + ' · ' + pickText(job.commitJobRole, '职位未填写'),
    cardLocation: pickText(job.cityDisplayName || job.cityName, '地点未填写'),
    cardBadge: job.payType == 1 ? '临' : '',
    avatar: util.toDisplayUrl(job.commitAvatar) || job.firstPhoto || ''
  };
}

Page({
  data: {
    userId: '',
    jobInfo: [],
    isEmpty: false,
    selectedJoinIds: [],
    selectedCount: 0
  },

  onLoad: function (options) {
    var currentUser = Bmob.User.current();
    var userId = (options && options.userId) || (currentUser && currentUser.objectId) || '';
    this.setData({
      userId: userId
    });
    this.getinfor();
  },

  onShow: function () {
    this.getinfor();
  },

  fetchJobInfoById: function (jobId) {
    if (!jobId) {
      return Promise.resolve(null);
    }
    var query = Bmob.Query('JobInfo');
    query.equalTo('objectId', '==', jobId);
    return query.find().then(function (results) {
      return (results && results[0]) || null;
    }).catch(function () {
      return null;
    });
  },

  getinfor: function () {
    var that = this;
    if (!that.data.userId) {
      that.setData({
        jobInfo: [],
        isEmpty: true,
        selectedJoinIds: [],
        selectedCount: 0
      });
      return;
    }

    var joinQuery = Bmob.Query('MyJoinInfo');
    joinQuery.equalTo('userId', '==', that.data.userId);
    joinQuery.order('-createdAt');
    joinQuery.find().then(function (joinRows) {
      var rows = Array.isArray(joinRows) ? joinRows : [];
      if (!rows.length) {
        that.setData({
          jobInfo: [],
          isEmpty: true,
          selectedJoinIds: [],
          selectedCount: 0
        });
        return;
      }
      var tasks = rows.map(function (row) {
        return that.fetchJobInfoById(row.jobId);
      });
      return Promise.all(tasks).then(function (jobs) {
        var list = rows.map(function (row, index) {
          return decorateJoinCard(jobs[index], row);
        }).filter(function (item) {
          return !!item.joinRecordId;
        });
        that.setData({
          jobInfo: list,
          isEmpty: list.length === 0,
          selectedJoinIds: [],
          selectedCount: 0
        });
      });
    }).catch(function () {
      that.setData({
        jobInfo: [],
        isEmpty: true,
        selectedJoinIds: [],
        selectedCount: 0
      });
      wx.showToast({
        title: '加载失败',
        icon: 'none',
        duration: 1500
      });
    });
  },

  showDetail: function (e) {
    var index = e.currentTarget.dataset.index;
    var item = (this.data.jobInfo || [])[index] || {};
    if (!item.objectId) {
      wx.showToast({
        title: '岗位信息不存在',
        icon: 'none',
        duration: 1500
      });
      return;
    }
    wx.navigateTo({
      url: '../jobDetail/jobDetail?jobId=' + item.objectId
    });
  },

  onRetryLoad: function () {
    this.getinfor();
  },

  noop: function () {},

  onSelectChange: function (e) {
    var rawIds = (e.detail && e.detail.value) || [];
    var ids = (Array.isArray(rawIds) ? rawIds : [rawIds]).map(function (id) {
      return id === undefined || id === null ? '' : String(id).trim();
    }).filter(function (id) {
      return !!id;
    });
    this.setData({
      selectedJoinIds: ids,
      selectedCount: ids.length
    });
  },

  deleteinfor: function () {
    var that = this;
    var ids = (that.data.selectedJoinIds || []).map(function (id) {
      return id === undefined || id === null ? '' : String(id).trim();
    }).filter(function (id) {
      return !!id;
    });
    if (!ids.length) {
      wx.showToast({
        title: '请先勾选记录',
        icon: 'none',
        duration: 1200
      });
      return;
    }
    wx.showModal({
      title: '提示',
      content: '确认删除已勾选的报名记录吗？',
      success: function (res) {
        if (!res.confirm) {
          return;
        }
        var tasks = ids.map(function (id) {
          var query = Bmob.Query('MyJoinInfo');
          return query.destroy(id);
        });
        Promise.allSettled(tasks).then(function (results) {
          var successCount = results.filter(function (item) {
            return item.status === 'fulfilled';
          }).length;
          if (!successCount) {
            wx.showToast({
              title: '删除失败',
              icon: 'none',
              duration: 1500
            });
            return;
          }
          wx.showToast({
            title: '已删除' + successCount + '条',
            icon: 'success',
            duration: 1500
          });
          that.getinfor();
        });
      }
    });
  }
});