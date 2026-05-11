// Backend API base URL - uses environment variable in production, falls back to localhost for development
export const BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000'
export const USERS_URL = '/users'
export const FRONT_URL = import.meta.env.VITE_FRONTEND_URL || 'http://localhost:5173'
export const PYTHON_URL = import.meta.env.VITE_FLASK_URL || 'http://127.0.0.1:5000'
