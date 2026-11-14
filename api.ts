import axios from "axios";
import { getAccessToken } from "./supabase";

const api = axios.create({ baseURL: "" });

api.interceptors.request.use(async (config) => {
  const token = await getAccessToken();
  if (token) {
    if (!config.headers) {
      config.headers = {} as any;
    }
    (config.headers as any).Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
