import axios from 'axios'
import Cookies from 'js-cookie'

const token = Cookies.get('token')

axios.defaults.baseURL = 'http://192.168.1.11:8000/api'
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest'
// axios.defaults.headers.common['Content-Type'] = 'application/json'
axios.defaults.headers.common['Accept'] = 'application/json'
axios.defaults.headers.common['Authorization'] = `Bearer ${token}`

axios.interceptors.request.use(
    config => {
        const token = Cookies.get('token')
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }
        return config
    },
)

axios.interceptors.response.use(
    response => {
        return response
    },
    error => {
        if (error.response) {
            if (error.response.status === 403) {
                alert('Akses ditolak! Anda tidak memiliki izin untuk halaman ini.')
                window.location.href = '/' 
            }

            if (error.response.status === 401) {
                Cookies.remove('token') 
                window.location.href = '/auth/login'
            }
        }

        return Promise.reject(error)
    }
)

export const axiosInstance = axios