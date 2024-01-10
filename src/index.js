// index.js
// This is the main entry point of our application
const express = require('express');
const jwt = require('jsonwebtoken');
const helmet = require('helmet');
const cors = require('cors');
const depthLimit = require('graphql-depth-limit');
const { createComplexityLimitRule } = require('graphql-validation-complexity');
const { ApolloServer } = require('apollo-server-express');
require('dotenv').config();

// 导入本地模块
const db = require('./db');
const models = require('./models');
const typeDefs = require('./schema');
const resolvers = require('./resolvers');

// 在 .env 文件指定的端口或 4000 端口上运行服务器
const port = process.env.PORT || 4000;
// 把 DB_HOST 值存入一个变量
const DB_HOST = process.env.DB_HOST;

const app = express();
app.use(helmet());
app.use(cors());

// 通过 JWT 获取用户信息
const getUser = (token) => {
  if (token) {
    try {
      // 通过令牌获取用户信息
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      // 如果令牌无效，则抛出错误
      throw new Error('Session invalid');
    }
  }
  // 如果没有 token，则返回 null
  return null;
};

// 连接到 MongoDB 数据库
db.connect(DB_HOST);

// 设置 Apollo Server
const server = new ApolloServer({
  typeDefs,
  resolvers,
  validationRules: [
    depthLimit(5),
    // createComplexityLimitRule(1000, { ignoreIntrospection: true }),
    createComplexityLimitRule(1000),
  ],
  // 将数据库模型传递给上下文
  context: ({ req }) => {
    // 从首部中获取用户令牌
    const token = req.headers.authorization;
    // 使用令牌检索用户
    const user = getUser(token);
    // 将用户输出到控制台中
    console.log(user);
    // 将数据库模型和用户信息添加到上下文
    return { models, user };
  },
  // fix: Server cannot be reached
  playground: true,
  introspection: true,
});

// 应用 Apollo Server 的中间件，把路径设置为 /api，这样就可以在浏览器中访问 http://localhost:4000/api
server.applyMiddleware({ app, path: '/api' });

app.get('/', (_, res) => {
  res.send('Hello Web Server!!!');
});

app.listen(port, () =>
  console.log(
    `GraphQL Server running at http://localhost:${port} ${server.graphqlPath}`,
  ),
);
