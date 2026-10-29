    <script setup>
    import { onMounted, ref, computed } from 'vue'
    import { useTicketStore } from '@/stores/ticket'
    import { storeToRefs } from 'pinia'
    import { capitalize } from 'lodash'
    import feather from 'feather-icons'
    import { DateTime } from 'luxon'
    import { useRoute, useRouter } from 'vue-router'
    import { showPopup, confirmPopup } from '@/helpers/popup'

    const route = useRoute()
    const router = useRouter()

    const ticket = ref({})
    const form = ref({
        status: '',
        content: '',
    })

    const ticketStore = useTicketStore()
    const { success, error, loading } = storeToRefs(ticketStore)
    const { fetchTicket, createTicketReply, deleteTicket } = ticketStore

    const fetchTicketDetail = async () => {
        try {
            const response = await fetchTicket(route.params.code)
            if (!response) return
            ticket.value = response
            form.value.status = response.status
        } catch (error) {
            console.error('Gagal mengambil tiket:', error)
        }
    }

    const handleSubmit = async () => {
        if (ticket.value.status === 'resolved') {
            showPopup("Tiket ini sudah berstatus 'Selesai'. Jawaban tetap akan terkirim sebagai arsip tambahan.", 'warning')
        }

        try {
            // 2. Kirim data ke API (Hanya satu kali di sini)
            await createTicketReply(route.params.code, form.value)
            
            // 3. Reset isi textarea agar kosong setelah terkirim
            form.value.content = ''
            
            // 4. Ambil data terbaru dari server untuk memperbarui daftar komentar
            await fetchTicketDetail()
            showPopup(form.value.status === 'resolved' ? 'Tiket berhasil diselesaikan.' : 'Jawaban berhasil dikirim.')
            
            // 5. Refresh icon (feather icons)
            setTimeout(() => feather.replace(), 100)

        } catch (err) {
            console.error("Gagal mengirim jawaban:", err)
            showPopup(typeof error.value === 'string' ? error.value : 'Gagal mengirim jawaban.', 'error')
        }
    }

    const handleDelete = async () => {
        if (await confirmPopup(`Apakah Anda yakin ingin menghapus tiket #${ticket.value.code}?`, 'Hapus tiket?')) {
            try {
                await deleteTicket(ticket.value.code)
                // Setelah sukses, arahkan kembali ke daftar tiket
                router.push({ name: 'admin.ticket' })
            } catch (err) {
                console.error("Gagal menghapus:", err)
            }
        }
    }

    const isResolveDisabled = computed(() => {
    // 1. Pastikan data tiket sudah ada
    if (!ticket.value || !ticket.value.status) return true

    // 2. Jika tiket sudah 'resolved', matikan tombol
    if (ticket.value.status === 'resolved') return true

    // 3. Jika admin belum mengisi konten jawaban, matikan tombol
    if (!form.value.content || form.value.content.trim() === '') return true
    
    // 4. Jika sedang dalam proses loading (mencegah double click)
    return loading.value
    })

    const handleResolve = async () => {
    form.value.status = 'resolved'
    await handleSubmit() 
    }
    onMounted(async () => {
        await fetchTicketDetail()

        feather.replace()
    })
    </script>

    <template>
        <div class="p-6">
            <div class="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
                <div class="p-6">
                    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                        
                        <div class="lg:col-span-8">
                            <div class="flex flex-wrap items-baseline gap-3 mb-4">
                                <h3 class="text-xl font-bold text-gray-900">{{ ticket.title }}</h3>   
                                <span class="text-xs text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                                    Kode Tiket: {{ ticket.code }}
                                </span>
                            </div>

                            <div class="p-4 bg-gray-50 rounded-lg border border-gray-100">
                                <p class="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                                    {{ ticket.description || 'Tidak ada deskripsi tambahan.' }}
                                </p>
                            </div>

                            <div class="mt-4" v-if="ticket.image_url">
                                <h4 class="text-sm font-medium text-gray-700 mb-2">Lampiran Bukti:</h4>
                                <img :src="ticket.image_url" alt="Lampiran Tiket" 
                                    class="max-w-full md:max-w-md rounded-lg border border-gray-200 shadow-sm cursor-pointer hover:opacity-90 transition"
                                    @click="window.open(ticket.image_url, '_blank')"
                                    title="Klik untuk memperbesar di tab baru">
                            </div>
                            <div class="mt-6 flex flex-wrap items-center gap-3">
                                <span class="px-3 py-1 text-xs font-medium rounded-lg" :class="{
                                    'text-blue-700 bg-blue-100': ticket.status === 'open',
                                    'text-yellow-700 bg-yellow-100': ticket.status === 'in_progress',
                                    'text-green-700 bg-green-100': ticket.status === 'resolved',
                                    'text-red-700 bg-red-100': ticket.status === 'rejected'
                                }">
                                    {{ capitalize(ticket.status) }}
                                </span>
                                <span class="px-3 py-1 text-xs font-medium rounded-lg" :class="{
                                    'text-red-700 bg-red-100': ticket.priority === 'high',
                                    'text-yellow-700 bg-yellow-100': ticket.priority === 'medium',
                                    'text-green-700 bg-green-100': ticket.priority === 'low'
                                }">
                                    {{ capitalize(ticket.priority) }}
                                </span>
                                <span class="text-xs text-gray-500 border-l pl-3 border-gray-200">
                                    Oleh: <span class="font-medium">{{ ticket.user?.name }}</span>
                                </span>
                                <span class="text-xs text-gray-400">
                                    {{ ticket.created_at ? DateTime.fromISO(ticket.created_at).toFormat('dd LMMM yyyy, HH:mm') : '' }}
                                </span>
                            </div>
                        </div>

                        <div class="lg:col-span-4 flex flex-row lg:justify-end items-start gap-2">
                            <button @click="handleDelete" 
                                class="w-full lg:max-w-[160px] px-4 py-2 border border-red-200 rounded-lg text-sm text-red-600 hover:bg-red-50 transition-colors"
                                :disabled="loading">
                                <i data-feather="trash-2" class="w-4 h-4 inline-block mr-2"></i>
                                {{ loading ? '...' : 'Hapus Tiket' }}
                            </button>
                            
                            <button 
                                @click="handleResolve"
                                :disabled="isResolveDisabled"
                                class="w-full lg:max-w-[160px] px-4 py-2 rounded-lg text-sm transition-all flex items-center justify-center shadow-sm"
                                :class="{
                                    'bg-gray-200 text-gray-400 cursor-not-allowed': isResolveDisabled,
                                    'bg-green-600 text-white hover:bg-green-700': !isResolveDisabled
                                }"
                            >
                                <i data-feather="check-circle" class="w-4 h-4 mr-2"></i>
                                {{ ticket.status === 'resolved' ? 'Sudah Selesai' : 'Selesaikan' }}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div class="bg-white rounded-xl shadow-sm border border-gray-100">
                <div v-for="reply in ticket.ticket_replies" :key="reply.id" class="p-6 border-b border-gray-100"
                    v-if="ticket.ticket_replies?.length > 0">
                    <div class="flex items-start space-x-4">
                        <img :src="`https://ui-avatars.com/api/?name=${reply.user.name}&background=0D8ABC&color=fff`"
                            :alt="reply.user.name" class="w-10 h-10 rounded-full">
                        <div class="flex-1">
                            <div class="flex items-center justify-between">
                                <div>
                                    <h4 class="text-sm font-medium text-gray-800">{{ reply.user.name }}</h4>
                                    <p class="text-xs text-gray-500">
                                        {{ DateTime.fromISO(reply.created_at).toFormat('dd MMMM yyyy, HH:mm') }}
                                    </p>
                                </div>
                            </div>
                            <div class="mt-3 text-sm text-gray-800">
                                <p class="whitespace-pre-line">{{ reply.content }}</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div v-else>
                    <div class="p-6">
                        <p class="text-sm text-gray-500">Belum ada tanggapan</p>
                    </div>
                </div>

                <div class="p-6 border-t border-gray-100">
                    <h4 class="text-sm font-medium text-gray-800 mb-4">Tambah Jawaban</h4>
                    <form @submit.prevent="handleSubmit" class="space-y-4">
                        <div class="grid grid-cols-1 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Status Tiket</label>
                                <select v-model="form.status"
                                    class="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                                    <option value="open" class="text-blue-700">Open</option>
                                    <option value="in_progress" class="text-yellow-700">In Progress</option>
                                    <option value="resolved" class="text-green-700">Resolved</option>
                                    <option value="rejected" class="text-red-700">Rejected</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <textarea v-model="form.content"
                                class="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                :class="{'border-red-500 ring-red-500': error?.content }" 
                                rows="4" placeholder="Tulis jawaban Anda di sini..."></textarea>
                            
                            <p class="mt-1 text-xs text-red-500" v-if="error?.content">
                                {{ error?.content?.join(', ') }}
                            </p>

                            <p v-if="ticket.status !== 'resolved' && !form.content" class="mt-2 text-xs text-amber-600 flex items-center">
                                <i data-feather="info" class="w-3.5 h-3.5 mr-1"></i>
                                *Isi jawaban di atas terlebih dahulu untuk dapat menggunakan tombol "Selesaikan".
                            </p>
                        </div>
                        <div class="flex items-center justify-between">
                            <div class="flex items-center space-x-4">
                            </div>
                            <button type="submit"
                                class="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
                                <i data-feather="send" class="w-4 h-4 inline-block mr-2"></i>
                                <span v-if="!loading">
                                    Kirim Jawaban
                                </span>
                                <span v-else>
                                    loading..
                                </span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </template>
