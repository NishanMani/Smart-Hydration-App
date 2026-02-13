import axiosInstance from "./axiosInstance";

export const addWaterLog = (amount) => {
  return axiosInstance.post("/water/add", { amount });
};

export const deleteWaterLog = (id) => {
  return axiosInstance.delete(`/water/${id}`);
};

export const getDailySummary = () => {
  return axiosInstance.get("/water/daily");
};

