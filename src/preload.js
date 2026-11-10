/**
 * Developed by Mohammad Rameez Imdad (Rameez Scripts)
 * WhatsApp: https://wa.me/923435347417 (For Custom Projects)
 * YouTube: https://www.youtube.com/@rameezimdad (Subscribe for more!)
 */
const {contextBridge, ipcRenderer} = require('electron')

const CALLS = ['boot', 'engine:install', 'app:update', 'probe', 'enqueue', 'enqueue:many', 'queue', 'q:pause', 'q:resume', 'q:cancel', 'q:run', 'set', 'pick-folder', 'cats', 'cat-dir', 'history', 'open', 'reveal', 'delete', 'open-out', 'paste', 'copy', 'ext', 'ext-folder', 'ext-status', 'browsers', 'ext-setup', 'pw:open', 'pw:act', 'fi:open', 'fi:browse', 'fi:go', 'devices', 'xfer', 'xfer:cancel']
const EVENTS = ['engine:progress', 'engine:warn', 'engine:ready', 'dl:progress', 'dl:stage', 'dl:count', 'dl:done', 'dl:failed', 'queue:changed', 'clip:link', 'clip:open', 'ext:status', 'pw:init', 'pw:done', 'pw:state', 'fi:loading', 'fi:init', 'devices', 'xfer:progress', 'xfer:done', 'app:update']

contextBridge.exposeInMainWorld('rs', {
  call: (ch, arg) => (CALLS.includes(ch) ? ipcRenderer.invoke(ch, arg) : Promise.resolve({ok: false})),
  on: (ch, fn) => EVENTS.includes(ch) && ipcRenderer.on(ch, (_e, v) => fn(v)),
})
