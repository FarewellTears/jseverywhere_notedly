const mongoose = require('mongoose');
const bycrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const {
  AuthenticationError,
  ForbiddenError,
} = require('apollo-server-express');
require('dotenv').config();

const gravatar = require('../util/gravatar');

module.exports = {
  newNote: async (_, { content }, { models, user }) => {
    if (!user) {
      throw new AuthenticationError('You must be logged in to create a note');
    }
    return await models.Note.create({
      content,
      author: mongoose.Types.ObjectId(user.id),
      favoriteCount: 0,
    });
  },
  updateNote: async (_, { id, content }, { models, user }) => {
    // 如果上下文中没有用户，则抛出 AuthenticationError
    if (!user) {
      throw new AuthenticationError('You must be logged in to update a note');
    }
    // 查找笔记
    const note = await models.Note.findById(id);
    // 验证用户是否有权限更新
    if (note && String(note.author) !== user.id) {
      throw new ForbiddenError(
        'You must be the author of the note to update it',
      );
    }
    // 通过所有检查后更新笔记
    try {
      return await models.Note.findOneAndUpdate(
        { _id: id },
        { $set: { content } },
        { new: true },
      );
    } catch (err) {
      return false;
    }
  },
  deleteNote: async (_, { id }, { models, user }) => {
    // 验证用户是否有权限删除，如果上下文中没有用户，则抛出 AuthenticationError
    if (!user) {
      throw new AuthenticationError('You must be logged in to delete a note');
    }
    // 查找笔记
    const note = await models.Note.findById(id);
    // 验证用户是否有权限删除
    if (note && String(note.author) !== user.id) {
      throw new ForbiddenError(
        'You must be the author of the note to delete it',
      );
    }
    try {
      // 通过所有检查后删除笔记
      await note.remove();
      return true;
    } catch (err) {
      // 如果检查过程中发现错误，则返回 false
      return false;
    }
  },
  signUp: async (_, { username, email, password }, { models }) => {
    // 规范电子邮件地址
    email = email.trim().toLowerCase();
    // 计算密码哈希值
    const hashed = await bycrypt.hash(password, 10);
    // 生成 Gravatar 地址
    const avatar = gravatar(email);
    try {
      const user = await models.User.create({
        username,
        email,
        avatar,
        password: hashed,
      });
      // 创建并返回 JSON Web Token（JWT）
      return jwt.sign({ id: user._id }, process.env.JWT_SECRET);
    } catch (err) {
      console.log(err);
      // 如果创建账户遇到问题，抛出错误
      throw new Error('Error creating account');
    }
  },
  signIn: async (_, { username, email, password }, { models }) => {
    if (email) {
      // 规范电子邮件地址
      email = email.trim().toLowerCase();
    }
    const user = await models.User.findOne({
      $or: [{ email }, { username }],
    });
    // 如果没有找到用户，抛出 AuthenticationError
    if (!user) {
      throw new AuthenticationError('Error signing in');
    }
    // 如果密码不匹配，抛出 AuthenticationError
    const valid = await bycrypt.compare(password, user.password);
    if (!valid) {
      throw new AuthenticationError('Error signing in');
    }

    // 创建并返回 JSON Web Token（JWT）
    return jwt.sign({ id: user._id }, process.env.JWT_SECRET);
  },
  toggleFavorite: async (_, { id }, { models, user }) => {
    // 如果上下文中没有用户，则抛出 AuthenticationError
    if (!user) {
      throw new AuthenticationError('Error signing in');
    }
    // 检查用户是否已经收藏该笔记
    let noteCheck = await models.Note.findById(id);
    const hashUser = noteCheck.favoritedBy.indexOf(user.id);

    // 如果当前用户在列表中
    // 把用户从列表中删除，并把 ‘favoriteCount’ 字段减 1
    if (hashUser >= 0) {
      return await models.Note.findByIdAndUpdate(
        id,
        {
          $pull: { favoritedBy: mongoose.Types.ObjectId(user.id) },
          $inc: { favoriteCount: -1 },
        },
        {
          // 返回更新后的笔记
          new: true,
        },
      );
    } else {
      // 如果当前用户不在列表中
      // 把用户添加到列表，并把 ‘favoriteCount’ 字段加 1
      return await models.Note.findByIdAndUpdate(
        id,
        {
          $push: { favoritedBy: mongoose.Types.ObjectId(user.id) },
          $inc: { favoriteCount: 1 },
        },
        {
          // 返回更新后的笔记
          new: true,
        },
      );
    }
  },
};
