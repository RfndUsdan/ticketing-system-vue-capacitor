import { reactive } from 'vue'

export const popupState = reactive({
  notification: null,
  confirmation: null,
})

let notificationTimer
let resolveConfirmation

export function showPopup(message, type = 'success') {
  clearTimeout(notificationTimer)
  popupState.notification = { message, type }
  notificationTimer = setTimeout(() => {
    popupState.notification = null
  }, 4000)
}

export function confirmPopup(message, title = 'Konfirmasi') {
  popupState.confirmation = { message, title }
  return new Promise((resolve) => {
    resolveConfirmation = resolve
  })
}

export function closeConfirmation(confirmed) {
  popupState.confirmation = null
  resolveConfirmation?.(confirmed)
  resolveConfirmation = null
}
