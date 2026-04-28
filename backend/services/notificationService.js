import admin from "./firebaseAdmin.js";

export const sendNotification = async (token, data) => {
  await admin.messaging().send({
    token,
    notification: {
      title: data.title,
      body: data.body,
    },
  });
};