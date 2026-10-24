export function handleError(error) {
    if (error.response) {
        const status = error.response.status
        const data = error.response.data

        if (status === 422) {
            // Field level validation, biasanya object { field: [msg...] }
            return data?.errors
        } else if (status === 401) {
            return data?.message || 'Unauthorized'
        } else if (status === 400) {
            return data?.message || 'Permintaan tidak valid'
        } else if (status === 500) {
            return data?.message || 'Terjadi kesalahan pada server'
        }

        // Fallback untuk status lain
        return data?.message || `Terjadi kesalahan (${status})`
    }

    // Request terkirim, tapi nggak ada response (network error, timeout, CORS)
    if (error.request) {
        return 'Tidak dapat terhubung ke server. Periksa koneksi jaringan Anda.'
    }

    // Error lain (mis. error di logic JS)
    return error.message || 'Terjadi kesalahan yang tidak diketahui.'
}
