import AsyncStorage from
"@react-native-async-storage/async-storage";

export const saveToken = async (token) => {
  await AsyncStorage.setItem(
    "authToken",
    token
  );
};

export const saveRefreshToken = async (token) => {
  await AsyncStorage.setItem(
    "refreshToken",
    token
  );
};

export const getToken = async () => {
  return await AsyncStorage.getItem(
    "authToken"
  );
};

export const getRefreshToken = async () => {
  return await AsyncStorage.getItem(
    "refreshToken"
  );
};

export const removeToken = async () => {
  await AsyncStorage.multiRemove([
    "authToken",
    "refreshToken",
  ]);
};
