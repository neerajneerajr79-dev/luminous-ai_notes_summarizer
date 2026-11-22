import axios from 'axios';

// Axios instance with credentials so the HTTP-only auth cookie is sent.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});
// Extract the backend message into a friendly Error.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const message =
      error.response?.data?.message ||
      (error.code === 'ERR_NETWORK'
        ? 'Cannot reach the server. Is the Lumio API running on port 5000?'
        : error.message || 'Something went wrong');

    if (status === 401 && !error.config?.url?.includes('/auth/')) {
      // Session expired: bounce to login unless it is an auth call itself.
      localStorage.removeItem('lumio_user');
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(new Error(message));
  }
);

export default api;

/** File upload with progress callback (onProgress receives 0-100). */
export function uploadFile(path, formData, { onProgress } = {}) {
  return api.post(path, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => {
      if (onProgress && e.total) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    },
  });
}
