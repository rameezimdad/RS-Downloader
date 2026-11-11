/**
 * Developed by Mohammad Rameez Imdad (Rameez Scripts)
 * WhatsApp: https://wa.me/923435347417 (For Custom Projects)
 * YouTube: https://www.youtube.com/@rameezimdad (Subscribe for more!)
 */
// talks only to the RS Downloader app on this PC
importScripts('i18n.js')
const API = 'http://127.0.0.1:47321'
const H = {'X-RS-Downloader': '1'}
const MEDIA = /^https?:\/\/([a-z0-9-]+\.)*(youtube\.com|youtu\.be|x\.com|twitter\.com|instagram\.com|tiktok\.com|facebook\.com|fb\.watch|vimeo\.com|reddit\.com|redd\.it|pinterest\.[a-z.]+|pin\.it|threads\.(net|com)|twitch\.tv|soundcloud\.com|dailymotion\.com)(\/|$)/i
// browser downloads worth catching
const CATCH = /\.(zip|rar|7z|gz|tgz|bz2|xz|tar|iso|img|exe|msi|msix|apk|xapk|dmg|pkg|deb|rpm|appimage|pdf|docx?|xlsx?|pptx?|epub|mp4|mkv|webm|avi|mov|m4v|wmv|flv|mp3|m4a|wav|flac|ogg|opus|aac)$/i

const timeout = ms => AbortSignal.timeout(ms)
// browser name + extension version go with every ping, so the app can show what is installed
const BROWSER = (navigator.userAgentData?.brands || []).map(b => b.brand).find(b => /Edge|Opera|Brave|Vivaldi|Chrome/.test(b))?.replace('Google ', '').replace('Microsoft ', '') || 'Chrome'
const who = () => `?b=${encodeURIComponent(BROWSER)}&v=${encodeURIComponent(chrome.runtime.getManifest().version)}`
async function ping() {
  try {
    const r = await fetch(API + '/ping' + who(), {headers: H, signal: timeout(1200)})
    // the app's language: menus, page bar and popup follow it
    r.ok && r.clone().json().then(j => { if (j.lang && j.lang !== RST.lang()) { RST.set(j.lang); chrome.storage.local.set({lang: j.lang}); menus() } }).catch(() => {})
    return r.ok
  } catch { return false }
}
// heartbeat: app shows "extension connected" while the browser is open
chrome.alarms.create('hello', {periodInMinutes: 1})
chrome.alarms.onAlarm.addListener(a => a.name === 'hello' && ping())
chrome.runtime.onStartup.addListener(ping)
ping()
function badge(text, color) {
  chrome.action.setBadgeBackgroundColor({color})
  chrome.action.setBadgeText({text})
  setTimeout(() => chrome.action.setBadgeText({text: ''}), 2500)
}
// file links carry the browser's cookies + referrer so protected downloads still work; video sites never get them
async function headersFor(url, referrer = '') {
  const headers = {}
  if (MEDIA.test(url)) return headers
  try {
    const jar = await chrome.cookies.getAll({url})
    if (jar.length) headers.Cookie = jar.map(c => `${c.name}=${c.value}`).join('; ')
  } catch {}
  if (/^https?:/.test(referrer)) headers.Referer = referrer
  headers['User-Agent'] = navigator.userAgent
  return headers
}
const OFF = () => RST.T('RS Downloader is not running. Open the app and try again.')
async function post(path, body, ms = 4000) {
  try {
    const r = await fetch(API + path, {method: 'POST', headers: {...H, 'Content-Type': 'application/json'}, body: JSON.stringify(body), signal: timeout(ms)})
    return r.ok ? await r.json() : {ok: false, msg: OFF()}
  } catch (e) { return {ok: false, msg: e?.name === 'TimeoutError' ? RST.T('Reading this video took too long. Try again.') : OFF()} }
}
async function send(url, referrer = '', filename = '') {
  const r = await post('/add', {url, filename, headers: await headersFor(url, referrer)})
  badge(r.ok ? 'OK' : 'OFF', r.ok ? '#16a34a' : '#dc2626')
  return r.ok
}

// open tabs get the new page script at once (no refresh needed after install / update)
async function injectOpenTabs() {
  for (const t of await chrome.tabs.query({url: ['http://*/*', 'https://*/*']})) {
    chrome.scripting.executeScript({target: {tabId: t.id, allFrames: true}, files: ['i18n.js', 'content.js']}).catch(() => {})
  }
}
chrome.runtime.onInstalled.addListener(() => {
  ping()
  injectOpenTabs()
  RST.ready().then(menus)
})
function menus() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({id: 'link', title: RST.T('Download link with RS Downloader'), contexts: ['link']})
    chrome.contextMenus.create({id: 'media', title: RST.T('Download this with RS Downloader'), contexts: ['video', 'audio', 'image']})
    chrome.contextMenus.create({id: 'page', title: RST.T('Download the video on this page'), contexts: ['page']})
  })
}
chrome.contextMenus.onClicked.addListener((info, tab) => {
  const page = tab?.url || ''
  const url = info.menuItemId === 'link' ? info.linkUrl : info.menuItemId === 'media' && /^https?:/.test(info.srcUrl || '') && !MEDIA.test(page) ? info.srcUrl : page
  url && send(url, page)
})

// catch the browser's own downloads (IDM style); the app must be running, else the browser keeps it
chrome.downloads.onCreated.addListener(async d => {
  const {capture} = await chrome.storage.local.get({capture: true})
  const url = d.finalUrl || d.url
  if (!capture || !/^https?:/i.test(url) || d.byExtensionId) return
  let path = ''
  try { path = new URL(url).pathname } catch { return }
  const name = (d.filename || '').split(/[\\/]/).pop()
  if (!CATCH.test(name) && !CATCH.test(path) && !((d.totalBytes || d.fileSize || 0) > 5e6)) return
  if (!(await ping())) return
  try { await chrome.downloads.cancel(d.id); await chrome.downloads.erase({id: d.id}) } catch {}
  send(url, d.referrer || '', name)
})

// popup + page button
chrome.runtime.onMessage.addListener((m, sender, reply) => {
  if (m?.type === 'ping') ping().then(ok => reply({ok}))
  else if (m?.type === 'add' && /^https?:/i.test(m.url || '')) send(m.url, sender.tab?.url || m.url).then(ok => reply({ok}))
  // page menu: qualities for one video, then a picked quality straight to the app
  else if (m?.type === 'probe' && /^https?:/i.test(m.url || '')) headersFor(m.url, sender.tab?.url).then(h => post('/probe', {url: m.url, headers: h}, 120000)).then(reply)
  else if (m?.type === 'grab' && /^https?:/i.test(m.url || '') && m.label) headersFor(m.url, sender.tab?.url).then(h => post('/add', {url: m.url, label: String(m.label), kind: m.kind, headers: h})).then(r => { badge(r.ok ? 'OK' : 'OFF', r.ok ? '#16a34a' : '#dc2626'); reply(r) })
  else return false
  return true
})
