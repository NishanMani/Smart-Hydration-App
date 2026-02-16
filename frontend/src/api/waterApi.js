import axiosInstance from "./axiosInstance";

export const addWaterLog = (amount) => {
  return axiosInstance.post("/water/add", { amount });
};

export const deleteWaterLog = (id) => {
  return axiosInstance.delete(`/water/${id}`);
};

export const updateWaterLog = (id, amount) => {
  return axiosInstance.put(`/water/update/${id}`, { amount });
};

export const getDailySummary = () => {
  return axiosInstance.get("/water/daily");
};

export const getHistoryInsights = (params = {}) => {
  const queryParts = [];

  if (params.from) {
    queryParts.push(`from=${encodeURIComponent(String(params.from))}`);
  }
  if (params.to) {
    queryParts.push(`to=${encodeURIComponent(String(params.to))}`);
  }
  if (params.page) {
    queryParts.push(`page=${encodeURIComponent(String(params.page))}`);
  }
  if (params.limit) {
    queryParts.push(`limit=${encodeURIComponent(String(params.limit))}`);
  }

  const suffix = queryParts.join("&");
  const url = suffix ? `/water/history?${suffix}` : "/water/history";
  return axiosInstance.get(url);
};

export const exportHistoryPdf = (params = {}) => {
  const queryParts = [];

  if (params.from) {
    queryParts.push(`from=${encodeURIComponent(String(params.from))}`);
  }
  if (params.to) {
    queryParts.push(`to=${encodeURIComponent(String(params.to))}`);
  }

  const suffix = queryParts.join("&");
  const url = suffix
    ? `/water/history/export/pdf?${suffix}`
    : "/water/history/export/pdf";
  return axiosInstance.get(url);
};
