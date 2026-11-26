import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

const { getMock, postMock, deleteMock } = vi.hoisted(() => ({
  getMock: vi.fn(), postMock: vi.fn(), deleteMock: vi.fn(),
}))
vi.mock('@/plugins/axios', () => ({ axiosInstance: { get: getMock, post: postMock, delete: deleteMock } }))
vi.mock('@/helpers/errorHelper', () => ({ handleError: vi.fn((e) => e?.response?.data?.message || e?.message || 'error') }))

import { useUserStore } from '@/stores/user'

describe('user store', () => {
  beforeEach(() => {
    setActivePinia(createPinia()); getMock.mockReset(); postMock.mockReset(); deleteMock.mockReset()
  })

  it('fetches users with params', async () => {
    getMock.mockResolvedValueOnce({ data: { data: [{ id: 1, name: 'A' }] } })
    const store = useUserStore()
    await store.fetchUsers({ search: 'a' })
    expect(getMock).toHaveBeenCalledWith('users', { params: { search: 'a' } })
    expect(store.users).toHaveLength(1)
  })

  it('creates and updates user', async () => {
    postMock.mockResolvedValueOnce({ data: { message: 'created', data: { id: 2 } } })
    const store = useUserStore()
    const created = await store.createUser({ name: 'B' })
    expect(postMock).toHaveBeenCalledWith('/users', { name: 'B' })
    expect(created.id).toBe(2)

    postMock.mockResolvedValueOnce({ data: { message: 'updated', data: { id: 2, name: 'B2' } } })
    const updated = await store.updateUser(2, { name: 'B2' })
    expect(postMock).toHaveBeenCalledWith('/users/2', { name: 'B2' })
    expect(updated.name).toBe('B2')
  })

  it('deletes user and removes from state', async () => {
    deleteMock.mockResolvedValueOnce({ data: { message: 'deleted' } })
    const store = useUserStore()
    store.users = [{ id: 1 }, { id: 2 }]
    await store.deleteUser(1)
    expect(deleteMock).toHaveBeenCalledWith('/users/1')
    expect(store.users).toEqual([{ id: 2 }])
  })
})