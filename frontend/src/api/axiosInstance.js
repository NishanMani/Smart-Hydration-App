import axios from "axios";
import { getToken } from "../services/storageService";

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  "http://210.0.2.:3000/api";

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
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

export default axiosInstance;
