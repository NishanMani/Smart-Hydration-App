import { admin, isFirebaseReady } from "../config/firebase.js";

export const sendPushNotification = async (token, title, body) => {
  if (!isFirebaseReady || !token) {
    return false;
  }

  try {
    await admin.messaging().send({
      token,
      notification: {
        title,
        body,
      },
    });
    console.log(`FCM notification sent: ${title}`);
    return true;
  } catch (error) {
    console.error("FCM Error:", error.message, error.code ? `(${error.code})` : "");
    return false;
  }
};
