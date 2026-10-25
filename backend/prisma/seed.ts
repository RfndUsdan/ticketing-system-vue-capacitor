import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../src/generated/prisma/client.ts'

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL belum diisi. Salin .env.example menjadi .env terlebih dahulu.')
}

const adapter = new PrismaPg({ connectionString })
const prisma = new PrismaClient({ adapter })

async function main() {
  const [adminPassword, userPassword] = await Promise.all([
    bcrypt.hash('Admin123!', 12),
    bcrypt.hash('User123!', 12),
  ])

  const admin = await prisma.user.upsert({
    where: { email: 'admin@apakabar.local' },
    update: { name: 'Administrator', role: 'admin' },
    create: {
      name: 'Administrator',
      email: 'admin@apakabar.local',
      password: adminPassword,
      role: 'admin',
    },
  })

  const user = await prisma.user.upsert({
    where: { email: 'mahasiswa@apakabar.local' },
    update: { name: 'Mahasiswa Demo' },
    create: {
      name: 'Mahasiswa Demo',
      email: 'mahasiswa@apakabar.local',
      password: userPassword,
      nim: '2305101086',
      role: 'user',
    },
  })

  const ticketSeeds = [
    {
      code: 'TKT-2026-0001',
      title: 'AC ruang kelas A201 tidak dingin',
      category: 'Fasilitas',
      priority: 'high',
      description: 'AC di ruang A201 sudah tidak dingin sejak kemarin. Sudah dicoba nyalakan ulang tetapi tetap hangat.',
      status: 'open',
    },
    {
      code: 'TKT-2026-0002',
      title: 'Wi-Fi laboratorium komputer terputus',
      category: 'Jaringan',
      priority: 'medium',
      description: 'Koneksi Wi-Fi di laboratorium komputer sering terputus saat praktikum berlangsung.',
      status: 'in_progress',
    },
    {
      code: 'TKT-2026-0003',
      title: 'Lampu koridor lantai 2 mati',
      category: 'Fasilitas',
      priority: 'low',
      description: 'Dua lampu di koridor lantai 2 mati sehingga area menjadi gelap pada malam hari.',
      status: 'resolved',
    },
  ] as const

  for (const seed of ticketSeeds) {
    await prisma.ticket.upsert({
      where: { code: seed.code },
      update: {},
      create: {
        ...seed,
        userId: user.id,
        completedAt: seed.status === 'resolved' ? new Date() : null,
      },
    })
  }

  const inProgressTicket = await prisma.ticket.findUnique({
    where: { code: 'TKT-2026-0002' },
  })

  if (inProgressTicket) {
    const existingReply = await prisma.ticketReply.findFirst({
      where: { ticketId: inProgressTicket.id },
    })

    if (!existingReply) {
      await prisma.ticketReply.create({
        data: {
          ticketId: inProgressTicket.id,
          userId: admin.id,
          content: 'Laporan sudah diterima. Teknisi sedang memeriksa perangkat jaringan di laboratorium.',
        },
      })
    }
  }

  console.log('Seed selesai.')
  console.log('Admin : admin@apakabar.local / Admin123!')
  console.log('User  : mahasiswa@apakabar.local / User123!')
}

main()
  .catch((error) => {
    console.error('Seed gagal:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
