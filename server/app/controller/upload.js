'use strict';

const Controller = require('egg').Controller;
const awaitWriteStream = require('await-stream-ready').write;
const sendToWormhole = require('stream-wormhole');
const fs = require('fs');
const path = require('path');
const Excel = require('exceljs');

class UploadController extends Controller {
  async uploadAvatar() {
    const { ctx, service } = this;
    const id = ctx.state.user.data._id;
    const stream = await ctx.getFileStream();
    const extname = path.extname(stream.filename).toLowerCase(); // 文件扩展名称
    const uuid = (Math.random() * 999999).toFixed();

    // 组装参数 stream
    const target = path.join(
      this.config.baseDir,
      'app/public/uploads',
      `${uuid}${extname}`
    );
    const writeStream = fs.createWriteStream(target);
    const user = await service.user.findByUserId(id);
    if (user.avatarUrl && !user.avatarUrl.includes('77058')) {
      await fs.unlinkSync(`app${user.avatarUrl}`, function(err) {
        if (err) throw err;
      });
    }
    // 文件处理，上传到云存储等等
    try {
      await awaitWriteStream(stream.pipe(writeStream));
      await service.user.findByIdAndUpdate(id, {
        avatarUrl: `/public/uploads/${uuid}${extname}`,
      });
    } catch (err) {
      // 必须将上传的文件流消费掉，要不然浏览器响应会卡死
      await sendToWormhole(stream);
      throw err;
    }

    const res = {
      avatarUrl: `/public/uploads/${uuid}${extname}`,
    };
    ctx.helper.success({ ctx, res });
  }
  // 文件导出
  async tableExport() {
    const { ctx } = this;
    const uuid = (Math.random() * 999999).toFixed();
    // 初始化excel
    const workbook = new Excel.Workbook();
    const sheet = workbook.addWorksheet();

    sheet.columns = [
      { header: '名称', key: 'name', width: 15 },
      { header: '日期', key: 'date', width: 15 },
      { header: '地址', key: 'address', width: 100 },
    ];
    const data = ctx.request.body || {};
    sheet.addRows(data.selectOption);
    this.ctx.set('Content-Disposition', `attachment;filename=${uuid}.xlsx`);
    this.ctx.set('content-Type', 'application/ms-excel');
    this.ctx.set('Access-Control-Expose-Headers', 'Content-Disposition');
    ctx.status = 200;
    await workbook.xlsx.write(ctx.res);
    ctx.res.end();
  }
  // excel文件上传
  async tableUpload() {
    const { ctx, service } = this;
    const stream = await ctx.getFileStream();
    const res = await service.upload.uploadExcel(stream);
    ctx.helper.success({ ctx, res });
  }
}

module.exports = UploadController;
