import axios from 'axios';

/**
 * MS360 Cloud Service (Via Cloudflare Tunnel)
 * 
 * Agora ligado ao túnel público: 
 * leg-exclude-lean-encourage.trycloudflare.com
 */
const API_URL = "https://leg-exclude-lean-encourage.trycloudflare.com";

console.log("MS360 API Cloud Ativa em:", API_URL);

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  }
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
