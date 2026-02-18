const fs = require("fs");
const path = require("path");

module.exports = ({ config }) => {
  const nextConfig = {
    ...config,
    android: {
      ...(config.android || {}),
    },
  };

  const envGoogleServicesPath = process.env.GOOGLE_SERVICES_JSON;
  const defaultGoogleServicesPath = "./android/app/google-services.json";
  const candidatePath = envGoogleServicesPath || defaultGoogleServicesPath;
  const resolvedPath = path.isAbsolute(candidatePath)
    ? candidatePath
    : path.resolve(__dirname, candidatePath);

  if (fs.existsSync(resolvedPath)) {
    nextConfig.android.googleServicesFile = candidatePath;
    console.log("[Expo Config] Using google-services file:", candidatePath);
  } else {
    delete nextConfig.android.googleServicesFile;
    console.warn(
      "[Expo Config] google-services.json not found. Building without Firebase config."
    );
  }

  return nextConfig;
};
