import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'

const PUBLIC_VAPID_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY
// Assuming backend runs on 8000
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// Convert URLBase64 to Uint8Array for push manager
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export function usePushNotifications() {
  const { appUser } = useAuth()
  const [isSupported, setIsSupported] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>('default')

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true)
      setPermission(Notification.permission)
      
      // Request permission immediately if supported and not yet asked
      if (Notification.permission === 'default') {
        requestPermissionAndSubscribe()
      } else if (Notification.permission === 'granted') {
        // Ensure subscription exists if already granted
        subscribeToPush()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appUser])

  const requestPermissionAndSubscribe = async () => {
    try {
      const perm = await Notification.requestPermission()
      setPermission(perm)
      if (perm === 'granted') {
        await subscribeToPush()
      }
    } catch (err) {
      console.error('Failed to request push permission', err)
    }
  }

  const subscribeToPush = async () => {
    if (!appUser || !PUBLIC_VAPID_KEY) return

    try {
      const registration = await navigator.serviceWorker.register('/sw.js')
      // Wait until active
      await navigator.serviceWorker.ready

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY)
      })

      const subData = subscription.toJSON()
      
      // Send to backend
      const res = await fetch(`${API_URL}/api/notifications/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: appUser.id,
          endpoint: subData.endpoint,
          p256dh: subData.keys?.p256dh,
          auth: subData.keys?.auth
        })
      })
      
      if (!res.ok) {
        console.error('Failed to subscribe on server')
      }
    } catch (err) {
      console.error('Failed to subscribe to push', err)
    }
  }

  return {
    isSupported,
    permission,
    requestPermission: requestPermissionAndSubscribe
  }
}
