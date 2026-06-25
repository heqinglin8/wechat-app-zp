// pages/index/detail.js

//引入SDK
var Bmob = wx.Bmob;
var app = getApp();
var util = require('../../utils/util.js');
Page({
  data: {
    content: '',
    viewData: {},
    userId: '',
    jobSeekId: '',
    //收藏个数
    num: 0,
    //是否为第一次加载
    isfist: true,
    //轮播图片数组
    photoList: [],
    //当前轮播索引
    currentPhotoIndex: 0,
    //是否已收藏当前求职信息
    hasCollected: false,
    detailMessageEnabled: true,
  },
  firstText: function () {
    for (var i = 0; i < arguments.length; i++) {
      var value = arguments[i];
      if (value !== undefined && value !== null && String(value).trim() !== '') {
        return String(value).trim();
      }
    }
    return '';
  },
  withFallback: function (value, label) {
    var text = this.firstText(value);
    return text || (label + '未填写');
  },
  formatLocationText: function (item) {
    var city = this.firstText(item.cityName);
    var district = this.firstText(item.districtName);
    if (city && district) return city + '·' + district;
    return '城市未填写';
  },
  formatPayTypeText: function (item) {
    var payType = this.firstText(item.payType);
    if (payType === '0') return '月结';
    if (payType === '1') return '临时工';
    return '工种未填写';
  },
  formatSalaryText: function (item) {
    var payType = this.firstText(item.payType);
    var min = this.firstText(item.detPayMin);
    var max = this.firstText(item.detPayMax);
    var unit = payType === '1' ? '元/天' : '元/月';
    if (min && max) return min + '-' + max + unit;
    if (max) return max + unit;
    if (min) return min + unit;
    return '期望薪资未填写';
  },
  buildPhotoList: function (item) {
    if (!item || !item.photoImgs) return [];
    return String(item.photoImgs)
      .split('|')
      .map(function (path) {
        return util.toDisplayUrl(path);
      })
      .filter(function (path) {
        return !!path;
      });
  },
  buildViewData: function (item) {
    return {
      titleText: this.withFallback(this.firstText(item.title, item.recoName), '求职标题'),
      salaryText: this.formatSalaryText(item),
      collectNumText: this.firstText(item.collectNum, '0'),
      publisherText: this.withFallback(item.commitUsername, '发布人'),
      locationText: this.formatLocationText(item),
      educationText: this.withFallback(item.recoEducation, '学历'),
      intentText: this.withFallback(item.recoJobIntent, '求职方向'),
      payTypeText: this.formatPayTypeText(item),
      expectedSalaryText: this.formatSalaryText(item),
      phoneText: this.withFallback(item.recoContact, '电话'),
      wxidText: this.withFallback(item.wxid, '微信'),
      summaryText: this.withFallback(item.summary, '摘要'),
      introText: this.withFallback(item.recoIntro, '自我介绍'),
    };
  },
  applySeekerResult: function (result) {
    var collectNum = Number(result && result.collectNum);
    var normalizedCollectNum = isNaN(collectNum) ? 0 : collectNum;
    this.setData({
      content: result || {},
      num: normalizedCollectNum,
      photoList: this.buildPhotoList(result),
      detailMessageEnabled: result.detailMessageEnabled !== false && result.messageBoardEnabled !== false && result.allowMessage !== false,
      viewData: this.buildViewData(result || {}),
    });
  },
  /**
   * 求职热线跳转
   */
  bindViewServicePhone: function () {
    wx.navigateTo({
      url: '../servicephone/servicephone'
    });
  },
  /**
   * 返回主页跳转
   */
  bindViewIndex: function () {
    wx.switchTab({
      url: '../index/index'
    });
  },
  fetchActiveJobSeekerById: function (jobSeekId) {
    if (!jobSeekId) return Promise.resolve(null);
    var query = Bmob.Query("JobSeeker");
    query.equalTo("objectId", "==", jobSeekId);
    query.equalTo("active", "==", 1);
    return query.find().then(function (rows) {
      return rows && rows.length ? rows[0] : null;
    });
  },
  refreshSeekerDetail: function () {
    var that = this;
    return that.fetchActiveJobSeekerById(that.data.jobSeekId).then(function (result) {
      if (result) {
        that.applySeekerResult(result);
      }
      return result;
    });
  },
  adjustCollectNum: function (delta) {
    var that = this;
    return that.fetchActiveJobSeekerById(that.data.jobSeekId).then(function (result) {
      if (!result) return null;
      var current = Number(result.collectNum);
      var next = Math.max(0, (isNaN(current) ? 0 : current) + delta);
      result.set('collectNum', next);
      return result.save().then(function () {
        return that.refreshSeekerDetail();
      });
    });
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.isuser();

    var that = this;
    if (options != null) {
      that.setData({
        jobSeekId: options.jobSeekId,
      });
    }

    that.checkCollectStatus();
    that.fetchActiveJobSeekerById(that.data.jobSeekId).then(function (results) {
      if (!results) {
        wx.showToast({
          title: '信息不存在或已下架',
          icon: 'none',
          duration: 2000
        });
        return;
      }
      that.applySeekerResult(results);
    }).catch(function (error) {
      console.log("查询失败: " + error.code + " " + error.message);
    });
  },
  //提交信息
  bindViewPutinfor: function () {
    var that = this;
    if (that.data.userId.length == 0) {
      wx.showToast({
        title: '请先登录',
        image: "../../images/warning.png",
        duration: 1500
      });
    } else {
      var query = Bmob.Query("MyCollectInfo");
      query.equalTo("userId", "==", that.data.userId);
      query.equalTo("jobSeekId", "==", that.data.jobSeekId);
      query.equalTo("type", "==", "1");
      query.find().then(function (results) {
        if (results.length == 0) {
          var diary = Bmob.Query("MyCollectInfo");
          diary.set("userId", that.data.userId);
          //类型："0"=收藏用户求职信息；“1”=收藏用户求职信息；“2”=收藏岗位
          diary.set("type", "1");
          diary.set("jobSeekId", that.data.jobSeekId);
          diary.save().then(function () {
            that.setData({
              isfist: false,
              hasCollected: true,
            });
            wx.showToast({
              title: '收藏成功',
              icon: 'success',
              duration: 2000
            });
            that.adjustCollectNum(1).catch(function (error) {
              console.error('收藏数更新失败:', error);
            });
          }).catch(function () {});
        } else {
          wx.showToast({
            title: '已收藏过了',
            image: "../../images/warning.png",
            duration: 2000
          });
        }
      }).catch(function () {});
    }
  },

  // 查询当前用户是否已收藏当前求职信息
  checkCollectStatus: function () {
    var that = this;
    if (!that.data.userId || !that.data.jobSeekId) {
      that.setData({
        hasCollected: false,
      });
      return;
    }

    var query = Bmob.Query("MyCollectInfo");
    query.equalTo("userId", "==", that.data.userId);
    query.equalTo("jobSeekId", "==", that.data.jobSeekId);
    query.equalTo("type", "==", "1");
    query.find().then(function (results) {
      that.setData({
        hasCollected: results.length > 0,
      });
    }).catch(function () {
      that.setData({
        hasCollected: false,
      });
    });
  },

  // 取消收藏当前求职信息
  cancelCollect: function () {
    var that = this;
    wx.showModal({
      title: '取消收藏',
      content: '确认取消收藏该求职信息吗？',
      cancelText: '再想想',
      confirmText: '确认取消',
      success: function (res) {
        if (!res.confirm) {
          return;
        }

        var query = Bmob.Query("MyCollectInfo");
        query.equalTo("userId", "==", that.data.userId);
        query.equalTo("jobSeekId", "==", that.data.jobSeekId);
        query.equalTo("type", "==", "1");
        query.find().then(function (results) {
          if (!results || results.length === 0) {
            that.setData({
              hasCollected: false
            });
            wx.showToast({
              title: '取消收藏成功',
              icon: 'success',
              duration: 2000
            });
            return;
          }

          var destroyTasks = results
            .map(function (item) {
              return item && item.objectId;
            })
            .filter(function (id) {
              return !!id;
            })
            .map(function (id) {
              return query.destroy(id);
            });

          Promise.all(destroyTasks).then(function () {
            that.setData({
              hasCollected: false,
              isfist: false,
            });
            wx.showToast({
              title: '取消收藏成功',
              icon: 'success',
              duration: 2000
            });
            that.adjustCollectNum(-1).then(function () {
              that.checkCollectStatus();
            }).catch(function (error) {
              console.error('收藏数更新失败:', error);
              that.checkCollectStatus();
            });
          }).catch(function () {
            wx.showToast({
              title: '删除失败',
              image: "../../images/warning.png",
              duration: 2000
            });
          });
        }).catch(function () {
          wx.showToast({
            title: '删除失败',
            image: "../../images/warning.png",
            duration: 2000
          });
        });
      }
    });
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {},

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    var that = this;
    that.checkCollectStatus();
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
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {},
  //点击微信咨询
  bindViewXWZX: function () {
    wx.showToast({
      title: '此功能暂未启用',
      image: "../../images/warning.png",
      duration: 2000,
      mask: true
    });
  },
  /**
   * swiper轮播改变事件
   */
  onPhotoSwiperChange: function (e) {
    this.setData({
      currentPhotoIndex: e.detail.current
    });
  },
  /**
   * 判断用户是否存在
   */
  isuser: function () {
    var that = this;
    var currentUser = Bmob.User.current();
    if (!currentUser) {
      wx.redirectTo({
        url: '../personal/personal',
      });
    } else {
      var userId = currentUser.objectId;
      that.setData({
        userId: userId,
      });
    }
  }
});
