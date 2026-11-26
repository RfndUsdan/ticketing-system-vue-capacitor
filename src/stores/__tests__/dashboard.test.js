import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

const { getMock } = vi.hoisted(() => ({ getMock: vi.fn() }))
vi.mock('@/plugins/axios', () => ({ axiosInstance: { get: getMock } }))
vi.mock('@/helpers/errorHelper', () => ({ handleError: vi.fn((e) => e?.message || 'error') }))

import { useDashboardStore } from '@/stores/dashboard'

describe('dashboard store', () => {
  beforeEach(() => { setActivePinia(createPinia()); getMock.mockReset() })

  it('fetches statistics', async () => {
    getMock.mockResolvedValueOnce({ data: { data: { total_tickets: 10, status_distribution: { open: 2 } } } })
    const store = useDashboardStore()
    await store.fetchStatistics()
    expect(getMock).toHaveBeenCalledWith('dashboard/statistic')
    expect(store.statistic.total_tickets).toBe(10)
    expect(store.loading).toBe(false)
  })

  it('stores error on failure', async () => {
    getMock.mockRejectedValueOnce(new Error('fail'))
    const store = useDashboardStore()
    await store.fetchStatistics()
    expect(store.error).toBe('fail')
    expect(store.loading).toBe(false)
  })
})