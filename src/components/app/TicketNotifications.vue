<script setup>
import { onBeforeUnmount, onMounted, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { axiosInstance } from '@/plugins/axios'
import { showPopup } from '@/helpers/popup'

const authStore = useAuthStore()
let timer
let previousTickets = new Map()
let initialized = false
let checking = false

const getTicketSnapshot = (ticket) => ({
  status: ticket.status,
  adminReplyIds: new Set(
    (ticket.ticket_replies || [])
      .filter((reply) => reply.user?.role === 'admin')
      .map((reply) => reply.id),
  ),
})

async function checkForUpdates() {
  if (checking || document.hidden || !authStore.isAuthenticated || authStore.user?.role === 'admin') return
  checking = true

  try {
    const response = await axiosInstance.get('/ticket')
    const tickets = response.data.data || []
    const currentTickets = new Map(tickets.map((ticket) => [ticket.code, getTicketSnapshot(ticket)]))

    if (initialized) {
      for (const ticket of tickets) {
        const previous = previousTickets.get(ticket.code)
        if (!previous) continue

        const current = currentTickets.get(ticket.code)
        const statusChanged = current.status !== previous.status
        const hasNewAdminReply = (ticket.ticket_replies || []).some(
          (reply) => reply.user?.role === 'admin' && !previous.adminReplyIds.has(reply.id),
        )

        if (statusChanged || hasNewAdminReply) {
          const updates = []
          if (statusChanged) updates.push(`Status tiket #${ticket.code} berubah menjadi ${ticket.status.replaceAll('_', ' ')}.`)
          if (hasNewAdminReply) updates.push(`Petugas membalas tiket #${ticket.code}.`)
          showPopup(updates.join(' '), 'info')
        }
      }
    }

    previousTickets = currentTickets
    initialized = true
  } catch {
    // Gangguan jaringan tidak perlu mengganggu aktivitas pengguna; pengecekan diulang berikutnya.
  } finally {
    checking = false
  }
}

function startMonitoring() {
  clearInterval(timer)
  previousTickets = new Map()
  initialized = false

  if (authStore.isAuthenticated && authStore.user?.role !== 'admin') {
    checkForUpdates()
    timer = setInterval(checkForUpdates, 20_000)
  }
}

watch(() => [authStore.isAuthenticated, authStore.user?.role], startMonitoring, { immediate: true })

onMounted(() => document.addEventListener('visibilitychange', checkForUpdates))
onBeforeUnmount(() => {
  clearInterval(timer)
  document.removeEventListener('visibilitychange', checkForUpdates)
})
</script>
