import { RefreshCcw } from 'lucide-react'
import { cn, formatNumber } from '@/lib/utils'
import { useCclLatest, useSyncCcl } from '@/api/ccl'

function formatShortDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
  })
}

export function CclBadge() {
  const { data, isLoading } = useCclLatest()
  const sync = useSyncCcl()

  const isSyncing = sync.isPending

  return (
    <div className="flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-3 py-1">
      <span className="text-xs text-muted-foreground font-mono">CCL</span>
      {isLoading ? (
        <span className="text-xs font-mono text-muted-foreground animate-pulse">…</span>
      ) : data ? (
        <>
          <span className="text-xs font-mono font-medium text-warn">
            ${formatNumber(data.rate, 2)}
          </span>
          <span className="text-[10px] text-muted-foreground font-mono hidden sm:inline">
            {formatShortDate(data.date)}
          </span>
        </>
      ) : (
        <span className="text-xs font-mono text-muted-foreground">—</span>
      )}
      <button
        onClick={() => sync.mutate()}
        disabled={isSyncing}
        className={cn(
          'ml-0.5 rounded-full p-0.5 text-muted-foreground transition-colors hover:text-foreground',
          isSyncing && 'opacity-60 cursor-not-allowed',
        )}
        title="Sincronizar CCL"
      >
        <RefreshCcw className={cn('h-3 w-3', isSyncing && 'animate-spin')} />
      </button>
    </div>
  )
}

export default CclBadge
