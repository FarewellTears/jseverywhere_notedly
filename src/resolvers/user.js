module.exports = {
  // 解析用户发布的所有笔记信息
  notes: async (user, args, { models }) => {
    return await models.Note.find({ author: user.id }).sort({ _id: -1 });
  },
  // 解析用户收藏的所有笔记信息
  favorites: async (user, args, { models }) => {
    return await models.Note.find({ favoritedBy: user.id }).sort({ _id: -1 });
  },
};
