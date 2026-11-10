/**
 * Developed by Mohammad Rameez Imdad (Rameez Scripts)
 * WhatsApp: https://wa.me/923435347417 (For Custom Projects)
 * YouTube: https://www.youtube.com/@rameezimdad (Subscribe for more!)
 */
// "Download this video" bar on the hovered / playing video; click = list of qualities, pick one = download starts
(() => {
  // one copy per extension version; an updated extension injects a fresh one
  const KEY = '__rsdl_' + chrome.runtime.getManifest().version
  if (window[KEY]) return
  window[KEY] = true
  // after the extension is reloaded or updated, this old copy loses chrome.* and must go quiet
  const alive = () => { try { return !!chrome.runtime?.id } catch { return false } }
  const MEDIA = /^https?:\/\/([a-z0-9-]+\.)*(youtube\.com|youtu\.be|x\.com|twitter\.com|instagram\.com|tiktok\.com|facebook\.com|fb\.watch|vimeo\.com|reddit\.com|pinterest\.[a-z.]+|threads\.(net|com)|twitch\.tv|dailymotion\.com)(\/|$)/i
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'})[c])
  const fmtB = n => { if (!n) return ''; const u = ['B', 'KB', 'MB', 'GB']; let i = 0; while (n >= 1024 && i < 3) { n /= 1024; i++ } return `${n.toFixed(i > 1 ? 1 : 0)} ${u[i]}` }
  const KIND = {video: 'MP4 video', audio: 'Audio only', image: 'Picture', file: 'File'}
  const hidden = new WeakSet(), cache = new Map() // url -> {at, p: promise}
  let on = true, cur = null, hideT = 0, raf = 0, open = false, req = 0
  const clr = () => { clearTimeout(hideT); hideT = 0 }

  try {
    chrome.storage.local.get({pageBtn: true}).then(s => (on = s.pageBtn)).catch(() => {})
    chrome.storage.onChanged.addListener(c => { if (c.pageBtn) { on = c.pageBtn.newValue; on || hide(true) } })
  } catch {}

  // the link that names this one video: its post / card permalink, a direct file, or the page
  function urlFor(v) {
    // youtube: the card / channel trailer / hover preview around this player names its own video
    if (/(^|\.)youtube\.com$/.test(location.hostname)) {
      const box = v.closest('ytd-channel-video-player-renderer, ytd-video-preview, ytd-rich-item-renderer, ytd-video-renderer, ytd-compact-video-renderer, ytd-reel-item-renderer, ytd-playlist-video-renderer, ytd-grid-video-renderer, ytd-reel-video-renderer')
      const ya = box?.querySelector('a[href*="/watch?v="], a[href*="/shorts/"]')
      if (ya) return ya.href
      if (/\/(watch|shorts\/|live\/|embed\/)/.test(location.pathname)) return location.href
      const pv = document.querySelector('ytd-video-preview a[href*="/watch?v="], ytd-channel-video-player-renderer a[href*="/watch?v="]')
      if (pv) return pv.href
    }
    const post = v.closest('article, shreddit-post, [data-testid="tweet"], [role="article"]')
    if (post) {
      const perm = post.getAttribute('permalink') || post.getAttribute('content-href')
      if (perm) return new URL(perm, location.href).href
      const a = post.querySelector('a[href*="/status/"] time')?.closest('a') || post.querySelector('a[href*="/status/"], a[href*="/reel/"], a[href*="/reels/"], a[href*="/p/"], a[href*="/video/"], a[href*="/videos/"], a[href*="/comments/"]')
      if (a?.href) return a.href
    }
    const src = v.currentSrc || v.src || ''
    if (/^https?:/i.test(src) && !/\.(m3u8|mpd)(\?|$)/i.test(src) && !MEDIA.test(location.href)) return src
    return location.href
  }

  // one bar + its menu, moved to the active video
  const host = document.createElement('div')
  host.style.cssText = 'position:fixed;z-index:2147483647;top:0;left:0;display:none'
  const sh = host.attachShadow({mode: 'closed'})
  sh.innerHTML = `<style>
    .wrap{all:initial;position:relative;display:block;font:13px/1.35 "Segoe UI",Arial,sans-serif}
    .bar{display:flex;align-items:stretch;height:24px;font:600 12.5px/24px "Segoe UI",Arial,sans-serif;border:1px solid #9cc4ec;border-radius:3px;overflow:hidden;
      background:linear-gradient(#f4f9ff,#d9e9fa);box-shadow:0 2px 8px rgba(0,0,0,.25);cursor:pointer;user-select:none}
    .go{display:flex;align-items:center;gap:6px;padding:0 8px 0 7px;color:#0b4f96}
    .go:hover,.x:hover{background:#cfe3f8}
    .go svg{flex:none}
    .x{width:22px;display:flex;align-items:center;justify-content:center;border-left:1px solid #9cc4ec;font:700 13px/1 Arial;color:#0b4f96}
    .menu{display:none;position:absolute;top:28px;right:0;min-width:320px;max-width:440px;overflow:auto;background:#fff;color:#1f2937;border:1px solid #c9d6e3;border-radius:6px;
      box-shadow:0 12px 32px rgba(0,0,0,.28);padding:4px;user-select:none}
    .menu.on{display:block}.menu.left{right:auto;left:0}
    .hd{padding:7px 10px 7px;font-weight:700;color:#0b4f96;border-bottom:1px solid #e5ecf3;margin-bottom:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .it{display:flex;align-items:center;gap:10px;padding:7px 10px;border-radius:4px;cursor:pointer;white-space:nowrap}
    .it:hover{background:#e3effc}
    .n{width:20px;text-align:right;color:#6b7280;font-variant-numeric:tabular-nums}
    .q{min-width:66px;font-weight:700;color:#111827}
    .k{color:#4b5563}
    .s{margin-left:auto;padding-left:14px;color:#6b7280;font-variant-numeric:tabular-nums}
    .best{font:700 10px/1 Arial;color:#fff;background:#16a34a;border-radius:3px;padding:3px 5px}
    .sep{height:1px;background:#e5ecf3;margin:4px 6px}
    .more{color:#0b4f96;font-weight:600}
    .msg{display:flex;align-items:center;gap:10px;padding:12px 10px;color:#374151;white-space:normal}
    .spin{flex:none;width:14px;height:14px;border:2px solid #9cc4ec;border-top-color:#0074D9;border-radius:50%;animation:r .8s linear infinite}
    @keyframes r{to{transform:rotate(360deg)}}
  </style><div class="wrap"><div class="bar"><span class="go" title="Pick a quality and download with RS Downloader"><svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="11" fill="#0074D9"/><path d="M11 6h2v6.6l2.3-2.3 1.4 1.4L12 16.4l-4.7-4.7 1.4-1.4 2.3 2.3z" fill="#fff"/><path d="M7.5 17.5h9v1.6h-9z" fill="#fff"/></svg><span class="t">Download this video</span><svg width="9" height="9" viewBox="0 0 10 10" aria-hidden="true"><path d="M1 3l4 4 4-4" fill="none" stroke="#0b4f96" stroke-width="1.8"/></svg></span><span class="x" title="Hide for this video">&times;</span></div><div class="menu" role="menu"></div></div>`
  const label = sh.querySelector('.t'), menu = sh.querySelector('.menu'), bar = sh.querySelector('.bar')
  ;(document.body || document.documentElement).append(host)

  function place() {
    if (!cur?.isConnected) return hide(true)
    const r = cur.getBoundingClientRect(), w = bar.offsetWidth || 200
    if (!open && (r.width < 160 || r.height < 90 || r.bottom < 0 || r.top > innerHeight)) { host.style.display = 'none'; return }
    // just above the video's top-right edge, inside it when there is no room above
    const top = r.top - 28 >= 0 ? r.top - 28 : Math.max(4, r.top + 6), left = Math.min(innerWidth - w - 4, Math.max(4, r.right - w))
    host.style.top = top + 'px'; host.style.left = left + 'px'; host.style.display = 'block'
  }
  const loop = () => { place(); raf = cur ? requestAnimationFrame(loop) : 0 }
  function showFor(v, ms) {
    if (!on || hidden.has(v) || (open && v !== cur)) return
    clr()
    if (cur !== v) { cur = v; label.textContent = 'Download this video' }
    raf || (raf = requestAnimationFrame(loop))
    ms && (hideT = setTimeout(() => hide(), ms))
  }
  // the bar stays while its menu is open, unless forced
  function hide(force) {
    if (open && !force) return
    clr(); closeMenu(); cur = null; host.style.display = 'none'
  }

  // videos are often under other layers, so match the pointer against video boxes, not event targets
  let last = 0
  document.addEventListener('mousemove', e => {
    if (!on || Date.now() - last < 120) return
    last = Date.now()
    if (!alive()) { on = false; hide(true); return host.remove() }
    if (e.composedPath?.().includes(host)) return clr()
    if (open) return
    const v = [...document.querySelectorAll('video')].find(x => { const r = x.getBoundingClientRect(); return r.width >= 160 && r.height >= 90 && e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top - 30 && e.clientY <= r.bottom })
    if (v) { showFor(v); warm(v) }
    else if (cur && !hideT) hideT = setTimeout(() => { hideT = 0; hide() }, 1500)
  }, {passive: true})
  document.addEventListener('play', e => e.target instanceof HTMLVideoElement && showFor(e.target, 4000), true)

  // qualities: asked once per link (kept 15 min); hovering the bar starts the read early
  function qualities(url) {
    const hit = cache.get(url)
    if (hit && Date.now() - hit.at < 15 * 60e3) return hit.p
    const p = chrome.runtime.sendMessage({type: 'probe', url}).catch(() => ({ok: false, msg: 'Refresh the page and try again.'}))
      .then(r => { r?.ok || cache.delete(url); return r || {ok: false, msg: 'RS Downloader is not running. Open the app and try again.'} })
    cache.set(url, {at: Date.now(), p})
    return p
  }
  // read early: the page's own video at once, any other video after the mouse rests on it 1.5 s
  let warmT = 0, warmV = null
  function warm(v) {
    if (v === warmV || !alive()) return
    warmV = v; clearTimeout(warmT)
    const url = urlFor(v), own = url === location.href && /\/(watch|shorts\/|reel|video|status)/.test(location.pathname)
    warmT = setTimeout(() => cur === v && !hidden.has(v) && qualities(url), own ? 0 : 1500)
  }
  bar.addEventListener('mouseenter', () => { if (cur && alive() && !hidden.has(cur)) qualities(urlFor(cur)) })

  function fit() {
    menu.classList.remove('left')
    const hr = host.getBoundingClientRect()
    menu.style.maxHeight = Math.max(160, innerHeight - hr.top - 40) + 'px'
    if (hr.right - menu.offsetWidth < 4) menu.classList.add('left')
  }
  function closeMenu() { open = false; menu.classList.remove('on'); menu.innerHTML = '' }
  async function openMenu() {
    if (!cur) return
    if (!alive()) { label.textContent = 'Refresh the page'; return }
    const url = urlFor(cur), id = ++req
    open = true
    menu.innerHTML = '<div class="msg"><span class="spin"></span>Reading the available qualities...</div>'
    menu.classList.add('on'); fit()
    const slow = setTimeout(() => id === req && open && (menu.innerHTML = '<div class="msg"><span class="spin"></span>Still reading... long videos and slow sites take a little longer.</div>'), 12000)
    const r = await Promise.race([qualities(url), new Promise(res => setTimeout(() => res({ok: false, msg: 'This took too long. Try again, or open the video page itself.'}), 75000))])
    clearTimeout(slow)
    if (id !== req || !open) return
    if (!r.ok) { menu.innerHTML = `<div class="msg">${esc(r.msg || 'Could not read this video.')}</div>`; return fit() }
    const list = r.choices
    menu.innerHTML = `<div class="hd" title="${esc(r.info.title)}">${esc(r.info.title)}</div>` + list.map((c, i) =>
      `${i && c.kind !== list[i - 1].kind ? '<div class="sep"></div>' : ''}<div class="it" role="menuitem" data-i="${i}"><span class="n">${i + 1}.</span><span class="q">${esc(c.label)}</span><span class="k">${KIND[c.kind] || ''}</span>${i === 0 && c.kind === 'video' ? '<span class="best">BEST</span>' : ''}<span class="s">${c.size ? '~' + fmtB(c.size) : ''}</span></div>`).join('')
      + '<div class="sep"></div><div class="it more" role="menuitem" data-more="1">More options in RS Downloader...</div>'
    menu.onclick = e => {
      const it = e.target.closest('.it')
      if (!it) return
      closeMenu()
      if (it.dataset.more) return chrome.runtime.sendMessage({type: 'add', url}).catch(() => {}).then(x => flash(x?.ok ? 'Opened in RS Downloader' : 'Open RS Downloader first'))
      const c = list[+it.dataset.i]
      label.textContent = `Starting ${c.label}...`
      chrome.runtime.sendMessage({type: 'grab', url, label: c.label, kind: c.kind}).catch(() => null).then(x => flash(x?.ok ? `Downloading ${c.label}` : 'Open RS Downloader first'))
    }
    fit()
  }
  const flash = t => { label.textContent = t; setTimeout(() => (label.textContent = 'Download this video'), 3000) }

  bar.addEventListener('click', e => {
    if (!cur) return
    if (e.target.closest('.x')) { hidden.add(cur); return hide(true) }
    open ? closeMenu() : openMenu()
  })
  // a click anywhere else or Esc closes the menu
  document.addEventListener('mousedown', e => { if (open && !e.composedPath().includes(host)) closeMenu() }, true)
  document.addEventListener('keydown', e => { if (open && e.key === 'Escape') closeMenu() }, true)
})()
