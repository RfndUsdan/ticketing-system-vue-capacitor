import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { popupState, showPopup, confirmPopup, closeConfirmation } from '@/helpers/popup'

describe('popup helper', () => {
  beforeEach(() => {
    popupState.notification = null
    popupState.confirmation = null
    vi.useFakeTimers()
  })
  afterEach(() => { vi.useRealTimers() })

  it('shows and auto-clears notification', () => {
    showPopup('Halo', 'success')
    expect(popupState.notification).toEqual({ message: 'Halo', type: 'success' })
    vi.advanceTimersByTime(4000)
    expect(popupState.notification).toBeNull()
  })

  it('resolves confirmation', async () => {
    const p = confirmPopup('Yakin?', 'Judul')
    expect(popupState.confirmation).toEqual({ message: 'Yakin?', title: 'Judul' })
    closeConfirmation(true)
    await expect(p).resolves.toBe(true)
    expect(popupState.confirmation).toBeNull()
  })
})