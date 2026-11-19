<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { DateTime } from 'luxon'
import { useNotificationStore } from '@/stores/notification'

const router = useRouter()
const notificationStore = useNotificationStore()
const { notifications, loading, unreadCount } = storeToRefs(notificationStore)

const formatTime = (iso) => {
  if (!iso) return '-'
  return DateTime.fromISO(iso).toFormat('dd MMM yyyy, HH:mm')
}

const openNotification = async (notif) => {
  if (!notif.read_at) {
    await notificationStore.markAsRead(notif.id)
  }
  const code = notif.data?.ticket_code
  if (code) {
    router.push({ name: 'admin.ticket.detail', params: { code } })
  }
}

const markAll = async () => {
  await notificationStore.markAllAsRead()
}

onMounted(async () => {
  await notificationStore.fetchNotifications()
})
</script>

<template>
  <div class="max-w-4xl mx-auto">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-xl font-semibold text-gray-800">Notifikasi</h1>
        <p class="text-sm text-gray-500 mt-1">Update balasan dan aktivitas tiket</p>
      </div>
      <button
        v-if="unreadCount > 0"
        @click="markAll"
        class="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
      >
        Tandai semua dibaca
      </button>
    </div>

    <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div v-if="loading" class="p-8 text-center text-gray-500">Memuat notifikasi...</div>

      <div v-else-if="notifications.length === 0" class="p-10 text-center">
        <div class="w-14 h-14 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
          <i data-feather="bell" class="w-7 h-7"></i>
        </div>
        <p class="text-gray-600 font-medium">Belum ada notifikasi</p>
        <p class="text-sm text-gray-400 mt-1">Notifikasi aktivitas tiket akan muncul di sini.</p>
      </div>

      <ul v-else class="divide-y divide-gray-100">
        <li
          v-for="notif in notifications"
          :key="notif.id"
          @click="openNotification(notif)"
          class="p-4 sm:p-5 cursor-pointer transition-colors hover:bg-gray-50"
          :class="{ 'bg-blue-50/40': !notif.read_at }"
        >
          <div class="flex items-start gap-3">
            <div class="mt-1">
              <span
                class="inline-block w-2.5 h-2.5 rounded-full"
                :class="notif.read_at ? 'bg-gray-300' : 'bg-blue-500'"
              ></span>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-start justify-between gap-3">
                <h3 class="text-sm font-semibold text-gray-900">{{ notif.title }}</h3>
                <span class="text-xs text-gray-400 whitespace-nowrap">{{ formatTime(notif.created_at) }}</span>
              </div>
              <p class="text-sm text-gray-600 mt-1">{{ notif.message }}</p>
              <div v-if="notif.data?.ticket_code" class="mt-2">
                <span class="inline-flex items-center text-xs font-medium text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                  Tiket #{{ notif.data.ticket_code }}
                </span>
                <span v-if="notif.data?.status" class="ml-2 inline-flex items-center text-xs font-medium text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
                  Status: {{ notif.data.status }}
                </span>
              </div>
            </div>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>
