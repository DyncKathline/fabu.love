"use strict";

import { request, summary, tags, body, description, query } from "../swagger";
import User from "../model/user";
import Team from "../model/team";
import Message from "../model/message";

import { responseWrapper } from "../helper/util";
import bcrypt from "bcrypt";
import Fawn from "fawn";

const tag = tags(["消息"]);

module.exports = class MessageRouter {
  @request("get", "/api/messages")
  @summary("获取该用户未读消息列表")
  @query({
    page: { type: "number", default: 0, description: "分页页码(可选)" },
    size: { type: "number", default: 10, description: "每页条数(可选)" }
  })
  @tag
  static async getMessages(ctx, next) {
    const page = ctx.query.page || 0;
    const size = ctx.query.size || 10;
    const user = ctx.state.user.data;

    const result = await Message.findAll({
      where: { receiver: user.id },
      offset: page,
      limit: size
    });
    ctx.body = responseWrapper(result);
  }

  @request("get", "/api/messages/count")
  @summary("获取消息总条数和未读条数")
  @tag
  static async getMessageCount(ctx, next) {
    const { caches } = ctx;
    const user = ctx.state.user.data;
    const count = await Message.count({
      where: { receiver: user.id }
    });
    // let status = caches.Status.filter((value) => {
    //   return value.name === "unread";
    // });
    // if(status.length > 0) {
    //   status = status[0]
    // }
    const unread = await Message.count({
      where: { receiver: user.id, status: 1 }
    });
    ctx.body = responseWrapper({ total: count, unread: unread });
  }

  @request("get", "/api/messages/markread")
  @summary("把消息全部标记为已读")
  @tag
  static async markMessageRead(ctx, next) {
    const { caches } = ctx;
    const user = ctx.state.user.data;
    // let status = caches.Status.filter((value) => {
    //   return value.name === "unread";
    // });
    // if(status.length > 0) {
    //   status = status[0]
    // }
    const result = await Message.update({
        status: 2
    }, {
      where: { receiver: user.id, status: 1}
    });
    ctx.body = responseWrapper(true,'所有消息已标记已读');
  }

  @request("delete", "/api/messages")
  @summary("清空消息列表")
  @query({
    page: { type: "number", default: 0, description: "分页页码(可选)" },
    size: { type: "number", default: 10, description: "每页条数(可选)" }
  })
  @tag
  static async clearMessages(ctx, next) {
    const page = ctx.query.page || 0;
    const size = ctx.query.size || 10;
    const user = ctx.state.user.data;
    await Message.destroy({
      where: { receiver: user.id }
    });
    ctx.body = responseWrapper(true, "消息已清空");
  }
};
