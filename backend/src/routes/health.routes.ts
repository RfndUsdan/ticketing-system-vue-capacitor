import { Router } from 'express'
import { success } from '../utils/response.js'

const router = Router()

router.get('/', (_req, res) => {
  success(
    res,
    {
      status: 'ok',
      uptime: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    },
    'Apa Kabar API aktif.',
  )
})

export default router
