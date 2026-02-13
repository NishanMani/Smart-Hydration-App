import axiosInstance from "./axiosInstance";

export const getUserProfile = () => {
  return axiosInstance.get("/user/profile");
};

export const updateUserProfile = (data) => {
  return axiosInstance.put("/user/profile", data);
};

