<script setup>
import { useAuthStore } from '@/stores/auth'
import { storeToRefs } from 'pinia'
import { ref } from 'vue'
import { showPopup } from '@/helpers/popup'

const authStore = useAuthStore();
const { loading, error } = storeToRefs(authStore);
const { register } = authStore 

const showPassword = ref(false)
const showConfirmPassword = ref(false)
const form = ref({
    name: '',
    email: '',
    nim: '',
    password: '',
    confirmPassword: '',
})

const handleSubmit = async () => {
    authStore.error = null
    if (form.value.password !== form.value.confirmPassword) {
        authStore.error = { confirmPassword: ['Konfirmasi password tidak cocok.'] }
        return
    }

    await register(form.value)
    if (typeof authStore.error === 'string') showPopup(authStore.error, 'error')
}

const togglePassword = () => {
    showPassword.value = !showPassword.value
}

const toggleConfirmPassword = () => {
    showConfirmPassword.value = !showConfirmPassword.value
}
</script>

<template>
    <form class="space-y-6" @submit.prevent="handleSubmit">
        <!-- Name -->
        <div>
            <label for="name" class="block text-sm font-medium text-gray-700">Nama Lengkap</label>
            <div class="mt-1 relative">
                <!-- TODO: Add v-model binding for name -->
                <input v-model="form.name" type="text" id="name" name="name" required
                    class="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="John Doe" :class="{'border-red-500 ring-red-500': error?.name }">
                <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <i data-feather="user" class="w-4 h-4 text-gray-400"></i>
                </div>

                <p class="mt-1 text-xs text-red-500" v-if="error?.name">
                    {{ error?.name?.join(', ') }}
                </p>
            </div>
        </div>

        <!-- Email -->
        <div>
            <label for="email" class="block text-sm font-medium text-gray-700">Email</label>
            <div class="mt-1 relative">
                <!-- TODO: Add v-model binding for email -->
                <input v-model="form.email" type="email" id="email" name="email" required
                    class="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="nama@perusahaan.com" :class="{'border-red-500 ring-red-500': error?.email }">
                <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <i data-feather="mail" class="w-4 h-4 text-gray-400"></i>
                </div>
                
                <p class="mt-1 text-xs text-red-500" v-if="error?.email">
                    {{ error?.email?.join(', ') }}
                </p>
            </div>
        </div>

        <!-- NIM -->
        <div>
            <label for="nim" class="block text-sm font-medium text-gray-700">Nomor Induk Mahasiswa (NIM)</label>
            <div class="mt-1 relative">
                <!-- TODO: Add v-model binding for NIM -->
                <input v-model="form.nim" type="text" id="nim" name="nim" required
                    class="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="Contoh: 123456789" :class="{'border-red-500 ring-red-500': error?.nim }">
                <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <i data-feather="user" class="w-4 h-4 text-gray-400"></i>
                </div>

                <p class="mt-1 text-xs text-red-500" v-if="error?.nim">
                    {{ error?.nim?.join(', ') }}
                </p>
            </div>
        </div>

        <!-- Password -->
        <div>
            <label for="password" class="block text-sm font-medium text-gray-700">Password</label>
            <div class="mt-1 relative">
                <!-- TODO: Add v-model binding for password -->
                <input v-model="form.password" :type="showPassword ? 'text' : 'password'" id="password" name="password" required minlength="6"
                    class="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="••••••••" :class="{'border-red-500 ring-red-500': error?.password }">
                <div class="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <!-- TODO: Add click handler for password toggle -->
                    <button type="button" class="text-gray-400 hover:text-gray-600 focus:outline-none" @click="togglePassword">
                        <i data-feather="eye" class="w-4 h-4" id="password-toggle"></i>
                    </button>
                </div>

                <p class="mt-1 text-xs text-red-500" v-if="error?.password">
                    {{ error?.password?.join(', ') }}
                </p>
            </div>
        </div>

        <!-- Confirm Password -->
        <div>
            <label for="confirm-password" class="block text-sm font-medium text-gray-700">Konfirmasi Password</label>
            <div class="mt-1 relative">
                <!-- TODO: Add v-model binding for confirm password -->
                <input v-model="form.confirmPassword" :type="showConfirmPassword ? 'text' : 'password'" id="confirm-password" name="confirmPassword" required minlength="6"
                    class="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="••••••••" :class="{'border-red-500 ring-red-500': error?.confirmPassword }">
                <div class="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <!-- TODO: Add click handler for confirm password toggle -->
                    <button type="button" class="text-gray-400 hover:text-gray-600 focus:outline-none" @click="toggleConfirmPassword">
                        <i data-feather="eye" class="w-4 h-4" id="confirm-password-toggle"></i>
                    </button>
                </div>

                <p class="mt-1 text-xs text-red-500" v-if="error?.confirmPassword">
                    {{ error?.confirmPassword?.join(', ') }}
                </p>
            </div>
        </div>

        <!-- Submit Button -->
        <div>
            <!-- TODO: Add loading state to button -->
            <button type="submit"
                class="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                <span v-if="!loading">
                    Daftar
                </span>
                <span v-else>
                    Loading...
                </span>
            </button>
        </div>
    </form>

    <!-- Divider -->
    <div class="mt-6">
        <div class="relative">
            <div class="absolute inset-0 flex items-center">
                <div class="w-full border-t border-gray-200"></div>
            </div>
            <div class="relative flex justify-center text-sm">
                <span class="px-2 bg-white text-gray-500">Atau</span>
            </div>
        </div>
    </div>

    <!-- Login Link -->
    <div class="mt-6 text-center">
        <p class="text-sm text-gray-600">
            Sudah punya akun?
            <RouterLink :to="{ name: 'login' }" class="font-medium text-blue-600 hover:text-blue-800">Masuk
                sekarang</RouterLink>
        </p>
    </div>
</template>
