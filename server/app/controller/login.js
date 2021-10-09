'use strict';

const Controller = require('egg').Controller;

class LoginController extends Controller {
  async index() {
    const { ctx, service } = this;
    // 参数类型
    const obj = {
      username: {
        type: 'string',
        required: true,
      },
      password: {
        type: 'string',
        required: true,
      },
      verify: {
        type: 'string',
        required: true,
      },
    };
    // 是否符合传参类型
    ctx.validate(obj);
    // 用户登录信息
    const userInfo = ctx.request.body || {};
    const res = await service.login.index(userInfo);
    ctx.helper.success({
      ctx,
      res,
    });
  }
  async getVerify() {
    const { ctx, service } = this;
    const captcha = await service.login.captcha();
    // ctx.response.type = "image/svg+xml"
    ctx.body = captcha.data;
  }
}

module.exports = LoginController;
