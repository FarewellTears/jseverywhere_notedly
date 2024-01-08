// 引入 mongoose 库
const mongoose = require('mongoose');

module.exports = {
  connect: (DB_HOST) => {
    // 使用 Mongo 驱动新的 URL 字符串解析器
    mongoose.set('useNewUrlParser', true);
    // 使用 findOneAndUpdate() 代替 findAndModify()
    mongoose.set('useFindAndModify', false);
    // 使用 createIndex() 代替 ensureIndex()
    mongoose.set('useCreateIndex', true);
    // 使用新的服务器发现和监视引擎
    mongoose.set('useUnifiedTopology', true);
    // 连接到 MongoDB 数据库
    mongoose.connect(DB_HOST);
    // 连接成功后的回调
    mongoose.connection.on('connected', () => {
      console.log('Mongoose default connection open to ' + DB_HOST);
    });
    // 连接错误的回调，记录日志并退出进程
    mongoose.connection.on('error', (err) => {
      console.error(err);
      console.log(
        'MongoDB connection error. Please make sure MongoDB is running.',
      );
      process.exit();
    });
  },
  close: () => {
    mongoose.connection.close();
  },
};
