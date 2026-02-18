import admin from "firebase-admin";    //Firebase’s backend SDK
import fs from "fs";

let isFirebaseReady = false;

try {
  const keyUrl = new URL("../config/firebaseServiceKey.json", import.meta.url);
  if (fs.existsSync(keyUrl)) {
    const serviceAccount = JSON.parse(
      fs.readFileSync(keyUrl, "utf8")
    );

    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    }
    isFirebaseReady = true;
  } else {
    console.warn(
      ""
    );
  }
} catch (error) {
  console.error("FCM init error:", error.message);
}

export const sendPushNotification = async (token, title, body) => {       //dev tok,notifi tit,content gets from reminderCron
  if (!isFirebaseReady || !token) {
    return false;
  }

  try {
    await admin.messaging().send({            //BE sends to FB and it sends to FE
      token,
      notification: {
        title,
        body,
      },
    });
    return true;
  } catch (error) {
    console.error("FCM Error:", error.message);
    return false;
  }
};
