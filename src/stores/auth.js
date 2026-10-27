import { defineStore } from "pinia";
import { axiosInstance } from "@/plugins/axios";
import { handleError } from "@/helpers/errorHelper";
import router from "@/router";
import Cookies from "js-cookie";

export const useAuthStore = defineStore("auth", {
    state: () => ({
        user: JSON.parse(localStorage.getItem('user')) || null,
        loading: false,
        error: null,
        success: null,
    }),

    getters: {
        token: () => Cookies.get('token'),
        isAuthenticated: (state) => !!state.user,
    },

    actions: {
        async login(credentials) {
            this.loading = true
            this.error = null
            this.success = null

            try {
                const response = await axiosInstance.post('/login', credentials)
                
                const { token, user } = response.data.data

                Cookies.set('token', token, {
                    expires: 7,
                    sameSite: 'lax',
                    secure: window.location.protocol === 'https:',
                })

                this.user = user
                this.success = response.data.message

                localStorage.setItem('user', JSON.stringify(user))

                if (user.role === 'admin') {
                    router.push({ name: 'admin.dashboard'})
                } else {
                    router.push({ name: 'app.dashboard' })
                }
            } catch (error) {
                this.error = handleError(error)
            } finally {
                this.loading = false
            }
        },

        async register(credentials) {
            this.loading = true
            this.error = null
            this.success = null
            try {
                const { name, email, nim, password } = credentials
                const response = await axiosInstance.post('/register', {
                    name,
                    email,
                    nim,
                    password,
                })
                const { token, user } = response.data.data

                this.success = response.data.message
                this.user = user 
                
                Cookies.set('token', token, {
                    expires: 7,
                    sameSite: 'lax',
                    secure: window.location.protocol === 'https:',
                })
                localStorage.setItem('user', JSON.stringify(user))

                router.push({ name: 'app.dashboard'})
            } catch (error) {
                this.error = handleError(error)
            } finally {
                this.loading = false
            }
        },

        async logout() {
            this.loading = true
            try {
                await axiosInstance.post('/logout')
            } catch (error) {
                console.error("Logout error:", error)
            } finally {
                Cookies.remove('token')
                localStorage.removeItem('user') 

                this.user = null
                this.error = null
                this.loading = false

                router.push({ name: 'login' })
            }
        },

        async checkAuth() {
            this.loading = true
            try {
                const response = await axiosInstance.get('/me')
                const user = response.data.data
                
                this.user = user
                localStorage.setItem('user', JSON.stringify(user))
            } catch (error) {
                this.user = null
                localStorage.removeItem('user')
                Cookies.remove('token')
            } finally {
                this.loading = false
            }
        },

        async deleteAvatar() {
            this.loading = true;
            this.error = null;
            try {
                const response = await axiosInstance.delete('/profile/avatar');
                
                this.user = response.data.data;
                localStorage.setItem('user', JSON.stringify(this.user));
                this.success = response.data.message;
                
                return true; 
            } catch (error) {
                this.error = handleError(error);
                return false; 
            } finally {
                this.loading = false;
            }
        }
    },
})
