/**
 * Developed by Mohammad Rameez Imdad (Rameez Scripts)
 * WhatsApp: https://wa.me/923435347417 (For Custom Projects)
 * YouTube: https://www.youtube.com/@rameezimdad (Subscribe for more!)
 */
'use strict'
const $ = id => document.getElementById(id)
const call = (ch, a) => window.rs.call(ch, a)
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'})[c])
const fmtB = n => { if (!n) return ''; const u = ['B', 'KB', 'MB', 'GB', 'TB']; let i = 0; while (n >= 1024 && i < 4) { n /= 1024; i++ } return `${n.toFixed(i > 1 ? 1 : 0)} ${u[i]}` }
const fmtB2 = n => { if (!n) return ''; const u = ['Bytes', 'KB', 'MB', 'GB', 'TB']; let i = 0; while (n >= 1024 && i < 4) { n /= 1024; i++ } return i ? `${n.toFixed(2)} ${u[i]}` : `${n} Bytes` }
const fmtT = s => { s = Math.round(s || 0); const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = String(s % 60).padStart(2, '0'); return h ? `${h}:${String(m).padStart(2, '0')}:${x}` : `${m}:${x}` }
const fmtD = iso => new Date(iso).toLocaleString(undefined, {day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'})
const ls = (k, v) => { try { return v === undefined ? localStorage.getItem(k) : localStorage.setItem(k, v) } catch { return null } }
const raw = s => RSI18N.raw(String(s ?? '')) // names / titles stay as they are
const LOGO = 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiGXxCe0WNNedmFqSWeF761f7Kshhc-NP5ChRQKz9fr97cO8VaarvD0KlCwqHojJVBWv-RAxfOqMI5rD4H78KnARyOc6QgwL1nRRFWf5xNQ1d9F9HfAoLPPGlTyP0GwNl4n-INMEsWLQ4Y7zJtz5bOdAnc2ePH9-uCRgshlo6BsS6gJEz6fhrxL-5U5O3sX/s160/channels4_profile.jpg'

const SITES = [['YouTube', 'fa-brands fa-youtube', ['youtube.com', 'youtu.be']], ['X / Twitter', 'fa-brands fa-x-twitter', ['x.com', 'twitter.com']],
  ['Instagram', 'fa-brands fa-instagram', ['instagram.com']], ['Threads', 'fa-brands fa-threads', ['threads.net', 'threads.com']],
  ['TikTok', 'fa-brands fa-tiktok', ['tiktok.com']], ['Facebook', 'fa-brands fa-facebook', ['facebook.com', 'fb.watch']],
  ['Vimeo', 'fa-brands fa-vimeo-v', ['vimeo.com']], ['Twitch', 'fa-brands fa-twitch', ['twitch.tv']],
  ['Reddit', 'fa-brands fa-reddit-alien', ['reddit.com']], ['Pinterest', 'fa-brands fa-pinterest', ['pinterest.com', 'pin.it']],
  ['SoundCloud', 'fa-brands fa-soundcloud', ['soundcloud.com']]]
const KIND = {video: ['fa-file-video', 'Video', 'ic-accent'], audio: ['fa-file-audio', 'Audio only', 'ic-success'], image: ['fa-file-image', 'Original picture', 'ic-warn'], file: ['fa-file', 'File', 'ic-muted']}
const FCAT = {zip: ['fa-file-zipper', 'ic-warn'], prog: ['fa-compact-disc', 'ic-accent'], doc: ['fa-file-lines', 'ic-danger'], other: ['fa-file', 'ic-muted']}
const iconOf = d => d.count > 1 && !['image', 'file'].includes(d.kind) ? ['fa-folder', 'ic-warn'] : d.kind === 'file' ? FCAT[d.fcat] || FCAT.other : [KIND[d.kind]?.[0] || 'fa-file', KIND[d.kind]?.[2] || 'ic-muted']
const CATS = [['all', 'All Downloads', 'fa-folder-open', 0], ['video', 'Video', 'fa-film', 1], ['audio', 'Music', 'fa-music', 1], ['image', 'Pictures', 'fa-image', 1],
  ['doc', 'Documents', 'fa-file-lines', 1], ['zip', 'Compressed', 'fa-file-zipper', 1], ['prog', 'Programs', 'fa-compact-disc', 1], ['other', 'Other', 'fa-file', 1],
  ['list', 'Playlists', 'fa-list', 1], ['unfinished', 'Unfinished', 'fa-hourglass-half', 0], ['finished', 'Finished', 'fa-circle-check', 0]]
// category = the one picked in Download File Info, else by file type
const CAT_KEY = {Video: 'video', Music: 'audio', Pictures: 'image', Documents: 'doc', Compressed: 'zip', Programs: 'prog', Other: 'other'}
const catKey = d => CAT_KEY[d.cat] || ({video: 'video', audio: 'audio', image: 'image'})[d.kind] || ({doc: 'doc', zip: 'zip', prog: 'prog'})[d.fcat] || 'other'
const inCat = (d, c) => c === 'all' || (c === 'unfinished' ? !!d.qid : c === 'finished' ? !d.qid
  : c === 'list' ? d.count > 1 && !['image', 'file'].includes(d.kind) : catKey(d) === c)
const RATES = [['', 'No limit'], ['500K', '0.5 MB/s'], ['1M', '1 MB/s'], ['2M', '2 MB/s'], ['5M', '5 MB/s'], ['10M', '10 MB/s']]
const LANGS = [['en', 'English'], ['ur', 'Urdu'], ['hi', 'Hindi'], ['ar', 'Arabic'], ['all', 'All']]
const BATCH = [['Best', 'video'], ['1080p', 'video'], ['720p', 'video'], ['480p', 'video'], ['MP3 320', 'audio'], ['MP3 128', 'audio'], ['M4A', 'audio']]

const S = {devs: [], xf: {}, cfg: {}, rows: [], q: [], qRun: true, prog: {}, cat: ls('rsdl_cat') || 'all', engine: null, upd: {}, version: '', packaged: false}
const running = qid => S.q.find(x => x.status === 'running' && (!qid || x.qid === qid))

function site(url) {
  let h
  try { h = new URL(url.trim()).hostname.toLowerCase() } catch { return null }
  const f = SITES.find(([, , hs]) => hs.some(x => h === x || h.endsWith('.' + x)))
  return f ? {label: f[0], icon: f[1]} : {label: h.replace(/^www\./, ''), icon: 'fa-solid fa-globe'}
}
// playlist / channel style links
const listy = u => /[?&]list=|\/playlist|\/@[^/]+\/?(videos|shorts|streams)?\/?$|\/channel\/|\/c\/|\/sets\//i.test(u)
const seg = (name, opts, on) => `<div class="seg" data-seg="${name}">${opts.map(([v, l]) => `<button type="button" data-v="${v}" class="${v === on ? 'on' : ''}">${esc(l)}</button>`).join('')}</div>`
const segVal = (root, name) => root.querySelector(`[data-seg="${name}"] .on`)?.dataset.v ?? ''
document.addEventListener('click', e => { const b = e.target.closest('.seg button'); if (b) { b.parentElement.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); b.parentElement.dispatchEvent(new Event('change')) } })

// top bar = reads, overlay = writes
let reads = 0
async function read(fn) { reads++; $('loadbar').hidden = false; try { return await fn() } finally { if (!--reads) $('loadbar').hidden = true } }
window.rsOverlay = label => {
  const o = document.createElement('div')
  o.className = 'rs-overlay'
  o.innerHTML = `<div class="rs-ov-box"><img src="icon.png" alt=""><div class="bar indet"><span></span></div><b>${esc(label)}</b></div>`
  document.body.append(o)
  return () => o.remove()
}
async function write(label, fn) { const done = rsOverlay(label); try { return await fn() } finally { done() } }
function busy(btn, on) {
  if (!btn) return
  const i = btn.querySelector('i')
  if (on) { btn.disabled = true; if (i) { i.dataset.k = i.className; i.className = 'fa-solid fa-spinner fa-spin' } }
  else { btn.disabled = false; if (i?.dataset.k) i.className = i.dataset.k }
}

// windows-style dialogs, stackable; Esc closes the top one
const dlgs = []
function dlg({title, icon = 'fa-circle-info', body = '', foot = '', width = 560, onClose}) {
  const w = document.createElement('div')
  w.className = 'dlg-wrap'
  w.innerHTML = `<div class="dlg" role="dialog" aria-modal="true" aria-label="${esc(title)}" style="max-width:${width}px">
    <div class="dlg-head"><i class="fa-solid ${icon}"></i><span class="dlg-t">${esc(title)}</span><button type="button" class="dlg-x" aria-label="Close"><i class="fa-solid fa-xmark"></i></button></div>
    <div class="dlg-body"></div><div class="dlg-foot">${foot}</div></div>`
  const b = w.querySelector('.dlg-body')
  typeof body === 'string' ? (b.innerHTML = body) : b.append(body)
  const d = {el: w, body: b, foot: w.querySelector('.dlg-foot'), q: s => w.querySelector(s),
    title: t => (w.querySelector('.dlg-t').textContent = t),
    close: () => { if (!w.isConnected) return; w.remove(); dlgs.splice(dlgs.indexOf(d), 1); onClose?.() }}
  w.addEventListener('click', e => { if (e.target.closest('.dlg-x, [data-x]')) d.close() })
  document.body.append(w); dlgs.push(d)
  setTimeout(() => w.querySelector('input:not([type=checkbox]):not([readonly]), textarea, .btn-primary')?.focus(), 30)
  return d
}

// engine
let installing = null, setupDlg = null
const install = update => (installing ||= doInstall(update).finally(() => (installing = null)))
async function doInstall(update) {
  if (!update) setupDlg = dlg({title: 'Setting up RS Downloader', icon: 'fa-gears', width: 460,
    body: '<p id="enMsg">Getting the download engine ready (one time, about 90 MB)...</p><div class="bar bar-lg indet" id="enBar"><span></span></div>'})
  try {
    const r = await call('engine:install', {update})
    if (!r.ok) { rsErr(r.msg, 'Engine not installed'); return null }
    S.engine = r.engine; status()
    if (!r.engine.ytdlp) { rsErr('The engine downloaded but does not start. Your antivirus may have blocked yt-dlp.exe.', 'Engine not installed'); return null }
    update || rsOk('Ready to download')
    return r
  } finally { setupDlg?.close(); setupDlg = null }
}
window.rs.on('engine:progress', p => {
  if (!setupDlg) return
  setupDlg.q('#enMsg').textContent = `${p.label}: ${fmtB(p.got)}${p.total ? ' of ' + fmtB(p.total) : ''}`
  const bar = setupDlg.q('#enBar')
  bar.classList.toggle('indet', !p.total)
  bar.firstElementChild.style.width = p.total ? (p.got / p.total * 100).toFixed(1) + '%' : ''
})
window.rs.on('engine:warn', m => rsPop.toast(m, 'warning'))

// app update
function showUpd(u) {
  S.upd = u || {}
  $('updDot').hidden = S.upd.state !== 'ready'
  $('tbUpdate').title = S.upd.state === 'ready' ? `Restart to update to v${S.upd.version}` : S.upd.state === 'downloading' ? `Downloading v${S.upd.version} (${S.upd.pct || 0}%)` : 'Update'
}
window.rs.on('app:update', u => {
  const was = S.upd.state
  showUpd(u)
  if (u.state === 'ready' && was !== 'ready') rsPop.toast(`Update v${u.version} is ready`, 'success', 'Click Update to restart now, or it installs when you quit the app.')
})
async function update() {
  if (running()) return rsPop.toast('Wait for the download to finish', 'info')
  if (S.upd.state === 'ready') {
    if (!(await rsPop.confirm({title: `Update to v${S.upd.version}?`, text: 'The app closes, installs the update and opens again. Queued downloads stay in the queue.', yes: 'Restart and update'}))) return
    return write('Updating...', () => call('app:update', {install: true}))
  }
  busy($('tbUpdate'), true)
  try {
    const [e, a] = await read(() => Promise.all([install(true), call('app:update')]))
    const app = !a.ok ? a.msg : a.upd.state === 'ready' ? `Version ${a.upd.version} is ready. Click Update again to restart.`
      : a.upd.state === 'downloading' ? `Version ${a.upd.version} is downloading. You will be told when it is ready.`
      : a.upd.state === 'error' ? a.upd.msg : `You have the latest version (v${S.version}).`
    const eng = !e ? 'Engine update failed.' : e.changed ? `Engine updated to ${e.engine.ytdlp}.` : `Engine is up to date (${e.engine.ytdlp}).`
    a.ok && showUpd(a.upd)
    rsPop({icon: e ? 'success' : 'warning', title: 'Update check done', text: `**App:** ${app}\n**Engine:** ${eng}`})
  } finally { busy($('tbUpdate'), false) }
}

// add url -> file info -> queue
async function addUrl(pre = '') {
  let url = pre
  if (!url) { const c = await call('paste'); if (/^https?:\/\/\S+$/i.test(c.text || '')) url = c.text }
  const d = dlg({title: 'Enter new address to download', icon: 'fa-link', width: 580, body: `
    <label class="lbl" for="auUrl">Address</label>
    <div class="field"><i class="fa-solid fa-link"></i><input id="auUrl" type="url" placeholder="Paste a link from YouTube, Instagram, TikTok, X, Facebook, Pinterest..." value="${esc(url)}" spellcheck="false"><span class="chip" id="auSite" hidden></span></div>
    <label class="toggle-row" id="auListRow" hidden><input type="checkbox" class="toggle" id="auList"><span><i class="fa-solid fa-list"></i> Whole playlist</span></label>`,
    foot: '<button type="button" class="btn btn-light" data-x>Cancel</button><button type="button" class="btn btn-primary" id="auOk"><i class="fa-solid fa-check"></i> OK</button>'})
  const inp = d.q('#auUrl'), ok = d.q('#auOk')
  const sync = () => {
    const u = inp.value.trim(), s = u && site(u)
    d.q('#auSite').hidden = !s
    if (s) d.q('#auSite').innerHTML = `<i class="${s.icon}"></i>${esc(s.label)}`
    d.q('#auListRow').hidden = !listy(u)
  }
  sync()
  inp.addEventListener('input', sync)
  const go = async () => (await probeOpen(inp.value.trim(), d.q('#auList').checked, ok)) && d.close()
  ok.addEventListener('click', go)
  inp.addEventListener('keydown', e => e.key === 'Enter' && go())
}

// read the link, then the File Info window
async function probeOpen(u, playlist, btn, name = '') {
  if (!/^https?:\/\//i.test(u)) { rsErr('Paste a full link that starts with http:// or https://', 'Not a link'); return false }
  if (!S.engine?.ytdlp && !(await install(false))) return false
  // Download File Info is its own window (same one the browser opens)
  const r = await call('fi:open', {url: u, playlist, name})
  r.ok || rsErr(r.msg, 'Could not open')
  return !!r.ok
}

// quick link bar under the toolbar
const qUrl = $('qUrl')
function qSync() {
  const u = qUrl.value.trim(), s = u && site(u)
  $('qSite').hidden = !s
  if (s) $('qSite').innerHTML = `<i class="${s.icon}"></i>${esc(s.label)}`
  $('qListRow').hidden = !listy(u)
}
async function qGo() { if (await probeOpen(qUrl.value.trim(), $('qList').checked, $('qGo'))) { qUrl.value = ''; $('qList').checked = false; qSync() } }
qUrl.addEventListener('input', qSync)
qUrl.addEventListener('keydown', e => e.key === 'Enter' && qGo())
$('qGo').addEventListener('click', qGo)

// many links at once
function batch() {
  const d = dlg({title: 'Add many links', icon: 'fa-layer-group', width: 640, body: `
    <label class="lbl" for="bLinks">Links (one per line)</label>
    <textarea id="bLinks" class="txt" rows="9" placeholder="https://www.youtube.com/watch?v=...&#10;https://www.instagram.com/reel/...&#10;https://pin.it/..." spellcheck="false"></textarea>
    <span class="muted" id="bCount">0 links</span>
    <span class="lbl">Quality for every link</span>${seg('q', BATCH.map(([l]) => [l, l]), ls('rsdl_bq') || 'Best')}
    <span class="muted">If a video does not have this quality, the nearest lower one is used. Posts with pictures save their pictures.</span>
    <div class="row"><span class="lbl">Format</span>${seg('container', [['mp4', 'MP4'], ['mkv', 'MKV']], ls('rsdl_cont') || 'mp4')}
      <label class="toggle-row"><input type="checkbox" class="toggle" id="bSubs"><span><i class="fa-solid fa-closed-captioning"></i> English subtitles</span></label></div>`,
    foot: `<button type="button" class="btn btn-light" data-x>Cancel</button><button type="button" class="btn btn-light" id="bLater"><i class="fa-solid fa-clock"></i> Add to queue</button>
      <button type="button" class="btn btn-primary" id="bGo"><i class="fa-solid fa-forward"></i> Start now</button>`})
  const links = () => (d.q('#bLinks').value.match(/https?:\/\/\S+/gi) || [])
  d.q('#bLinks').addEventListener('input', () => (d.q('#bCount').textContent = `${links().length} link${links().length === 1 ? '' : 's'}`))
  const add = async start => {
    if (!links().length) return rsErr('Paste at least one link, one on each line.', 'No links')
    if (!S.engine?.ytdlp && !(await install(false))) return
    const label = segVal(d.el, 'q'), kind = BATCH.find(([l]) => l === label)?.[1] || 'video'
    ls('rsdl_bq', label)
    const r = await call('enqueue:many', {urls: links(), label, kind, start, opts: {container: segVal(d.el, 'container'), subs: d.q('#bSubs').checked, subLang: 'en'}})
    if (!r.ok) return rsErr(r.msg, 'Not added')
    d.close()
    rsOk(`${r.n} link${r.n > 1 ? 's' : ''} added to the queue`)
  }
  d.q('#bGo').addEventListener('click', () => add(true))
  d.q('#bLater').addEventListener('click', () => add(false))
}

// the download window lives in main (one per download)
const openPd = (qid = running()?.qid) => qid && call('pw:open', {qid})
async function cancelQ(qids) {
  if (!qids.length) return
  if (!(await rsPop.confirm({danger: true, title: qids.length > 1 ? `Cancel ${qids.length} downloads?` : 'Cancel this download?', text: 'The part already downloaded is removed.', yes: 'Cancel download', no: 'Keep'}))) return
  await call('q:cancel', {qids})
}
const prog = (qid, p) => { S.prog[qid] = {...S.prog[qid], ...p}; const it = S.q.find(x => x.qid === qid); it && table?.updateData([rowOfQ(it)]).catch(() => {}) }
window.rs.on('dl:progress', p => prog(p.qid, {
  pct: p.total ? Math.min(100, p.got / p.total * 100) : 0, got: p.got, total: p.total, speed: p.speed, eta: p.eta, stage: false, items: p.items,
  status: 'Receiving data...', part: p.items > 1 ? `Video ${p.item || 1} of ${p.items}` : p.parts > 1 ? `${p.part === 0 ? 'Video' : 'Audio'} (${Math.min(p.part + 1, p.parts)} of ${p.parts})` : '',
}))
window.rs.on('dl:count', p => prog(p.qid, {pct: p.total ? p.done / p.total * 100 : 0, total: 0, got: 0, items: p.total, status: `Saving pictures (${p.done} of ${p.total || '?'})`, part: `Picture ${p.done} of ${p.total || '?'}`}))
window.rs.on('dl:stage', p => prog(p.qid, {stage: true, status: 'Finishing (joining, adding cover)...', speed: 0, eta: null}))
window.rs.on('dl:done', async p => {
  delete S.prog[p.qid]
  await loadRows()
  p.showDone && document.hasFocus() ? done(p.rec, p.warn) : rsOk(t('Saved: {0}', p.rec.title))
})
window.rs.on('dl:failed', p => { delete S.prog[p.qid]; rsErr(p.msg, 'Download failed') })
window.rs.on('queue:changed', q => {
  S.q = q.items; S.qRun = q.run
  refresh()
})

function done(rec, warn) {
  const d = dlg({title: 'Download complete', icon: 'fa-circle-check', width: 560, body: `
    <div class="pd-top"><i class="fa-solid fa-circle-check ok"></i><b translate="no">${esc(rec.title)}</b></div>
    <div class="kv"><span>Saved</span><span>${rec.kind === 'image' ? `${rec.count} picture${rec.count > 1 ? 's' : ''}` : rec.count > 1 ? `${rec.count} files` : esc(rec.label)}</span>
      <span>Size</span><span>${fmtB(rec.size) || '-'}</span><span>Location</span><span>${esc(rec.file || rec.folder)}</span></div>
    ${warn ? `<p class="muted"><i class="fa-solid fa-triangle-exclamation"></i> ${esc(warn)}</p>` : ''}`,
    foot: `${rec.file ? '<button type="button" class="btn btn-primary" data-a="open"><i class="fa-solid fa-circle-play"></i> Open</button>' : ''}
      <button type="button" class="btn btn-light" data-a="reveal"><i class="fa-solid fa-folder-open"></i> Open folder</button><button type="button" class="btn btn-light" data-x>Close</button>`})
  d.foot.addEventListener('click', e => { const b = e.target.closest('[data-a]'); if (b) { act(b.dataset.a, rec.id); d.close() } })
}

// list = queue rows (unfinished) + history rows (finished)
let table = null
const rowOfQ = it => ({id: 'q:' + it.qid, qid: it.qid, title: it.title, kind: it.kind, fcat: it.fcat, cat: it.opts?.cat, label: it.label, site: it.site, url: it.url, count: it.count,
  at: it.added, qs: it.status, err: it.err, ...S.prog[it.qid], size: S.prog[it.qid]?.total || it.size || 0})
const allRows = () => [...S.q.map(rowOfQ), ...S.rows]
const statusOf = d => {
  if (!d.qid && d.movedTo) return `<span class="st st-q" title="Moved to ${esc(d.movedTo)}">${d.exists && !d.missing ? 'On ' : 'Moved to '}${esc(d.movedTo)}</span>`
  if (!d.qid) return d.missing ? `<span class="st st-err">${d.exists ? 'Some missing' : 'File missing'}</span>` : 'Complete'
  if (d.qs === 'running') return d.stage ? 'Joining...' : d.total ? `<span class="st st-run">${(d.pct || 0).toFixed(2)}%</span>` : esc(d.status || 'Connecting...')
  return {queued: 'Queued', paused: `<span class="st st-q">Paused${d.pct ? ` ${d.pct.toFixed(2)}%` : ''}</span>`, failed: `<span class="st st-err" title="${esc(d.err)}">Error</span>`}[d.qs] || ''
}
const empty = document.createElement('div')
empty.className = 'empty'
empty.innerHTML = `<i class="fa-solid fa-cloud-arrow-down"></i><b>Nothing here yet</b><p>Paste a link in the box above, press Ctrl+V anywhere, or copy a link in your browser and RS Downloader picks it up.</p>
  <button type="button" class="btn btn-primary"><i class="fa-solid fa-circle-plus"></i> Add URL</button>`
empty.querySelector('button').addEventListener('click', () => addUrl())

function rowMenu(e, row) {
  const d = row.getData(), ids = sel(), many = ids.length > 1 && ids.includes(d.id)
  if (d.qid) {
    const qids = many ? ids.filter(x => x.startsWith('q:')).map(x => x.slice(2)) : [d.qid]
    return [d.qs === 'running' && {label: '<i class="fa-solid fa-window-maximize"></i>Show progress', action: () => openPd(d.qid)},
      ['paused', 'failed'].includes(d.qs) && {label: '<i class="fa-solid fa-play"></i>Resume', action: () => call('q:resume', {qids})},
      ['running', 'queued'].includes(d.qs) && {label: '<i class="fa-solid fa-pause"></i>Pause', action: () => call('q:pause', {qids})},
      {label: '<i class="fa-solid fa-link"></i>Copy address', action: () => copy(d.url)},
      d.err && {label: '<i class="fa-solid fa-circle-exclamation"></i>Why it failed', action: () => rsErr(d.err, 'Download failed')},
      {separator: true},
      {label: '<i class="fa-solid fa-xmark"></i>Cancel download', action: () => cancelQ(qids)}].filter(Boolean)
  }
  return [{label: '<i class="fa-solid fa-circle-play"></i>Open', disabled: !d.file, action: () => act('open', d.id)},
    {label: '<i class="fa-solid fa-folder-open"></i>Open folder', action: () => act('reveal', d.id)},
    {label: '<i class="fa-solid fa-link"></i>Copy address', action: () => copy(d.url)},
    {label: '<i class="fa-solid fa-rotate-right"></i>Download again', action: () => probeOpen(d.url, false)},
    {separator: true},
    {label: '<i class="fa-solid fa-trash-can"></i>Delete', action: () => del(many ? ids : [d.id])}]
}
function buildTable() {
  table = new Tabulator('#list', {
    data: [], index: 'id', height: '100%', layout: 'fitColumns', movableColumns: true, selectableRows: true, selectableRowsRangeMode: 'click',
    placeholder: empty, initialSort: [{column: 'at', dir: 'desc'}],
    rowFormatter: row => row.getElement().classList.toggle('is-active', row.getData().qs === 'running'),
    rowContextMenu: rowMenu,
    columns: [
      {title: 'File Name', field: 'title', minWidth: 150, widthGrow: 4, formatter: c => { const d = c.getRow().getData(), k = iconOf(d)
        return `<div class="fn"><i class="fa-solid ${k[0]} ${k[1]}"></i><span class="fn-t" translate="no" title="${esc([d.title, d.kind === 'image' ? (d.count > 1 ? d.count + ' pictures' : 'Picture') : d.label, d.site, d.desc].filter(Boolean).join(' · '))}">${esc(d.title)}</span></div>` }},
      {title: 'Size', field: 'size', width: 92, hozAlign: 'right', sorter: 'number', formatter: c => fmtB2(c.getValue())},
      {title: 'Status', field: 'qs', width: 120, headerSort: false, formatter: c => statusOf(c.getRow().getData())},
      {title: 'Time left', field: 'eta', width: 90, headerSort: false, formatter: c => c.getRow().getData().qs === 'running' && c.getValue() != null ? fmtT(c.getValue()) : ''},
      {title: 'Transfer rate', field: 'speed', width: 112, headerSort: false, formatter: c => c.getRow().getData().qs === 'running' && c.getValue() ? fmtB(c.getValue()) + '/sec' : ''},
      {title: 'Last Try Date', field: 'at', width: 140, formatter: c => esc(fmtD(c.getValue()))},
      {title: 'Actions', field: 'id', minWidth: 170, widthGrow: 3, headerSort: false, download: false, formatter: c => actCell(c.getRow().getData()),
        cellClick: (e, c) => { const b = e.target.closest('[data-a]'); if (!b) return; e.stopPropagation(); sendTo([c.getRow().getData().id], b.dataset.a, b, b.dataset.dev) }},
    ],
  })
  table.on('rowDblClick', (e, row) => { const d = row.getData(); d.qid ? (d.qs === 'running' ? openPd(d.qid) : ['paused', 'failed'].includes(d.qs) && call('q:resume', {qids: [d.qid]})) : act(d.file ? 'open' : 'reveal', d.id) })
  table.on('rowSelectionChanged', toolbarState)
  table.on('tableBuilt', () => { table.replaceData(allRows()); applyFilter() })
}
const sel = () => table?.getSelectedData().map(d => d.id) || []
const selQ = () => table?.getSelectedData().filter(d => d.qid) || []
const selH = () => sel().filter(id => !id.startsWith('q:'))
function applyFilter() {
  if (!table) return
  const q = $('fSearch').value.trim().toLowerCase()
  table.setFilter(d => inCat(d, S.cat) && (!q || `${d.title} ${d.site} ${d.label}`.toLowerCase().includes(q)))
}
$('fSearch').addEventListener('input', applyFilter)
function refresh() {
  if (!table) return
  const keep = sel()
  table.replaceData(allRows()).then(() => { keep.length && table.selectRow(keep.filter(id => table.getRow(id))); applyFilter() })
  renderCats(); status(); toolbarState()
}
async function loadRows() {
  const r = await read(() => call('history'))
  S.rows = r.rows || []
  table ? refresh() : buildTable()
  renderCats(); status()
}

// categories
function renderCats() {
  const all = allRows()
  $('cats').innerHTML = '<div class="cat-h">Categories</div>' + CATS.map(([k, l, ic, sub]) =>
    `<button type="button" class="cat${sub ? ' sub' : ''}${S.cat === k ? ' on' : ''}" data-cat="${k}"><i class="fa-solid ${ic}"></i><span>${l}</span><em>${all.filter(d => inCat(d, k)).length}</em></button>`).join('')
}
$('cats').addEventListener('click', e => {
  const a = e.target.closest('[data-act]')
  if (a) return ACT[a.dataset.act]()
  const b = e.target.closest('[data-cat]')
  if (b) { S.cat = b.dataset.cat; ls('rsdl_cat', S.cat); renderCats(); applyFilter() }
})

// USB drives + phones: Actions column, Send to USB, copy progress
const devShort = d => d.kind === 'drive' ? d.id : d.name.split(' - ')[0]
// icon by device type: usb stick, memory card, external disk, phone
const DEV_ICON = {usb: 'fa-brands fa-usb', card: 'fa-solid fa-sd-card', hdd: 'fa-solid fa-hard-drive', phone: 'fa-solid fa-mobile-screen'}
const devIcon = d => DEV_ICON[d.type] || (d.kind === 'phone' ? DEV_ICON.phone : DEV_ICON.usb)
const devTag = d => d.kind === 'drive' ? d.id : d.name.split(' - ')[0].split(' ')[0].slice(0, 10)
const devLong = d => d.kind === 'drive' ? `${d.id} ${d.name}${d.free ? ` · ${fmtB(d.free)} free` : ''}` : d.name
function actCell(d) {
  if (d.qid) return ''
  if (!d.exists) return d.movedTo ? '' : '<span class="act-none">File not on this PC</span>'
  if (!S.devs.length) return '<span class="act-none"><i class="fa-brands fa-usb"></i> Connect a USB or phone</span>'
  // one group per connected drive / phone, so 3-4 USBs need no extra menu
  return `<div class="act-row">${S.devs.map(v => `<span class="dev-grp" title="${esc(devLong(v))}"><b><i class="${devIcon(v)}"></i>${esc(devTag(v))}</b>
    <button type="button" class="act-btn" data-a="copy" data-dev="${esc(v.id)}" title="Copy to ${esc(devLong(v))}"><i class="fa-regular fa-copy"></i>Copy</button>
    <button type="button" class="act-btn act-move" data-a="move" data-dev="${esc(v.id)}" title="Move to ${esc(devLong(v))} (removed from this PC)"><i class="fa-solid fa-share-from-square"></i>Move</button></span>`).join('')}</div>`
}
function devMenu(anchor, mode, onPick) {
  closeMenu()
  const el = document.createElement('div')
  el.className = 'menu-pop'
  el.innerHTML = `<div class="menu-h">${mode === 'move' ? 'Move to' : 'Copy to'}</div>` + S.devs.map((d, i) => `<button type="button" data-i="${i}"><i class="${devIcon(d)}"></i>${esc(devLong(d))}</button>`).join('')
  const r = anchor.getBoundingClientRect()
  el.style.left = Math.min(r.left, innerWidth - 300) + 'px'; el.style.top = r.bottom + 2 + 'px'
  el.addEventListener('click', e => { const b = e.target.closest('[data-i]'); if (b) { const d = S.devs[+b.dataset.i]; closeMenu(); onPick(d) } })
  popAfterClick(el)
}
async function sendTo(ids, mode, anchor, devId) {
  ids = ids.filter(id => !id.startsWith('q:') && S.rows.find(x => x.id === id)?.exists)
  if (!ids.length) return rsErr('Pick downloads that are still on this PC.', 'Nothing to send')
  if (!S.devs.length) return rsErr('Plug in a USB, SD card or phone. For a phone, unlock it and choose File transfer.', 'No USB or phone found')
  const go = async d => {
    const rows = S.rows.filter(x => ids.includes(x.id)), size = rows.reduce((t, x) => t + (x.size || 0), 0)
    if (mode === 'move' && !(await rsPop.confirm({title: `Move to ${devShort(d)}?`, text: t('**{0}** ({1}) will be copied to {2}, then removed from this PC.', rows.length === 1 ? raw(rows[0].title) : t('{0} downloads', rows.length), fmtB(size) || '?', devLong(d)), yes: 'Move'}))) return
    const r = await call('xfer', {ids, dev: d.id, mode})
    if (!r.ok) return rsErr(r.msg, 'Not sent')
    S.xf[r.tid] = {mode, dev: devShort(d), title: rows.length === 1 ? rows[0].title : `${rows.length} downloads`}
    drawXf(r.tid, {done: 0, total: size})
  }
  const pick = devId && S.devs.find(d => d.id === devId)
  pick ? go(pick) : S.devs.length === 1 ? go(S.devs[0]) : devMenu(anchor || $('tbSend'), mode, go)
}
function drawXf(tid, p) {
  const x = S.xf[tid]
  if (!x) return
  let el = $('xf-' + tid)
  if (!el) {
    el = document.createElement('div'); el.className = 'xf'; el.id = 'xf-' + tid
    el.innerHTML = `<div class="xf-h"><i class="fa-brands fa-usb"></i><b></b><button type="button" class="xf-x" title="Cancel" aria-label="Cancel"><i class="fa-solid fa-xmark"></i></button></div>
      <div class="xf-t" translate="no"></div><div class="bar"><span></span></div><div class="xf-s"></div>`
    el.querySelector('.xf-x').addEventListener('click', () => call('xfer:cancel', {tid}))
    $('xfers').append(el)
  }
  const pct = p.total ? Math.min(100, p.done / p.total * 100) : 0
  el.querySelector('b').textContent = `${x.mode === 'move' ? 'Moving' : 'Copying'} to ${x.dev}`
  el.querySelector('.xf-t').textContent = x.title
  el.querySelector('.bar').classList.toggle('indet', !p.done)
  el.querySelector('.bar span').style.width = p.done ? pct.toFixed(1) + '%' : ''
  el.querySelector('.xf-s').textContent = p.done ? `${pct.toFixed(0)}% · ${fmtB(p.done)} of ${fmtB(p.total)}${p.speed ? ' · ' + fmtB(p.speed) + '/s' : ''}${p.eta != null ? ' · ' + fmtT(p.eta) + ' left' : ''}` : 'Starting...'
}
window.rs.on('xfer:progress', p => drawXf(p.tid, p))
window.rs.on('xfer:done', async p => {
  $('xf-' + p.tid)?.remove(); delete S.xf[p.tid]
  if (!p.ok) return p.msg === 'Cancelled.' ? rsPop.toast('Copy cancelled', 'info') : rsErr(p.msg, p.mode === 'move' ? 'Not moved' : 'Not copied')
  rsOk(`${p.mode === 'move' ? 'Moved' : 'Copied'} ${p.n} file${p.n > 1 ? 's' : ''} to ${p.dev}`)
  p.mode === 'move' && loadRows()
})
function showDevs(list) {
  S.devs = list || []
  const n = S.devs.length
  $('sbDev').innerHTML = `<i class="fa-brands fa-usb ${n ? 'ic-success' : 'ic-muted'}"></i> ${n === 0 ? 'No USB / phone' : n === 1 ? esc(devLong(S.devs[0])) : n + ' devices connected'}`
  $('sbDev').title = n ? S.devs.map(devLong).join('\n') : 'Plug in a USB, SD card or phone (unlocked, File transfer) to copy downloads to it.'
  table?.getRows().forEach(r => r.reformat())
  toolbarState()
}
window.rs.on('devices', showDevs)
$('sbDev').addEventListener('click', async () => { const r = await read(() => call('devices')); showDevs(r.devs); rsPop.toast(r.devs.length ? `${r.devs.length} device${r.devs.length > 1 ? 's' : ''} found` : 'No USB or phone found', r.devs.length ? 'success' : 'info') })

// extension: installed / connected, shown in the status bar and Options
const ago = t => { const m = Math.round((Date.now() - t) / 60000); return m < 60 ? `${m} min ago` : m < 2880 ? `${Math.round(m / 60)} h ago` : `${Math.round(m / 1440)} days ago` }
const older = (a, b) => { const x = String(a).split('.').map(Number), y = String(b).split('.').map(Number); for (let i = 0; i < 3; i++) if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) < (y[i] || 0); return false }
function extText(x, long) {
  const tag = x.state === 'on' ? `<span class="pill pill-ok"><i class="fa-solid fa-plug-circle-check"></i>Installed and connected</span>`
    : x.state === 'idle' ? `<span class="pill pill-pause"><i class="fa-solid fa-plug"></i>Installed, browser closed</span>` : `<span class="pill pill-miss"><i class="fa-solid fa-plug-circle-xmark"></i>Not installed</span>`
  if (!long) return tag
  const who = x.browser ? ` ${esc(x.browser)}${x.version ? ' · extension v' + esc(x.version) : ''}${x.state === 'idle' ? ' · last seen ' + ago(x.seen) : ''}` : ' Install it once with the 3 steps below.'
  const upd = x.version && x.latest && older(x.version, x.latest) ? `<br><i class="fa-solid fa-circle-up ic-accent"></i> ${t('A newer extension (v{0}) is ready: open {1}://extensions and click the reload icon on RS Downloader.', esc(x.latest), (x.browser || 'chrome').toLowerCase().includes('edge') ? 'edge' : 'chrome')}` : ''
  return tag + who + upd
}
async function extCheck() {
  const x = await call('ext-status')
  S.ext = x
  $('sbExt').innerHTML = `<i class="fa-solid ${x.state === 'on' ? 'fa-plug-circle-check ic-success' : x.state === 'idle' ? 'fa-plug ic-warn' : 'fa-plug-circle-xmark ic-danger'}"></i> Extension ${x.state === 'on' ? 'connected' + (x.browser ? ' · ' + esc(x.browser) : '') : x.state === 'idle' ? 'installed' : 'not installed'}`
  $('sbExt').title = x.state === 'none' ? 'Browser extension not installed. Click to set it up.' : `Browser extension${x.browser ? ' in ' + x.browser : ''}${x.version ? ', v' + x.version : ''}. Click for details.`
  return x
}
$('sbExt').addEventListener('click', () => options('ext'))
window.rs.on('ext:status', x => { extCheck(); x?.added && rsOk(`Extension installed in ${x.added}`); document.querySelectorAll('.brw').forEach(browserList) })

// browsers on this PC with an Install button each (default browser first)
const BRW_ICON = {Chrome: 'fa-brands fa-chrome', Edge: 'fa-brands fa-edge', Brave: 'fa-brands fa-brave', Opera: 'fa-brands fa-opera', Vivaldi: 'fa-solid fa-globe'}
async function browserList(box) {
  const r = await call('browsers'), list = r.list || []
  if (!box?.isConnected) return
  box.innerHTML = list.length ? list.map(b => `<div class="brw-row"><i class="${BRW_ICON[b.name] || 'fa-solid fa-globe'}"></i><b>${esc(b.name)}</b>${b.def ? '<span class="brw-def">Default</span>' : ''}
    ${b.seen ? `<span class="eng-v ok"><i class="fa-solid fa-check"></i>Installed${b.version ? ' v' + esc(b.version) : ''}</span><button type="button" class="mini" data-b="${esc(b.name)}">Reinstall</button>`
      : `<span class="eng-v off">Not installed</span><button type="button" class="mini mini-pri" data-b="${esc(b.name)}"><i class="fa-solid fa-puzzle-piece"></i> Install</button>`}</div>`).join('')
    : '<div class="hint">No Chrome, Edge, Brave, Opera or Vivaldi found on this PC.</div>'
  box.onclick = async e => {
    const b = e.target.closest('[data-b]'); if (!b) return
    busy(b, true)
    const x = await call('ext-setup', {name: b.dataset.b})
    busy(b, false)
    x.ok ? rsPop({icon: 'info', title: `Finish in ${b.dataset.b}`, text: t('{0} opened **{1}** and the extension folder.\n1. Turn on **Developer mode** (top right).\n2. Click **Load unpacked**.\n3. Paste the folder path (already copied) and click **Select Folder**.\nRS Downloader shows Installed here as soon as it is added.', b.dataset.b, x.page)}) : rsErr(x.msg, 'Could not open the browser')
  }
}
// first run: offer the extension once, after the engines are ready
async function firstRunExt() {
  if (ls('rsdl_extAsked')) return
  const x = await extCheck()
  if (x.state !== 'none') return ls('rsdl_extAsked', '1')
  ls('rsdl_extAsked', '1')
  const d = dlg({title: 'Add RS Downloader to your browser', icon: 'fa-puzzle-piece', width: 560, body: `
    <p>${t('Get a <b>Download this video</b> button on every video, quality list right on the page, and browser downloads caught automatically.')}</p>
    <div class="brw"></div>`, foot: '<button type="button" class="btn btn-light" data-x>Later</button>'})
  browserList(d.q('.brw'))
}
window.rs.on('engine:ready', e => { S.engine = e; status(); setTimeout(firstRunExt, 800) })
setInterval(extCheck, 30000)

// status bar
function status() {
  const e = S.engine, waiting = S.q.filter(x => x.status === 'queued').length
  $('sbCount').textContent = `${S.rows.length} download${S.rows.length === 1 ? '' : 's'}`
  $('sbSpace').textContent = `${fmtB(S.rows.reduce((s, x) => s + (x.size || 0), 0)) || '0 B'} used`
  $('sbQueue').innerHTML = `<i class="fa-solid ${S.qRun ? 'fa-forward ic-success' : 'fa-hand ic-danger'}"></i> Queue ${S.qRun ? 'on' : 'stopped'}${waiting ? ` · ${waiting} waiting` : ''}${S.cfg.sched?.on ? ` · starts ${S.cfg.sched.time}` : ''}${S.cfg.rate ? ` · limit ${RATES.find(r => r[0] === S.cfg.rate)?.[1]}` : ''}`
  $('sbPath').textContent = `Saving to ${S.cfg.outDir || ''}`
  $('sbPath').title = S.cfg.outDir || ''
  $('sbVer').textContent = `v${S.version} · Engine ${e?.ytdlp || 'not installed'}`
}

// actions
function toolbarState() {
  const q = selQ(), h = selH(), one = h.length === 1 && !q.length && S.rows.find(x => x.id === h[0])
  $('tbResume').disabled = !q.some(d => ['paused', 'failed'].includes(d.qs))
  $('tbPause').disabled = !q.some(d => ['running', 'queued'].includes(d.qs))
  $('tbDel').disabled = !sel().length
  $('tbOpen').disabled = !one?.file
  $('tbFolder').disabled = !one
  $('tbSend').disabled = !h.length || !S.devs.length
  $('tbQStart').disabled = S.qRun || !S.q.some(x => x.status === 'queued')
  $('tbQStop').disabled = !S.qRun
}
async function act(a, id) {
  const r = await call(a, {id})
  r.ok || rsErr(r.msg || 'This file was moved or deleted.', 'Could not open')
}
async function copy(t) { await call('copy', {text: t}); rsOk('Address copied') }
async function del(ids) {
  const qids = ids.filter(x => x.startsWith('q:')).map(x => x.slice(2)), hids = ids.filter(x => !x.startsWith('q:'))
  if (!ids.length) return
  if (qids.length && !hids.length) return cancelQ(qids)
  const one = hids.length === 1 && S.rows.find(x => x.id === hids[0])
  const ok = await rsPop.confirm({danger: true, yes: 'Delete', title: one ? 'Delete this download?' : `Delete ${hids.length} downloads?`,
    text: `${one ? `**${raw(one.title)}**\n` : ''}${t(one?.count === 1 ? 'The file will be removed from your PC (moved to the Recycle Bin) and from this list.' : 'The files will be removed from your PC (moved to the Recycle Bin) and from this list.')}${qids.length ? '\n' + t('{0} unfinished download(s) are cancelled too.', qids.length) : ''}`})
  if (!ok) return
  const r = await write('Deleting...', async () => { qids.length && await call('q:cancel', {qids}); return call('delete', {ids: hids}) })
  r.ok ? rsOk(r.gone ? `${r.gone} file${r.gone > 1 ? 's' : ''} moved to the Recycle Bin` : 'Removed from the list') : rsErr(r.msg, 'Not deleted')
  await loadRows()
}
const selAct = a => { const id = selH()[0]; id && act(a, id) }
const setCfg = async (key, value) => { const r = await call('set', {key, value}); if (r.ok) { S.cfg[key] = value; status() } return r.ok }

// Options: classic tabbed configuration window
const OPT_TABS = [['gen', 'General'], ['save', 'Save to'], ['dl', 'Downloads'], ['ext', 'Browser'], ['sched', 'Scheduler'], ['eng', 'Engine']]
const chk = (key, on, text, id) => `<label class="chk"><input type="checkbox" ${id ? `id="${id}"` : `data-k="${key}"`}${on ? ' checked' : ''}><span>${text}</span></label>`
async function options(focus) {
  const c = S.cfg, e = S.engine || {}, cats = (await call('cats')).list || []
  const d = dlg({title: 'RS Downloader Configuration', icon: 'fa-gear', width: 600, body: `
    <div class="tabs" role="tablist">${OPT_TABS.map(([k, l]) => `<button type="button" role="tab" data-t="${k}">${l}</button>`).join('')}</div>
    <div class="tabp" data-p="gen">
      <div class="grp-h"><i class="fa-solid fa-language"></i> Language</div>
      <div translate="no">${seg('lang', RSI18N.LANGS, RSI18N.lang)}</div>
      <div class="grp-h"><i class="fa-solid fa-desktop"></i> Windows integration</div>
      ${chk('startup', c.startup, 'Launch RS Downloader on Windows startup (opens in the tray)')}
      ${chk('tray', c.tray !== false, 'Keep running in the tray when the window is closed')}
      ${chk('clip', c.clip !== false, 'Watch the clipboard for video and picture links')}
      <div class="grp-h"><i class="fa-solid fa-window-restore"></i> Windows and messages</div>
      ${chk('progressWin', c.progressWin !== false, 'Show the download window (progress, speed, time left) for each download I start')}
      ${chk('notify', c.notify !== false, 'Windows notification when a download finishes')}
      ${chk('', document.body.classList.contains('dark-mode'), 'Dark mode', 'opDark')}
    </div>
    <div class="tabp" data-p="save">
      <div class="frm"><span class="l">Main folder</span><div class="row"><input class="in" id="opDir" readonly value="${esc(c.outDir)}"><button type="button" class="dots" id="opBrowse" title="Change">...</button></div></div>
      ${chk('sort', !!c.sort, 'Put each category in its own folder inside the main folder')}
      <fieldset class="box"><legend>Category folders</legend>
        <table class="cats-t">${cats.map(x => `<tr data-cat="${esc(x.cat)}"><td><i class="fa-solid ${({Video: 'fa-film', Music: 'fa-music', Pictures: 'fa-image', Documents: 'fa-file-lines', Compressed: 'fa-file-zipper', Programs: 'fa-compact-disc'})[x.cat] || 'fa-file'}"></i> ${esc(x.cat)}</td>
          <td><input class="in" readonly value="${esc(x.dir)}" title="${esc(x.dir)}"></td><td class="nw"><div><button type="button" class="dots" data-a="pick" title="Choose a folder for ${esc(x.cat)}">...</button>
          <button type="button" class="mini" data-a="reset" title="Back to the main folder"${x.custom ? '' : ' disabled'}>Reset</button></div></td></tr>`).join('')}</table>
      </fieldset>
    </div>
    <div class="tabp" data-p="dl">
      <div class="frm"><span class="l">Downloads at once</span>${seg('maxAt', [['1', '1'], ['2', '2'], ['3', '3']], String(c.maxAt || 2))}</div>
      <div class="frm"><span class="l">Connections per file</span>${seg('conns', [['4', '4'], ['8', '8'], ['16', '16']], String(c.conns || 16))}</div>
      <div class="frm"><span class="l">Speed limit</span>${seg('rate', RATES, c.rate || '')}</div>
      <p class="hint">Connections are used for plain files (zip, exe, pdf...). Videos always take 4 parts at once.</p>
    </div>
    <div class="tabp" data-p="ext">
      <div class="grp-h"><i class="fa-solid fa-puzzle-piece"></i> Add RS Downloader to your browsers</div>
      <div class="brw" id="brwList"><div class="hint">Looking for browsers...</div></div>
      <p class="hint">${t('Install opens that browser\'s extensions page and the extension folder (its path is already copied). There: turn on <b>Developer mode</b>, click <b>Load unpacked</b>, paste the path, Select Folder. Done.')}</p>
    </div>
    <div class="tabp" data-p="sched">
      <div class="row">${chk('', c.sched?.on, 'Start the queue every day at', 'opSchedOn')}<input class="in time" id="opTime" type="time" value="${esc(c.sched?.time || '02:00')}"></div>
      <p class="hint">Downloads added with Download Later or Batch wait in the queue until this time.</p>
    </div>
    <div class="tabp" data-p="eng">
      <div class="eng">${[
        ['fa-circle-down', 'Download engine', 'Reads and downloads videos from 1,800+ sites', e.ytdlp && 'yt-dlp ' + e.ytdlp],
        ['fa-images', 'Picture engine', 'Pictures from Pinterest, X, Reddit, Instagram...', e.gdl && 'gallery-dl ' + e.gdl, 'Installs on first picture link'],
        ['fa-bolt', 'File engine', 'Up to 16 connections for zip, exe, pdf, iso...', e.aria && 'aria2 ' + e.aria, 'Installs on first file link'],
        ['fa-brands fa-youtube', 'YouTube helper', 'Needed for YouTube\'s newest video formats', e.deno && 'Deno ' + e.deno],
        ['fa-film', 'Video joiner', 'Joins video + sound, makes MP3 / M4A, adds covers', e.ffmpeg && 'ffmpeg'],
        ['fa-desktop', 'RS Downloader', 'The app itself, updates from GitHub', 'v' + S.version]].map(([ic, name, what, ver, none]) => `
        <div class="eng-row"><span class="eng-ic${ver ? '' : ' off'}"><i class="${ic.startsWith('fa-brands') ? ic : 'fa-solid ' + ic}"></i></span>
          <div class="eng-tx"><b>${name}</b><small>${what}</small></div>
          <span class="eng-v ${ver ? 'ok' : 'off'}">${ver ? '<i class="fa-solid fa-check"></i>' + esc(ver) : esc(none || 'Not installed')}</span></div>`).join('')}
      </div>
      <div class="eng-foot"><span class="hint">${e.age == null ? 'The download engine is not installed yet.' : e.age >= 30 ? `<i class="fa-solid fa-triangle-exclamation ic-warn"></i> Download engine last checked ${e.age} days ago. Update it so sites keep working.` : `<i class="fa-solid fa-circle-check ic-success"></i> Download engine checked ${e.age ? e.age + ' day' + (e.age > 1 ? 's' : '') + ' ago' : 'today'}.`}</span>
        <button type="button" class="mini mini-pri" id="opUpd"><i class="fa-solid fa-rotate"></i> Update now</button></div>
    </div>`,
    foot: '<button type="button" class="btn btn-primary btn-ok" data-x>OK</button><button type="button" class="btn btn-light btn-ok" id="opHelp">Help</button>'})
  d.el.querySelector('.dlg').classList.add('cfg')
  const tab = t => { d.body.querySelectorAll('[data-t]').forEach(b => b.classList.toggle('on', b.dataset.t === t)); d.body.querySelectorAll('[data-p]').forEach(p => (p.hidden = p.dataset.p !== t)); ls('rsdl_optTab', t) }
  d.body.querySelector('.tabs').addEventListener('click', e2 => { const b = e2.target.closest('[data-t]'); b && tab(b.dataset.t) })
  tab(focus || ls('rsdl_optTab') || 'gen')
  d.q('#opBrowse').addEventListener('click', async () => { const p = await call('pick-folder'); if (p.ok) { S.cfg.outDir = p.outDir; d.q('#opDir').value = p.outDir; status(); options.refreshCats() } })
  options.refreshCats = async () => { for (const x of (await call('cats')).list || []) { const tr = d.q(`tr[data-cat="${x.cat}"]`); if (tr) { tr.querySelector('input').value = x.dir; tr.querySelector('[data-a="reset"]').disabled = !x.custom } } }
  d.q('.cats-t').addEventListener('click', async e2 => {
    const b = e2.target.closest('[data-a]'); if (!b) return
    const tr = b.closest('tr'), r = await call('cat-dir', {cat: tr.dataset.cat, pick: b.dataset.a === 'pick'})
    if (r.ok) { tr.querySelector('input').value = r.dir; tr.querySelector('[data-a="reset"]').disabled = !r.custom }
  })
  d.body.querySelectorAll('[data-k]').forEach(t => t.addEventListener('change', () => setCfg(t.dataset.k, t.checked).then(() => t.dataset.k === 'sort' && options.refreshCats())))
  d.q('[data-seg="lang"]').addEventListener('change', () => setLang(segVal(d.el, 'lang')))
  d.q('[data-seg="rate"]').addEventListener('change', () => setCfg('rate', segVal(d.el, 'rate')))
  d.q('[data-seg="maxAt"]').addEventListener('change', () => setCfg('maxAt', +segVal(d.el, 'maxAt')))
  d.q('[data-seg="conns"]').addEventListener('change', () => setCfg('conns', +segVal(d.el, 'conns')))
  browserList(d.q('#brwList'))
  const sched = () => setCfg('sched', {on: d.q('#opSchedOn').checked, time: d.q('#opTime').value || '02:00'})
  d.q('#opSchedOn').addEventListener('change', sched)
  d.q('#opTime').addEventListener('change', sched)
  d.q('#opDark').addEventListener('change', e2 => setTheme(e2.target.checked ? 'dark' : 'light', true))
  d.q('#opUpd').addEventListener('click', () => { d.close(); update() })
  d.q('#opHelp').addEventListener('click', () => { d.close(); about() })
}

function about() {
  const u = S.upd || {}
  const upd = !S.packaged ? 'Works in the installed app' : {ready: `v${u.version} ready, click Update`, downloading: `Downloading v${u.version} (${u.pct || 0}%)`, latest: 'Up to date', error: u.msg, checking: 'Checking...'}[u.state] || 'Checks on its own every hour'
  const d = dlg({title: 'About RS Downloader', icon: 'fa-circle-info', width: 780, body: `
    <div class="dev"><img src="${esc(LOGO)}" alt=""><div><h3>RS Downloader v${esc(S.version)}</h3><p>Developed by Mohammad Rameez Imdad (Rameez Scripts). App update: ${esc(upd)}.</p></div></div>
    <div class="links"><a data-ext="https://rameezscripts.com/"><i class="fa-solid fa-globe"></i>rameezscripts.com</a><a data-ext="https://www.youtube.com/@rameezimdad"><i class="fa-brands fa-youtube"></i>YouTube: @rameezimdad</a></div>
    <div class="contact"><b><i class="fa-solid fa-handshake"></i> Let's Work Together</b>
      <a data-ext="https://wa.me/923435347417"><i class="fa-brands fa-whatsapp"></i>WhatsApp: https://wa.me/923435347417</a>
      <a data-ext="mailto:Contact@rameezscripts.com"><i class="fa-solid fa-envelope"></i>Email: Contact@rameezscripts.com</a></div>
    <span class="lbl">How it works</span>
    <table class="about-table"><thead><tr><th>What</th><th>Logic</th><th>Where</th></tr></thead><tbody>
      <tr><td>Quality list</td><td>Every height the site offers, highest first, up to 8. Audio: MP3 320, MP3 128, M4A, WAV. Size = video size + best audio size (estimate).</td><td>Download File Info</td></tr>
      <tr><td>Speed</td><td>4 parts of a video download at the same time. A dropped connection is retried 10 times before it fails.</td><td>Every download</td></tr>
      <tr><td>Plain files</td><td>Links to zip, exe, pdf, iso, mp4 and other files download with up to 16 connections at once (aria2), sorted into Compressed, Programs, Documents, Videos, Music, Pictures. Pause keeps the part; resume needs a server that allows it.</td><td>Download File Info</td></tr>
      <tr><td>Browser extension</td><td>Right-click a link, picture or video, or the Download button on video pages, sends it here. Browser downloads of files are caught while the app is open. File links carry the browser's cookies so protected downloads work; video sites never get them.</td><td>Chrome / Edge</td></tr>
      <tr><td>USB / phone</td><td>USB drives, SD cards and external disks (by drive letter) and phones in File transfer mode are found every 4 seconds. Copy keeps the PC file; Move copies, checks the size, then removes the PC file and the row shows "Moved to". Space is checked first, and FAT32 drives refuse files of 4 GB or more. Phones: videos go to Movies, music to Music, pictures to Pictures, other files to Download.</td><td>Actions column, Send to USB</td></tr>
      <tr><td>Queue</td><td>Up to 1-3 downloads at a time (Options), in order. Start Download puts a link first in line; Download Later and Batch add to the end. Stop Queue lets the current one finish.</td><td>Toolbar, list</td></tr>
      <tr><td>Pause / Resume</td><td>Pause keeps the part already downloaded; Resume carries on from there. A download cut off by closing the app comes back paused.</td><td>List, progress window</td></tr>
      <tr><td>Batch quality</td><td>Every link takes the picked quality, or the nearest lower one it has. Posts with pictures save their pictures.</td><td>Batch</td></tr>
      <tr><td>Extras in the file</td><td>Title, channel and the cover picture are saved inside MP4, MKV, MP3 and M4A files. Subtitles are saved as a .srt file next to the video.</td><td>Download File Info</td></tr>
      <tr><td>Only a part</td><td>Downloads only the time range given (m:ss or h:mm:ss); the file name gets the range.</td><td>Download File Info</td></tr>
      <tr><td>Pictures</td><td>A post with no video is read for pictures (gallery-dl), else its largest preview image is saved. Several pictures go to a folder named after the post.</td><td>Download File Info</td></tr>
      <tr><td>Folders</td><td>With sorting on: Videos, Music and Pictures inside the save folder. Playlists get their own folder: 001 - Title.</td><td>Options</td></tr>
      <tr><td>Clipboard</td><td>A copied YouTube, Instagram, TikTok, X, Facebook, Pinterest, Reddit... link fills the link box; when the window is in the background a Windows notification offers it.</td><td>Options</td></tr>
      <tr><td>Scheduler</td><td>Starts the queue once a day at the set time if something is waiting.</td><td>Scheduler</td></tr>
      <tr><td>Download File Info</td><td>One window for every new download (link box, Add URL, browser menu, right-click, caught browser downloads): URL, Quality, Category, Save As (folder + name, ... to browse), Remember this path for the category, Description, More options (format, subtitles, only a part). Download Later waits in the queue; Start Download begins now.</td><td>Everywhere</td></tr>
      <tr><td>Categories</td><td>The category picked in Download File Info (Video, Music, Pictures, Documents, Compressed, Programs, Other), else by file type; Playlists = more than one video; Unfinished = queued, running, paused or failed; Finished = saved.</td><td>Left panel</td></tr>
      <tr><td>Delete</td><td>Saved files go to the Recycle Bin; an unfinished download is cancelled and its part files removed.</td><td>List, toolbar</td></tr>
      <tr><td>Update</td><td>Updates the engine, then checks for a new app version. New versions download on their own and install on restart.</td><td>Toolbar</td></tr>
    </tbody></table>
    <p class="muted">Only public videos and pictures can be downloaded. Save only what you own or have permission to keep, and follow each site's terms.</p>`,
    foot: '<button type="button" class="btn btn-primary" data-x>Close</button>'})
  d.body.addEventListener('click', e => { const a = e.target.closest('[data-ext]'); a && call('ext', {url: a.dataset.ext}) })
}

function setTheme(t, save) {
  document.body.classList.toggle('dark-mode', t === 'dark')
  ls('rsdl_theme', t)
  save && call('set', {key: 'theme', value: t})
}
// new language = the window opens again in it (tray, notifications and other windows follow)
async function setLang(l) {
  if (!l || l === RSI18N.lang || !(await setCfg('lang', l))) return
  RSI18N.save(l) && location.reload()
}
async function pasteGo() { const c = await call('paste'); /^https?:\/\//i.test(c.text || '') ? probeOpen(c.text, false) : rsPop.toast('No link in the clipboard', 'info') }

const ACT = {
  add: () => addUrl(), batch, paste: pasteGo, del: () => del(sel()), open: () => selAct('open'), reveal: () => selAct('reveal'),
  resume: () => call('q:resume', {qids: selQ().map(d => d.qid)}), pause: () => call('q:pause', {qids: selQ().map(d => d.qid)}),
  qstart: () => call('q:run', {on: true}), qstop: () => call('q:run', {on: false}), sched: () => options('sched'),
  send: () => { const ids = selH(); closeMenu(); devMenuOrMode(ids) },
  copy: () => { const d = table?.getSelectedData()[0]; d && copy(d.url) }, again: () => { const d = table?.getSelectedData()[0]; d && probeOpen(d.url, false) },
  options, update, about, folder: async () => (await call('open-out')).ok || rsErr('The folder could not be opened.', 'Could not open'),
  dark: () => setTheme(document.body.classList.contains('dark-mode') ? 'light' : 'dark', true),
  cats: () => { const c = $('cats'); c.hidden = !c.hidden; ls('rsdl_cats', c.hidden ? '0' : '1') },
  extension: () => options('ext'), progress: () => openPd(), selall: () => table?.selectRow('active'),
}
document.querySelector('.toolbar').addEventListener('click', e => { const b = e.target.closest('[data-act]'); b && !b.disabled && ACT[b.dataset.act]() })

// a menu opened by a click shows after that click is done, so the outside-click close does not eat it
const popAfterClick = el => setTimeout(() => { closeMenu(); menuEl = el; document.body.append(el) })

// Send to USB: copy or move first, then the device
function devMenuOrMode(ids) {
  const b = $('tbSend'), el = document.createElement('div')
  el.className = 'menu-pop'
  el.innerHTML = '<button type="button" data-m="copy"><i class="fa-regular fa-copy"></i>Copy to USB / phone</button><button type="button" data-m="move"><i class="fa-solid fa-share-from-square"></i>Move to USB / phone</button>'
  const r = b.getBoundingClientRect()
  el.style.left = r.left + 'px'; el.style.top = r.bottom + 2 + 'px'
  el.addEventListener('click', e => { const m = e.target.closest('[data-m]'); if (m) { closeMenu(); sendTo(ids, m.dataset.m, b) } })
  popAfterClick(el)
}

// menu bar
const MENUS = {
  tasks: () => [['add', 'fa-circle-plus', 'Add new download', 'Ctrl+N'], ['batch', 'fa-layer-group', 'Add many links', 'Ctrl+B'], ['paste', 'fa-paste', 'Download link from clipboard', 'Ctrl+V'], 0,
    ['qstart', 'fa-forward', 'Start queue', '', S.qRun || !S.q.some(x => x.status === 'queued')], ['qstop', 'fa-hand', 'Stop queue', '', !S.qRun], ['sched', 'fa-clock', 'Scheduler'], 0, ['extension', 'fa-puzzle-piece', 'Browser extension'],
    ['folder', 'fa-folder', 'Open download folder'], ['options', 'fa-gear', 'Options']],
  downloads: () => { const q = selQ(), h = selH(), one = h.length === 1 && S.rows.find(x => x.id === h[0])
    return [['progress', 'fa-window-maximize', 'Show progress', '', !running()], ['resume', 'fa-play', 'Resume', '', !q.some(d => ['paused', 'failed'].includes(d.qs))],
      ['pause', 'fa-pause', 'Pause', '', !q.some(d => ['running', 'queued'].includes(d.qs))], 0,
      ['open', 'fa-circle-play', 'Open', 'Enter', !one?.file], ['reveal', 'fa-folder-open', 'Open folder', '', !one], ['copy', 'fa-link', 'Copy address', '', !sel().length], ['again', 'fa-rotate-right', 'Download again', '', !one], 0,
      ['selall', 'fa-check-double', 'Select all', 'Ctrl+A'], ['del', 'fa-trash-can', 'Delete', 'Del', !sel().length]] },
  view: () => [['dark', 'fa-moon', document.body.classList.contains('dark-mode') ? 'Light mode' : 'Dark mode'], ['cats', 'fa-table-columns', $('cats').hidden ? 'Show categories' : 'Hide categories']],
  help: () => [['update', 'fa-rotate', S.upd.state === 'ready' ? `Restart and update to v${S.upd.version}` : 'Check for updates'], ['about', 'fa-circle-info', 'About RS Downloader']],
}
let menuEl = null, menuBtn = null
function closeMenu() { menuEl?.remove(); menuEl = null; menuBtn?.classList.remove('on'); menuBtn = null }
function openMenu(btn) {
  closeMenu()
  menuBtn = btn; btn.classList.add('on')
  menuEl = document.createElement('div')
  menuEl.className = 'menu-pop'
  menuEl.innerHTML = MENUS[btn.dataset.menu]().map(m => m ? `<button type="button" data-act="${m[0]}"${m[4] ? ' disabled' : ''}><i class="fa-solid ${m[1]}"></i>${esc(m[2])}${m[3] ? `<kbd>${m[3]}</kbd>` : ''}</button>` : '<hr>').join('')
  const r = btn.getBoundingClientRect()
  menuEl.style.left = r.left + 'px'; menuEl.style.top = r.bottom + 2 + 'px'
  menuEl.addEventListener('click', e => { const b = e.target.closest('[data-act]'); if (b && !b.disabled) { closeMenu(); ACT[b.dataset.act]() } })
  document.body.append(menuEl)
}
$('menubar').addEventListener('click', e => { const b = e.target.closest('.mb-item'); if (!b) return; e.stopPropagation(); menuBtn === b ? closeMenu() : openMenu(b) })
$('menubar').addEventListener('mouseover', e => { const b = e.target.closest('.mb-item'); b && menuEl && b !== menuBtn && openMenu(b) })
document.addEventListener('click', e => { if (menuEl && !e.target.closest('.menu-pop')) closeMenu() })
addEventListener('blur', closeMenu)

// keys (capture: runs before the popup's own Esc)
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { if (menuEl) return closeMenu(); if (dlgs.length && !rsPop.isOpen()) return dlgs.at(-1).close() }
  if (dlgs.length || rsPop.isOpen() || e.target.closest('input, textarea, button')) return
  const k = e.key.toLowerCase()
  if (e.ctrlKey && k === 'n') { e.preventDefault(); ACT.add() }
  else if (e.ctrlKey && k === 'b') { e.preventDefault(); ACT.batch() }
  else if (e.ctrlKey && k === 'v') { e.preventDefault(); pasteGo() }
  else if (e.ctrlKey && k === 'a') { e.preventDefault(); ACT.selall() }
  else if (e.key === 'Delete') ACT.del()
  else if (e.key === 'Enter') ACT.open()
}, true)

