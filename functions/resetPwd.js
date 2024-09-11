/*
    This function will be run when the client SDK 'callResetPasswordFunction' is called with an object parameter that
    contains five keys: 'token', 'tokenId', 'username', 'password', and 'currentPasswordValid'.
    'currentPasswordValid' is a boolean will be true if a user changes their password by entering their existing
    password and the password matches the actual password that is stored. Additional parameters are passed in as part
    of the argument list from the SDK.

    The return object must contain a 'status' key which can be empty or one of three string values:
      'success', 'pending', or 'fail'

    'success': the user's password is set to the passed in 'password' parameter.

    'pending': the user's password is not reset and the UserPasswordAuthProviderClient 'resetPassword' function would
      need to be called with the token, tokenId, and new password via an SDK. (see below)

      const Realm = require("realm");
      const appConfig = {
          id: "my-app-id",
          timeout: 1000,
          app: {
              name: "my-app-name",
              version: "1"
          }
        };
      let app = new Realm.App(appConfig);
      let client = app.auth.emailPassword;
      await client.resetPassword(token, tokenId, newPassword);

    'fail': the user's password is not reset and will not be able to log in with that password.

    If an error is thrown within the function the result is the same as 'fail'.

    Example below:

    exports = (
      { token, tokenId, username, password, currentPasswordValid },
      sendEmail,
      securityQuestionAnswer
    ) => {
      // process the reset token, tokenId, username and password
      if (sendEmail) {
        context.functions.execute(
          "sendResetPasswordEmail",
          username,
          token,
          tokenId
        );
        // will wait for SDK resetPassword to be called with the token and tokenId
        return { status: "pending" };
      } else if (
        context.functions.execute(
          "validateSecurityQuestionAnswer",
          username,
          securityQuestionAnswer || currentPasswordValid
        )
      ) {
        // will set the users password to the password parameter
        return { status: "success" };
      }

    The uncommented function below is just a placeholder and will result in failure.
  */

exports = async ({ token, tokenId, username, password, currentPasswordValid }, sendEmail, securityQuestionAnswer) => {
  const serviceName = "mongodb-atlas";  // MongoDB 数据库服务的名称
  const dbName = "master_data";         // 数据库名称
  const collName = "users";             // 集合名称
  const collection = context.services.get(serviceName).db(dbName).collection(collName);

  try {
    // 如果需要发送重置密码邮件
    if (sendEmail) {
      // 调用 sendResetPasswordEmail 函数发送重置密码的邮件
      await context.functions.execute(
        "sendResetPasswordEmail",
        username,
        token,
        tokenId
      );
      // 返回状态 'pending'，等待调用 SDK 的 resetPassword 方法
      return { status: "pending" };
    }

    // 验证安全问题或当前密码是否有效
    const isValidSecurityAnswer = await context.functions.execute(
      "validateSecurityQuestionAnswer",
      username,
      securityQuestionAnswer || currentPasswordValid
    );

    if (isValidSecurityAnswer) {
      // 查询用户，确保该用户存在
      const user = await collection.findOne({ UserName: username });
      if (!user) {
        throw new Error("User not found");
      }

      // 更新用户密码，假设密码字段为 'password'
      await collection.updateOne(
        { UserName: username },
        { $set: { PassWord: password } }
      );
      return { status: "success" };  // 返回成功状态
    } else {
      return { status: "fail", message: "Invalid security answer or current password." };
    }
  } catch (err) {
    console.log("Error during password reset: ", err.message);
    return { status: "fail", message: err.message };
  }
};

