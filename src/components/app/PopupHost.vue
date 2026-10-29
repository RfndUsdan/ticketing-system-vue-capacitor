<script setup>
import { popupState, closeConfirmation } from '@/helpers/popup'
</script>

<template>
  <Teleport to="body">
    <Transition name="popup">
      <div v-if="popupState.notification" class="fixed top-5 right-5 z-[100] w-[calc(100vw-2.5rem)] max-w-[26rem]">
        <div class="flex items-start gap-3 rounded-xl border bg-white p-4 shadow-xl"
          :class="popupState.notification.type === 'error' ? 'border-red-200' : popupState.notification.type === 'warning' ? 'border-amber-200' : 'border-green-200'"
          role="status" aria-live="polite">
          <span class="mt-0.5 text-lg" :class="popupState.notification.type === 'error' ? 'text-red-600' : popupState.notification.type === 'warning' ? 'text-amber-600' : 'text-green-600'">
            {{ popupState.notification.type === 'error' ? '!' : popupState.notification.type === 'warning' ? '⚠' : '✓' }}
          </span>
          <p class="flex-1 text-sm font-medium text-gray-800">{{ popupState.notification.message }}</p>
          <button class="text-gray-400 hover:text-gray-700" aria-label="Tutup notifikasi" @click="popupState.notification = null">×</button>
        </div>
      </div>
    </Transition>

    <div v-if="popupState.confirmation" class="fixed inset-0 z-[110] flex items-center justify-center bg-gray-900/50 p-4" @click.self="closeConfirmation(false)" @keydown.esc="closeConfirmation(false)">
      <section class="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" role="dialog" aria-modal="true" :aria-label="popupState.confirmation.title">
        <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">?</div>
        <h2 class="text-lg font-semibold text-gray-900">{{ popupState.confirmation.title }}</h2>
        <p class="mt-2 text-sm leading-6 text-gray-600">{{ popupState.confirmation.message }}</p>
        <div class="mt-6 flex justify-end gap-3">
          <button class="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50" @click="closeConfirmation(false)">Batal</button>
          <button class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700" @click="closeConfirmation(true)">Ya, lanjutkan</button>
        </div>
      </section>
    </div>
  </Teleport>
</template>

<style scoped>
.popup-enter-active, .popup-leave-active { transition: all .2s ease; }
.popup-enter-from, .popup-leave-to { opacity: 0; transform: translateY(-8px); }
</style>
