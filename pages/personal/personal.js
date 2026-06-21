// pages/personal/personal.js
var Bmob = wx.Bmob;
var util = require('../../utils/util.js');

var app=getApp()

const defaultAvatarUrl = 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0'

Page({

  /**
   * 页面的初始数据
   */
  data: {
    //微信官方信息
    userInfo:{},
    //数据库个人信息
    nickname:'',
    hasUserInfo: false,
    defaultAvatarUrl: defaultAvatarUrl,
    avatarUrl: defaultAvatarUrl,
    showRoleDialog: false,
    selectedRole: 2,
    roleJobRole: '',
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
      var query = Bmob.Query("_User");
      query.equalTo("objectId", "==", objectId);
      // 查询用户是否注册
      query.find().then(function(results) {
        console.log("onShow 个人中心判断:共查询到 " + objectId+":" +results.length + " 条记录");
        if (results.length != 0) {
          var userInfo = results[0];
          userInfo.sessionToken = sessionToken;
          console.log("onShow 个人中心当前用户: " ,userInfo);
          var rolePromise = that.isEmptyRole(userInfo.role) ? that.promptUserRole() : Promise.resolve(null);
          rolePromise.then(function (roleInfo) {
            return that.updateRoleUserInfo(userInfo, roleInfo);
          }).then(function (latestUserInfo) {
            //用户已注册
            that.applyUserInfo(latestUserInfo);
            console.log('login success')
          }).catch(function (error) {
            console.log('onShow 设置角色信息失败:', error);
            that.applyUserInfo(userInfo);
            wx.showToast({
              title: '设置角色信息失败',
              icon: 'none',
              duration: 1500
            });
          });
        } else {
          console.log("onShow 没有注册，objectId: " + objectId);
          that.logoutCurrentUser();
        }
      }).catch(function(error) {
        console.log("查询失败: " + error.code + " " + error.message);
        that.logoutCurrentUser();
      });
    }else{
      console.log("没有登录，objectId: " + objectId);
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
  //点击个人中心里求职热线页面跳转
  bindViewServicePhone: function () {
    wx.navigateTo({
      url: '../servicephone/servicephone'
    })
  },
 //点击交换信息
 bindExchangeLink: function () {
  wx.navigateTo({
    url: '../linkings/linkings'
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
        var ext = 'jpg';
        var dotIndex = avatarUrl.lastIndexOf('.');
        if (dotIndex > -1) {
          ext = avatarUrl.substring(dotIndex + 1) || 'jpg';
        }
        var fileName = 'avatar-' + objectId + '-' + Date.now() + '.' + ext;
        var file = new Bmob.File(fileName, avatarUrl);

        wx.showLoading({ title: '上传中...' });

        file.save().then(function (saved) {
          var avatarUrl = '';
          if (saved && saved[0] && saved[0].url) {
            avatarUrl = saved[0].url;
          } else if (saved && saved._url) {
            avatarUrl = saved._url;
          }

          if (!avatarUrl) {
            return Promise.reject(new Error('no avatar url'));
          }
          var avatarPath = util.extractRelativePathFromUrl(avatarUrl);
          if (!avatarPath) {
            return Promise.reject(new Error('no avatar path'));
          }
          
          var query = Bmob.Query('_User');
          return query.get(objectId).then(function (userObj) {
            userObj.set('avatarPath', avatarPath);
            return userObj.save().then(function () {
              var latestUserInfo = that.data.userInfo || {};
              latestUserInfo.avatarPath = avatarPath;
              latestUserInfo.avatarUrl = util.toDisplayUrl(avatarPath);
              that.setData({
                userInfo: latestUserInfo
              });

              wx.showToast({
                title: '头像已更新',
                icon: 'success',
                duration: 1500
              });
            });
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
      this.setData({
        avatarUrl,
      })
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

  logoutCurrentUser: function () {
    try {
      Bmob.User.logout();
    } catch (e) {
      console.log("退出登录失败: " + e.code + " " + e.message);
    }
    this.setData({
      userInfo: {},
      nickname: '',
      hasUserInfo: false
    });
  },

  isEmptyRole: function (role) {
    if (role === undefined || role === null) {
      return true;
    }
    var roleText = String(role).trim();
    return roleText === '' || roleText === '0';
  },

  promptUserRole: function () {
    var that = this;
    if (that._rolePromise) {
      return that._rolePromise;
    }

    that._rolePromise = new Promise(function (resolve) {
      that._roleResolve = resolve;
      that.setData({
        showRoleDialog: true,
        selectedRole: 2,
        roleJobRole: ''
      });
    });

    return that._rolePromise;
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
    var selectedRole = Number(this.data.selectedRole);
    var jobRole = ((this.data.roleJobRole || '') + '').trim();

    if (selectedRole === 1 && !jobRole) {
      wx.showToast({
        title: '请输入职位角色',
        icon: 'none',
        duration: 1500
      });
      return;
    }

    var resolve = this._roleResolve;
    this._roleResolve = null;
    this._rolePromise = null;
    this.setData({
      showRoleDialog: false,
      roleJobRole: selectedRole === 1 ? jobRole : ''
    });

    if (resolve) {
      resolve({
        role: String(selectedRole),
        jobRole: selectedRole === 1 ? jobRole : ''
      });
    }
  },

  noop: function () {},

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

  applyUserInfo: function (userInfo) {
    userInfo.avatarUrl = util.toDisplayUrl(userInfo.avatarPath);
    this.setData({
      userInfo: userInfo,
      nickname: userInfo.nickname || '',
      mobilePhoneNumber:userInfo.mobilePhoneNumber || '',
      hasUserInfo: true,
      avatarUrl: userInfo.avatarUrl || defaultAvatarUrl
    });
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
      // 登录
    wx.login({
      success: res => {
       // 发送 res.code 到后台换取 openId, sessionKey, unionId
        console.log('login res:', res);
     var that = this;
          Bmob.User.auth().then(res => {
            console.log('一键登陆成功 res:',res)
             // 登录成功
            var userInfo = res;
            userInfo.avatarUrl = util.toDisplayUrl(userInfo.avatarPath);
            console.log("个人中心登录:查询到 objectId:" + userInfo.objectId+" sessionToken:" +userInfo.sessionToken, ", avatarPath:",userInfo.avatarPath);

            that.setData({
              userInfo: userInfo,
              hasUserInfo: true,
              nickname: userInfo.nickname
            });
              wx.showToast({
              title: '登录成功',
              icon: 'success',
              duration: 1500
            });
          }).catch(err => {
            console.log(err)
          });
      }
    })
  },

  bindModifyNickname:function(){
     wx.navigateTo({
      url: '../setinfor/setinfor' 
     })
  }

})
