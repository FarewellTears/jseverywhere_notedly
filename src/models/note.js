// 引入 mongoose 库
const mongoose = require('mongoose');

// 定义笔记的数据库模式
const noteSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    favoriteCount: {
      type: Number,
      default: 0,
    },
    favoritedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    // 为每个文档添加 Date 类型的 createdAt 和 updatedAt 字段
    timestamps: true,
  },
);

// 通过模式定义 'Note' 模型
const Note = mongoose.model('Note', noteSchema);
// 导出 'Note' 模型
module.exports = Note;
