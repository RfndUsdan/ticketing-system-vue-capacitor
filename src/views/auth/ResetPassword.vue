<script setup>
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { axiosInstance } from '@/plugins/axios'
import { handleError } from '@/helpers/errorHelper'
import { showPopup } from '@/helpers/popup'

const route = useRoute()
const router = useRouter()

const token = String(route.params.token || '')
const valid = ref(false)
const checking = ref(true)
const maskedEmail = ref('')
const loading = ref(false)
const showPassword = ref(false)
const form = ref({
    password: '',
    password_confirmation: '',
})

const checkToken = async () => {
    checking.value = true
    try {
        const response = await axiosInstance.get(`/reset-password/${token}`)
        valid.value = response.data.data?.valid === true
        maskedEmail.value = response.data.data?.email || ''
    } catch (error) {
        valid.value = false
        const message = handleError(error)
        showPopup(typeof message === 'string' ? message : 'Tautan reset tidak dapat diperiksa.', 'error')
    } finally {
        checking.value = false
    }
}

const handleSubmit = async () => {
    if (form.value.password !== form.value.password_confirmation) {
        showPopup('Konfirmasi password tidak cocok.', 'warning')
        return
    }

    loading.value = true
    try {
        const response = await axiosInstance.post('/reset-password', {
            token,
            password: form.value.password,
            password_confirmation: form.value.password_confirmation,
        })

        showPopup(response.data.message, 'success')
        await router.push({ name: 'login' })
    } catch (error) {
        const message = handleError(error)
        showPopup(typeof message === 'string' ? message : 'Gagal mengubah password.', 'error')
    } finally {
        loading.value = false
    }
}

onMounted(checkToken)
</script>

<template>
    <div class="space-y-6">
        <div v-if="checking" class="py-8 text-center text-sm text-gray-500">
            Memeriksa tautan reset...
        </div>

        <div v-else-if="!valid" class="text-center">
            <h3 class="text-lg font-semibold text-gray-800">Tautan tidak dapat digunakan</h3>
            <p class="mt-1 text-sm text-gray-500">
                Tautan reset tidak valid atau sudah kedaluwarsa. Silakan minta tautan baru.
            </p>
            <RouterLink :to="{ name: 'forgot-password' }"
                class="mt-4 inline-block text-sm font-medium text-blue-600 hover:text-blue-800">
                Minta tautan baru
            </RouterLink>
        </div>

        <form v-else class="space-y-6" @submit.prevent="handleSubmit">
            <div>
                <h3 class="text-lg font-semibold text-gray-800">Atur ulang password</h3>
                <p v-if="maskedEmail" class="mt-1 text-sm text-gray-500">
                    Untuk akun {{ maskedEmail }}
                </p>
            </div>

            <div>
                <label for="password" class="block text-sm font-medium text-gray-700">Password baru</label>
                <input v-model="form.password" :type="showPassword ? 'text' : 'password'" id="password"
                    name="password" required minlength="6" autocomplete="new-password"
                    class="mt-1 w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
            </div>

            <div>
                <label for="password-confirmation" class="block text-sm font-medium text-gray-700">
                    Konfirmasi password baru
                </label>
                <input v-model="form.password_confirmation" :type="showPassword ? 'text' : 'password'"
                    id="password-confirmation" name="password_confirmation" required minlength="6"
                    autocomplete="new-password"
                    class="mt-1 w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
            </div>

            <div class="flex items-center">
                <input id="show-password" v-model="showPassword" type="checkbox"
                    class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded">
                <label for="show-password" class="ml-2 text-sm text-gray-600">Tampilkan password</label>
            </div>

            <button type="submit" :disabled="loading"
                class="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-60">
                {{ loading ? 'Menyimpan...' : 'Simpan password baru' }}
            </button>

            <div class="text-center">
                <RouterLink :to="{ name: 'login' }" class="text-sm font-medium text-blue-600 hover:text-blue-800">
                    Kembali ke halaman masuk
                </RouterLink>
            </div>
        </form>
    </div>
</template>
