import axiosInstance from "./axiosInstance";

export const getReminder = () => {
  return axiosInstance.get("/reminder");
};

export const setReminder = (data) => {
  return axiosInstance.post("/reminder/set", data);
};

export const toggleSleepMode = () => {
  return axiosInstance.put("/reminder/sleep");
};

