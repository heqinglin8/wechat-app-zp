Page({
  data: {
    qrCode: '/images/sg_zhaopin_qr_code.png'
  },

  previewQrCode: function () {
    wx.previewImage({
      current: this.data.qrCode,
      urls: [this.data.qrCode]
    });
  }
});
