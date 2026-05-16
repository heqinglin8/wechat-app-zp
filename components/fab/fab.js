Component({
  methods: {
    onFabTap1() {
      // wx.switchTab({
      //   url: '/pages/award/award'
      // });
       wx.navigateTo({
      url: '../award/award'
    })
    },
    onFabTap2() {
       wx.navigateTo({
      url: '../publishjob/publishjob'
    })
    }
  }
});
