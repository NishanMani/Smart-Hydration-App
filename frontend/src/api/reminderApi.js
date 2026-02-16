import axiosInstance from "./axiosInstance";

export const getReminder = () => {
  return axiosInstance.get("/reminder");
};

export const setReminder = (data) => {
  return axiosInstance.post("/reminder/set", data);
};

export const setSleepMode = (sleepMode) => {
  return axiosInstance.put("/reminder/sleep", { sleepMode });
};

export const setReminderPause = (isPaused) => {
  return axiosInstance.put("/reminder/pause", { isPaused });
};

export const toggleSleepMode = () => {
  return axiosInstance.put("/reminder/sleep");
};
