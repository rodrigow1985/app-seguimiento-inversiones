import { Link } from 'react-router-dom'
import { TrendingUp, TrendingDown, type LucideIcon } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatPercent } from '@/lib/utils'

interface KpiCardProps {
  label: string
  value: string
  subValue?: string
  trend?: number
  icon?: LucideIcon
  isLoading?: boolean
  linkTo?: string
  style?: React.CSSProperties
}

function KpiCardInner({
  label,
  value,
  subValue,
  trend,
  icon: Icon,
  isLoading,
}: Omit<KpiCardProps, 'linkTo' | 'style'>) {
  return (
    <>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{label}</CardTitle>
          {Icon && (
            <div className="h-7 w-7 rounded-md bg-muted flex items-center justify-center">
              <Icon className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <div className="h-7 w-3/4 rounded-md bg-gradient-to-r from-muted via-accent to-muted bg-[length:400px_100%] animate-shimmer" />
            <div className="h-4 w-1/2 rounded-md bg-gradient-to-r from-muted via-accent to-muted bg-[length:400px_100%] animate-shimmer" />
          </div>
        ) : (
          <div className="space-y-1.5">
            <p className="text-2xl font-display font-semibold text-foreground font-num tracking-tight">
              {value}
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              {subValue && (
                <span className="text-xs text-muted-foreground font-mono">{subValue}</span>
              )}
              {trend !== undefined && (
                <Badge
                  variant={trend >= 0 ? 'profit' : 'loss'}
                  className="gap-1 text-[10px] px-1.5 py-0"
                >
                  {trend >= 0 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {formatPercent(trend)}
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </>
  )
}

export function KpiCard({ linkTo, style, ...rest }: KpiCardProps) {
  if (linkTo) {
    return (
      <Link to={linkTo} className="block group" style={style}>
        <Card className="h-full transition-all duration-200 group-hover:border-primary/40 group-hover:bg-card/80">
          <KpiCardInner {...rest} />
        </Card>
      </Link>
    )
  }

  return (
    <Card style={style} className="h-full">
      <KpiCardInner {...rest} />
    </Card>
  )
}
