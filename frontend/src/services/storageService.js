import AsyncStorage from
"@react-native-async-storage/async-storage";

export const saveToken = async (token) => {
  console.log("[Storage] Saving auth token:", token);
  await AsyncStorage.setItem(
    "authToken",
    token
  );
};

export const saveRefreshToken = async (token) => {
  console.log("[Storage] Saving refresh token:", token);
  await AsyncStorage.setItem(
    "refreshToken",
    token
  );
};

export const getToken = async () => {
  const token = await AsyncStorage.getItem(
    "authToken"
  );
  console.log("[Storage] Loaded auth token:", token);
  return token;
};

export const getRefreshToken = async () => {
  const token = await AsyncStorage.getItem(
    "refreshToken"
  );
  console.log("[Storage] Loaded refresh token:", token);
  return token;
};

export const removeToken = async () => {
  console.log("[Storage] Clearing auth and refresh tokens");
  await AsyncStorage.multiRemove([
    "authToken",
    "refreshToken",
  ]);
};
