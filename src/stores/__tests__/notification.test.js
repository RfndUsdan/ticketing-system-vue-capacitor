import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

const { getMock, postMock, patchMock } = vi.hoisted(() => ({
  getMock: vi.fn(),
  postMock: vi.fn(),
  patchMock: vi.fn(),
}))

vi.mock('@/plugins/axios', () => ({
  axiosInstance: {
    get: getMock,
    post: postMock,
    patch: patchMock,
  },
}))

vi.mock('@/helpers/errorHelper', () => ({
  handleError: vi.fn((e) => e?.response?.data?.message || e?.message || 'error'),
}))

import { useNotificationStore } from '@/stores/notification'

describe('notification store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    getMock.mockReset()
    postMock.mockReset()
    patchMock.mockReset()
  })

  it('fetches notifications and updates unread count from meta', async () => {
    getMock.mockResolvedValueOnce({
      data: {
        data: [{ id: 1, title: 'A', read_at: null }],
        meta: { unread_count: 3, total: 1 },
      },
    })

    const store = useNotificationStore()
    await store.fetchNotifications({ page: 1 })

    expect(getMock).toHaveBeenCalledWith('/notifications', { params: { page: 1 } })
    expect(store.notifications).toHaveLength(1)
    expect(store.unreadCount).toBe(3)
  })

  it('marks notification as read and decrements unread count', async () => {
    patchMock.mockResolvedValueOnce({ data: { data: { id: 1, read_at: '2026-01-01T00:00:00Z' } } })
    const store = useNotificationStore()
    store.notifications = [{ id: 1, read_at: null }]
    store.unreadCount = 2

    await store.markAsRead(1)

    expect(patchMock).toHaveBeenCalledWith('/notifications/1/read')
    expect(store.notifications[0].read_at).toBeTruthy()
    expect(store.unreadCount).toBe(1)
  })

  it('marks all as read', async () => {
    patchMock.mockResolvedValueOnce({ data: { data: { ok: true } } })
    const store = useNotificationStore()
    store.notifications = [{ id: 1, read_at: null }, { id: 2, read_at: null }]
    store.unreadCount = 2

    await store.markAllAsRead()

    expect(patchMock).toHaveBeenCalledWith('/notifications/read-all')
    expect(store.unreadCount).toBe(0)
    expect(store.notifications.every((n) => n.read_at)).toBe(true)
  })
})
