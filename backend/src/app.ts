import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import { rateLimit } from 'express-rate-limit'
import { env } from './config/env.js'
import { errorHandler, notFound } from './middlewares/error.js'
import { storageDir } from './middlewares/upload.js'
import apiRoutes from './routes/index.js'

const app = express()

app.disable('x-powered-by')

app.use(
  helmet({
    // Gambar dilayani dari origin API dan dipakai oleh web/Android.
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }),
)

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || env.corsOrigins.includes(origin)) {
        callback(null, true)
        return
      }

      const error = new Error(
        `Origin ${origin} tidak diizinkan oleh CORS.`,
      ) as Error & { status?: number }
      error.status = 403
      callback(error)
    },
  }),
)

app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true }))

if (!env.isProduction) {
  app.use(morgan('dev'))
}

// File upload lokal: http://localhost:8000/storage/tickets/<file>
app.use('/storage', express.static(storageDir, { maxAge: '1d' }))

app.use(
  '/api',
  rateLimit({
    windowMs: 60_000,
    limit: 120,
    standardHeaders: true,
    legacyHeaders: false,
  }),
)

app.use('/api', apiRoutes)

app.use(notFound)
app.use(errorHandler)

export default app
