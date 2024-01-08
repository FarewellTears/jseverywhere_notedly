module.exports = {
  notes: async (_, args, { models }) => {
    return await models.Note.find();
  },
  note: async (_, { id }, { models }) => {
    return await models.Note.findById(id);
  },
  user: async (_, { username }, { models }) => {
    return await models.User.findOne({ username });
  },
  users: async (_, args, { models }) => {
    return await models.User.find().limit(100);
  },
  me: async (_, args, { models, user }) => {
    if (!user) {
      return null;
    }
    return await models.User.findById(user.id);
  },
  noteFeed: async (_, { cursor }, { models }) => {
    // 硬编码 limit 限量为 10 个元素
    const limit = 10;
    // 把 hasNextPage 默认值设置为 false
    let hasNextPage = false;
    // 如未传入游标，默认查询为空
    // 即从数据库中获取最新的一组笔记
    let cursorQuery = {};

    // 如果传入了游标，则
    // 查询对象 ID 小于游标的笔记
    if (cursor) {
      cursorQuery = { _id: { $lt: cursor } };
    }

    // 从数据库中查找 limit + 1 个笔记，从新到旧排序
    let notes = await models.Note.find(cursorQuery)
      .sort({ _id: -1 })
      .limit(limit + 1);

    // 如果笔记的数量超过 limit
    // 设置 hasNextPage 为 true，截取结果，返回限定的数量
    if (notes.length > limit) {
      hasNextPage = true;
      notes = notes.slice(0, -1);
    }

    // 新游标是笔记动态流数组中最后一个元素的 MongoDB 对象 ID
    const newCursor = notes[notes.length - 1]._id;

    return {
      notes,
      cursor: newCursor,
      hasNextPage,
    };
  },
};
