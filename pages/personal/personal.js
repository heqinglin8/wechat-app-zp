// pages/personal/personal.js
var Bmob = wx.Bmob;

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

  getUserInfo: function (e) {
    console.log('user'+JSON.stringify(e))
    if(e.detail.userInfo!=undefined){
      console.log("授权成功")
      app.globalData.userInfo = e.detail.userInfo
      this.setData({
        userInfo: e.detail.userInfo,
        hasUserInfo: true
      })
    }else{
      var err_code = e.detail.err_code
      var errMsg = e.detail.errMsg
       console.log("授权失败: " + err_code + " " + errMsg);
        wx.showToast({
          title: errMsg,
          icon: 'warning',
          duration: 1500
        });
    }
    
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
    var userInfo = wx.getStorageSync('userInfo');
    var token = wx.getStorageSync('token');
    var objectId = wx.getStorageSync('objectId');
    if (objectId!=undefined && objectId.length > 0) {
      var query = Bmob.Query("_User");
      query.equalTo("objecId", "==", objectId);
      // 查询用户是否注册
      query.find().then(function(results) {
        console.log("个人中心判断:共查询到 " + objectId+":" +results.length + " 条记录");
        if (results.length != 0) {
          //用户已注册
          that.setData({
            username: results[0].username
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

        app.globalData.userInfo = null;
        if (app.userinfor) {
          app.userinfor.img_src = '';
          app.userinfor.imgsrc = '';
        }

        try {
          Bmob.User.logout();
        } catch (e) {
        }

        that.setData({
          userInfo: {},
          username: '',
          hasUserInfo: false
        });

        wx.removeStorageSync('userInfo');
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
    // wx.navigateTo({
    //   url: '../login/login'
    // })
      // 登录
    wx.login({
      success: res => {
       // 发送 res.code 到后台换取 openId, sessionKey, unionId
        console.log('aaaaa:'+res.code);
         var that = this;
         Bmob.functions('code2Session',{
          "code" : res.code
        }).then(function (response) {
                console.log(response);
                if(response.code==200){
                    // 登录成功
                    var userInfo = response.data;
                    // app.globalData.userInfo = userInfo;
                    // app.userinfor.token = userInfo.token;
                    // app.userinfor.objectId = userInfo.objectId;
                    wx.setStorageSync('userInfo', userInfo);
                    wx.setStorageSync('token', userInfo.token);
                    wx.setStorageSync('objectId', userInfo.objectId);
                    console.log("个人中心登录:查询到 " + app.userinfor.objectId+":" +app.userinfor.token);
                    that.setData({
                      userInfo: userInfo,
                      hasUserInfo: true,
                      username: userInfo.username
                    });
                     wx.showToast({
                      title: '登录成功',
                      icon: 'none',
                      duration: 1500
                    });
                }else{
                    // 登录失败
                    wx.showToast({
                      title: '登录失败'+response.msg,
                      icon: 'none',
                      duration: 1500
                    });
                }
            }).catch(function (error) {
                console.log(error);
                 // 登录失败
                  wx.showToast({
                    title: '登录失败'+error.msg,
                    icon: 'none',
                    duration: 1500
                  });
            });
      }
    })
  }

})