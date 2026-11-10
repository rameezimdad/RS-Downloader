/**
 * Developed by Mohammad Rameez Imdad (Rameez Scripts)
 * WhatsApp: https://wa.me/923435347417 (For Custom Projects)
 * YouTube: https://www.youtube.com/@rameezimdad (Subscribe for more!)
 */
'use strict'
const $ = id => document.getElementById(id)
const call = (ch, a) => window.rs.call(ch, a)
const fmtB = n => { if (!n) return '0 B'; const u = ['B', 'KB', 'MB', 'GB', 'TB']; let i = 0; while (n >= 1024 && i < 4) { n /= 1024; i++ } return `${n.toFixed(i > 1 ? 2 : 0)} ${u[i]}` }
const fmtT = s => { s = Math.max(0, Math.round(s || 0)); const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = String(s % 60).padStart(2, '0'); return h ? `${h}:${String(m).padStart(2, '0')}:${x}` : `${m}:${x}` }
const words = s => { s = Math.max(0, Math.round(s || 0)); return s < 60 ? `${s} sec` : s < 3600 ? `${Math.floor(s / 60)} min ${s % 60} sec` : `${Math.floor(s / 3600)} hr ${Math.floor(s % 3600 / 60)} min` }

const W = {qid: '', start: 0, run: 0, state: 'running', p: {}, rec: null}
let tick = 0

// time taken counts only while receiving (a pause stops the clock)
const took = () => W.run + (W.start ? (Date.now() - W.start) / 1000 : 0)
function clock(on) {
  if (on && !W.start) W.start = Date.now()
  if (!on && W.start) { W.run += (Date.now() - W.start) / 1000; W.start = 0 }
  clearInterval(tick)
  tick = on ? setInterval(() => { $('took').textContent = fmtT(took()); W.p.eta != null && ($('total').textContent = fmtT(took() + W.p.eta)) }, 1000) : 0
}

function buttons(list) {
  $('foot').innerHTML = list.map(([act, icon, label, cls]) => `<button type="button" class="btn ${cls || ''}" data-act="${act}"><i class="fa-solid ${icon}"></i>${label}</button>`).join('')
}
$('foot').addEventListener('click', async e => {
  const b = e.target.closest('[data-act]')
  if (!b) return
  b.disabled = true
  const r = await call('pw:act', {qid: W.qid, act: b.dataset.act, id: W.rec?.id})
  b.disabled = false
  if (r && !r.ok && r.msg) { $('msg').hidden = false; $('msg').textContent = r.msg }
})

const setTitle = () => (document.title = W.state === 'done' ? `Download complete - ${$('name').textContent}` : `${W.p.total ? Math.floor(W.p.pct) + '% ' : ''}${$('name').textContent}`)
function bar(pct, text, indet) {
  $('bar').classList.toggle('indet', !!indet)
  $('bar').querySelector('.fill').style.width = indet ? '' : Math.min(100, pct || 0).toFixed(1) + '%'
  $('barTxt').textContent = text
}

function draw() {
  const p = W.p, has = !!p.total
  $('pct').textContent = has ? `${Math.floor(p.pct)}%` : p.items > 1 && p.done != null ? `${p.done}/${p.items}` : ''
  bar(p.pct, has ? `${fmtB(p.got)} of ${fmtB(p.total)}${p.eta != null ? `  ·  ${words(p.eta)} left` : ''}` : p.got ? `${fmtB(p.got)} received` : p.status || 'Connecting...', !has && W.state === 'running' || !!p.stage)
  $('status').textContent = p.status || 'Receiving data...'
  $('rate').textContent = p.speed ? `${fmtB(p.speed)}/s` : '-'
  $('left').textContent = p.eta != null ? fmtT(p.eta) : '-'
  $('total').textContent = p.eta != null ? fmtT(took() + p.eta) : '-'
  // one strip per connection, all at the file's progress (aria2 shares the work)
  const n = p.conns > 1 ? p.conns : 0
  $('segs').hidden = !n
  if (n) $('segs').innerHTML = Array.from({length: n}, () => `<i><b style="width:${(p.pct || 0).toFixed(0)}%"></b></i>`).join('')
  setTitle()
}

function running() {
  W.state = 'running'
  $('ico').className = 'pw-ico'; $('ico').innerHTML = '<i class="fa-solid fa-circle-down"></i>'
  $('msg').hidden = true
  buttons([['close', 'fa-eye-slash', 'Hide', 'mr-auto'], ['pause', 'fa-pause', 'Pause'], ['cancel', 'fa-xmark', 'Cancel', 'btn-danger']])
  clock(true)
}

