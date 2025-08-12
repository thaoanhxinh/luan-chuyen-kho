import api from "./api";

export const authService = {
  async login(credentials) {
    const response = await api.post("/auth/login", credentials);
    return response.data;
  },

  async getProfile() {
    const response = await api.get("/auth/profile");
    return response.data;
  },

  async logout() {
    localStorage.removeItem("token");
  },
};
