import { Router } from 'express'
import { login, logout, me, register } from '../controllers/auth.controller.js'
import { authenticate } from '../middlewares/auth.js'
import { uploadAvatar } from '../middlewares/upload.js'
import { validate } from '../middlewares/validate.js'
import { registerSchema } from '../validators/auth.validator.js'

const router = Router()

// Frontend memanggil /api/login dan /api/register (bukan /api/auth/...).
router.post('/register', uploadAvatar, validate(registerSchema), register)
router.post('/login', login)
router.get('/me', authenticate, me)
router.post('/logout', authenticate, logout)

export default router