window.rs.on('pw:init', i => {
  W.qid = i.qid
  $('name').textContent = i.title || 'Download'
  $('url').textContent = i.url || ''; $('url').title = i.url || ''
  if (i.size && !W.p.total) W.p = {...W.p, total: i.size, got: 0, pct: 0}
  $('resume').textContent = i.resumable == null ? '' : i.resumable ? 'Resume: yes' : 'Resume: no'
  if (i.status === 'paused') return paused()
  if (i.status === 'failed') return failed(i.err)
  W.state === 'done' || running()
  draw()
})
window.rs.on('dl:progress', p => {
  if (p.qid !== W.qid) return
  W.state === 'running' || running()
  W.p = {...W.p, pct: p.total ? Math.min(100, p.got / p.total * 100) : 0, got: p.got, total: p.total, speed: p.speed, eta: p.eta, stage: false, items: p.items, conns: p.conns,
    status: p.items > 1 ? `Receiving video ${p.item || 1} of ${p.items}` : p.parts > 1 ? `Receiving ${p.part === 0 ? 'video' : 'audio'} (part ${Math.min(p.part + 1, p.parts)} of ${p.parts})` : 'Receiving data...'}
  draw()
})
window.rs.on('dl:count', p => {
  if (p.qid !== W.qid) return
  W.p = {...W.p, pct: p.total ? p.done / p.total * 100 : 0, total: 0, got: 0, items: p.total, done: p.done, status: `Saving pictures (${p.done} of ${p.total || '?'})`}
  draw()
})
window.rs.on('dl:stage', p => { if (p.qid !== W.qid) return; W.p = {...W.p, stage: true, speed: 0, eta: null, status: 'Finishing: joining video and sound, adding the cover...'}; draw() })

function paused() {
  W.state = 'paused'; clock(false)
  $('ico').className = 'pw-ico pause'; $('ico').innerHTML = '<i class="fa-solid fa-pause"></i>'
  $('status').textContent = 'Paused'; $('rate').textContent = '-'; $('left').textContent = '-'
  bar(W.p.pct, W.p.total ? `Paused at ${fmtB(W.p.got)} of ${fmtB(W.p.total)}` : 'Paused')
  buttons([['close', 'fa-xmark', 'Close', 'mr-auto'], ['cancel', 'fa-trash-can', 'Cancel', 'btn-danger'], ['resume', 'fa-play', 'Resume', 'btn-primary']])
  setTitle()
}
function failed(err) {
  W.state = 'failed'; clock(false)
  $('ico').className = 'pw-ico err'; $('ico').innerHTML = '<i class="fa-solid fa-circle-exclamation"></i>'
  $('status').textContent = 'Failed'; $('rate').textContent = '-'; $('left').textContent = '-'
  bar(W.p.pct, 'Stopped')
  $('msg').hidden = false; $('msg').textContent = err || 'The download failed.'
  buttons([['close', 'fa-xmark', 'Close', 'mr-auto'], ['cancel', 'fa-trash-can', 'Remove', 'btn-danger'], ['resume', 'fa-rotate-right', 'Try again', 'btn-primary']])
  document.title = `Failed - ${$('name').textContent}`
}
window.rs.on('pw:state', s => s.status === 'paused' ? paused() : s.status === 'failed' ? failed(s.err) : s.status === 'queued' && (W.state = 'queued', $('status').textContent = 'Waiting for a free slot...', $('ico').className = 'pw-ico', $('msg').hidden = true))

window.rs.on('pw:done', d => {
  W.state = 'done'; W.rec = d.rec; clock(false)
  $('ico').className = 'pw-ico ok'; $('ico').innerHTML = '<i class="fa-solid fa-circle-check"></i>'
  $('name').textContent = d.rec.title
  $('pct').textContent = '100%'
  $('bar').classList.add('ok'); bar(100, `${fmtB(d.rec.size)} downloaded`)
  $('segs').hidden = true
  $('status').textContent = 'Download complete'
  $('rate').textContent = W.run > 0 && d.rec.size ? `${fmtB(d.rec.size / W.run)}/s avg` : '-'
  $('left').textContent = '0:00'; $('took').textContent = fmtT(W.run); $('total').textContent = fmtT(W.run)
  // no path here: Open folder shows where it went
  $('msg').hidden = !d.warn; $('msg').textContent = d.warn || ''
  buttons([['close', 'fa-xmark', 'Close', 'mr-auto'], ['reveal', 'fa-folder-open', 'Open folder'], ...(d.rec.file ? [['open', 'fa-circle-play', 'Open', 'btn-primary']] : [])])
  setTitle()
})

document.addEventListener('keydown', e => e.key === 'Escape' && W.state !== 'running' && call('pw:act', {qid: W.qid, act: 'close'}))
