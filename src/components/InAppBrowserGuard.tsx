'use client'

import { useEffect, useState } from 'react'

function isInAppBrowser(): boolean {
  const ua = navigator.userAgent
  return /FBAN|FBAV|FB_IAB|MessengerForiOS|Instagram|WhatsApp|Musical_ly|BytedanceWebview|MicroMessenger|Line\//.test(ua)
}

export default function InAppBrowserGuard() {
  const [blocked, setBlocked] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (isInAppBrowser()) setBlocked(true)
  }, [])

  if (!blocked) return null

  const url = 'https://songless-bois.vercel.app'

  const handleCopy = () => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-zinc-950 px-6 text-center">
      <div className="flex flex-col items-center gap-6 max-w-xs">
        <div className="text-5xl">🌐</div>
        <div>
          <h2 className="text-white font-bold text-xl mb-2">Open in your browser</h2>
          <p className="text-zinc-400 text-sm leading-relaxed">
            Google sign-in doesn&apos;t work inside Messenger or Instagram.
            Copy the link and open it in <strong className="text-white">Safari</strong> or <strong className="text-white">Chrome</strong>.
          </p>
        </div>
        <button
          onClick={handleCopy}
          className="w-full py-3 rounded-2xl font-semibold text-sm transition-all active:scale-[0.98]"
          style={{ backgroundColor: 'var(--accent)', color: 'rgba(0,0,0,0.75)' }}
        >
          {copied ? '✓ Copied!' : 'Copy link'}
        </button>
        <p className="text-zinc-600 text-xs">
          Then tap the address bar in Safari/Chrome and paste
        </p>
      </div>
    </div>
  )
}
