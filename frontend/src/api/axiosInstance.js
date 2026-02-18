import axios from "axios";
import {
  getToken,
  getRefreshToken,
  removeToken,
  saveToken,
} from "../services/storageService";

const axiosInstance = axios.create({
  baseURL: "http://10.0.2.2:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

axiosInstance.interceptors.request.use(
  async (config) => {
    const token = await getToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

let isRefreshing = false;
let refreshPromise = null;

const refreshAccessToken = async () => {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) {
    throw new Error("No refresh token available");
  }

  const response = await axios.post("http://10.0.2.2:5000/api/auth/refresh", {
    refreshToken,
  });

  const newAccessToken = response?.data?.accessToken;
  if (!newAccessToken) {
    throw new Error("Refresh token flow did not return a new access token");
  }

  await saveToken(newAccessToken);
  return newAccessToken;
};

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error?.config;
    const status = error?.response?.status;
    const isRefreshRequest = originalRequest?.url?.includes("/auth/refresh");

    if (status !== 401 || !originalRequest || originalRequest._retry || isRefreshRequest) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      if (!isRefreshing) {
        isRefreshing = true;
        refreshPromise = refreshAccessToken()
          .finally(() => {
            isRefreshing = false;
          });
      }

      const newAccessToken = await refreshPromise;
      if (!originalRequest.headers) {
        originalRequest.headers = {};
      }
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      return axiosInstance(originalRequest);
    } catch (refreshError) {
      await removeToken();
      return Promise.reject(refreshError);
    }
  }
);

export default axiosInstance;
