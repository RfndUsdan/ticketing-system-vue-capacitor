import { Router } from 'express'
import { getStatistics } from '../controllers/dashboard.controller.js'
import { authenticate, requireAdmin } from '../middlewares/auth.js'

const router = Router()

router.get('/statistic', authenticate, requireAdmin, getStatistics)

export default router
