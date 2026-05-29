// pages/index/detail.js

//引入SDK
var Bmob = wx.Bmob;
var app = getApp();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    content: '',
    username: '',
    userphone: '',
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
    uid: '', //用户id
    hasJoined: false, //是否已报名
  },
  /**
   * 求职热线跳转
   */
  bindViewServicePhone: function () {
    wx.navigateTo({
      url: '../servicephone/servicephone'
    })
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
    var query = Bmob.Query("JobInfo");
    query.get(that.data.jobId).then(function (results) {
      console.log("onLoad results:", results);
      that.setData({
        content: results,
        companyName: results.companyName,
        num: results.entNum,
        photoList: results.photoImgs.split('|'), // Populate photoList
      });
    }).catch(function (error) {
      // 查询失败
    });
  
  },
  //提交信息
  bindViewPutinfor: function (){
    var companyName = this.data.companyName;
    var that = this;
    //判断用户是否注册
    if (that.data.username.length == 0){
      wx.showToast({
        title: '请先注册',
        image: "../../images/warning.png",
        duration: 1500
      })  
    }
    else {
      var query = Bmob.Query("MyJoinInfo"); 
      query.equalTo("uid", "==", that.data.uid);
      query.equalTo("jobId", "==", that.data.jobId);
      // 查询用户是否已经报名过这个岗位
      query.find().then(function(results) {
        console.log("查询报名状态:共查询到 " + results.length + " 条记录");
        if (results.length == 0) {
          // 未报名，执行报名逻辑
          var diary = Bmob.Query("MyJoinInfo");
          diary.set("userName", that.data.username);
          diary.set("userPhone", that.data.userphone);
          diary.set("joinCompanyName", that.data.companyName);
          diary.set("uid", that.data.uid);
          diary.set("jobId", that.data.jobId);
          diary.save().then(function(result) {
            // 报名表添加成功
            wx.showToast({
              title: '报名成功',
              icon: 'success',
              duration: 2000
            });
            //更新招聘信息表
            var detailQuery = Bmob.Query("JobInfo");
            detailQuery.get(that.data.jobId).then(function(result) {
              result.set('entNum', (that.data.num + 1));
              result.save();
              that.setData({
                isFist: false,
              });
              that.onShow();
            }).catch(function(error) {
              // 更新失败
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
                results[0].destroy().then(function() {
                  wx.showToast({
                    title: '取消报名成功',
                    icon: 'success',
                    duration: 2000
                  });
                  // 更新报名人数
                  var detailQuery = Bmob.Query("JobInfo");
                  detailQuery.get(that.data.jobId).then(function(result) {
                    result.set('entNum', Math.max(0, that.data.num - 1));
                    result.save();
                    that.setData({
                      num: Math.max(0, that.data.num - 1),
                      hasJoined: false
                    });
                    that.onShow();
                  }).catch(function(error) {
                    // 更新失败
                  });
                }).catch(function(error) {
                  wx.showToast({
                    title: '取消报名失败',
                    image: "../../images/warning.png",
                    duration: 2000
                  })  
                });
              }
            }
          });
        }
      }).catch(function(error) {
        // 查询失败
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
    var that = this;
    
    // 查询是否已报名
    var query = Bmob.Query("MyJoinInfo");
    query.equalTo("uid", "==", that.data.uid);
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
    
    if(that.data.isFist==false)
    {
    // 向Bmob请求详情页数据
    var query = Bmob.Query("JobInfo");
    //查询单条数据，第一个参数是这条数据的jobId值
    query.get(that.data.jobId).then(function(results) {
      that.setData({
        content: results,
      });
    }).catch(function(error) {
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
  
  },
  //点击微信咨询
  bindViewXWZX: function () {
    console.log('点击微信咨询')
    wx.showToast({
      title: '此功能暂未启用',
      image: "../../images/warning.png",
      duration: 2000,
      mask: true
    })
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
    query.equalTo("objectId", "==", uid);
        // 查询用户是否存在
    query.find().then(function(results) {
      //console.log("个人中心判断:共查询到 " + results.length + " 条记录");
      if (results.length == 0) {
        wx.redirectTo({
          url: '../personal/personal',
        })
      } else {
        //用户存在
        that.setData({
          username: results[0].username,
          userphone: results[0].userphone,
          uid: uid,
        });
        //console.log('用户存在');
      }
    }).catch(function(error) {
      //console.log("查询失败: " + error.code + " " + error.message);
    });
    } else {
      //console.log('用户不存在');
      wx.redirectTo({
        url: '../personal/personal',
      })
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