// pages/index/detail.js

//引入SDK
var Bmob = wx.Bmob;
var app = getApp();
var util = require('../../utils/util.js');
Page({

  /**
   * 页面的初始数据
   */
  data: {
    content:'',
    userId:'',
    jobSeekId:'',
    //收藏个数
    num:'',
    //是否为第一次加载
    isfist:true,
    //轮播图片数组
    photoList: [],
    //当前轮播索引
    currentPhotoIndex: 0,
    //是否已收藏当前求职信息
    hasCollected: false,
    detailMessageEnabled: true,
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
    if (options!=null){
      that.setData({
        jobSeekId: options.jobSeekId,
      });
      console.log('onLoad options为空')
    }else{
     
      console.log('onLoadoptions不为空')
    }

    that.checkCollectStatus();
    console.log('userId'+that.data.userId+' jobSeekId:'+that.data.jobSeekId)
    // 向Bmob请求详情页数据
    var query = Bmob.Query("JobSeeker");
    //查询单条数据，第一个参数是这条数据的objectId值
    query.get(that.data.jobSeekId).then(function(results) {
      // 处理photoImgs分割成photoList数组
      var photoList = [];
      if (results.photoImgs && results.photoImgs.length > 0) {
        photoList = results.photoImgs.split('|').map(path => util.toDisplayUrl(path));
      }
      console.log("onLoad results：", results, " photoList:", photoList)
      that.setData({
        content: results,
        num: results.collectNum,
        photoList: photoList,
        detailMessageEnabled: results.detailMessageEnabled !== false && results.messageBoardEnabled !== false && results.allowMessage !== false,
      });
    }).catch(function(error) {
      // 查询失败
      console.log("查询失败: " + error.code + " " + error.message);
    });
  
  },
  //提交信息
  bindViewPutinfor: function (){
    var that = this;
    //console.log(name);
    //判断用户是否注册
    if (that.data.userId.length==0){
      //用户已注册
      wx.showToast({
        title: '请先注册',
        image: "../../images/warning.png",
        duration: 1500
      })  
    }
    else{
    var query = Bmob.Query("MyCollectInfo"); 
    query.equalTo("userId", "==", that.data.userId);
    query.equalTo("jobSeekId", "==", that.data.jobSeekId);
    // 查询用户是否已经被我收藏过
    query.find().then(function(results) {
      //console.log("个人中心判断:共查询到 " + results.length + " 条记录");
      if (results.length == 0) {
       
       //提交用户信息
        var diary = Bmob.Query("MyCollectInfo");
        diary.set("userId", that.data.userId);
        //类型："0"=收藏用户求职信息；“1”=收藏用户求职信息；“2”=收藏岗位
        diary.set("type", "1");
        diary.set("jobSeekId", that.data.jobSeekId);
        diary.save().then(function(result) {
          //收藏表添加成功，
          wx.showToast({
            title: '收藏成功',
            icon: 'success',
            duration: 2000
          });
          //更新求职信息表
          var detailQuery = Bmob.Query("JobSeeker");
          detailQuery.get(that.data.jobSeekId).then(function(result) {
            result.set('collectNum', (that.data.num + 1));
            result.save();
            //console.log('+1')
            that.setData({
              isFist:false,
              hasCollected: true,
            });
            that.onShow();
          }).catch(function(error) {
            //console.log('添加失败')
          });
        }).catch(function(error) {
          // 添加失败
          //console.log('创建失败' + error.code + " " + error.message);
        });
      } else {
        //用户已收藏
        wx.showToast({
          title: '已收藏过了',
          image: "../../images/warning.png",
          duration: 2000
        })  
      }
    }).catch(function(error) {
      //console.log("查询失败: " + error.code + " " + error.message);
    });
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
        query.find().then(function (results) {
          if (!results || results.length === 0) {
            that.setData({
              hasCollected: false
            });
            wx.showToast({
              title: '删除成功',
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
              isFist: false,
            });
            wx.showToast({
              title: '删除成功',
              icon: 'success',
              duration: 2000
            });
            that.onShow();
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
  onReady: function () {
  
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    var that=this;
    that.checkCollectStatus();
    // 向Bmob请求详情页数据
    // var query = Bmob.Query("JobSeeker");
    // //查询单条数据，第一个参数是这条数据的objectId值
    // query.get(that.data.jobSeekId).then(function(results) {
    //   // 处理photoImgs分割成photoList数组
    //   var photoList = [];
    //   if (results.photoImgs && results.photoImgs.length > 0) {
    //     photoList = results.photoImgs.split('|');
    //   }
    //   console.log("results", results, " photoList:", photoList)
    //   that.setData({
    //     content: results,
    //     num: results.collectNum,
    //     photoList: photoList,
    //   });
    // }).catch(function(error) {
    //   // 查询失败
    // });
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
    wx.showToast({
      title: '此功能暂未启用',
      image: "../../images/warning.png",
      duration: 2000,
      mask: true
    })
  },
  /**
   * swiper轮播改变事件
   */
  onPhotoSwiperChange: function(e) {
    this.setData({
      currentPhotoIndex: e.detail.current
    });
  },
  /**
   * 判断用户是否存在
   */
  isuser:function(){
    var that = this
    var currentUser = Bmob.User.current();
    if (!currentUser) {
      //console.log('用户不存在');
      wx.redirectTo({
        url: '../personal/personal',
    })}else{
    //console.log('用户存在');
      var userId = currentUser.objectId;
      that.setData({
        userId: userId,
      });
    //   var query = Bmob.Query("_User");
    //   query.equalTo("objectId", "==", userId);
    //    //查询用户是否存在
    // query.find().then(function(results) {
    //   //console.log("个人中心判断:共查询到 " + results.length + " 条记录");
    //   if (results.length == 0) {
    //     wx.redirectTo({
    //       url: '../personal/personal',
    //     })
    //   } else {
    //     //用户存在
    //     that.setData({
    //       userId: results[0].objectId,
    //     });
    //     //console.log('用户存在');
    //   }
    // }).catch(function(error) {
    //   //console.log("查询失败: " + error.code + " " + error.message);
    // });

    }
  }

})
