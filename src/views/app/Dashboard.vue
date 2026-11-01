<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useTicketStore } from '@/stores/ticket';
import { storeToRefs } from 'pinia';
import { debounce } from 'lodash';
import feather from 'feather-icons'
import { DateTime } from 'luxon';

const ticketStore = useTicketStore()
const { tickets, ticketPagination, loading, error } = storeToRefs(ticketStore)
const { fetchTickets } = ticketStore

const filters = ref({
    search: '',
    status: '',
    priority: '',
    date: '',
})
const page = ref(1)
const perPage = ref(10)
const lastPage = computed(() => ticketPagination.value?.last_page ?? 1)
const totalTickets = computed(() => ticketPagination.value?.total ?? 0)

const loadTickets = () => fetchTickets({
    ...filters.value,
    page: page.value,
    per_page: perPage.value,
})

const debouncedFilterFetch = debounce(loadTickets, 300)
watch(filters, () => {
    page.value = 1
    debouncedFilterFetch()
}, { deep: true })

watch([page, perPage], loadTickets)

const resetFilters = () => {
    filters.value = { search: '', status: '', priority: '', date: '' }
    page.value = 1
}

onMounted(async() => {
    await loadTickets()

    feather.replace()
})
</script>

<template>
    <div class="max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8">

        <div class="flex items-center justify-between mb-8">
            <div>
                <h1 class="text-2xl font-bold text-gray-800">Tiket Saya</h1>
                <p class="text-sm text-gray-500 mt-1">Kelola dan pantau status tiket Anda</p>
            </div>
            
            <RouterLink :to="{ name: 'app.ticket.create' }"
                class="hidden md:inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                <i data-feather="plus" class="w-4 h-4 mr-2"></i>
                Buat Tiket Baru
            </RouterLink>
        </div>

        <div class="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
            <div class="p-4">
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div class="relative">
                        <input type="text" placeholder="Cari tiket..." v-model="filters.search"
                            class="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                        <i data-feather="search" class="w-4 h-4 text-gray-400 absolute left-3 top-2.5"></i>
                    </div>
                    <select v-model="filters.status"
                        class="border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                        <option value="">Semua Status</option>
                        <option value="open">Open</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="rejected">Rejected</option>
                    </select>
                    <select v-model="filters.priority"
                        class="border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                        <option value="">Semua Prioritas</option>
                        <option value="low">Rendah</option>
                        <option value="medium">Sedang</option>
                        <option value="high">Tinggi</option>
                    </select>
                    <select v-model="filters.date"
                        class="border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                        <option value="">Semua Tanggal</option>
                        <option value="today">Hari Ini</option>
                        <option value="week">Minggu Ini</option>
                        <option value="month">Bulan Ini</option>
                    </select>
                </div>
                <div class="mt-4 flex justify-end">
                    <button type="button" @click="resetFilters"
                        class="text-sm font-medium text-blue-600 hover:text-blue-800">
                        Hapus filter
                    </button>
                </div>
            </div>
        </div>

        <div v-if="loading" class="py-10 text-center text-sm text-gray-500" role="status">Memuat tiket...</div>
        <div v-else-if="error" class="py-10 text-center text-sm text-red-600" role="alert">
            {{ typeof error === 'string' ? error : 'Tiket gagal dimuat. Silakan coba lagi.' }}
        </div>
        <div v-else-if="tickets.length === 0" class="rounded-xl border border-gray-100 bg-white py-10 text-center text-sm text-gray-500">
            Tidak ada tiket yang sesuai dengan filter.
        </div>

        <div class="space-y-4">
            <div class="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                v-for="ticket in tickets" :key="ticket.code">
                
                <RouterLink :to="{ name: 'app.ticket.detail', params: { code: ticket.code } }" class="block p-4 sm:p-6">
                    <div class="flex items-start justify-between">
                        <div class="flex-1">
                            <div class="flex items-center flex-wrap gap-2">
                                <h3 class="text-base sm:text-lg font-semibold text-gray-800">{{ ticket.title }}</h3>
                                
                                <span class="px-3 py-1 text-[10px] sm:text-xs font-medium rounded-full" 
                                    :class="{
                                        'text-blue-700 bg-blue-100': ticket.status === 'open',
                                        'text-yellow-700 bg-yellow-100': ticket.status === 'in_progress',
                                        'text-green-700 bg-green-100': ticket.status === 'resolved',
                                        'text-red-700 bg-red-100': ticket.status === 'rejected'
                                    }">
                                    {{ ticket.status === 'in_progress' ? 'In Progress' : ticket.status.toUpperCase() }}
                                </span>

                                <span class="px-3 py-1 text-[10px] sm:text-xs font-medium rounded-full"
                                    :class="{
                                        'text-red-700 bg-red-100': ticket.priority === 'high',
                                        'text-yellow-700 bg-yellow-100': ticket.priority === 'medium',
                                        'text-green-700 bg-green-100': ticket.priority === 'low'
                                    }">
                                    {{ ticket.priority === 'high' ? 'Tinggi' : (ticket.priority === 'medium' ? 'Sedang' : 'Rendah') }}
                                </span>
                            </div>
                            <p class="text-xs sm:text-sm text-gray-500 mt-2">#{{ ticket.code }} • Dibuat pada {{ DateTime.fromISO(ticket.created_at).toFormat('dd MMMM yyyy, HH:mm') }}</p>
                            <p class="text-sm text-gray-600 mt-2">{{ ticket.description }}</p>
                            <div class="mt-4 flex flex-wrap items-center gap-4">
                                <div class="flex items-center text-xs sm:text-sm text-gray-500">
                                    <i data-feather="message-square" class="w-4 h-4 mr-1"></i>
                                    <span>{{ ticket.ticket_replies?.length || 0 }} balasan</span>
                                </div>
                                <div class="flex items-center text-xs sm:text-sm text-gray-500">
                                    <i data-feather="clock" class="w-4 h-4 mr-1"></i>
                                    <span>Terakhir diupdate {{ DateTime.fromISO(ticket.updated_at).toFormat('dd MMMM yyyy, HH:mm') }}</span>
                                </div>
                            </div>
                        </div>
                        <div class="ml-2 sm:ml-4 mt-1">
                            <i data-feather="chevron-right" class="w-4 h-4 sm:w-5 sm:h-5 text-gray-400"></i>
                        </div>
                    </div>
                </RouterLink>
            </div>
        </div>

        <div v-if="totalTickets > 0" class="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p class="text-sm text-gray-500">
                Halaman {{ ticketPagination?.current_page ?? page }} dari {{ lastPage }} · {{ totalTickets }} tiket
            </p>
            <div class="flex items-center gap-3">
                <label for="tickets-per-page" class="text-sm text-gray-600">Per halaman</label>
                <select id="tickets-per-page" v-model.number="perPage"
                    class="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none">
                    <option :value="10">10</option>
                    <option :value="20">20</option>
                    <option :value="50">50</option>
                </select>
                <button type="button" @click="page--" :disabled="page <= 1 || loading"
                    class="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50">
                    Sebelumnya
                </button>
                <button type="button" @click="page++" :disabled="page >= lastPage || loading"
                    class="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50">
                    Berikutnya
                </button>
            </div>
        </div>

    </div>
</template>
