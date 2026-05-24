// pages/setinfor/setinfor.js
var Bmob = wx.Bmob;
var app = getApp()
var util = require('../../utils/util.js');
Page({

  /**
   * 页面的初始数据
   */
  data: {
    //数据库个人信息
    username: '',
    userphone:'',
    objectId: '',
    //原始手机号
    initphone:'',
  
  },
  //获取用户输入的用户名
  userNameInput: function (e) {
    this.setData({
      username: e.detail.value
    })
  },
  //获取用户输入的昵称
  nicknameInput: function (e) {
     var nickname = ((e.detail && e.detail.value) || '').trim();
    this.setData({ nickname: nickname });
  },
  phoneInput: function (e) {
    this.setData({
      userphone: e.detail.value
    })
  },

  //获取用户输入的密码
  passwordInput: function (e) {
    this.setData({
      password: e.detail.value
    })
  },
  confirmPasswordInput: function (e) {
    this.setData({
      confirmPassword: e.detail.value
    })
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {

      var that = this;
      let currentUser = Bmob.User.current()
      var sessionToken = currentUser.sessionToken;
      var objectId = currentUser.objectId;
      console.log("onLoad objectId:"+objectId)
          //获取用户当前信息
    if (objectId != undefined && objectId.length > 0) {
        this.getinfor(objectId);
    }
  
  },
  //获取信息
  getinfor:function(objectId){
    var that = this
    var query = Bmob.Query("_User");
    query.equalTo("objectId", "==", objectId);
    //查询用户是否注册
    query.find().then(function(results) {
      console.log("个人中心判断:共查询到 objectId："+objectId+" " + results.length + " 条记录");
      var userInfo = results[0]
      var avatarUrl = util.toAvatarDisplayUrl(userInfo.avatarPath)
      console.log('avatarUrl:',avatarUrl)
        //用户已注册
        that.setData({
          username: userInfo.username,
          nickname: userInfo.nickname,
          userphone: userInfo.userphone || '',
          initphone: userInfo.initphone || '',
          objectId: userInfo.objectId,
          avatarUrl:avatarUrl,
        });
    }).catch(function(error) {
      console.log("查询失败: " + error.code + " " + error.message);
    });
  },
  //更新信息
  bindViewPut:function(){
    var that=this;
    if (that.isusername(that.data.username) != false && that.validatenickname(that.data.nickname) != false && that.validatemobile(that.data.userphone) != false ){
      if (that.data.initphone == that.data.userphone){
        //手机号未修改
        var query = Bmob.Query("_User");
        query.get(that.data.objectId).then(function(result) {
          result.set('username', that.data.username);
          result.set('userphone', that.data.userphone);
          result.set('nickname', that.data.nickname);
          result.save();
          wx.switchTab({
            url: '../personal/personal'
          });
          wx.showToast({
            title: '修改成功',
            icon: 'success',
            duration: 2000
          });
        }).catch(function(error) {});
      }else{
        //查询手机号是否存在
        var query = Bmob.Query("_User");
        query.equalTo("userphone", "==", that.data.userphone);
        //console.log('手机号：' + that.data.userphone)
        // 查询所有数据
        query.find().then(function(results) {
          //console.log('查询结果：'+results.length)
          if (results.length == 0) {
            var innerQuery = Bmob.Query("_User");
            innerQuery.get(that.data.objectId).then(function(userinfo) {
              userinfo.set("username", that.data.username);
              userinfo.set("userphone", that.data.userphone);
              userinfo.set("nickname", that.data.nickname);
              userinfo.save();
              wx.showToast({
                title: "修改成功",
                icon: 'success',
                duration: 2000
              });
            }).catch(function(error) {});
          }
          else {
            wx.showToast({
              title: "该手机号已注册",
              image: "../../images/warning.png",
              duration: 2000
            });
          }
        });
      }
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
  // 判断手机号是否正确
  validatemobile: function (mobile) {
    if (mobile.length == 0) {
      wx.showToast({
        title: '请输入手机号！',
         icon: 'none',
        duration: 1500
      })
      return false;
    }
    if (mobile.length != 11) {
      wx.showToast({
        title: '手机号长度有误！',
        icon: 'none',
        duration: 1500
      })
      return false;
    }
    var myreg = /^(((13[0-9]{1})|(15[0-9]{1})|(18[0-9]{1})|(17[0-9]{1}))+\d{8})$/;
    if (!myreg.test(mobile)) {
      wx.showToast({
        title: '手机号有误！',
        icon: 'none',
        duration: 1500
      })
      return false;
    }
    return true;
  },
  //判断用户名是否为空
isusername:function(user){
  if(user.length==0){
    wx.showToast({
      title: '用户名不能为空',
      icon: 'none',
      duration: 1500
    })
    return false;
  }
},
  //判断昵称是否为空
validatenickname: function(nickname) {
  if (!nickname || nickname.trim().length == 0) {
    wx.showToast({
      title: '昵称不能为空',
      icon: 'none',
      duration: 1500
    })
    return false;
  }
  return true;
},

nicknameInput:function(e){
  this.setData({
    nickname: e.detail.value
  })
}

})