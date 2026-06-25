// pages/index/detail.js

//引入SDK
var Bmob = wx.Bmob;
var util = require('../../utils/util');
var app = getApp();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    content: '',
    companyName: '',
    //轮播图片数组
    photoList: [],
    //当前轮播索引
    currentPhotoIndex: 0,
    jobId: '',
    //报名个数
    num: '',
    //是否为第一次加载
    isfist: true,
    userId: '', //用户id
    hasJoined: false, //是否已报名
    hasCollected: false, //是否已收藏
    detailMessageEnabled: true,
    viewData: {},
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
  toMonthlyK: function (value) {
    var num = Number(value);
    if (isNaN(num) || num <= 0) return '';
    var k = num / 1000;
    return (k % 1 === 0 ? String(k) : String(Number(k.toFixed(1)))) + 'K';
  },
  salaryUnitByPayType: function (payType) {
    return this.firstText(payType) === '1' ? '元/天' : '元/月';
  },
  formatTopSalary: function (item) {
    var min = Number(this.firstText(item.detPayMin));
    var max = Number(this.firstText(item.detPayMax));
    var hasMin = !isNaN(min) && min > 0;
    var hasMax = !isNaN(max) && max > 0;
    var unit = this.salaryUnitByPayType(item.payType);
    if (hasMin && hasMax) return this.toMonthlyK(min) + '-' + this.toMonthlyK(max) + unit;
    if (hasMax) return this.toMonthlyK(max) + unit;
    if (hasMin) return this.toMonthlyK(min) + unit;
    return '未填薪资';
  },
  resolveRecruiterAvatar: function (item) {
    var avatar = this.firstText(item.commitAvatar, item.firstPhoto);
    return avatar ? util.toDisplayUrl(avatar) : '';
  },
  resolveCompanyLogo: function (item) {
    var logo = this.firstText(item.companyLogo, item.logo);
    return logo ? util.toDisplayUrl(logo) : '';
  },
  formatCompanyScale: function (item) {
    var raw = this.firstText(item.companyPeople, item.companyScale, item.companyPeopleText);
    if (!raw) return '';
    var normalized = String(raw).replace(/\s+/g, '');
    if (/^\d+$/.test(normalized)) {
      return normalized + '人以上';
    }
    return normalized;
  },
  buildViewData: function (item) {
    var topPayText = this.formatTopSalary(item);
    var payTypeValue = this.firstText(item.payType);
    var payTypeText = '未填工种';
    if (payTypeValue === '0') {
      payTypeText = '月结';
    } else if (payTypeValue === '1') {
      payTypeText = '临时工';
    }
    var jobDirectionText = this.firstText(item.jobDirection,'未填职业方向');
    var educationForDetail = this.firstText(item.education, '未填最低学历');
    var experienceForDetail = this.firstText(item.experience, '未填经验');
    var jobDescriptionText = this.firstText(item.jobDescription);
    var boardDescriptionText = this.firstText(item.boardDescription);
    var companyNameText = this.firstText(item.companyName, item.company, '未填公司名称');
    var companyIndustryText = this.firstText(item.companyIndustry, '未填行业');
    var companyFinanceText = this.firstText(item.financeStage, item.finance, '未填融资阶段');
    var companyScaleText = this.formatCompanyScale(item) || '未填规模';
    var cityName = this.firstText(item.cityName);
    var districtName = this.firstText(item.districtName);
    var locationText = '未填市区';
    if (cityName && districtName) {
      locationText = cityName + '·' + districtName;
    } else if (cityName) {
      locationText = cityName + '·未填区名';
    } else if (districtName) {
      locationText = '未填市名·' + districtName;
    }
    return {
      title: this.firstText(item.title, item.detName, '未填职位名称'),
      topPayText: topPayText,
      payTypeText: payTypeText,
      jobDirectionText: jobDirectionText,
      educationExperienceText: educationForDetail + ' / ' + experienceForDetail,
      entNumText: this.firstText(item.entNum, '0'),
      locationText: locationText,
      experienceText: this.firstText(item.experience, '未填经验要求'),
      educationText: this.firstText(item.education, '未填学历要求'),
      jobDescriptionText: jobDescriptionText || '未填岗位说明',
      boardDescriptionText: boardDescriptionText || '未填福利说明',
      companyNameText: companyNameText,
      companyIndustryText: companyIndustryText,
      companyFinanceText: companyFinanceText,
      companyScaleText: companyScaleText,
      companyLogo: this.resolveCompanyLogo(item),
      recruiterName: this.firstText(item.commitUsername, '未填招聘者姓名'),
      recruiterRole: this.firstText(item.commitJobRole, '未填招聘者职位'),
      recruiterAvatar: this.resolveRecruiterAvatar(item)
    };
  },
  applyJobResult: function (result) {
    this.setData({
      content: result,
      companyName: result.companyName,
      num: Number(result.entNum) || 0,
      photoList: result.photoImgs ? result.photoImgs.split('|') : [],
      detailMessageEnabled: result.detailMessageEnabled !== false && result.messageBoardEnabled !== false && result.allowMessage !== false,
      viewData: this.buildViewData(result)
    });
  },
  fetchActiveJobInfoById: function (jobId) {
    if (!jobId) return Promise.resolve(null);
    var query = Bmob.Query("JobInfo");
    query.equalTo("objectId", "==", jobId);
    query.equalTo("active", "==", 1);
    return query.find().then(function (rows) {
      return rows && rows.length ? rows[0] : null;
    });
  },
  refreshJobDetail: function () {
    var that = this;
    return that.fetchActiveJobInfoById(that.data.jobId).then(function (result) {
      if (result) {
        that.applyJobResult(result);
      }
      return result;
    });
  },
  adjustJobEntNum: function (delta) {
    var that = this;
    return that.fetchActiveJobInfoById(that.data.jobId).then(function (result) {
      if (!result) return null;
      var current = Number(result.entNum);
      var next = Math.max(0, (isNaN(current) ? 0 : current) + delta);
      result.set('entNum', next);
      return result.save().then(function () {
        return that.refreshJobDetail();
      });
    });
  },
  /**
   * 求职热线跳转
   */
  bindViewServicePhone: function () {
    var content = this.data.content || {};
    var phone = this.firstText(content.recoContact, content.contact).replace(/\s+/g, '');
    if (!phone) {
      wx.showToast({
        title: '未填联系电话',
        image: "../../images/warning.png",
        duration: 2000
      });
      return;
    }
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
  },  
  /**
     * 返回主页跳转
     */
  bindViewIndex: function () {
    wx.switchTab({
      //url: '../servicephone/servicephone'
      url: '../index/index'
    })
  },  

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    //判断用户是否注册
    this.isuser();

    var that = this;
    // 获取传参
    if (options != null) {
      that.setData({
        jobId: options.jobId,
      });
    }

    // 向Bmob请求详情页数据
    that.fetchActiveJobInfoById(that.data.jobId).then(function (results) {
      if (!results) {
        wx.showToast({
          title: '岗位不存在或已下架',
          icon: 'none',
          duration: 2000
        });
        return;
      }
      console.log("onLoad results:", results);
      that.applyJobResult(results);
    }).catch(function (error) {
      // 查询失败
    });
  
  },
  //提交信息
  bindViewPutinfor: function (){
    var that = this;
    //判断用户是否注册
    if (that.data.userId.length == 0){
      wx.showToast({
        title: '请先登录',
        image: "../../images/warning.png",
        duration: 1500
      })  
    }
    else {
      var query = Bmob.Query("MyJoinInfo"); 
      query.equalTo("userId", "==", that.data.userId);
      query.equalTo("jobId", "==", that.data.jobId);
      // 查询用户是否已经报名过这个岗位
      query.find().then(function(results) {
        console.log("查询报名状态:共查询到 " + results.length + " 条记录");
        if (results.length == 0) {
          // 未报名，执行报名逻辑
          var diary = Bmob.Query("MyJoinInfo");
          diary.set("userId", that.data.userId);
          diary.set("jobId", that.data.jobId);
          diary.set("joinCompanyName", that.data.companyName);
          diary.save().then(function(result) {
            // 报名表添加成功
            that.setData({
              hasJoined: true,
              isfist: false,
            });
            wx.showToast({
              title: '报名成功',
              icon: 'success',
              duration: 2000
            });
            that.adjustJobEntNum(1).then(function () {
              that.checkCollectStatus();
            }).catch(function(error) {
              console.error('报名人数更新失败:', error);
            });
          }).catch(function(error) {
            // 添加失败
          });
        } else {
          // 已报名，弹出确认对话框
          wx.showModal({
            title: '取消报名',
            content: '您已报名过此岗位，是否要取消报名？',
            cancelText: '保持报名',
            confirmText: '取消报名',
            success: function(res) {
              if (res.confirm) {
                // 用户点击确认，执行取消报名逻辑
                that.cancelJoin();
              }
            }
          });
        }
      }).catch(function(error) {
        // 查询失败
      });
    }
  },

  // 取消报名：删除 uid 和 jobId 同时匹配的报名记录
  cancelJoin: function () {
    var that = this;
    wx.showModal({
      title: '取消报名',
      content: '确认取消该岗位报名吗？',
      cancelText: '再想想',
      confirmText: '确认取消',
      success: function (res) {
        if (!res.confirm) {
          return;
        }

        var query = Bmob.Query("MyJoinInfo");
        query.equalTo("userId", "==", that.data.userId);
        query.equalTo("jobId", "==", that.data.jobId);
        query.find().then(function (results) {
          if (!results || results.length === 0) {
            that.setData({
              hasJoined: false
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
              hasJoined: false,
              isfist: false
            });
            wx.showToast({
              title: '取消报名成功',
              icon: 'success',
              duration: 2000
            });
            that.adjustJobEntNum(-1).catch(function (error) {
              console.error('报名人数更新失败:', error);
            });
          }).catch(function (e) {
            console.error('取消报名失败:', e)
            wx.showToast({
              title: '取消报名失败',
              image: "../../images/warning.png",
              duration: 2000
            });
          });
        }).catch(function (e) {
          console.error("取消报名失败,e:",e);
          wx.showToast({
            title: '取消报名失败',
            image: "../../images/warning.png",
            duration: 2000
          });
        });
      }
    });
  },
  // 收藏岗位
  bindCollectJob: function () {
    var that = this;
    if (!that.firstText(that.data.userId)) {
      wx.showToast({
        title: '请先登录',
        image: "../../images/warning.png",
        duration: 1500
      });
      return;
    }

    var query = Bmob.Query("MyCollectInfo");
    query.equalTo("userId", "==", that.data.userId);
    query.equalTo("jobId", "==", that.data.jobId);
    query.equalTo("type", "==", "1");
    query.find().then(function (results) {
      if (results && results.length > 0) {
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
            hasCollected: false
          });
          wx.showToast({
            title: '取消收藏成功',
            icon: 'success',
            duration: 2000
          });
        }).catch(function () {
          wx.showToast({
            title: '取消收藏失败',
            image: "../../images/warning.png",
            duration: 2000
          });
        });
        return;
      }
      var collect = Bmob.Query("MyCollectInfo");
      collect.set("userId", that.data.userId);
      collect.set("jobId", that.data.jobId);
      collect.set("type", "1");
      collect.save().then(function () {
        that.setData({
          hasCollected: true
        });
        wx.showToast({
          title: '收藏成功',
          icon: 'success',
          duration: 2000
        });
      }).catch(function () {
        wx.showToast({
          title: '收藏失败',
          image: "../../images/warning.png",
          duration: 2000
        });
      });
    }).catch(function () {
      wx.showToast({
        title: '收藏失败',
        image: "../../images/warning.png",
        duration: 2000
      });
    });
  },
  // 查询当前用户是否已收藏当前岗位
  checkCollectStatus: function () {
    var that = this;
    if (!that.data.userId || !that.data.jobId) {
      that.setData({
        hasCollected: false
      });
      return;
    }
    var query = Bmob.Query("MyCollectInfo");
    query.equalTo("userId", "==", that.data.userId);
    query.equalTo("jobId", "==", that.data.jobId);
    query.equalTo("type", "==", "1");
    query.find().then(function (results) {
      that.setData({
        hasCollected: !!(results && results.length > 0)
      });
    }).catch(function () {
      that.setData({
        hasCollected: false
      });
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
    var that = this;
    console.log('userId'+that.data.userId+' jobId:'+that.data.jobId)
    // 查询是否已报名
    var query = Bmob.Query("MyJoinInfo");
    query.equalTo("userId", "==", that.data.userId);
    query.equalTo("jobId", "==", that.data.jobId);
    query.find().then(function(results) {
      console.log("查询报名状态:共查询到 " + results.length + " 条记录");
      that.setData({
        hasJoined: results.length > 0
      });
    }).catch(function(error) {
      that.setData({
        hasJoined: false
      });
    });
    that.checkCollectStatus();
    
    if(that.data.isfist==false)
    {
    that.refreshJobDetail().catch(function(error) {
      // 查询失败
    });
    
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
    var content = this.data.content || {};
    var title = this.firstText(content.title, content.detName, '职位详情');
    var imageUrl = this.firstText(this.data.photoList && this.data.photoList[0]);
    return {
      title: title,
      path: '/pages/jobDetail/jobDetail?jobId=' + this.data.jobId,
      imageUrl: imageUrl || undefined
    };
  },
  //点击微信咨询
  bindViewXWZX: function () {
    var that = this;
    var isLoggedIn = !!that.firstText(that.data.userId);
    if (!isLoggedIn) {
      wx.showToast({
        title: '未登录',
        image: "../../images/warning.png",
        duration: 1500
      });
      wx.showModal({
        title: '提示',
        content: '是否跳转个人中心？',
        confirmText: '是',
        cancelText: '取消',
        success: function (res) {
          if (res.confirm) {
            wx.navigateTo({
              url: '../personal/personal',
            });
          }
        }
      });
      return;
    }
    var wechatNo = that.firstText(that.data.content && that.data.content.wxid);
    if (!wechatNo) {
      wx.showToast({
        title: '未填微信号',
        image: "../../images/warning.png",
        duration: 2000
      });
      return;
    }
    wx.showModal({
      title: '提示',
      content: '你正在申请对方的微信交换，同时你的微信将自动发给对方。',
      cancelText: '取消',
      confirmText: '确认',
      success: function (modalRes) {
        if (!modalRes.confirm) return;
          var verifyUserid = that.firstText(that.data.content && that.data.content.commitUid);
          console.log('111 jobinfo:',that.data.content)
          if (!verifyUserid) {
            wx.showToast({
              title: '未获取到审核人信息',
              image: "../../images/warning.png",
              duration: 2000
            });
            return;
          }
          var linkingRow = Bmob.Query('linking');
          linkingRow.set('applyUserid', that.data.userId);
          linkingRow.set('verifyUserid', verifyUserid);
          linkingRow.set('type', '2');
          linkingRow.save().then(function () {
           wx.showModal({
            title: '对方微信号',
            content: wechatNo,
            showCancel: false,
            confirmText: '知道了'
          });
          }).catch(function (e) {
            console.error('申请交换失败,e', e)
            wx.showToast({
              title: '申请交换失败',
              image: "../../images/warning.png",
              duration: 2000
            });
          });
      }
    });
  },
  /**
   * 判断用户是否存在
   */
  isuser:function(){
    var that = this
    var currentUser = Bmob.User.current();
    if (currentUser) {
      //console.log('用户存在');
    var query = Bmob.Query("_User");
    var uid = currentUser.objectId
    that.setData({
      uid: uid,
    })
    query.equalTo("objectId", "==", uid);
        // 查询用户是否存在
    query.find().then(function(results) {
      //console.log("个人中心判断:共查询到 " + results.length + " 条记录");
      if (results.length == 0) {
        that.setData({
          userId: ''
        });
        that.checkCollectStatus();
      } else {
        //用户存在
        that.setData({
          userId: results[0].objectId
        });
        that.checkCollectStatus();
        //console.log('用户存在');
      }
    }).catch(function(error) {
      //console.log("查询失败: " + error.code + " " + error.message);
    });
    } else {
      //console.log('用户不存在');
      that.setData({
        userId: ''
      });
      that.checkCollectStatus();
    }
  },

  /**
   * Handle swiper change event
   */
  onPhotoSwiperChange: function (e) {
    this.setData({
      currentPhotoIndex: e.detail.current
    });
  }

})
