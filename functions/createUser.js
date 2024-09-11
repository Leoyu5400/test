exports = async function (authEvent) {
  const serviceName = "mongodb-atlas"; // MongoDB 服务名
  const dbName = "master_data"; // 数据库名称
  const collName = "users"; // 用户集合名称
  const collection = context.services
    .get(serviceName)
    .db(dbName)
    .collection(collName);
  debugger;
  const userId = authEvent.user.id; // 获取新注册用户的 ID
  const email = authEvent.user.data.email; // 获取新注册用户的 Email

  // 假设用户在注册时也提交了密码（需要通过 App 提交）
  const password = authEvent.user.data.password;

  try {
    // 将新用户的密码存储到 users 表中，确保对密码加密
    //const hashedPassword = await hashPassword(password); // 使用自定义函数进行密码加密

    // console.log(`${hashedPassword}`);

    // 将新用户插入到 users 集合中
    await collection.insertOne({
      userId: userId,
      email: email,
      password: password, // 存储加密后的密码
      createdOn: new Date(),
    });

    console.log(`User ${email} created successfully with userId ${userId}`);
  } catch (err) {
    console.error(`Error creating user ${email}: `, err.message);
  }
};

// 自定义函数来加密密码
async function hashPassword(password) {
  const bcrypt = require("bcryptjs");
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}
