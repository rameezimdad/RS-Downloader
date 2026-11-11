/**
 * Developed by Mohammad Rameez Imdad (Rameez Scripts)
 * WhatsApp: https://wa.me/923435347417 (For Custom Projects)
 * YouTube: https://www.youtube.com/@rameezimdad (Subscribe for more!)
 */
const $ = id => document.getElementById(id)
const T = RST.T
const say = (t, cls) => { $('st').textContent = T(t); $('dot').className = 'dot ' + (cls || '') }

// static text in the app language, then the live check
RST.ready().then(() => {
  document.documentElement.dir = RST.rtl() ? 'rtl' : 'ltr'
  document.querySelectorAll('#st, #page, #go, .tg span, .hint').forEach(e => (e.textContent = T(e.textContent.trim())))
  $('url').placeholder = T($('url').placeholder)
})
chrome.runtime.sendMessage({type: 'ping'}, r => r?.ok
  ? say('Connected to RS Downloader on this PC.', 'ok')
  : say('RS Downloader is not running. Open the app, then try again.', 'bad'))

chrome.storage.local.get({capture: true, pageBtn: true}, s => { $('capture').checked = s.capture; $('pageBtn').checked = s.pageBtn })
$('capture').addEventListener('change', e => chrome.storage.local.set({capture: e.target.checked}))
$('pageBtn').addEventListener('change', e => chrome.storage.local.set({pageBtn: e.target.checked}))

const send = (url, btn) => {
  btn.disabled = true
  chrome.runtime.sendMessage({type: 'add', url}, r => {
    btn.disabled = false
    r?.ok ? (say('Sent. Pick the quality in RS Downloader.', 'ok'), setTimeout(() => window.close(), 900)) : say('Could not reach RS Downloader. Is the app open?', 'bad')
  })
}
$('page').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({active: true, currentWindow: true})
  ;/^https?:/.test(tab?.url || '') ? send(tab.url, $('page')) : say('This tab has no web page to download.', 'bad')
})
$('go').addEventListener('click', () => { const u = $('url').value.trim(); /^https?:\/\//i.test(u) ? send(u, $('go')) : say('Paste a full link starting with http.', 'bad') })
$('url').addEventListener('keydown', e => e.key === 'Enter' && $('go').click())
