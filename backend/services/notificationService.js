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
<<<<<<< HEAD
      "FCM key not found at backend/config/firebaseServiceKey.json. Push notifications are disabled."
=======
      ""
>>>>>>> origin/main
    );
  }
} catch (error) {
  console.error("FCM init error:", error.message);
}

const isExpoPushToken = (token) => {
  const raw = String(token || "");
  return raw.startsWith("ExponentPushToken[") || raw.startsWith("ExpoPushToken[");
};

const sendExpoPushNotification = async (token, title, body) => {
  try {
    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: token,
        title,
        body,
        sound: "default",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Expo push error:", errorText);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Expo push send error:", error.message);
    return false;
  }
};

export const sendPushNotification = async (token, title, body) => {       //dev tok,notifi tit,content gets from reminderCron
  if (!token) {
    console.log("[Push] Skipped send: no token.");
    return false;
  }

  if (isExpoPushToken(token)) {
    console.log("[Push] Sending Expo notification:", token);
    const sent = await sendExpoPushNotification(token, title, body);
    console.log("[Push] Expo notification result:", sent);
    return sent;
  }

  if (!isFirebaseReady) {
    console.log("[Push] Skipped FCM send: Firebase not initialized.");
    return false;
  }

  try {
    console.log("[Push] Sending FCM notification:", token);
    await admin.messaging().send({            //BE sends to FB and it sends to FE
      token,
      notification: {
        title,
        body,
      },
    });
<<<<<<< HEAD
    console.log("[Push] FCM notification sent successfully.");
=======
>>>>>>> origin/main
    return true;
  } catch (error) {
    console.error("FCM Error:", error.message);
    return false;
  }
};