// clipboard: a copied link lands in the link box; the notification click opens it
window.rs.on('clip:link', u => {
  if (dlgs.length) return
  qUrl.value = u; qSync()
  $('qField').classList.remove('flash'); void $('qField').offsetWidth; $('qField').classList.add('flash')
})
window.rs.on('clip:open', u => /^https?:\/\//i.test(u || '') && probeOpen(u, false))

// drop a link anywhere
document.addEventListener('dragover', e => e.preventDefault())
document.addEventListener('drop', e => {
  e.preventDefault()
  const u = (e.dataTransfer.getData('text/uri-list') || e.dataTransfer.getData('text/plain')).split('\n')[0].trim()
  ;/^https?:\/\//i.test(u) && probeOpen(u, false)
})

// boot
;(async () => {
  $('cats').hidden = ls('rsdl_cats') === '0'
  const r = await read(() => call('boot'))
  S.cfg = r.cfg || {}; S.version = r.version || ''; S.packaged = !!r.packaged; S.engine = r.engine; S.q = r.items || []; S.qRun = r.run
  // language set in main (or first run from the Windows language) wins
  if (S.cfg.lang && S.cfg.lang !== RSI18N.lang && RSI18N.save(S.cfg.lang)) return location.reload()
  setTheme(S.cfg.theme)
  showUpd(r.upd)
  await loadRows()
  toolbarState()
  r.engine?.ytdlp || install(false) // first run: set up on its own
  extCheck()
  call('devices').then(r => showDevs(r.devs))
})()
