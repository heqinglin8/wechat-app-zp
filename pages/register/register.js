// pages/register/login.js
var Bmob = wx.Bmob;

var app = getApp()
Page({

  /**
   * 页面的初始数据
   */
  data: {
    userName: "",
    userPhone: "",
    password: "",
    confirmPassword: "",
    userInfo: {}
  },
  //获取用户输入的用户名
  userNameInput: function (e) {
    this.setData({ userName: e.detail.value })
  },
  passWdInput: function (e) {
    this.setData({ userPhone: e.detail.value })
  },
  passwordInput: function (e) {
    this.setData({ password: e.detail.value })
  },
  confirmPasswordInput: function (e) {
    this.setData({ confirmPassword: e.detail.value })
  },

  
  /**
   * 点击返回按钮跳转主页
   */
  goBackIndex: function () {
    wx.switchTab({
      url: '../index/index'
    })
  },
/**
   * 生命周期函数--监听页面加载
   */
  onLoad: function () {


    if (app.globalData.userInfo) {
      this.setData({
        userInfo: app.globalData.userInfo,
        hasUserInfo: true
      })
    } else if (this.data.canIUse) {
      // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
      // 所以此处加入 callback 以防止这种情况
      app.userInfoReadyCallback = res => {
        this.setData({
          userInfo: res.userInfo,
          hasUserInfo: true
        })
      }
    } else {
      // 在没有 open-type=getUserInfo 版本的兼容处理
      wx.getUserInfo({
        success: res => {
          app.globalData.userInfo = res.userInfo
          this.setData({
            userInfo: res.userInfo,
            hasUserInfo: true
          })
        }
      })
    }


  },
  getUserInfo: function (e) {
    //console.log('user' + e)
    app.globalData.userInfo = e.detail.userInfo
    this.setData({
      userInfo: e.detail.userInfo,
      hasUserInfo: true
    })
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

  //提交
  put_infor: function () {
    if (
      this.isusername(this.data.userName) == false ||
      this.validatemobile(this.data.userPhone) == false ||
      this.validatepassword(this.data.password, this.data.confirmPassword) == false
    ) {
      return;
    }
    var query = Bmob.Query("_User");
    query.equalTo("userphone", "==", this.data.userPhone);
    var name = this.data.userName;
    var phone = this.data.userPhone;
    var password = this.data.password;
    var pir_src = this.data.userInfo.avatarUrl;
    var time = this.getdate();
    query.find().then(function (results) {
      if (results.length == 0) {
        Bmob.User.register({
          username: name,
          password: password,
          userphone: phone,
          imgSrc: pir_src,
          regtime: time,
        }).then(function (result) {
          wx.switchTab({ url: '../personal/personal' });
          wx.showToast({ title: "注册成功", icon: 'success', duration: 2000 });
        }).catch(function (error) {
          wx.showToast({ title: "注册失败", icon: 'none', duration: 2000 });
        });
      } else {
        wx.showToast({
          title: "该手机号已注册",
          image: "../../images/warning.png",
          duration: 2000
        });
      }
    });
  },
  // 验证密码
  validatepassword: function (password, confirmPassword) {
    if (password.length == 0) {
      wx.showToast({ title: '请输入密码', icon: 'none', duration: 1500 });
      return false;
    }
    if (password.length < 6) {
      wx.showToast({ title: '密码不能少于6位', icon: 'none', duration: 1500 });
      return false;
    }
    console.log("password:"+password+" confirmPassword:"+confirmPassword)
    if (password !== confirmPassword) {
      wx.showToast({ title: '两次密码输入不一致', icon: 'none', duration: 1500 });
      return false;
    }
    return true;
  },
  //判断用户名是否为空
  isusername: function (user) {
    //console.log('判断用户名：'+user)
    if (user.length == 0) {
      wx.showToast({
        title: '用户名不能为空',
        icon: 'none',
        duration: 1500
      })
      return false;
    }
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
  getdate: function () {
    var myDate = new Date;
    var year = myDate.getFullYear(); //获取当前年
    var yue = String(myDate.getMonth() + 1); //获取当前月
    var date = String(myDate.getDate()); //获取当前日
    if(yue.length == 1) {
      yue = '0' + yue;
    }
    if (date.length == 1) {
      date = '0' + date;
    }
    var ss = year + '-' + yue + '-' + date;
    return ss
  }
})