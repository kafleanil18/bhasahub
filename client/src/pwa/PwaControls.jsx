import { useEffect, useRef, useState } from 'react'
import './pwa.css'

export default function PwaControls() {
  const [install, setInstall] = useState(null)
  const [waiting, setWaiting] = useState(null)
  const [dismissed, setDismissed] = useState(false)
  const [updating, setUpdating] = useState(false)
  const reloadRequested = useRef(false)

  useEffect(() => {
    const onInstall = event => {
      event.preventDefault()
      setInstall(event)
    }
    const onInstalled = () => setInstall(null)
    window.addEventListener('beforeinstallprompt', onInstall)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onInstall)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  useEffect(() => {
    if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return
    let active = true
    let registration
    let installing
    const checkWaiting = () => {
      if (active && registration?.waiting) setWaiting(registration.waiting)
    }
    const trackInstall = () => {
      installing?.removeEventListener('statechange', checkWaiting)
      installing = registration.installing
      installing?.addEventListener('statechange', checkWaiting)
    }
    const onControllerChange = () => {
      if (reloadRequested.current) window.location.reload()
    }
    const checkUpdate = () => {
      if (document.visibilityState === 'visible') registration?.update().catch(() => {})
    }
    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange)
    navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' }).then(result => {
      if (!active) return
      registration = result
      checkWaiting()
      trackInstall()
      registration.addEventListener('updatefound', trackInstall)
    }).catch(error => console.warn('Offline support could not start:', error))
    document.addEventListener('visibilitychange', checkUpdate)
    return () => {
      active = false
      installing?.removeEventListener('statechange', checkWaiting)
      registration?.removeEventListener('updatefound', trackInstall)
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange)
      document.removeEventListener('visibilitychange', checkUpdate)
    }
  }, [])

  if (dismissed || (!waiting && !install)) return null
  return (
    <aside className="pwa-notice" aria-label={waiting ? 'App update' : 'Install app'}>
      <p role="status">{waiting ? 'A new version is ready. Finish your work before reloading.' : 'Keep Xiao Ao on your home screen for easy access.'}</p>
      <div className="pwa-actions">
        {waiting ? (
          <button type="button" disabled={updating} onClick={() => {
            reloadRequested.current = true
            setUpdating(true)
            waiting.postMessage({ type: 'SKIP_WAITING' })
          }}>{updating ? 'Updating…' : 'Reload to update'}</button>
        ) : (
          <button type="button" onClick={async () => {
            const prompt = install
            setInstall(null)
            try { await prompt.prompt() } catch { /* Browser cancelled the prompt. */ }
          }}>Install app</button>
        )}
        <button className="pwa-later" type="button" onClick={() => setDismissed(true)}>Later</button>
      </div>
    </aside>
  )
}
