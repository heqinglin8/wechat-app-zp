// pages/index/detail.js

//引入SDK
var Bmob = wx.Bmob;
var app = getApp();
var util = require('../../utils/util.js');
var findDisplayByDistrictCode = require('../../utils/region').findDisplayByDistrictCode;
Page({
  _userId: '',
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
    var regionInfo = findDisplayByDistrictCode(item.districtCode);
    var city = this.firstText(regionInfo && regionInfo.cityName);
    var district = this.firstText(regionInfo && regionInfo.districtName);
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
  buildViewData: function (item, collectNum) {
    return {
      titleText: this.withFallback(item.title, '求职标题'),
      salaryText: this.formatSalaryText(item),
      collectNumText: this.firstText(collectNum, '0'),
      publisherText: this.withFallback(item.commitNickname, '发布人'),
      locationText: this.formatLocationText(item),
      educationText: this.withFallback(item.education, '学历'),
      intentText: this.withFallback(item.jobIntent, '求职方向'),
      payTypeText: this.formatPayTypeText(item),
      expectedSalaryText: this.formatSalaryText(item),
      summaryText: this.withFallback(item.summary, '摘要'),
      introText: this.withFallback(item.recoIntro, '自我介绍'),
    };
  },
  applySeekerResult: function (result, collectCount) {
    var item = result || {};
    var collectNum = Number(collectCount);
    var normalizedCollectNum = isNaN(collectNum) ? 0 : collectNum;
    this.setData({
      content: item,
      num: normalizedCollectNum,
      photoList: this.buildPhotoList(item),
      detailMessageEnabled: item.detailMessageEnabled !== false && item.messageBoardEnabled !== false && item.allowMessage !== false,
      viewData: this.buildViewData(item, normalizedCollectNum),
    });
  },
  showLoginPrompt: function (actionText) {
    wx.showModal({
      title: '提示',
      content: '请先登录后' + actionText,
      cancelText: '取消',
      confirmText: '去登录',
      success: function (res) {
        if (res.confirm) {
          wx.switchTab({
            url: '/pages/personal/personal'
          });
        }
      }
    });
  },
  showSetInfoPrompt: function (content) {
    wx.showModal({
      title: '提示',
      content: content,
      cancelText: '取消',
      confirmText: '去完善',
      success: function (res) {
        if (res.confirm) {
          wx.navigateTo({
            url: '/pages/setinfor/setinfor'
          });
        }
      }
    });
  },
  fetchCurrentUserInfo: function (userId) {
    if (!userId) return Promise.resolve(null);
    var query = Bmob.Query("_User");
    query.equalTo("objectId", "==", userId);
    return query.find().then(function (results) {
      return results && results.length ? results[0] : null;
    });
  },
  ensureCurrentUserContactReady: function (actionText, callback) {
    var that = this;
    if (!that._userId) {
      that.showLoginPrompt(actionText);
      return;
    }

    that.fetchCurrentUserInfo(that._userId).then(function (userInfo) {
      if (!userInfo) {
        that.showLoginPrompt(actionText);
        return;
      }

      var wxid = userInfo.wxid;
      var mobilePhoneNumber = userInfo.mobilePhoneNumber;
      that.setData({
        userId: userInfo.objectId,
      });

      if (!wxid) {
        that.showSetInfoPrompt('请先完善微信号，再' + actionText);
        return;
      }
      if (!mobilePhoneNumber) {
        that.showSetInfoPrompt('请先完善联系电话，再' + actionText);
        return;
      }

      if (typeof callback === 'function') {
        callback(userInfo);
      }
    }).catch(function (error) {
      console.error('获取登录账号信息失败:', error);
      wx.showToast({
        title: '获取用户信息失败',
        icon: 'none',
        duration: 1500
      });
    });
  },
  /**
   * 求职热线跳转
   */
  bindViewServicePhone: function () {
    var that = this;
    that.ensureCurrentUserContactReady('再电话咨询', function () {
      var content = that.data.content || {};
      if (!content.contact) {
        wx.showToast({
          title: '未填联系电话',
          image: "../../images/warning.png",
          duration: 2000
        });
        return;
      }
      var phone = content.contact.replace(/\s+/g, '');
      wx.makePhoneCall({
        phoneNumber: phone,
        fail: function () {
          wx.showToast({
            title: '拨号失败',
            image: "../../images/warning.png",
            duration: 2000
          });
        }
      });
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
  fetchSeekerCollectCount: function (jobSeekId) {
    if (!jobSeekId) return Promise.resolve(0);
    var query = Bmob.Query("MyCollectInfo");
    query.equalTo("jobId", "==", jobSeekId);
    query.equalTo("type", "==", "2");
    return query.count().then(function (count) {
      var total = Number(count);
      return isNaN(total) ? 0 : total;
    });
  },
  refreshSeekerDetail: function () {
    var that = this;
    return Promise.all([
      that.fetchActiveJobSeekerById(that.data.jobSeekId),
      that.fetchSeekerCollectCount(that.data.jobSeekId)
    ]).then(function (values) {
      var result = values[0];
      var collectCount = values[1];
      if (result) {
        that.applySeekerResult(result, collectCount);
      }
      return result;
    });
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var that = this;
    if (options != null) {
      that.setData({
        jobSeekId: options.jobSeekId,
      });
    }

    that.refreshSeekerDetail().then(function (results) {
      if (!results) {
        wx.showToast({
          title: '信息不存在或已下架',
          icon: 'none',
          duration: 2000
        });
        return;
      }
    }).catch(function (error) {
      console.log("查询失败: " + error.code + " " + error.message);
    });
  },
  //提交信息
  bindViewPutinfor: function () {
    var that = this;
    if (!that._userId) {
      wx.showToast({
        title: '请先登录',
        image: "../../images/warning.png",
        duration: 1500
      });
    } else {
      var query = Bmob.Query("MyCollectInfo");
      query.equalTo("userId", "==", that._userId);
      query.equalTo("jobId", "==", that.data.jobSeekId);
      query.equalTo("type", "==", "2");
      query.find().then(function (results) {
        if (results.length == 0) {
          var diary = Bmob.Query("MyCollectInfo");
          diary.set("userId", that._userId);
          //类型："1"=收藏岗位；"2"=收藏求职信息
          diary.set("type", "2");
          diary.set("jobId", that.data.jobSeekId);
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
            that.refreshSeekerDetail().then(function () {
              that.checkCollectStatus();
            }).catch(function (error) {
              console.error('求职详情刷新失败:', error);
            });
          }).catch(function () {});
        } else {
          that.setData({
            hasCollected: true,
          });
          wx.showToast({
            title: '已收藏过了',
            image: "../../images/warning.png",
            duration: 2000
          });
          that.refreshSeekerDetail().catch(function (error) {
            console.error('求职详情刷新失败:', error);
          });
        }
      }).catch(function () {});
    }
  },

  // 查询当前用户是否已收藏当前求职信息
  checkCollectStatus: function () {
    var that = this;
    if (!that._userId || !that.data.jobSeekId) {
      that.setData({
        hasCollected: false,
      });
      return;
    }

    var query = Bmob.Query("MyCollectInfo");
    query.equalTo("userId", "==", that._userId);
    query.equalTo("jobId", "==", that.data.jobSeekId);
    query.equalTo("type", "==", "2");
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
        query.equalTo("userId", "==", that._userId);
        query.equalTo("jobId", "==", that.data.jobSeekId);
        query.equalTo("type", "==", "2");
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
            that.refreshSeekerDetail().catch(function (error) {
              console.error('求职详情刷新失败:', error);
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
            that.refreshSeekerDetail().then(function () {
              that.checkCollectStatus();
            }).catch(function (error) {
              console.error('求职详情刷新失败:', error);
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
    that.isUser().then(function () {
      that.checkCollectStatus();
    });
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
    var that = this;
    that.ensureCurrentUserContactReady('再微信咨询', function () {
      var wxid = that.data.content && that.data.content.wxid;
      if (!wxid) {
        wx.showModal({
          title: '提示',
          content: '对方没有留下微信',
          showCancel: false,
          confirmText: '知道了'
        });
        return;
      }

      wx.setClipboardData({
        data: wxid,
        success: function () {
          wx.showModal({
            title: '提示',
            content: '已经复制微信号，请直接去微信加好友',
            showCancel: false,
            confirmText: '知道了'
          });
        },
        fail: function () {
          wx.showToast({
            title: '复制失败',
            image: "../../images/warning.png",
            duration: 2000
          });
        }
      });
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
  isUser: function () {
    var that = this;
    var currentUser = Bmob.User.current();
    var objectId = currentUser && currentUser.objectId;
    if (!objectId) {
      that._userId = '';
      that.setData({ userId: '' });
      return Promise.resolve(false);
    }

    return that.fetchCurrentUserInfo(objectId).then(function (userInfo) {
      that._userId = userInfo && userInfo.objectId ? userInfo.objectId : '';
      that.setData({ userId: that._userId });
      return !!that._userId;
    }).catch(function (error) {
      console.error('查询当前登录用户失败:', error);
      that._userId = '';
      that.setData({ userId: '' });
      return false;
    });
  }
});
