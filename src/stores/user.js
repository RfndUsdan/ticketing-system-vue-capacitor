import { defineStore } from "pinia";
import { axiosInstance } from "@/plugins/axios";
import { handleError } from "@/helpers/errorHelper";

export const useUserStore = defineStore("user", {
    state: () => ({
        users: [],
        loading: false,
        error: null,
        success: null,
    }),

    actions: {
        async fetchUsers(params) {
            this.loading = true;
            try {
                const response = await axiosInstance.get('users', { params });
                this.users = response.data.data;
            } catch (error) {
                this.error = handleError(error);
            } finally {
                this.loading = false;
            }
        },

        async fetchUser(id) {
            this.loading = true;
            try {
                const response = await axiosInstance.get(`/users/${id}`);
                return response.data.data;
            } catch (error) {
                this.error = handleError(error);
            } finally {
                this.loading = false;
            }
        },

        async createUser(payload) {
            this.loading = true;
            this.error = null;
            
            try {
                const response = await axiosInstance.post('/users', payload);
                
                this.success = response.data.message || 'User berhasil ditambahkan';
                return response.data.data;
            } catch (error) {
                this.error = handleError(error);
                throw error; 
            } finally {
                this.loading = false;
            }
        },

        async deleteUser(id) {
            this.loading = true;
            this.error = null;
            
            try {
                const response = await axiosInstance.delete(`/users/${id}`);
                this.success = response.data.message;
                
                this.users = this.users.filter(user => user.id !== id);
                
                return response.data;
            } catch (error) {
                this.error = handleError(error);
                throw error;
            } finally {
                this.loading = false;
            }
        },

        async updateUser(id, payload) {
            this.loading = true;
            this.error = null;
            
            try {
                // Keep POST for the existing frontend; backend has this compatibility route.
                const response = await axiosInstance.post(`/users/${id}`, payload);
                
                this.success = response.data.message || 'User berhasil diupdate';
                return response.data.data;
            } catch (error) {
                this.error = handleError(error);
                throw error; 
            } finally {
                this.loading = false;
            }
        },
    }
});
