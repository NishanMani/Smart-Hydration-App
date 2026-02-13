import axiosInstance from "./axiosInstance";

export const getWeeklyAnalytics = () => {
  return axiosInstance.get("/analytics/weekly");
};

export const getMonthlyAnalytics = () => {
  return axiosInstance.get("/analytics/monthly");
};

export const getStreakAnalytics = () => {
  return axiosInstance.get("/analytics/streak");
};

export const getPerformance = () => {
  return axiosInstance.get("/analytics/performance");
};

