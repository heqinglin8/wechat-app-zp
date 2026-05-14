Component({
  methods: {
    onFabTap() {
      // wx.switchTab({
      //   url: '/pages/award/award'
      // });
       wx.navigateTo({
      url: '../award/award'
    })
    }
  }
});
