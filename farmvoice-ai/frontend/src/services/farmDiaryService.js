import api from "./api";

export const farmDiaryService = {
  // =========================
  // Crops
  // =========================
  listCrops: () => api.get("/api/farm-diary/crops"),
  addCrop: (data) => api.post("/api/farm-diary/crops", data),
  getCrop: (cropId) => api.get(`/api/farm-diary/crops/${cropId}`),
  updateCrop: (cropId, data) => api.put(`/api/farm-diary/crops/${cropId}`, data),
  deleteCrop: (cropId) => api.delete(`/api/farm-diary/crops/${cropId}`),

  // =========================
  // Activities
  // =========================
  listActivities: (params) => {
    let url = "/api/farm-diary/activities";

    if (params) {
      const queryParams = [];

      if (params.type)
        queryParams.push(`type=${encodeURIComponent(params.type)}`);

      if (params.crop_id)
        queryParams.push(`crop_id=${encodeURIComponent(params.crop_id)}`);

      if (params.date)
        queryParams.push(`date=${encodeURIComponent(params.date)}`);

      if (queryParams.length > 0) url += `?${queryParams.join("&")}`;
    }

    return api.get(url);
  },

  addActivity: (data) => api.post("/api/farm-diary/activities", data),

  updateActivity: (activityId, data) =>
    api.put(`/api/farm-diary/activities/${activityId}`, data),

  deleteActivity: (activityId) =>
    api.delete(`/api/farm-diary/activities/${activityId}`),

  // =========================
  // Fertilizer Records
  // =========================
  listFertilizers: (params) => {
    let url = "/api/farm-diary/fertilizers";

    if (params?.crop_id) {
      url += `?crop_id=${encodeURIComponent(params.crop_id)}`;
    }

    return api.get(url);
  },

  addFertilizer: (data) => api.post("/api/farm-diary/fertilizers", data),

  updateFertilizer: (recordId, data) =>
    api.put(`/api/farm-diary/fertilizers/${recordId}`, data),

  deleteFertilizer: (recordId) =>
    api.delete(`/api/farm-diary/fertilizers/${recordId}`),

  // =========================
  // Irrigation Records
  // =========================
  listIrrigation: (params) => {
    let url = "/api/farm-diary/irrigation";

    if (params?.crop_id) {
      url += `?crop_id=${encodeURIComponent(params.crop_id)}`;
    }

    return api.get(url);
  },

  addIrrigation: (data) => api.post("/api/farm-diary/irrigation", data),

  updateIrrigation: (recordId, data) =>
    api.put(`/api/farm-diary/irrigation/${recordId}`, data),

  deleteIrrigation: (recordId) =>
    api.delete(`/api/farm-diary/irrigation/${recordId}`),

  // =========================
  // Pest Management
  // =========================
  listPestManagement: (params) => {
    const queryParams = new URLSearchParams();

    if (params?.crop_id) queryParams.append("crop_id", params.crop_id);

    if (params?.type) queryParams.append("type", params.type);

    if (params?.date) queryParams.append("date", params.date);

    const query = queryParams.toString();

    return api.get(
      query
        ? `/api/farm-diary/pest-management?${query}`
        : "/api/farm-diary/pest-management",
    );
  },

  addPestManagement: (data) => api.post("/api/farm-diary/pest-management", data),

  updatePestManagement: (recordId, data) =>
    api.put(`/api/farm-diary/pest-management/${recordId}`, data),

  deletePestManagement: (recordId) =>
    api.delete(`/api/farm-diary/pest-management/${recordId}`),

  // =========================
  // Harvest Records
  // =========================
  listHarvest: (params) => {
    const queryParams = new URLSearchParams();

    if (params?.crop_id) queryParams.append("crop_id", params.crop_id);

    if (params?.date) queryParams.append("date", params.date);

    const query = queryParams.toString();

    return api.get(
      query ? `/api/farm-diary/harvest?${query}` : "/api/farm-diary/harvest",
    );
  },

  addHarvest: (data) => api.post("/api/farm-diary/harvest", data),

  updateHarvest: (recordId, data) =>
    api.put(`/api/farm-diary/harvest/${recordId}`, data),

  deleteHarvest: (recordId) => api.delete(`/api/farm-diary/harvest/${recordId}`),

  // =========================
  // Farm Expenses
  // =========================
  listExpenses: (params) => {
    const queryParams = new URLSearchParams();

    if (params?.crop_id) queryParams.append("crop_id", params.crop_id);

    if (params?.category) queryParams.append("category", params.category);

    if (params?.date) queryParams.append("date", params.date);

    const query = queryParams.toString();

    return api.get(
      query ? `/api/farm-diary/expenses?${query}` : "/api/farm-diary/expenses",
    );
  },

  addExpense: (data) => api.post("/api/farm-diary/expenses", data),

  updateExpense: (expenseId, data) =>
    api.put(`/api/farm-diary/expenses/${expenseId}`, data),

  deleteExpense: (expenseId) => api.delete(`/api/farm-diary/expenses/${expenseId}`),
};
