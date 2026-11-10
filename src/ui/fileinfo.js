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
const words = s => { s = Math.round(s || 0); return s < 60 ? `${s} sec` : s < 3600 ? `${Math.floor(s / 60)} min ${s % 60 ? (s % 60) + ' sec' : ''}`.trim() : `${Math.floor(s / 3600)} hr ${Math.floor(s % 3600 / 60)} min` }
const safe = n => String(n || '').replace(/[<>:"/\\|?*\x00-\x1f]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 120).replace(/[. ]+$/, '') || 'download'
const CAT_ICON = {Video: 'fa-film', Music: 'fa-music', Pictures: 'fa-image', Documents: 'fa-file-lines', Compressed: 'fa-file-zipper', Programs: 'fa-compact-disc', Other: 'fa-file'}
const KIND_ICON = {video: 'fa-file-video', audio: 'fa-file-audio', image: 'fa-file-image', file: 'fa-file'}
const KIND_CAT = {video: 'Video', audio: 'Music', image: 'Pictures'}
const MEDIA_EXT = /\.(mp4|mkv|webm|mp3|m4a|wav|opus|ogg)$/i

const S = {d: null, sel: 0, cat: 'Other', dir: '', name: '', catTouched: false, fmt: 'mp4', lang: 'en', busy: false}

// small keyboard-friendly dropdown
function dd(root, items, value, onPick) {
  root.innerHTML = '<button type="button" class="dd-btn" aria-haspopup="listbox"><i class="fa-solid"></i><span></span><em></em><i class="fa-solid fa-chevron-down"></i></button><div class="dd-list" role="listbox"></div>'
  const btn = root.firstElementChild, list = root.lastElementChild
  let hl = -1
  const pick = v => {
    const it = items.find(x => x.v === v)
    if (!it) return
    value = v
    btn.children[0].className = 'fa-solid ' + (it.icon || '')
    btn.children[1].textContent = it.label; btn.children[2].textContent = it.note || ''
    list.innerHTML = items.map((x, i) => x.head ? `<div class="dd-h">${esc(x.head)}</div>` : `<div class="dd-it${x.v === v ? ' on' : ''}" role="option" data-i="${i}"><i class="fa-solid ${x.icon || ''}"></i>${esc(x.label)}<em>${esc(x.note || '')}</em></div>`).join('')
  }
  const close = () => { root.classList.remove('open'); hl = -1 }
  const move = d => {
    const opts = [...list.querySelectorAll('.dd-it')]
    hl = (hl + d + opts.length) % opts.length
    opts.forEach((o, i) => o.classList.toggle('hl', i === hl)); opts[hl]?.scrollIntoView({block: 'nearest'})
  }
  btn.addEventListener('click', () => root.classList.toggle('open'))
  list.addEventListener('click', e => { const o = e.target.closest('.dd-it'); if (o) { pick(items[+o.dataset.i].v); close(); onPick(value) } })
  btn.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); root.classList.add('open'); move(e.key === 'ArrowDown' ? 1 : -1) }
    else if (e.key === 'Enter' && root.classList.contains('open') && hl >= 0) { e.preventDefault(); e.stopPropagation(); list.querySelectorAll('.dd-it')[hl].click() }
    else if (e.key === 'Escape' && root.classList.contains('open')) { e.stopPropagation(); close() }
  })
  document.addEventListener('mousedown', e => root.contains(e.target) || close())
  pick(value)
  return {set: v => pick(v), get: () => value}
}

const extOf = c => !c ? '' : c.kind === 'video' ? '.' + S.fmt : c.kind === 'audio' ? '.' + ({'M4A': 'm4a', 'WAV': 'wav'}[c.label] || 'mp3') : ''
const cur = () => S.d.choices[S.sel]
const sep = () => (S.dir.endsWith('\\') ? '' : '\\')
function compose() {
  const c = cur(), base = S.name.replace(MEDIA_EXT, '')
  const name = c.kind === 'file' ? S.name : c.kind === 'image' ? base : base + extOf(c)
  $('fSave').value = S.dir + sep() + name
}
// typed / browsed path -> folder + name
function parseSave() {
  const v = $('fSave').value.trim(), i = Math.max(v.lastIndexOf('\\'), v.lastIndexOf('/'))
  return i < 0 ? {dir: S.dir, name: v} : {dir: v.slice(0, i) || S.dir, name: v.slice(i + 1)}
}
function setCat(cat, byUser) {
  const old = S.d.catDirs[S.cat]
  S.cat = cat
  if (byUser) S.catTouched = true
  // follow the category folder unless the user picked another folder
  const now = parseSave()
  S.name = now.name || S.name
  if (!S.dir || now.dir === old || S.dir === old) S.dir = S.d.catDirs[cat]
  $('fRemTxt').textContent = `Remember this path for "${cat}" category`
  $('fCatDir').value = S.d.catDirs[cat]
  compose()
}
function side() {
  const i = S.d.info, c = cur()
  $('sideMain').textContent = i.duration ? words(i.duration) : c?.size ? '~' + fmtB(c.size) : i.size ? fmtB(i.size) : i.images ? `${i.count} picture${i.count > 1 ? 's' : ''}` : ''
  $('sideSub').textContent = i.title || ''
  if (i.thumb) { const img = new Image(); img.alt = ''; img.referrerPolicy = 'no-referrer'; img.onload = () => $('pic').replaceChildren(img); img.src = i.thumb }
  else $('pic').innerHTML = `<i class="fa-solid ${KIND_ICON[c?.kind] || 'fa-file'}"></i>`
}
function opts() {
  const k = cur()?.kind
  $('oFmt').hidden = $('oSub').hidden = k !== 'video'
  $('oCut').hidden = !(k === 'video' || k === 'audio') || !!S.d.info.playlist
  $('fMoreBtn').hidden = !(k === 'video' || k === 'audio')
}
const lock = on => ['bGo', 'bLater'].forEach(id => ($(id).disabled = on))
const err = t => { $('msg').hidden = !t; $('msg').textContent = t || '' }

