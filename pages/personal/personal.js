// pages/personal/personal.js
var Bmob = wx.Bmob;
var util = require('../../utils/util.js');
var userRole = require('../../utils/userRole.js');

var app=getApp()

const defaultAvatarUrl = 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0'

Page({

  /**
   * 页面的初始数据
   */
  data: {
    //微信官方信息
    userInfo:{},
    userId: '',
    //数据库个人信息
    nickname:'',
    hasUserInfo: false,
    defaultAvatarUrl: defaultAvatarUrl,
    avatarUrl: defaultAvatarUrl,
    showRoleDialog: false,
    selectedRole: 2,
    roleJobRole: '',
    isSavingRole: false,
    showMyJoinEntry: false,
    showMyJobSeekEntry: false,
    showMyRecruitEntry: false,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function () {
    console.log("onLoad")
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
    //console.log("onShow")
      var that = this;
      let currentUser = Bmob.User.current()
      var sessionToken = currentUser ? currentUser.sessionToken : '';
      var objectId = currentUser ? currentUser.objectId : '';
      //获取用户当前信息
    if (objectId!=undefined && objectId.length > 0) {
      that.fetchCurrentUserInfo(objectId, sessionToken).then(function(userInfo) {
        console.log("onShow 个人中心当前用户: " ,userInfo);
        //用户已注册
        that.applyUserInfo(userInfo);
        console.log('login success')
      }).catch(function(error) {
        if (error && error.code === 'USER_NOT_FOUND') {
          console.log("onShow 没有注册，objectId: " + objectId);
          that.logoutCurrentUser();
          return;
        }
        console.log("查询失败: " + error.code + " " + error.message);
        that.logoutCurrentUser();
      });
    }else{
      console.log("没有登录，objectId: " + objectId);
      that.clearPersonalUserState();
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
  
  },
  //点击个人中心里我的报名页面跳转
  bindViewMyJoin: function () {
    var userId=this.data.userInfo.objectId
    wx.navigateTo({
      url: '../myjoin/myjoin?userId=' + userId
    })
  },
  //点击个人中心里我的招聘页面跳转
  bindViewMyRecruit: function () {
    var userId = this.data.userInfo.objectId
    wx.navigateTo({
      url: '../myrecruit/myrecruit?userId=' + userId
    })
  },
  //点击个人中心里求职热线页面跳转
  bindViewServicePhone: function () {
    wx.navigateTo({
      url: '../servicephone/servicephone'
    })
  },

  //点击个人中心里门店地址页面跳转
  bindViewMap: function () {
    wx.navigateTo({
      url: '../map/map'
    })
  },
  //点击个人中心里修改信息页面跳转
  bindViewTodayGxz:function(){
    wx.navigateTo({
      url: '../setinfor/setinfor' 
    })
  },
  //点击个人中心里我的求职跳转
  bindViewMyaward:function(){
    var userId = this.data.userInfo.objectId
    wx.navigateTo({
      url: '../myjobseeks/myjobseeks?userId=' + userId
    })
  },
  // 点击头像修改
   onChooseAvatar(e) {
    var that = this;
    const { avatarUrl } = e.detail 
    console.log('onChooseAvatar avatarUrl:',avatarUrl)
  
    //  var tempFilePath = (res.tempFilePaths && res.tempFilePaths[0]) || '';
        if (!avatarUrl) {
          wx.showToast({
            title: '未选择图片',
            icon: 'none',
            duration: 1500
          });
          return;
        }
        var userInfo = that.data.userInfo
        var objectId = userInfo.objectId;

        wx.showLoading({ title: '上传中...' });

        util.uploadAndSaveUserAvatar({
          Bmob: Bmob,
          objectId: objectId,
          avatarUrl: avatarUrl
        }).then(function (avatarInfo) {
          var latestUserInfo = that.data.userInfo || {};
          latestUserInfo.avatarPath = avatarInfo.avatarPath;
          latestUserInfo.avatarUrl = avatarInfo.avatarUrl;
          that.setData({
            userInfo: latestUserInfo,
            avatarUrl: avatarInfo.avatarUrl
          });
          wx.showToast({
            title: '头像已更新',
            icon: 'success',
            duration: 1500
          });
        }).catch(function (err) {
          console.log('头像上传或更新失败:', err);
          wx.showToast({
            title: '头像更新失败',
            icon: 'none',
            duration: 1500
          });
        }).finally(function () {
          wx.hideLoading();
        });
  },
  // 点击退出登录
  bindLogout: function () {
    var that = this;
    wx.showModal({
      title: '提示',
      content: '是否退出登录',
      cancelText: '取消',
      confirmText: '确认',
      success: function (res) {
        if (!res.confirm) {
          return;
        }

        that.logoutCurrentUser();

        
        wx.showToast({
          title: '已退出登录',
          icon: 'success',
          duration: 1500
        });
      }
    });
  },
//点击个人中心里登录页面跳转

  clearPersonalUserState: function () {
    app.globalData.currentUserRole = '';
    this.setData({
      userInfo: {},
      userId: '',
      nickname: '',
      mobilePhoneNumber: '',
      hasUserInfo: false,
      avatarUrl: defaultAvatarUrl,
      showRoleDialog: false,
      selectedRole: 2,
      roleJobRole: '',
      isSavingRole: false,
      showMyJoinEntry: false,
      showMyJobSeekEntry: false,
      showMyRecruitEntry: false
    });
    app.syncTodayTabBarByRole('');
    this.refreshFabVisibility();
  },

  logoutCurrentUser: function () {
    try {
      Bmob.User.logout();
    } catch (e) {
      console.log("退出登录失败: " + e.code + " " + e.message);
    }
    this.clearPersonalUserState();
  },

  isEmptyRole: function (role) {
    return userRole.isEmptyRole(role);
  },

  fetchCurrentUserInfo: function (objectId, sessionToken) {
    var query = Bmob.Query("_User");
    query.equalTo("objectId", "==", objectId);
    return query.find().then(function(results) {
      console.log("onShow 个人中心判断:共查询到 " + objectId + ":" + results.length + " 条记录");
      if (results.length === 0) {
        return Promise.reject({
          code: 'USER_NOT_FOUND',
          message: '用户不存在'
        });
      }
      var userInfo = results[0];
      userInfo.sessionToken = sessionToken;
      return userInfo;
    });
  },

  shouldShowRoleDialog: function (userInfo) {
    var currentUserInfo = userInfo || {};
    var userId = currentUserInfo.objectId || this.data.userId || '';
    return !!userId && this.isEmptyRole(currentUserInfo.role);
  },

  onRoleSelect: function (e) {
    var role = Number(e.currentTarget.dataset.role);
    var nextData = {
      selectedRole: role
    };
    if (role === 2) {
      nextData.roleJobRole = '';
    }
    this.setData(nextData);
  },

  onRoleJobInput: function (e) {
    this.setData({
      roleJobRole: e.detail.value
    });
  },

  confirmRoleDialog: function () {
    if (this.data.isSavingRole) {
      return;
    }

    var that = this;
    var selectedRole = Number(this.data.selectedRole);
    var jobRole = ((this.data.roleJobRole || '') + '').trim();
    var userInfo = this.data.userInfo || {};
    var userId = this.data.userId || userInfo.objectId || '';

    if (selectedRole !== 1 && selectedRole !== 2) {
      wx.showToast({
        title: '请选择身份',
        icon: 'none',
        duration: 1500
      });
      return;
    }
    if (selectedRole === 1 && !jobRole) {
      wx.showToast({
        title: '请输入职位角色',
        icon: 'none',
        duration: 1500
      });
      return;
    }

    if (!userId) {
      wx.showToast({
        title: '请先登录',
        icon: 'none',
        duration: 1500
      });
      this.clearPersonalUserState();
      return;
    }

    userInfo.objectId = userId;
    this.setData({
      isSavingRole: true
    });

    this.updateRoleUserInfo(userInfo, {
        role: String(selectedRole),
        jobRole: selectedRole === 1 ? jobRole : ''
    }).then(function (latestUserInfo) {
      that.applyUserInfo(latestUserInfo);
      wx.showToast({
        title: '身份已设置',
        icon: 'success',
        duration: 1500
      });
    }).catch(function (error) {
      console.log('设置角色信息失败:', error);
      that.setData({
        showRoleDialog: false,
        isSavingRole: false
      });
      wx.showToast({
        title: '设置身份失败，请再次登陆',
        icon: 'none',
        duration: 1500
      });
      setTimeout(function () {
        that.showReloginModal();
      }, 1500);
    });
  },

  noop: function () {},

  showReloginModal: function () {
    var that = this;
    wx.showModal({
      title: '退出登录',
      content: '请退出后重新登录',
      showCancel: false,
      confirmText: '确定',
      success: function (res) {
        if (res.confirm) {
          that.logoutCurrentUser();
        }
      }
    });
  },

  updateRoleUserInfo: function (userInfo, roleInfo) {
    if (!roleInfo) {
      return Promise.resolve(userInfo);
    }

    var query = Bmob.Query('_User');
    return query.get(userInfo.objectId).then(function (userObj) {
      var role = String(roleInfo.role);
      userObj.set('sessionToken', userInfo.sessionToken);
      userObj.set('role', role);
      userObj.set('jobRole', roleInfo.jobRole);
      return userObj.save();
    }).then(function () {
      userInfo.role = String(roleInfo.role);
      userInfo.jobRole = roleInfo.jobRole;
      return userInfo;
    });
  },

  resolvePersonalEntryVisibility: function (role) {
    if (this.isEmptyRole(role)) {
      return {
        showMyJoinEntry: false,
        showMyJobSeekEntry: false,
        showMyRecruitEntry: false
      };
    }

    var isJobSeeker = userRole.isJobSeekerRole(role);
    return {
      showMyJoinEntry: isJobSeeker,
      showMyJobSeekEntry: isJobSeeker,
      showMyRecruitEntry: !isJobSeeker
    };
  },

  applyUserInfo: function (userInfo) {
    var userId = userInfo.objectId || '';
    var role = userRole.normalizeRole(userInfo.role);
    userInfo.role = role;
    var showRoleDialog = this.shouldShowRoleDialog(userInfo);
    var entryVisibility = this.resolvePersonalEntryVisibility(role);
    userInfo.avatarUrl = util.toDisplayUrl(userInfo.avatarPath) || userInfo.avatarUrl || userInfo.wechatAvatarUrl || '';
    app.globalData.currentUserRole = showRoleDialog ? '' : role;
    if (!showRoleDialog) {
      app.syncTodayTabBarByRole(role);
    }
    this.setData({
      userInfo: userInfo,
      userId: userId,
      nickname: userInfo.nickname || '',
      mobilePhoneNumber: userInfo.mobilePhoneNumber || userInfo.userphone || '',
      hasUserInfo: true,
      avatarUrl: userInfo.avatarUrl || defaultAvatarUrl,
      showRoleDialog: showRoleDialog,
      selectedRole: showRoleDialog && !this.data.showRoleDialog ? 2 : this.data.selectedRole,
      roleJobRole: showRoleDialog && !this.data.showRoleDialog ? '' : this.data.roleJobRole,
      isSavingRole: false,
      showMyJoinEntry: entryVisibility.showMyJoinEntry,
      showMyJobSeekEntry: entryVisibility.showMyJobSeekEntry,
      showMyRecruitEntry: entryVisibility.showMyRecruitEntry
    });
    this.refreshFabVisibility();
  },

  refreshFabVisibility: function () {
    var fab = this.selectComponent ? this.selectComponent('#pageFab') : null;
    if (fab && fab.refreshEntryVisibility) {
      fab.refreshEntryVisibility();
    }
  },

  // 解密后返回数据格式如下
 // { "phoneNumber":"137xxxx6579", "purePhoneNumber":"137xxxx6579", "countryCode":"86", "watermark":{ "timestamp":1516762168, "appid":"wx094edexxxxx" } }
// getPhoneNumber: function (res) {
//     console.log('getPhoneNumber res:',res)
//     Bmob.User.decryption(res).then(res => {
//       console.log(res)
//     })
// },

  bingLogin:function(){
    var that = this;
    Bmob.User.auth().then(function (userInfo) {
      console.log('Bmob.User.auth res:', userInfo)
      var sessionToken = userInfo ? userInfo.sessionToken : '';
      var objectId = userInfo ? userInfo.objectId : '';
      if (!objectId) {
        return Promise.reject({
          code: 'USER_ID_EMPTY',
          message: '未获取到用户ID'
        });
      }
      return that.fetchCurrentUserInfo(objectId, sessionToken).catch(function (error) {
        console.log('登录后查询用户信息失败，使用授权返回信息:', error);
        userInfo.sessionToken = sessionToken;
        return userInfo;
      });
    }).then(function (userInfo) {
      that.applyUserInfo(userInfo);
      wx.showToast({
        title: '登录成功',
        icon: 'success',
        duration: 1500
      });
    }).catch(function (err) {
      console.log(err);
      wx.showToast({
        title: '登录失败',
        icon: 'none',
        duration: 1500
      });
    });
  },

  bindModifyNickname:function(){
     wx.navigateTo({
      url: '../setinfor/setinfor' 
     })
  }

})
