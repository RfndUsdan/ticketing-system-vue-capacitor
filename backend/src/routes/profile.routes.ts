import { Router } from 'express'
import { deleteAvatar, updateProfile } from '../controllers/profile.controller.js'
import { authenticate } from '../middlewares/auth.js'
import { uploadProfileAvatar } from '../middlewares/upload.js'
import { validate } from '../middlewares/validate.js'
import { profileAvatarDeleteLimit, profileUpdateLimit } from '../middlewares/rate-limit.js'
import { updateProfileSchema } from '../validators/user.validator.js'

const router = Router()

router.post('/', authenticate, profileUpdateLimit, uploadProfileAvatar, validate(updateProfileSchema), updateProfile)
router.delete('/avatar', authenticate, profileAvatarDeleteLimit, deleteAvatar)

export default router
