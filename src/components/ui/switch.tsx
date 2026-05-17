import { cn } from '@/lib/utils'

export function Switch({ checked, onCheckedChange }: { checked: boolean; onCheckedChange: (checked: boolean) => void }) {
  return (
    <button type="button" role="switch" aria-checked={checked} onClick={() => onCheckedChange(!checked)} className={cn('h-8 w-14 rounded-full p-1 transition', checked ? 'bg-primary' : 'bg-slate-700')}>
      <span className={cn('block h-6 w-6 rounded-full bg-white transition', checked ? 'translate-x-6' : 'translate-x-0')} />
    </button>
  )
}
