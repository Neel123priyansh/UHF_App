import { Workbox } from 'workbox-window'

if ('serviceWorker' in navigator) {
  const wb = new Workbox('/sw.js')
  wb.addEventListener('waiting', () => {
    // Optional: show a “new version available” toast and then:
    wb.messageSkipWaiting()
  })
  wb.register()
}
