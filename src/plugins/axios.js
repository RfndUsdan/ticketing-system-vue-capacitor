import axios from 'axios'
import Cookies from 'js-cookie'

const baseURL =
    import.meta.env.VITE_API_BASE_URL?.trim() || 'http://localhost:8000/api'

export const axiosInstance = axios.create({
    baseURL,
    headers: {
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
    },
})

axiosInstance.interceptors.request.use((config) => {
    const token = Cookies.get('token')
    config.headers = config.headers || {}

    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    } else {
        delete config.headers.Authorization
    }

    return config
})

axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error.response?.status
        const requestPath = String(error.config?.url || '').replace(/\/+$/, '')
        const isPublicAuthRequest =
            requestPath.endsWith('/login') || requestPath.endsWith('/register')

        // A failed login/register is form feedback, not an expired session.
        if (status === 401 && !isPublicAuthRequest) {
            Cookies.remove('token')
            localStorage.removeItem('user')

            if (window.location.pathname !== '/auth/login') {
                window.location.assign('/auth/login')
            }
        }

        // Leave 403 handling to the calling view so it can show the API message.
        return Promise.reject(error)
    },
)
