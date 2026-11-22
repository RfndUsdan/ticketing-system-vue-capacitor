import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

const { getMock, postMock, deleteMock } = vi.hoisted(() => ({
  getMock: vi.fn(),
  postMock: vi.fn(),
  deleteMock: vi.fn(),
}))

vi.mock('@/plugins/axios', () => ({
  axiosInstance: {
    get: getMock,
    post: postMock,
    delete: deleteMock,
  },
}))

vi.mock('@/helpers/errorHelper', () => ({
  handleError: vi.fn((e) => e?.response?.data?.message || e?.message || 'error'),
}))

import { useTicketStore } from '@/stores/ticket'

describe('ticket store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    getMock.mockReset()
    postMock.mockReset()
    deleteMock.mockReset()
  })

  it('fetches tickets with pagination params and stores meta', async () => {
    getMock.mockResolvedValueOnce({
      data: {
        data: [{ code: 'T-1' }],
        meta: { current_page: 2, per_page: 10, last_page: 5, total: 42 },
      },
    })

    const store = useTicketStore()
    await store.fetchTickets({ page: 2, per_page: 10, status: 'open' })

    expect(getMock).toHaveBeenCalledWith('ticket', { params: { page: 2, per_page: 10, status: 'open' } })
    expect(store.tickets).toEqual([{ code: 'T-1' }])
    expect(store.ticketPagination.total).toBe(42)
  })

  it('returns duplicate info when backend reports DUPLICATE_TICKET', async () => {
    postMock.mockRejectedValueOnce({
      response: { data: { code: 'DUPLICATE_TICKET', duplicate: { code: 'T-OLD' } } },
    })

    const store = useTicketStore()
    const result = await store.createTicket(new FormData(), 'idem-key', false)

    expect(result).toEqual({ duplicate: { code: 'T-OLD' } })
    expect(store.error).toBeNull()
  })

  it('creates ticket reply and returns data', async () => {
    postMock.mockResolvedValueOnce({ data: { message: 'ok', data: { id: 1, content: 'hi' } } })

    const store = useTicketStore()
    const result = await store.createTicketReply('T-1', { content: 'hi', status: 'resolved' })

    expect(postMock).toHaveBeenCalledWith('/ticket-reply/T-1', { content: 'hi', status: 'resolved' })
    expect(result).toEqual({ id: 1, content: 'hi' })
    expect(store.success).toBe('ok')
  })
})
