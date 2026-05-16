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
    companyName :'',
    detSrc: '',
    objectId:'',
    //报名个数
    num:'',
    //是否为第一次加载
    isfist:true,
    uid:'', //用户id
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
    var query = Bmob.Query("DetailInfo");
    //查询单条数据，第一个参数是这条数据的objectId值
    query.get(that.data.objectId).then(function(results) {
      console.log("onLoad results:",results);
      that.setData({
        content: results,
        companyName: results.companyName,
        detSrc: results.detSrc,
        num: results.entNum,
      });
    }).catch(function(error) {
      // 查询失败
    });
  
  },
  //提交信息
  bindViewPutinfor: function (){
    var companyName =this.data.companyName
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
    var query = Bmob.Query("MyJoinInfo"); 
    query.equalTo("userPhone", "==", that.data.userphone);
    query.equalTo("joinCompanyName", "==", that.data.companyName);
    // 查询用户是否已经报名过这家公司
    query.find().then(function(results) {
      //console.log("个人中心判断:共查询到 " + results.length + " 条记录");
      if (results.length == 0) {
       
       //提交用户信息
        var diary = Bmob.Query("MyJoinInfo");
        diary.set("userName", that.data.username);
        diary.set("userPhone", Number(that.data.userphone));
        diary.set("joinCompanyName", that.data.companyName);
        diary.set("uid", that.data.uid);
        diary.set("detSrc", that.data.detSrc);
        diary.save().then(function(result) {
          // 报名表添加成功，
          wx.showToast({
            title: '报名成功',
            icon: 'success',
            duration: 2000
          });
          //更新招聘信息表
          var detailQuery = Bmob.Query("DetailInfo");
          detailQuery.get(that.data.objectId).then(function(result) {
            result.set('entNum', (that.data.num + 1));
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
        //用户已报名
        wx.showToast({
          title: '已参加过报名',
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
    var query = Bmob.Query("DetailInfo");
    //查询单条数据，第一个参数是这条数据的objectId值
    query.get(that.data.objectId).then(function(results) {
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
          uid: results[0].objectId,
        });
        //console.log('用户存在');
      }
    }).catch(function(error) {
      //console.log("查询失败: " + error.code + " " + error.message);
    });
  }

})