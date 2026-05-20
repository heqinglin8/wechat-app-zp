// pages/personal/personal.js
var Bmob = wx.Bmob;
var util = require('../../utils/util.js');

var app=getApp()

Page({

  /**
   * 页面的初始数据
   */
  data: {
    //微信官方信息
    userInfo:{},
    //数据库个人信息
    username:'',
    hasUserInfo: false
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
    //获取用户当前信息
    let currentUser = Bmob.User.current()
    console.log("onShow 个人中心当前用户: " ,currentUser);
      var token = currentUser.sessionToken;
      var objectId = currentUser.objectId;
    if (objectId!=undefined && objectId.length > 0) {
      var query = Bmob.Query("_User");
      query.equalTo("objectId", "==", objectId);
      // 查询用户是否注册
      query.find().then(function(results) {
        console.log("个人中心判断:共查询到 " + objectId+":" +results.length + " 条记录");
        if (results.length != 0) {
          var userInfo = results[0];
          userInfo.avatarUrl = util.toAvatarDisplayUrl(userInfo.avatarPath);
          //用户已注册
          that.setData({
            userInfo: userInfo,
            username: userInfo.username,
            hasUserInfo: true
          });
        } else {
          console.log("没有注册，objectId: " + objectId);
        }
      }).catch(function(error) {
        console.log("查询失败: " + error.code + " " + error.message);
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
    var user=this.data.username
    wx.navigateTo({
      url: '../myjoin/myjoin?username=' + user
    })
  },
  //点击个人中心里我的客服页面跳转
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
  //点击个人中心里我的推荐跳转
  bindViewMyaward:function(){
    var user = this.data.username
    wx.navigateTo({
      url: '../myaward/myaward?username=' + user
    })
  },
  // 点击头像修改
  bindChangeAvatar: function () {
    var that = this;
    var currentUser = Bmob.User.current();
    if (!currentUser || !currentUser.objectId) {
      wx.showToast({
        title: '请先登录',
        icon: 'none',
        duration: 1500
      });
      return;
    }

    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: function (res) {
        var tempFilePath = (res.tempFilePaths && res.tempFilePaths[0]) || '';
        if (!tempFilePath) {
          wx.showToast({
            title: '未选择图片',
            icon: 'none',
            duration: 1500
          });
          return;
        }

        var ext = 'jpg';
        var dotIndex = tempFilePath.lastIndexOf('.');
        if (dotIndex > -1) {
          ext = tempFilePath.substring(dotIndex + 1) || 'jpg';
        }
        var fileName = 'avatar-' + currentUser.objectId + '-' + Date.now() + '.' + ext;
        var file = new Bmob.File(fileName, tempFilePath);

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
          return query.get(currentUser.objectId).then(function (userObj) {
            userObj.set('avatarPath', avatarPath);
            return userObj.save().then(function () {
              var latestUserInfo = that.data.userInfo || {};
              latestUserInfo.avatarPath = avatarPath;
              latestUserInfo.avatarUrl = util.toAvatarDisplayUrl(avatarPath);
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
      },
      fail: function () {
        wx.showToast({
          title: '取消选择',
          icon: 'none',
          duration: 1200
        });
      }
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

        // wx.removeStorageSync('weapp');
        // wx.removeStorageSync('userInfo');

        try {
          Bmob.User.logout();
        } catch (e) {
          console.log("退出登录失败: " + e.code + " " + e.message);
        }

        that.setData({
          userInfo: {},
          username: '',
          hasUserInfo: false
        });

        
        wx.showToast({
          title: '已退出登录',
          icon: 'success',
          duration: 1500
        });
      }
    });
  },
//点击个人中心里登录页面跳转

  bingLogin:function(){
      // 登录
    wx.login({
      success: res => {
       // 发送 res.code 到后台换取 openId, sessionKey, unionId
        console.log('aaaaa:'+res.code);
     var that = this;
          Bmob.User.auth().then(res => {
            console.log(res)
            console.log('一键登陆成功')

             // 登录成功
            var userInfo = res;
            userInfo.avatarUrl = toAvatarDisplayUrl(userInfo.avatarPath);
            console.log("个人中心登录:查询到 " + userInfo.objectId+":" +userInfo.sessionToken);
            that.setData({
              userInfo: userInfo,
              hasUserInfo: true,
              username: userInfo.username
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
  }

})