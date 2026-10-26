import type { Response } from 'express'
import { prisma } from '../config/prisma.js'
import { TICKET_CATEGORIES, TICKET_STATUSES } from '../utils/constants.js'
import { success } from '../utils/response.js'

type DashboardAggregate = {
  total_tickets: number
  active_tickets: number
  resolved_tickets: number
  avg_resolution_time: number
}

type GroupCount = { value: string; count: number }

export async function getStatistics(_req: unknown, res: Response): Promise<void> {
  const end = new Date()
  const start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000)

  const [aggregateRows, statusRows, categoryRows] = await Promise.all([
    prisma.$queryRaw<DashboardAggregate[]>`
      SELECT
        COUNT(*)::int AS total_tickets,
        COUNT(*) FILTER (WHERE status <> 'resolved')::int AS active_tickets,
        COUNT(*) FILTER (WHERE status = 'resolved')::int AS resolved_tickets,
        COALESCE(
          ROUND(
            AVG(
              GREATEST(
                0,
                FLOOR(EXTRACT(EPOCH FROM (completed_at - created_at)) / 3600)
              )
            )::numeric,
            1
          ),
          0
        )::double precision AS avg_resolution_time
      FROM tickets
      WHERE deleted_at IS NULL AND created_at BETWEEN ${start} AND ${end}
    `,
    prisma.$queryRaw<GroupCount[]>`
      SELECT status AS value, COUNT(*)::int AS count
      FROM tickets
      WHERE deleted_at IS NULL AND created_at BETWEEN ${start} AND ${end}
      GROUP BY status
    `,
    prisma.$queryRaw<GroupCount[]>`
      SELECT category AS value, COUNT(*)::int AS count
      FROM tickets
      WHERE deleted_at IS NULL AND created_at BETWEEN ${start} AND ${end}
      GROUP BY category
    `,
  ])

  const aggregate = aggregateRows[0]
  const statusDistribution = Object.fromEntries(
    TICKET_STATUSES.map((status) => [status, 0]),
  ) as Record<(typeof TICKET_STATUSES)[number], number>
  const categoryDistribution = Object.fromEntries(
    TICKET_CATEGORIES.map((category) => [category, 0]),
  ) as Record<(typeof TICKET_CATEGORIES)[number], number>

  for (const row of statusRows) {
    if (row.value in statusDistribution) {
      statusDistribution[row.value as keyof typeof statusDistribution] = row.count
    }
  }
  for (const row of categoryRows) {
    if (row.value in categoryDistribution) {
      categoryDistribution[row.value as keyof typeof categoryDistribution] = row.count
    }
  }

  success(
    res,
    {
      total_tickets: aggregate?.total_tickets ?? 0,
      active_tickets: aggregate?.active_tickets ?? 0,
      resolved_tickets: aggregate?.resolved_tickets ?? 0,
      avg_resolution_time: Number(aggregate?.avg_resolution_time ?? 0),
      status_distribution: statusDistribution,
      category_distribution: categoryDistribution,
    },
    'Dashboard statistic fetched successfully',
  )
}
