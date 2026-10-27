import { defineStore } from "pinia";
import { axiosInstance } from "@/plugins/axios";
import { handleError } from "@/helpers/errorHelper";

export const useTicketStore = defineStore("ticket", {
    state: () => ({
        tickets: [],
        loading: false,
        error: null,
        success: null,
    }),

    actions: {
        async fetchTickets(params) {
            this.loading = true
            this.error = null

            try {
                const response = await axiosInstance.get('ticket', { params })

                this.tickets = response.data.data
            } catch (error) {
                this.error = handleError(error)
            } finally {
                this.loading = false
            }
        },

        async fetchTicket(code) {
            this.loading = true
            this.error = null

            try {
                const response = await axiosInstance.get(`/ticket/${code}`)

                return response.data.data
            } catch (error) {
                this.error = handleError(error)
                throw error
            } finally {
                this.loading = false
            }
        },

        async createTicket(payload) {
            this.loading = true
            this.error = null 

            try {
                const response = await axiosInstance.post("/ticket", payload)

                this.success = response.data.message

                return response.data.data
            } catch (error) {
                this.error = handleError(error)
            } finally {
                this.loading = false
            }
        },

        async createTicketReply(code, payload) {
            this.loading = true
            this.error = null

            try {
                const response = await axiosInstance.post(`/ticket-reply/${code}`, payload)

                this.success = response.data.message

                return response.data.data
            } catch (error) {
                this.error = handleError(error)
                throw error
            } finally {
                this.loading = false
            }
        },

        async deleteTicket(code) {
            this.loading = true
            this.error = null // Reset error sebelum hapus
            
            try {
                const response = await axiosInstance.delete(`/ticket/${code}`)
                
                this.success = response.data.message
                
                // Hapus tiket dari state lokal agar UI langsung terupdate
                this.tickets = this.tickets.filter(ticket => ticket.code !== code)
                
                return response.data
            } catch (error) {
                this.error = handleError(error)
                throw error // Lempar error agar bisa ditangkap di komponen jika perlu
            } finally {
                this.loading = false
            }
        },
    }
})
