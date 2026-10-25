import app from './app.js'
import { env } from './config/env.js'
import { prisma } from './config/prisma.js'

const server = app.listen(env.PORT, () => {
  console.log(
    `[api] Apa Kabar API berjalan di http://localhost:${env.PORT} (${env.NODE_ENV})`,
  )
})

function shutdown(signal: NodeJS.Signals): void {
  console.log(`[api] Menerima ${signal}, menutup server...`)

  server.close(() => {
    void prisma.$disconnect().finally(() => {
      process.exit(0)
    })
  })
}

process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))

process.on('unhandledRejection', (reason) => {
  console.error('[api] Unhandled rejection:', reason)
})
