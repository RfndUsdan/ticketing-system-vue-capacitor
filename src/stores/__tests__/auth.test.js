import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

const { postMock, getMock, deleteMock } = vi.hoisted(() => ({
  postMock: vi.fn(),
  getMock: vi.fn(),
  deleteMock: vi.fn(),
}))

const { pushMock } = vi.hoisted(() => ({
  pushMock: vi.fn(),
}))

vi.mock('@/plugins/axios', () => ({
  axiosInstance: {
    post: postMock,
    get: getMock,
    delete: deleteMock,
  },
}))

vi.mock('@/router', () => ({
  default: { push: pushMock },
}))

vi.mock('@/helpers/errorHelper', () => ({
  handleError: vi.fn((e) => e?.response?.data?.message || e?.message || 'error'),
}))

vi.mock('js-cookie', () => ({
  default: {
    set: vi.fn(),
    get: vi.fn(),
    remove: vi.fn(),
  },
}))

import Cookies from 'js-cookie'
import { useAuthStore } from '@/stores/auth'

describe('auth store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    postMock.mockReset()
    getMock.mockReset()
    deleteMock.mockReset()
    pushMock.mockReset()
    Cookies.set.mockReset()
    Cookies.remove.mockReset()
    localStorage.clear()
  })

  it('logs in, stores token/user, and redirects by role', async () => {
    postMock.mockResolvedValueOnce({
      data: { message: 'ok', data: { token: 'tok', user: { id: 1, name: 'Admin', role: 'admin' } } },
    })

    const store = useAuthStore()
    await store.login({ email: 'a@a.com', password: 'secret123' })

    expect(postMock).toHaveBeenCalledWith('/login', { email: 'a@a.com', password: 'secret123' })
    expect(Cookies.set).toHaveBeenCalled()
    expect(store.user.role).toBe('admin')
    expect(pushMock).toHaveBeenCalledWith({ name: 'admin.dashboard' })
  })

  it('logs out and clears session', async () => {
    postMock.mockResolvedValueOnce({ data: {} })
    localStorage.setItem('user', JSON.stringify({ id: 1 }))
    Cookies.get.mockReturnValue('tok')

    const store = useAuthStore()
    store.user = { id: 1 }
    await store.logout()

    expect(Cookies.remove).toHaveBeenCalledWith('token')
    expect(localStorage.getItem('user')).toBeNull()
    expect(store.user).toBeNull()
    expect(pushMock).toHaveBeenCalledWith({ name: 'login' })
  })
})
