import { defineStore } from 'pinia'
import { axiosInstance } from '@/plugins/axios'
import { handleError } from '@/helpers/errorHelper'

export const useNotificationStore = defineStore('notification', {
  state: () => ({
    notifications: [],
    meta: null,
    unreadCount: 0,
    loading: false,
    error: null,
    _pollTimer: null,
  }),

  actions: {
    async fetchNotifications(params = {}) {
      this.loading = true
      this.error = null
      try {
        const response = await axiosInstance.get('/notifications', { params })
        this.notifications = response.data.data || []
        this.meta = response.data.meta || null
        if (this.meta && typeof this.meta.unread_count === 'number') {
          this.unreadCount = this.meta.unread_count
        }
        return response.data
      } catch (error) {
        this.error = handleError(error)
      } finally {
        this.loading = false
      }
    },

    async fetchUnreadCount() {
      try {
        const response = await axiosInstance.get('/notifications/unread-count')
        const count = response.data?.data?.unread_count ?? 0
        this.unreadCount = count
        return count
      } catch (error) {
        // silent fail for badge polling
        return this.unreadCount
      }
    },

    async markAsRead(id) {
      try {
        const response = await axiosInstance.patch(`/notifications/${id}/read`)
        const updated = response.data?.data
        if (updated) {
          const idx = this.notifications.findIndex((n) => n.id === id)
          if (idx !== -1) this.notifications[idx] = updated
          if (updated.read_at) {
            this.unreadCount = Math.max(0, this.unreadCount - 1)
          }
        }
        return updated
      } catch (error) {
        this.error = handleError(error)
      }
    },

    async markAllAsRead() {
      try {
        await axiosInstance.patch('/notifications/read-all')
        this.notifications = this.notifications.map((n) => ({
          ...n,
          read_at: n.read_at || new Date().toISOString(),
        }))
        this.unreadCount = 0
      } catch (error) {
        this.error = handleError(error)
      }
    },

    async registerDeviceToken(token, platform = 'web') {
      try {
        await axiosInstance.post('/notifications/device-token', { token, platform })
      } catch (error) {
        // non-critical
      }
    },

    startPolling(intervalMs = 30000) {
      if (this._pollTimer) return
      this.fetchUnreadCount()
      this._pollTimer = setInterval(() => {
        this.fetchUnreadCount()
      }, intervalMs)
    },

    stopPolling() {
      if (this._pollTimer) {
        clearInterval(this._pollTimer)
        this._pollTimer = null
      }
    },
  },
})
