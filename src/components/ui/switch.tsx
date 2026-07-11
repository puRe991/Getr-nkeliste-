import { cn } from '@/lib/utils'

export function Switch({ checked, onCheckedChange, disabled }: { checked: boolean; onCheckedChange: (checked: boolean) => void; disabled?: boolean }) {
  return (
    <button type="button" role="switch" aria-checked={checked} disabled={disabled} onClick={() => onCheckedChange(!checked)} className={cn('h-8 w-14 rounded-full p-1 transition disabled:opacity-50', checked ? 'bg-primary' : 'bg-slate-700')}>
      <span className={cn('block h-6 w-6 rounded-full bg-white transition', checked ? 'translate-x-6' : 'translate-x-0')} />
    </button>
  )
}
