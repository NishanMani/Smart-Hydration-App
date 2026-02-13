import axios from "axios";
import { getToken } from "../services/storageService";

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

export default axiosInstance;
