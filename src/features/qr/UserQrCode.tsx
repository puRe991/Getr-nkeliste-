import { useEffect, useState } from 'react'
import QRCode from 'qrcode'

export function UserQrCode({ userId, name }: { userId: string; name: string }) {
  const [src, setSrc] = useState('')
  useEffect(() => { void QRCode.toDataURL(JSON.stringify({ type: 'getraenkekasse-user', userId }), { margin: 1, width: 192 }).then(setSrc) }, [userId])
  return <div className="rounded-2xl bg-white p-3 text-center text-slate-950"><img src={src} alt={`QR-Code für ${name}`} className="mx-auto h-36 w-36" /><p className="mt-2 text-sm font-bold">{name}</p></div>
}
