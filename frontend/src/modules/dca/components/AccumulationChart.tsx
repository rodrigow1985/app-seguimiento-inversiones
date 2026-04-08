import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { DcaEntry } from '@/api/dca'

interface ChartPoint {
  date: string
  accumulated: number
  entry: number
}

function buildChartData(entries: DcaEntry[]): ChartPoint[] {
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date))
  let accumulated = 0
  return sorted.map((e) => {
    const delta = e.type === 'CIERRE' ? -e.amount_usd : e.amount_usd
    accumulated += delta
    return {
      date: formatDate(e.date),
      accumulated: Math.max(0, accumulated),
      entry: e.amount_usd,
    }
  })
}

interface AccumulationChartProps {
  entries: DcaEntry[]
}

export function AccumulationChart({ entries }: AccumulationChartProps) {
  const data = buildChartData(entries)

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-sm text-muted-foreground">
        Sin datos para graficar
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="accGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v: number) => `$${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}`}
          width={48}
        />
        <Tooltip
          contentStyle={{
            background: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '6px',
            fontSize: '12px',
            color: 'hsl(var(--foreground))',
          }}
          formatter={(value, name) => [
            typeof value === 'number' ? formatCurrency(value, 'USD') : String(value),
            name === 'accumulated' ? 'Capital acumulado' : 'Monto entrada',
          ]}
        />
        <Area
          type="monotone"
          dataKey="accumulated"
          stroke="#10b981"
          strokeWidth={2}
          fill="url(#accGrad)"
          dot={false}
          activeDot={{ r: 4, fill: '#10b981', strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
