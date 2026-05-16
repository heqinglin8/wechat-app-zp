// pages/index/detail.js

//引入SDK
var Bmob = wx.Bmob;
var app = getApp();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    content:'',
    username:'',
    userphone:'',
    objectId:'',
    //收藏个数
    num:'',
    //是否为第一次加载
    isfist:true,
    //轮播图片数组
    photoList: [],
    //当前轮播索引
    currentPhotoIndex: 0,
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
    if (options!=null)
    {

      that.setData({
        objectId: options.objectId,
      });
      //console.log('options为空')
    }else{
     
      //console.log('options不为空')
    }
   
    // 向Bmob请求详情页数据
    var query = Bmob.Query("MyRecommend");
    //查询单条数据，第一个参数是这条数据的objectId值
    query.get(that.data.objectId).then(function(results) {
      // 处理photoImgs分割成photoList数组
      var photoList = [];
      if (results.photoImgs && results.photoImgs.length > 0) {
        photoList = results.photoImgs.split('|');
      }
      that.setData({
        content: results,
        num: results.entNum,
        photoList: photoList,
      });
    }).catch(function(error) {
      // 查询失败
    });
  
  },
  //提交信息
  bindViewPutinfor: function (){
    var that = this;
    //console.log(name);
    //判断用户是否注册
    if (that.data.username.length==0){
      //用户已注册
      wx.showToast({
        title: '请先注册',
        image: "../../images/warning.png",
        duration: 1500
      })  
    }
    else{
    var query = Bmob.Query("MyCollectInfo"); 
    query.equalTo("userphone", "==", that.data.userphone);
    query.equalTo("username", "==", that.data.username);
    query.equalTo("type", "==", "1");
    // 查询用户是否已经被我收藏过
    query.find().then(function(results) {
      //console.log("个人中心判断:共查询到 " + results.length + " 条记录");
      if (results.length == 0) {
       
       //提交用户信息
        var diary = Bmob.Query("MyCollectInfo");
        diary.set("username", that.data.username);
        diary.set("userphone", that.data.userphone);
        diary.set("type", "1");
        diary.save().then(function(result) {
          //收藏表添加成功，
          wx.showToast({
            title: '收藏成功',
            icon: 'success',
            duration: 2000
          });
          //更新求职信息表
          var detailQuery = Bmob.Query("MyRecommend");
          detailQuery.get(that.data.objectId).then(function(result) {
            result.set('collectNum', (that.data.num + 1));
            result.save();
            //console.log('+1')
            that.setData({
              isFist:false,
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
    if(that.data.isFist==false)
    {
    // 向Bmob请求详情页数据
    var query = Bmob.Query("MyRecommend");
    //查询单条数据，第一个参数是这条数据的objectId值
    query.get(that.data.objectId).then(function(results) {
      // 处理photoImgs分割成photoList数组
      var photoList = [];
      if (results.photoImgs && results.photoImgs.length > 0) {
        photoList = results.photoImgs.split('|');
      }
      that.setData({
        content: results,
        photoList: photoList,
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
    var query = Bmob.Query("_User");
    var objectId = wx.getStorageSync('objectId');
    query.equalTo("objectId", "==", objectId);

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
        });
        //console.log('用户存在');
      }
    }).catch(function(error) {
      //console.log("查询失败: " + error.code + " " + error.message);
    });
  }

})