window.rs.on('fi:loading', a => {
  $('fUrl').value = a.url; $('fUrl').title = a.url
  $('pic').className = 'pic load'; $('pic').innerHTML = '<i class="fa-solid fa-circle-notch"></i>'
  $('sideMain').textContent = 'Reading...'; $('sideSub').textContent = 'Getting the file details'
  lock(true)
})
window.rs.on('fi:init', d => {
  S.d = d
  $('fUrl').value = d.url; $('fUrl').title = d.url
  $('pic').className = 'pic'
  if (!d.ok) { $('pic').innerHTML = '<i class="fa-solid fa-circle-exclamation"></i>'; $('sideMain').textContent = 'Could not read'; $('sideSub').textContent = ''; err(d.msg || 'Could not read this link.'); return }
  const p = d.preset || {}
  S.sel = Math.max(0, d.choices.findIndex(c => c.label === p.label))
  // quality list: video first, then audio
  const q = [], vids = d.choices.map((c, i) => [c, i]).filter(([c]) => c.kind !== 'audio'), auds = d.choices.map((c, i) => [c, i]).filter(([c]) => c.kind === 'audio')
  if (vids.length && auds.length) q.push({head: d.info.images ? 'Save' : d.info.file ? 'File' : 'Video'})
  vids.forEach(([c, i], n) => q.push({v: i, label: c.label + (n === 0 && c.kind === 'video' ? '  (best)' : ''), icon: KIND_ICON[c.kind], note: c.size ? '~' + fmtB(c.size) : ''}))
  if (auds.length) q.push({head: 'Audio only'})
  auds.forEach(([c, i]) => q.push({v: i, label: c.label, icon: KIND_ICON.audio, note: c.size ? '~' + fmtB(c.size) : ''}))
  S.ddQ = dd($('ddQ'), q, S.sel, v => {
    S.sel = v
    if (!S.catTouched) { const kc = KIND_CAT[cur().kind]; kc && kc !== S.cat && (S.ddC.set(kc), setCat(kc)) }
    S.name = parseSave().name; compose(); side(); opts()
  })
  S.ddC = dd($('ddC'), d.cats.map(c => ({v: c, label: c, icon: CAT_ICON[c]})), d.cat, v => setCat(v, true))
  S.name = safe(p.name || d.info.name || d.info.title)
  S.cat = d.cat; S.dir = d.catDirs[d.cat]
  setCat(d.cat)
  side(); opts(); lock(false); err('')
  $('bGo').focus()
})

// more options
$('fMoreBtn').addEventListener('click', () => ($('fMore').hidden = !$('fMore').hidden))
document.querySelectorAll('.seg').forEach(g => g.addEventListener('click', e => {
  const b = e.target.closest('button[data-v]'); if (!b) return
  g.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b))
  if (g.id === 'sFmt') { S.fmt = b.dataset.v; S.name = parseSave().name; compose() } else S.lang = b.dataset.v
}))
$('fCut').addEventListener('change', e => { $('fFrom').disabled = $('fTo').disabled = !e.target.checked; e.target.checked && $('fFrom').focus() })

$('fBrowse').addEventListener('click', async () => {
  const r = await call('fi:browse', {file: $('fSave').value})
  if (!r.ok) return
  $('fSave').value = r.file
  const p = parseSave(); S.dir = p.dir; S.name = p.name
})

async function go(now) {
  if (!S.d?.ok || S.busy) return
  const c = cur(), {dir, name} = parseSave()
  const cut = $('fCut').checked, from = cut ? $('fFrom').value.trim() : '', to = cut ? $('fTo').value.trim() : ''
  if (cut && ![from, to].every(t => !t || /^\d{1,2}(:\d{2}){1,2}$/.test(t))) return err('Write the time as m:ss or h:mm:ss, for example 1:30 or 0:02:15.')
  if (!/^([a-zA-Z]:\\|\\\\)/.test(dir)) return err('Save As must start with a drive, for example C:\\Users\\you\\Downloads\\file.mp4. Click ... to pick.')
  if (!name || /[<>:"/\\|?*]/.test(name)) return err('A file name cannot be empty or contain < > : " / \\ | ? *')
  S.busy = true; lock(true)
  const r = await call('fi:go', {url: S.d.url, playlist: S.d.playlist, label: c.label, kind: c.kind, now, remember: $('fRem').checked,
    opts: {dir, name, cat: S.cat, desc: $('fDesc').value.trim(), container: S.fmt, subs: $('fSubs').checked, subLang: S.lang, from, to}})
  S.busy = false
  if (!r?.ok) { lock(false); return err(r?.msg || 'Not added.') }
  window.close()
}
$('bGo').addEventListener('click', () => go(true))
$('bLater').addEventListener('click', () => go(false))
$('bCancel').addEventListener('click', () => window.close())
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !document.querySelector('.dd.open')) window.close()
  if (e.key === 'Enter' && !e.defaultPrevented && !e.target.closest('.dd, button')) go(true)
})
