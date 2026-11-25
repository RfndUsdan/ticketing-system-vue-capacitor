<script setup>
import { ref } from 'vue'
import { axiosInstance } from '@/plugins/axios'
import { handleError } from '@/helpers/errorHelper'
import { showPopup } from '@/helpers/popup'

const form = ref({ email: '' })
const loading = ref(false)
const devResetUrl = ref('')

const handleSubmit = async () => {
    if (!form.value.email) {
        showPopup('Harap isi alamat email Anda.', 'warning')
        return
    }

    loading.value = true
    devResetUrl.value = ''

    try {
        const response = await axiosInstance.post('/forgot-password', {
            email: form.value.email,
        })

        showPopup(response.data.message, 'success')
        devResetUrl.value = response.data.data?.dev_reset_url || ''
    } catch (error) {
        const message = handleError(error)
        showPopup(typeof message === 'string' ? message : 'Gagal meminta reset password.', 'error')
    } finally {
        loading.value = false
    }
}
</script>

<template>
    <form class="space-y-6" @submit.prevent="handleSubmit">
        <div>
            <h3 class="text-lg font-semibold text-gray-800">Lupa password?</h3>
            <p class="mt-1 text-sm text-gray-500">
                Masukkan email yang terdaftar. Kami akan mengirim tautan untuk mengatur ulang password Anda.
            </p>
        </div>

        <div>
            <label for="email" class="block text-sm font-medium text-gray-700">Email</label>
            <div class="mt-1 relative">
                <input v-model="form.email" type="email" id="email" name="email" required autocomplete="email"
                    class="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="nama@perusahaan.com">
                <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <i data-feather="mail" class="w-4 h-4 text-gray-400"></i>
                </div>
            </div>
        </div>

        <div v-if="devResetUrl" class="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            <p class="font-medium">Mode pengembangan</p>
            <p class="mt-1">Email belum dikonfigurasi. Gunakan tautan berikut untuk menguji alur reset:</p>
            <a :href="devResetUrl" class="mt-1 block break-all font-medium text-blue-700 underline">
                {{ devResetUrl }}
            </a>
        </div>

        <button type="submit" :disabled="loading"
            class="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-60">
            {{ loading ? 'Mengirim...' : 'Kirim tautan reset' }}
        </button>

        <div class="text-center">
            <RouterLink :to="{ name: 'login' }" class="text-sm font-medium text-blue-600 hover:text-blue-800">
                Kembali ke halaman masuk
            </RouterLink>
        </div>
    </form>
</template>
