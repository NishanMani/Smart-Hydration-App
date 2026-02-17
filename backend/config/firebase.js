import admin from "firebase-admin";
import fs from "fs";

let isFirebaseReady = false;

try {
  const keyUrl = new URL("./firebaseServiceKey.json", import.meta.url);

  if (fs.existsSync(keyUrl)) {
    const serviceAccount = JSON.parse(fs.readFileSync(keyUrl, "utf8"));

    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    }

    isFirebaseReady = true;
  } else {
    console.warn(
      "FCM key not found at backend/config/firebaseServiceKey.json. Push notifications are disabled."
    );
  }
} catch (error) {
  console.error("FCM init error:", error.message);
}

export { admin, isFirebaseReady };
