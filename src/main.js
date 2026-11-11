/**
 * Developed by Mohammad Rameez Imdad (Rameez Scripts)
 * WhatsApp: https://wa.me/923435347417 (For Custom Projects)
 * YouTube: https://www.youtube.com/@rameezimdad (Subscribe for more!)
 */
'use strict'
const {app, BrowserWindow, ipcMain, dialog, shell, clipboard, Notification, Tray, Menu, nativeImage} = require('electron')
const path = require('node:path')
const fs = require('node:fs')
const fsp = fs.promises
const http = require('node:http')
const {spawn} = require('node:child_process')
const {Readable} = require('node:stream')
const {pipeline} = require('node:stream/promises')
const I18N = require('./i18n/i18n.js')

const WIN = process.platform === 'win32'
const ARM = process.arch === 'arm64'
const ICON = path.join(__dirname, 'ui', 'icon.png')
const BIN = () => path.join(app.getPath('userData'), 'bin')
const YTDLP = () => path.join(BIN(), WIN ? 'yt-dlp.exe' : 'yt-dlp')
const DENO = () => path.join(BIN(), WIN ? 'deno.exe' : 'deno')
const GDL = () => path.join(BIN(), WIN ? 'gallery-dl.exe' : 'gallery-dl')
const ARIA = () => WIN ? path.join(BIN(), 'aria2c.exe') : 'aria2c' // linux / mac: system aria2
const YT_ASSET = WIN ? 'yt-dlp.exe' : process.platform === 'darwin' ? 'yt-dlp_macos' : ARM ? 'yt-dlp_linux_aarch64' : 'yt-dlp_linux'
const DENO_ASSET = `deno-${ARM ? 'aarch64' : 'x86_64'}-${WIN ? 'pc-windows-msvc' : process.platform === 'darwin' ? 'apple-darwin' : 'unknown-linux-gnu'}.zip`
const SRC = {
  ytdlp: `https://github.com/yt-dlp/yt-dlp/releases/latest/download/${YT_ASSET}`,
  deno: `https://github.com/denoland/deno/releases/latest/download/${DENO_ASSET}`,
  // gallery-dl moved its builds: old place first, then gdl-org/builds
  gdl: [`https://github.com/mikf/gallery-dl/releases/latest/download/${WIN ? 'gallery-dl.exe' : 'gallery-dl.bin'}`, `https://github.com/gdl-org/builds/releases/latest/download/${WIN ? 'gallery-dl_windows.exe' : 'gallery-dl_linux'}`],
  aria: 'https://github.com/aria2/aria2/releases/download/release-1.37.0/aria2-1.37.0-win-64bit-build1.zip',
}
// yt-dlp found the post but no video in it
const NOVID = /no video formats found|no video could be found|there'?s no video|no media found|unsupported url|does not contain (a )?video/i
const HIST_MAX = 500
const TPL = 'RSDL|%(progress.downloaded_bytes)s|%(progress.total_bytes)s|%(progress.total_bytes_estimate)s|%(progress.speed)s|%(progress.eta)s|%(info.playlist_index)s|%(info.n_entries)s'
const ENV = {...process.env, PYTHONIOENCODING: 'utf-8', PYTHONUTF8: '1'} // non-latin titles
const RATES = ['', '500K', '1M', '2M', '5M', '10M']
const SUBLANG = {en: 'en.*', ur: 'ur.*', hi: 'hi.*', ar: 'ar.*', all: 'all,-live_chat'}
const TIME = /^\d{1,2}(:\d{2}){1,2}$/
const SITE_HOSTS = '(youtube\\.com|youtu\\.be|x\\.com|twitter\\.com|instagram\\.com|tiktok\\.com|facebook\\.com|fb\\.watch|vimeo\\.com|reddit\\.com|redd\\.it|pinterest\\.[a-z.]+|pin\\.it|threads\\.(net|com)|twitch\\.tv|soundcloud\\.com|dailymotion\\.com|imgur\\.com|tumblr\\.com|flickr\\.com|bilibili\\.com)'
const MEDIA_RE = new RegExp(`^https?://([a-z0-9-]+\\.)*${SITE_HOSTS}(/|$)`, 'i')
const CLIP_RE = new RegExp(`^https?://([a-z0-9-]+\\.)*${SITE_HOSTS}/\\S*$`, 'i')
// plain files: folder + kind + category by extension
const FTYPES = [
  ['Videos', 'video', 'video', /\.(mp4|mkv|webm|avi|mov|m4v|wmv|flv|ts)$/i], ['Music', 'audio', 'audio', /\.(mp3|m4a|wav|flac|ogg|opus|aac|wma)$/i],
  ['Pictures', 'image', 'image', /\.(jpe?g|png|gif|webp|bmp|svg|heic|tiff?)$/i], ['Compressed', 'file', 'zip', /\.(zip|rar|7z|gz|tgz|bz2|xz|tar|iso|img)$/i],
  ['Programs', 'file', 'prog', /\.(exe|msi|msix|apk|xapk|dmg|pkg|deb|rpm|appimage)$/i], ['Documents', 'file', 'doc', /\.(pdf|docx?|xlsx?|pptx?|txt|csv|epub|odt|ods|rtf)$/i],
]
const ftype = name => FTYPES.find(t => t[3].test(name || '')) || ['Other', 'file', 'other']
const FILE_EXT = /\.(mp4|mkv|webm|avi|mov|m4v|wmv|flv|mp3|m4a|wav|flac|ogg|opus|aac|zip|rar|7z|gz|tgz|bz2|xz|tar|iso|img|exe|msi|msix|apk|xapk|dmg|pkg|deb|rpm|appimage|pdf|docx?|xlsx?|pptx?|txt|csv|epub|jpe?g|png|gif|webp|bin)$/i
const FOLDERS = {video: 'Videos', audio: 'Music', image: 'Pictures'}
// download categories: name -> default sub-folder (classic download manager style)
const CATS = {Video: 'Videos', Music: 'Music', Pictures: 'Pictures', Documents: 'Documents', Compressed: 'Compressed', Programs: 'Programs', Other: 'Other'}
const catOf = (kind, fcat) => ({video: 'Video', audio: 'Music', image: 'Pictures'})[kind] || ({doc: 'Documents', zip: 'Compressed', prog: 'Programs'})[fcat] || 'Other'
const catDir = (c, cat) => c.catDirs?.[cat] || (c.sort ? path.join(c.outDir, CATS[cat] || 'Other') : c.outDir)
const okDir = d => typeof d === 'string' && d.length < 240 && path.isAbsolute(d) && !/[<>"|?*]/.test(d.slice(2))
const PORT = 47321

let win, tray, quitting = false, qRun = false
let queue = []
const jobs = new Map()   // qid -> {child, ctrl, mode}
const probes = new Map() // url|playlist -> {at, data}
const hdrs = new Map()   // url / qid -> browser headers for that file (memory only)

// json store in userData
const jf = n => path.join(app.getPath('userData'), n + '.json')
const jread = (n, d) => { try { return JSON.parse(fs.readFileSync(jf(n), 'utf8')) } catch { return d } }
const jwrite = (n, v) => { try { fs.writeFileSync(jf(n), JSON.stringify(v, null, 1)) } catch {} }
// first run: the Windows language when the app has it
const sysLang = () => { try { const l = app.getLocale().slice(0, 2).toLowerCase(); return I18N.ok(l) ? l : 'en' } catch { return 'en' } }
const cfg = () => ({outDir: app.getPath('downloads'), theme: 'light', lang: sysLang(), rate: '', sort: true, clip: true, tray: true, notify: true, sched: {on: false, time: '02:00'}, maxAt: 2, conns: 16, progressWin: true, catDirs: {}, ...jread('settings', {})})
const send = (ch, v) => win && !win.isDestroyed() && win.webContents.send(ch, v)
const show = () => { if (!win) return; win.isMinimized() && win.restore(); win.show(); win.focus() }

function run(cmd, args, opt = {}) {
  return new Promise(res => {
    let out = '', err = '', ch
    try { ch = spawn(cmd, args, {windowsHide: true, env: ENV, ...opt}) } catch (e) { return res({code: -1, out, err: e.message}) }
    ch.stdout.setEncoding('utf8'); ch.stderr.setEncoding('utf8')
    ch.stdout.on('data', c => (out += c)); ch.stderr.on('data', c => (err += c))
    ch.on('error', e => res({code: -1, out, err: e.message}))
    ch.on('close', code => res({code, out, err}))
  })
}

// github download with throttled progress
async function fetchTo(url, dest, label) {
  const r = await fetch(url, {redirect: 'follow'})
  if (!r.ok || !r.body) throw new Error(`${label} download failed (${r.status}). Check the internet and try again.`)
  const total = +r.headers.get('content-length') || 0
  let got = 0, t = 0
  const src = Readable.fromWeb(r.body)
  src.on('data', c => { got += c.length; if (Date.now() - t > 150) { t = Date.now(); send('engine:progress', {label, got, total}) } })
  await pipeline(src, fs.createWriteStream(dest))
}

async function engineInfo() {
  const [y, d, g, a] = await Promise.all([YTDLP(), DENO(), GDL(), ARIA()].map(b => run(b, ['--version'], {timeout: 30000})))
  let age = null
  try { age = Math.floor((Date.now() - (await fsp.stat(YTDLP())).mtimeMs) / 864e5) } catch {}
  return {ytdlp: y.code === 0 ? y.out.trim() : null, deno: d.code === 0 ? (d.out.match(/deno\s+(\S+)/)?.[1] ?? 'yes') : null, gdl: g.code === 0 ? g.out.trim() : null,
    aria: a.code === 0 ? (a.out.match(/version\s+(\S+)/)?.[1] ?? 'yes') : null, age, ffmpeg: !!ffmpegPath()}
}

async function freshYtdlp() {
  const tmp = YTDLP() + '.download'
  await fetchTo(SRC.ytdlp, tmp, 'Download engine')
  if (!WIN) await fsp.chmod(tmp, 0o755)
  await fsp.rename(tmp, YTDLP())
}
const gdlOk = async () => (await run(GDL(), ['--version'], {timeout: 30000})).code === 0
async function getGdl() {
  await fsp.mkdir(BIN(), {recursive: true})
  const tmp = GDL() + '.download'
  let err
  for (const u of SRC.gdl) { try { await fetchTo(u, tmp, 'Image helper'); err = null; break } catch (e) { err = e } }
  if (err) throw err
  if (!WIN) await fsp.chmod(tmp, 0o755)
  await fsp.rename(tmp, GDL())
}
// aria2 = multi-connection engine for plain files
const ariaOk = async () => (await run(ARIA(), ['--version'], {timeout: 30000})).code === 0
async function getAria() {
  if (!WIN) return
  await fsp.mkdir(BIN(), {recursive: true})
  const zip = path.join(BIN(), 'aria2.zip'), tmp = path.join(BIN(), 'aria2-tmp')
  try {
    await fetchTo(SRC.aria, zip, 'File engine')
    await fsp.rm(tmp, {recursive: true, force: true}); await fsp.mkdir(tmp)
    const r = await run('tar', ['-xf', zip, '-C', tmp])
    if (r.code !== 0) throw new Error(r.err.trim())
    const exe = (await fsp.readdir(tmp, {recursive: true})).find(f => /aria2c\.exe$/i.test(f))
    if (!exe) throw new Error('aria2c.exe not found in the download')
    await fsp.rename(path.join(tmp, exe), ARIA())
  } finally { await fsp.rm(zip, {force: true}); await fsp.rm(tmp, {recursive: true, force: true}) }
}

// update = yt-dlp -U (small), full download only when missing or -U fails
async function installEngine(update) {
  await fsp.mkdir(BIN(), {recursive: true})
  const has = (await run(YTDLP(), ['--version'])).code === 0
  if (!has) await freshYtdlp()
  else if (update) {
    const r = await run(YTDLP(), ['-U'], {timeout: 180000})
    if (r.code !== 0) await freshYtdlp()
    else await fsp.utimes(YTDLP(), new Date(), new Date()) // age counts from last check
  }
  // gallery-dl = pictures (pinterest, x, reddit...); optional, refreshed on update
  if (update || !(await gdlOk())) await getGdl().catch(e => send('engine:warn', 'Image helper could not be installed: ' + e.message))
  if (!(await ariaOk())) await getAria().catch(e => send('engine:warn', 'File engine could not be installed: ' + e.message))
  // deno = js runtime yt-dlp needs for youtube; optional, other sites work without it
  if ((await run(DENO(), ['--version'])).code !== 0) {
    const zip = path.join(BIN(), 'deno.zip')
    try {
      await fetchTo(SRC.deno, zip, 'YouTube helper')
      const r = WIN ? await run('tar', ['-xf', zip, '-C', BIN()]) : await run('unzip', ['-o', zip, '-d', BIN()])
      if (r.code !== 0) throw new Error(r.err.trim())
      if (!WIN) await fsp.chmod(DENO(), 0o755)
    } catch (e) { send('engine:warn', 'YouTube helper could not be installed: ' + e.message) }
    finally { await fsp.rm(zip, {force: true}) }
  }
  return engineInfo()
}

// the installer ships the engines; first run copies them where updates can replace them
const ENGINES = WIN ? ['yt-dlp.exe', 'gallery-dl.exe', 'aria2c.exe', 'deno.exe'] : []
async function seedEngines() {
  if (!app.isPackaged) return
  const src = path.join(process.resourcesPath, 'engines')
  await fsp.mkdir(BIN(), {recursive: true}).catch(() => {})
  for (const f of ENGINES) {
    const to = path.join(BIN(), f), from = path.join(src, f)
    if (!fs.existsSync(to) && fs.existsSync(from)) await fsp.copyFile(from, to).catch(() => {})
  }
}
// anything still missing comes down quietly in the background
async function fillEngines() {
  let e = await engineInfo()
  if (e.ytdlp && (!e.gdl || !e.aria || !e.deno)) e = await installEngine(false).catch(() => e)
  send('engine:ready', e)
}

// ffmpeg-static sits in app.asar.unpacked once packed
function ffmpegPath() {
  try {
    const p = String(require('ffmpeg-static') || '').replace('app.asar' + path.sep, 'app.asar.unpacked' + path.sep)
    return p && fs.existsSync(p) ? p : null
  } catch { return null }
}

function baseArgs() {
  const a = ['--ignore-config', '--no-warnings']
  if (fs.existsSync(DENO())) a.push('--js-runtimes', 'deno:' + DENO())
  const ff = ffmpegPath(); ff && a.push('--ffmpeg-location', ff)
  return a
}

const okUrl = u => { try { const x = new URL(String(u).trim()); return /^https?:$/.test(x.protocol) ? x.href : null } catch { return null } }

function cleanErr(s) {
  const e = String(s).split('\n').map(l => l.trim()).filter(l => l.startsWith('ERROR:')).at(-1)?.replace(/^ERROR:\s*(\[[^\]]+\]\s*)?/, '') || ''
  if (/not a bot|confirm you.re not/i.test(e)) return 'YouTube is asking this connection to prove it is not a bot. Turn off any VPN, wait a few minutes, and try again.'
  if (/sign in|login required|private|use --cookies|age/i.test(e)) return 'This video is private or age-restricted. Only public videos can be downloaded.'
  if (NOVID.test(e)) return 'No public video or picture was found in this post. It may be private or need a login.'
  if (/HTTP Error 403|nsig|signature/i.test(e)) return 'The site refused the download. Click Update and try again.'
  if (/getaddrinfo|timed out|connection (reset|refused)|network is unreachable|unable to download webpage/i.test(e)) return 'The internet connection dropped. Check it and click Resume.'
  return e.replace(/;?\s*please report this issue.*$/is, '').trim()
}

// formats offered for every video and playlist
const AUDIO = [
  {kind: 'audio', label: 'MP3 320', args: ['-f', 'ba/b', '-x', '--audio-format', 'mp3', '--audio-quality', '320K']},
  {kind: 'audio', label: 'MP3 128', args: ['-f', 'ba/b', '-x', '--audio-format', 'mp3', '--audio-quality', '128K']},
  {kind: 'audio', label: 'M4A', args: ['-f', 'ba[ext=m4a]/ba/b', '-x', '--audio-format', 'm4a']},
  {kind: 'audio', label: 'WAV', args: ['-f', 'ba/b', '-x', '--audio-format', 'wav']},
]
// single video: up to 8 heights + audio
function buildChoices(info) {
  const f = info.formats ?? []
  const vid = x => x.vcodec && x.vcodec !== 'none'
  const aud = x => x.acodec && x.acodec !== 'none'
  // size: real, else the site's estimate, else bitrate x length (youtube often sends no size)
  const sz = x => x ? x.filesize ?? x.filesize_approx ?? ((x.tbr || x.vbr || x.abr) && info.duration ? Math.round((x.tbr || x.vbr || x.abr) * 125 * info.duration) : 0) : 0
  const bestA = f.filter(x => aud(x) && !vid(x)).sort((a, b) => (b.abr ?? b.tbr ?? 0) - (a.abr ?? a.tbr ?? 0))[0]
  const aSize = sz(bestA)
  const score = x => (x.tbr ?? 0) + (x.ext === 'mp4' ? 1e4 : 0) + (x.vcodec?.startsWith('avc') ? 5e3 : 0)
  const vids = f.filter(x => vid(x) && x.height)
  const out = [...new Set(vids.map(x => x.height))].sort((a, b) => b - a).slice(0, 8).map(h => {
    const b = vids.filter(x => x.height === h).sort((p, q) => score(q) - score(p))[0]
    const v = sz(b)
    return {kind: 'video', label: `${h}p`, h, size: v ? v + (aud(b) ? 0 : aSize) : 0,
      args: ['-f', `bv*[height=${h}]+ba/b[height=${h}]/bv*[height<=${h}]+ba/b`]}
  })
  if (!out.length) out.push({kind: 'video', label: 'Best', h: 99999, size: 0, args: ['-f', 'bv*+ba/b']})
  // audio sizes by the bitrate each one is made at
  const secs = info.duration || 0, ab = {'MP3 320': 320, 'MP3 128': 128, WAV: 1411}
  return [...out, ...AUDIO.map(a => ({...a, size: ab[a.label] && secs ? Math.round(ab[a.label] * 125 * secs) : aSize}))]
}
// playlist: fixed caps, each video takes the nearest
const listChoices = () => [
  {kind: 'video', label: 'Best', h: 99999, size: 0, args: ['-f', 'bv*+ba/b']},
  ...[1080, 720, 480, 360].map(h => ({kind: 'video', label: `${h}p`, h, size: 0, args: ['-f', `bv*[height<=${h}]+ba/b[height<=${h}]/b`]})),
  ...AUDIO.map(a => ({...a, size: 0})),
]

const num = v => { const n = parseFloat(v); return Number.isFinite(n) ? n : undefined }

// history; old rows get id + files on read
const hist = () => jread('history', []).map(h => ({...h, id: h.id ?? h.at, files: h.files ?? (h.file ? [h.file] : [])}))
const addHist = r => jwrite('history', [r, ...hist()].slice(0, HIST_MAX))
const byId = id => hist().find(h => h.id === id)
async function sizeOf(files) {
  let size = 0, n = 0
  for (const f of files) { try { size += (await fsp.stat(f)).size; n++ } catch {} }
  return {size, n}
}
const rid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
const safe = n => String(n || '').replace(/[<>:"/\\|?*\x00-\x1f]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 120).replace(/[. ]+$/, '') || 'Download'
const outFor = (c, kind) => c.sort ? path.join(c.outDir, FOLDERS[kind] || 'Videos') : c.outDir

// plain file: HEAD (or a 1-byte GET) for name, size, type and resume support
const cleanHdrs = h => Object.fromEntries(Object.entries(h || {}).filter(([k, v]) => ['Cookie', 'Referer', 'User-Agent'].includes(k) && typeof v === 'string' && v.length < 8192 && !/[\r\n]/.test(v)))
function nameFrom(r, u) {
  const cd = r.headers.get('content-disposition') || ''
  const star = cd.match(/filename\*\s*=\s*(?:UTF-8'')?([^;]+)/i)?.[1], plain = cd.match(/filename\s*=\s*"?([^";]+)"?/i)?.[1]
  let n = ''
  try { n = star ? decodeURIComponent(star.trim().replace(/^"|"$/g, '')) : plain || decodeURIComponent(new URL(r.url || u).pathname.split('/').pop() || '') } catch { n = plain || '' }
  return safe(n || 'download')
}
async function probeFile(u, h = {}) {
  const head = {...cleanHdrs(h)}
  const ask = async (method, extra) => {
    const ctrl = new AbortController(), t = setTimeout(() => ctrl.abort(), 15000)
    try { return await fetch(u, {method, redirect: 'follow', headers: {...head, ...extra}, signal: ctrl.signal}) } finally { clearTimeout(t) }
  }
  let r = await ask('HEAD').catch(() => null)
  if (!r?.ok || !r.headers.get('content-length')) {
    const g = await ask('GET', {Range: 'bytes=0-0'}).catch(() => null)
    if (g) { g.body?.cancel().catch(() => {}); if (g.ok) r = g }
  }
  if (!r?.ok) return {ok: false, msg: r ? `The server answered ${r.status}.` : 'The server did not answer.'}
  const type = r.headers.get('content-type') || ''
  const total = +(r.headers.get('content-range')?.split('/')[1] || 0) || (r.status === 206 ? 0 : +r.headers.get('content-length') || 0)
  const name = nameFrom(r, u), [folder, kind, fcat] = ftype(name)
  return {ok: true, file: true, html: /text\/html/i.test(type) && !FILE_EXT.test(name), url: u, final: r.url, title: name, name, size: total, type,
    resumable: r.status === 206 || /bytes/i.test(r.headers.get('accept-ranges') || ''), site: new URL(r.url || u).hostname.replace(/^www\./, ''), folder, kind, fcat, count: 1, thumb: '', duration: 0,
    choices: [{kind, label: (name.match(/\.(\w+)$/)?.[1] || 'File').toUpperCase(), size: total, args: []}]}
}

// read a link once; cached 20 min so queue + file info share it
async function probeUrl(u, playlist) {
  const key = u + '|' + !!playlist, hit = probes.get(key)
  if (hit && Date.now() - hit.at < 20 * 60e3) return hit.data
  let data = null
  // not a known video site: a plain file goes to the file engine, a web page to yt-dlp
  if (!MEDIA_RE.test(u)) {
    const f = await probeFile(u, hdrs.get(u)).catch(() => null)
    if (f?.ok && !f.html) data = f
  }
  if (!data) {
    const r = await run(YTDLP(), [...baseArgs(), '-J', ...(playlist ? ['--yes-playlist', '--flat-playlist'] : ['--no-playlist']), '--', u], {timeout: 180000})
    if (r.code !== 0) {
      // no video in the post: try it as pictures
      const g = NOVID.test(r.err) ? await probeImages(u) : null
      data = !g ? {ok: false, msg: cleanErr(r.err) || 'Could not read this link.'}
        : {ok: true, url: u, images: true, playlist: false, mode: g.mode, direct: g.direct, title: (g.title || 'Picture').trim().slice(0, 120), site: g.site, count: g.n, thumb: g.thumb, duration: 0, uploader: '',
          choices: [{kind: 'image', label: g.n > 1 ? `All ${g.n} pictures` : 'Picture', size: 0, args: []}]}
    } else {
      let i
      try { i = JSON.parse(r.out) } catch { return {ok: false, msg: 'Could not read the video details.'} }
      const list = i._type === 'playlist'
      data = {ok: true, url: u, playlist: list, json: list ? null : r.out, title: i.title || u, site: i.extractor_key || '', count: list ? (i.entries?.length ?? i.playlist_count ?? 0) : 1,
        thumb: i.thumbnail || i.thumbnails?.at(-1)?.url || '', duration: i.duration || 0, uploader: i.uploader || i.channel || '', choices: list ? listChoices() : buildChoices(i)}
    }
  }
  data.ok && probes.set(key, {at: Date.now(), data})
  return data
}

// pictures: gallery-dl first, then the post's biggest preview image from yt-dlp
const pick = k => [k?.title, k?.grid_title, k?.description, k?.content, k?.caption, k?.text].find(x => typeof x === 'string' && x.trim())?.split('\n')[0]
async function probeImages(u) {
  let n = 0, first = '', k = null
  if (!(await gdlOk())) await getGdl().catch(() => {}) // older installs get the helper on first need
  if (await gdlOk()) {
    const r = await run(GDL(), ['-j', '--range', '1-500', '--', u], {timeout: 120000})
    try {
      for (const m of JSON.parse(r.out)) {
        if (m[0] === 3) { n++; first ||= m[1]; k ||= m[2] }
        else if (m[0] === 2) k ||= m[1]
      }
    } catch {}
    if (n) return {mode: 'gdl', n, thumb: /\.(jpe?g|png|webp|gif)(\?|$)/i.test(first) ? first : '', title: pick(k), site: k?.category || ''}
  }
  const r = await run(YTDLP(), [...baseArgs(), '-J', '--ignore-no-formats-error', '--no-playlist', '--', u], {timeout: 120000})
  try {
    const i = JSON.parse(r.out)
    const t = [...(i.thumbnails || [])].sort((a, b) => (a.width || 0) * (a.height || 0) - (b.width || 0) * (b.height || 0) || (a.preference || 0) - (b.preference || 0)).at(-1)?.url || i.thumbnail
    if (t) return {mode: 'direct', n: 1, direct: [t], thumb: t, title: i.title || i.description, site: i.extractor_key || ''}
  } catch {}
  return null
}
const pub = p => ({ok: true, info: {url: p.url, title: p.title, uploader: p.uploader || '', duration: p.duration, site: p.site, thumb: p.thumb, count: p.count, playlist: !!p.playlist, images: !!p.images,
  file: !!p.file, name: p.name, size: p.size, type: p.type, resumable: p.resumable, fcat: p.fcat},
  choices: p.choices.map(({kind, label, size}) => ({kind, label, size}))})

// queue item asks for a label; take it, or the nearest the link has
function pickChoice(p, it) {
  const c = p.choices
  if (p.images || p.file) return c[0]
  const exact = c.find(x => x.label === it.label)
  if (exact) return exact
  if (it.kind === 'audio') return c.find(x => x.kind === 'audio')
  const want = +String(it.label).replace(/\D/g, '') || 99999, vids = c.filter(x => x.kind === 'video')
  return vids.find(x => x.h <= want) || vids.at(-1)
}

// speed shown = 3 s moving average, at most 4 updates a second (steady numbers like a classic download manager)
const smooth = new Map()
function relay(it, ch, v) {
  if (ch === 'dl:progress') {
    // speed is measured here from bytes received (yt-dlp often reports none while fragments / chunks run)
    const s = smooth.get(it.qid) || {sp: 0, got: 0, lt: 0, sent: 0, key: ''}, now = Date.now(), key = `${v.item}|${v.part}`
    if (key !== s.key) { s.key = key; s.got = v.got; s.lt = now } // next part / playlist video: count from here
    const dt = (now - s.lt) / 1000
    if (dt >= 0.5) {
      const inst = Math.max(0, (v.got - s.got) / dt)
      s.sp = s.sp ? s.sp + (1 - Math.exp(-dt / 3)) * (inst - s.sp) : inst
      s.got = v.got; s.lt = now
    }
    smooth.set(it.qid, s)
    if (now - s.sent < 250 && !(v.total && v.got >= v.total)) return
    s.sent = now
    const sp = s.sp || v.speed || 0
    v = {...v, speed: sp, eta: v.total && sp ? Math.max(0, (v.total - v.got) / sp) : null}
  }
  send(ch, {qid: it.qid, ...v}); pwSend(it.qid, ch, {qid: it.qid, ...v})
}

// download window (one per download, like a classic download manager): progress, speed, time left, then complete
const pwins = new Map()
const pwSend = (qid, ch, v) => { const w = pwins.get(qid); w && !w.isDestroyed() && w.webContents.send(ch, v) }
const pwInfo = it => ({qid: it.qid, title: it.title, url: it.url, size: it.size || 0, kind: it.kind, fcat: it.fcat, status: it.status, err: it.err, resumable: probes.get(it.url + '|' + !!it.playlist)?.data?.resumable})
function openPw(it) {
  const old = pwins.get(it.qid)
  if (old && !old.isDestroyed()) { old.show(); old.focus(); return }
  const w = new BrowserWindow({width: 540, height: 292, minWidth: 460, minHeight: 280, title: it.title, icon: ICON, autoHideMenuBar: true, maximizable: false, fullscreenable: false,
    backgroundColor: cfg().theme === 'dark' ? '#1e1e1e' : '#ffffff', webPreferences: {preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: true}})
  w.removeMenu()
  w.webContents.setWindowOpenHandler(() => ({action: 'deny'}))
  w.webContents.on('will-navigate', e => e.preventDefault())
  w.webContents.on('did-finish-load', () => w.webContents.send('pw:init', pwInfo(it)))
  w.on('closed', () => pwins.delete(it.qid))
  pwins.set(it.qid, w)
  w.loadFile(path.join(__dirname, 'ui', 'progress.html'))
}
const killTree = child => WIN ? spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'], {windowsHide: true}) : child.kill('SIGTERM')

function download(p, choice, it) {
  const c = cfg(), o = it.opts || {}
  return new Promise(async resolve => {
    const dir = o.dir || outFor(c, choice.kind)
    await fsp.mkdir(dir, {recursive: true})
    let infoFile = null
    if (p.json) { infoFile = path.join(app.getPath('temp'), `rsdl-${process.pid}-${rid()}.json`); await fsp.writeFile(infoFile, p.json) }
    const trim = !p.playlist && (o.from || o.to)
    // a name typed in Download File Info keeps yt-dlp's real extension; two downloads never share a name
    let base = '%(title).90s'
    if (o.name && !p.playlist) {
      if (!it.base) {
        const b0 = o.name.replace(/\.(mp4|mkv|webm|mp3|m4a|wav|opus|ogg)$/i, ''), here = (() => { try { return fs.readdirSync(dir) } catch { return [] } })()
        const taken = b => here.some(f => f.toLowerCase().startsWith(b.toLowerCase() + '.')) || queue.some(x => x !== it && x.status === 'running' && x.base === b && x.opts?.dir === o.dir)
        let b = b0
        for (let n = 2; taken(b); n++) b = `${b0} (${n})`
        it.base = b; saveQ()
      }
      base = it.base.replace(/%/g, '%%')
    }
    const name = `${base}${trim ? ` [${(o.from || '0').replace(/:/g, '.')}-${(o.to || 'end').replace(/:/g, '.')}]` : ''}.%(ext)s`
    const outTpl = p.playlist ? `%(playlist_title,playlist_id)s/%(playlist_index)03d - %(title).70s.%(ext)s` : name
    const video = choice.kind === 'video'
    const args = [...baseArgs(), ...(infoFile ? ['--load-info-json', infoFile, '--no-playlist'] : ['--yes-playlist', '--ignore-errors']), ...choice.args,
      ...(video ? ['--merge-output-format', o.container === 'mkv' ? 'mkv' : 'mp4', '--embed-chapters'] : []),
      '--embed-metadata', ...(choice.label === 'WAV' ? [] : ['--embed-thumbnail']),
      '-N', '8', '--http-chunk-size', '10M', '--retries', '10', '--fragment-retries', '10', '--file-access-retries', '5',
      ...(c.rate ? ['-r', c.rate] : []),
      ...(video && o.subs ? ['--write-subs', '--write-auto-subs', '--sub-langs', SUBLANG[o.subLang] || 'en.*', '--convert-subs', 'srt'] : []),
      ...(trim ? ['--download-sections', `*${o.from || '0'}-${o.to || 'inf'}`, '--force-keyframes-at-cuts'] : []),
      '--newline', '--no-quiet', '--progress', '--progress-template', 'download:' + TPL, '--print', 'after_move:filepath',
      '--no-simulate', '--no-mtime', '-P', dir, '-o', outTpl, ...(infoFile ? [] : ['--', p.url])]

    const child = spawn(YTDLP(), args, {windowsHide: true, env: ENV})
    const job = {child, mode: ''}
    jobs.set(it.qid, job)
    const files = [], subs = [], dests = []
    let err = '', buf = '', part = 0, parts = 1, lastGot = 0, item = 0
    child.stdout.setEncoding('utf8'); child.stderr.setEncoding('utf8')
    child.stderr.on('data', s => (err += s))
    child.stdout.on('data', s => {
      buf += s
      const lines = buf.split('\n'); buf = lines.pop() ?? ''
      for (const raw of lines) {
        const l = raw.trim()
        if (!l) continue
        if (l.startsWith('RSDL|')) {
          const [got, tot, est, spd, eta, idx, n] = l.slice(5).split('|')
          const i = num(idx) ?? 0
          if (i !== item) { item = i; part = 0; lastGot = 0 }
          const g = num(got) ?? 0
          if (g < lastGot) part++
          lastGot = g
          relay(it, 'dl:progress', {got: g, total: num(tot) ?? num(est), speed: num(spd), eta: num(eta), part, parts, item: i, items: num(n) ?? p.count})
        } else if (l.includes('Downloading 1 format(s):')) parts = (l.split('format(s):')[1] ?? '').trim().split('+').length
        else if (/^\[(Merger|ExtractAudio|VideoConvertor|FixupM3u8|EmbedThumbnail|Metadata)\]/.test(l)) {
          const t = /Merging formats into "(.+)"$/.exec(l)?.[1] ?? /Destination: (.+)$/.exec(l)?.[1]
          t && dests.push(t)
          relay(it, 'dl:stage', {})
        } else if (l.startsWith('[download] Destination: ')) dests.push(l.slice(24))
        else if (/^\[info\] Writing video thumbnail .* to: /.test(l)) dests.push(l.replace(/^\[info\] Writing video thumbnail .* to: /, ''))
        else if (/^\[info\] Writing video subtitles to: /.test(l)) subs.push(l.replace(/^\[info\] Writing video subtitles to: /, '').replace(/\.vtt$/i, '.srt'))
        else if (path.isAbsolute(l)) files.push(l)
      }
    })
    child.on('error', e => (err += 'ERROR: ' + e.message))
    child.on('close', async code => {
      jobs.delete(it.qid)
      infoFile && fsp.rm(infoFile, {force: true}).catch(() => {})
      if (job.mode === 'pause') return resolve({paused: true, dests})
      if (job.mode === 'cancel') { await rmParts(dests, files); return resolve({cancelled: true}) }
      if (!files.length) return resolve({ok: false, msg: cleanErr(err) || `Download failed (engine exit code ${code}).`, dests})
      const all = [...files, ...subs.filter(f => fs.existsSync(f))]
      resolve({ok: true, rec: record(p, choice, it, all, files, path.dirname(files[0])), warn: code !== 0 ? (cleanErr(err) || 'Some videos in the list were skipped.') : ''})
    })
  })
}
const rmParts = (dests, keep = []) => {
  const k = new Set(keep)
  return Promise.allSettled(dests.filter(d => !k.has(d)).flatMap(d => [d, d + '.part', d + '.ytdl', d + '.aria2'])
    .map(f => fsp.rm(f, {force: true, maxRetries: 5, retryDelay: 300})))
}
const record = (p, choice, it, all, main, folder) => ({id: rid(), cat: it.opts?.cat || catOf(choice.kind, p.fcat), desc: it.opts?.desc || '', title: p.title, site: p.site, thumb: p.thumb, duration: p.duration, label: choice.label, kind: choice.kind, fcat: p.fcat || '',
  url: p.url, at: new Date().toISOString(), count: main.length, files: all, file: main.length === 1 ? main[0] : null, folder})

async function uniq(f) {
  const {dir, name, ext} = path.parse(f)
  for (let i = 2; fs.existsSync(f); i++) f = path.join(dir, `${name} (${i})${ext}`)
  return f
}
async function downloadImages(p, choice, it) {
  const c = cfg(), base = it.opts?.dir || outFor(c, 'image'), dir = p.count > 1 ? path.join(base, safe(it.opts?.name || p.title).slice(0, 80)) : base
  await fsp.mkdir(dir, {recursive: true})
  const files = [], ctrl = new AbortController(), job = {child: null, ctrl, mode: ''}
  const tick = () => relay(it, 'dl:count', {done: files.length, total: p.count})
  let err = '', code = 0
  jobs.set(it.qid, job)
  if (p.mode === 'direct') {
    for (const [i, u] of p.direct.entries()) {
      if (ctrl.signal.aborted) break
      try {
        const r = await fetch(u, {signal: ctrl.signal})
        if (!r.ok || !r.body) throw new Error(`HTTP ${r.status}`)
        const ext = (r.headers.get('content-type')?.match(/image\/(jpe?g|png|webp|gif)/)?.[1] || new URL(u).pathname.match(/\.(jpe?g|png|webp|gif)$/i)?.[1] || 'jpg').replace('jpeg', 'jpg')
        const f = await uniq(path.join(dir, `${safe(p.title).slice(0, 80)}${p.direct.length > 1 ? ' ' + (i + 1) : ''}.${ext}`))
        await pipeline(Readable.fromWeb(r.body), fs.createWriteStream(f), {signal: ctrl.signal})
        files.push(f); tick()
      } catch (e) { err = 'ERROR: ' + e.message }
    }
  } else {
    await new Promise(res => {
      const child = spawn(GDL(), ['-D', dir, '--range', '1-500', ...(c.rate ? ['--limit-rate', c.rate] : []), '--retries', '5', '--', p.url], {windowsHide: true, env: ENV})
      job.child = child
      let buf = ''
      child.stdout.setEncoding('utf8'); child.stderr.setEncoding('utf8')
      child.stderr.on('data', s => (err += s))
      child.stdout.on('data', s => {
        buf += s
        const lines = buf.split('\n'); buf = lines.pop() ?? ''
        for (const l of lines.map(x => x.trim().replace(/^# /, ''))) if (path.isAbsolute(l)) { files.push(l); tick() }
      })
      child.on('error', e => (err += 'ERROR: ' + e.message))
      child.on('close', c2 => { code = c2; res() })
    })
  }
  jobs.delete(it.qid)
  if (job.mode === 'pause') return {paused: true, dests: []}
  if (job.mode === 'cancel') { await Promise.allSettled(files.map(f => fsp.rm(f, {force: true}))); return {cancelled: true} }
  if (!files.length) return {ok: false, msg: (String(err).split('\n').filter(l => /error/i.test(l)).at(-1) || '').replace(/^\[[^\]]*\]\[error\]\s*|^ERROR:\s*/i, '') || 'No picture could be saved from this post.'}
  return {ok: true, rec: record(p, choice, it, files, files, dir), warn: code !== 0 ? 'Some pictures were skipped.' : ''}
}

// plain file through aria2: many connections, .aria2 control file keeps the resume point
const UNIT = {B: 1, KiB: 1024, MiB: 1048576, GiB: 1073741824}
const bytes = (n, u) => Math.round(parseFloat(n) * (UNIT[u] || 1))
const secs = s => (s || '').match(/(\d+)([hms])/g)?.reduce((t, x) => t + parseInt(x) * {h: 3600, m: 60, s: 1}[x.slice(-1)], 0)
async function downloadFile(p, choice, it) {
  if (!(await ariaOk())) await getAria().catch(() => {})
  if (!(await ariaOk())) return {ok: false, msg: 'The file engine (aria2) could not be installed. Check the internet and click Update.'}
  const c = cfg(), dir = it.opts?.dir || (c.sort ? path.join(c.outDir, p.folder) : c.outDir)
  await fsp.mkdir(dir, {recursive: true})
  // keep the resume target on a re-run; a fresh download never overwrites another file
  let name = safe(it.opts?.name || p.name)
  if (!it.dest) { const f = await uniq(path.join(dir, name)); name = path.basename(f); it.dest = f; saveQ() }
  else name = path.basename(it.dest)
  const dest = it.dest, h = cleanHdrs(hdrs.get(it.qid) || hdrs.get(p.url))
  const n = String(Math.min(16, Math.max(1, +c.conns || 16)))
  const args = ['-x', n, '-s', n, '-k', '1M', '-c', '--file-allocation=none', '--auto-file-renaming=false', '--allow-overwrite=true', '--summary-interval=1',
    '--console-log-level=error', '--download-result=hide', '--max-tries=10', '--retry-wait=3', '--check-certificate=true',
    ...(c.rate ? ['--max-overall-download-limit=' + c.rate] : []), ...Object.entries(h).map(([k, v]) => `--header=${k}: ${v}`),
    '-d', path.dirname(dest), '-o', name, p.url]
  return new Promise(resolve => {
    const child = spawn(ARIA(), args, {windowsHide: true})
    const job = {child, mode: ''}
    jobs.set(it.qid, job)
    let err = ''
    const read = s => {
      const m = [...String(s).matchAll(/\[#\w+ ([\d.]+)(\w+)\/([\d.]+)(\w+)\((\d+)%\)(?: CN:(\d+))?(?: DL:([\d.]+)(\w+))?(?: ETA:(\w+))?\]/g)].at(-1)
      if (m) relay(it, 'dl:progress', {got: bytes(m[1], m[2]), total: bytes(m[3], m[4]) || p.size, speed: m[7] ? bytes(m[7], m[8]) : 0, eta: secs(m[9]), part: 0, parts: 1, item: 0, items: 1, conns: +m[6] || 0})
      if (/errorCode|Exception|\[ERROR\]/i.test(s)) err += s
    }
    child.stdout.setEncoding('utf8'); child.stderr.setEncoding('utf8')
    child.stdout.on('data', read); child.stderr.on('data', s => (err += s))
    child.on('error', e => (err += e.message))
    child.on('close', async code => {
      jobs.delete(it.qid)
      if (job.mode === 'pause') return resolve({paused: true, dests: [dest]})
      if (job.mode === 'cancel') { await rmParts([dest]); return resolve({cancelled: true}) }
      if (code !== 0 || !fs.existsSync(dest) || fs.existsSync(dest + '.aria2')) {
        const e = String(err)
        return resolve({ok: false, dests: [dest], msg: /403|forbidden/i.test(e) ? 'The server refused (403). The link may have expired: open it again in the browser.'
          : /404|not found/i.test(e) ? 'The file is not on the server any more (404).' : /resolve|timeout|network|connection/i.test(e) ? 'The internet connection dropped. Check it and click Resume.'
          : (e.match(/errorMessage=(.+)/)?.[1] || e.split('\n').find(l => l.trim()) || `Download failed (code ${code}).`).trim()})
      }
      resolve({ok: true, rec: record({...p, title: name}, choice, it, [dest], [dest], path.dirname(dest)), warn: ''})
    })
  })
}

function killJob(qid, mode = 'cancel') {
  const job = jobs.get(qid)
  if (!job) return
  job.mode = mode
  if (job.ctrl && !job.child) return job.ctrl.abort()
  job.ctrl?.abort()
  job.child && killTree(job.child) // onefile exe spawns a child, kill the whole tree
}
const killAll = mode => [...jobs.keys()].forEach(q => killJob(q, mode))

// queue: up to maxAt at a time, kept across restarts
const saveQ = () => jwrite('queue', queue)
const sendQ = () => send('queue:changed', {items: queue, run: qRun})
const cleanOpts = o => ({dir: okDir(o?.dir) ? path.normalize(o.dir) : '', cat: CATS[o?.cat] ? o.cat : '', desc: typeof o?.desc === 'string' ? o.desc.replace(/[\r\n]+/g, ' ').slice(0, 200) : '',
  container: o?.container === 'mkv' ? 'mkv' : 'mp4', subs: !!o?.subs, subLang: SUBLANG[o?.subLang] ? o.subLang : 'en',
  from: TIME.test(o?.from) ? o.from : '', to: TIME.test(o?.to) ? o.to : '', name: typeof o?.name === 'string' ? safe(o.name) : ''})
function addItem(u, a, front) {
  const p = probes.get(u + '|' + !!a.playlist)?.data
  const it = {qid: rid(), url: u, playlist: !!a.playlist, label: String(a.label || 'Best').slice(0, 40), kind: ['video', 'audio', 'image', 'file'].includes(a.kind) ? a.kind : 'video',
    opts: cleanOpts(a.opts), title: a.opts?.name || p?.title || u, site: p?.site || '', thumb: p?.thumb || '', count: p?.count || 1, size: p?.size || 0, fcat: p?.fcat || '',
    status: 'queued', err: '', added: new Date().toISOString(), showDone: !!a.showDone, now: !!a.now}
  hdrs.has(u) && hdrs.set(it.qid, hdrs.get(u))
  // "now" goes first in line, after the ones already running
  const at = queue.findIndex(x => x.status !== 'running')
  front ? queue.splice(at < 0 ? queue.length : at, 0, it) : queue.push(it)
  return it
}
// "now" items run even while the queue is stopped; the queue stops itself once empty
function pump() {
  const max = Math.min(5, Math.max(1, +cfg().maxAt || 2))
  while (queue.filter(x => x.status === 'running').length < max) {
    const it = queue.find(x => x.status === 'queued' && (qRun || x.now))
    if (!it) { if (qRun && !queue.some(x => ['queued', 'running'].includes(x.status))) { qRun = false; sendQ() } return }
    it.status = 'running'; it.err = ''; saveQ(); sendQ()
    runItem(it)
  }
}
async function runItem(it) {
  let res
  try {
    const p = await probeUrl(it.url, it.playlist)
    if (!queue.includes(it) || it.status !== 'running') return // cancelled or paused while reading
    if (!p.ok) res = {ok: false, msg: p.msg}
    else {
      Object.assign(it, {title: it.opts?.name || p.title, site: p.site, thumb: p.thumb, count: p.count || 1, size: p.size || it.size, fcat: p.fcat || ''}); saveQ(); sendQ()
      if (it.now && cfg().progressWin !== false) openPw(it)
      pwSend(it.qid, 'pw:init', {...pwInfo(it), resumable: p.resumable ?? !!(p.json || p.playlist)})
      const ch = pickChoice(p, it)
      res = p.file ? await downloadFile(p, ch, it) : p.images ? await downloadImages(p, ch, it) : await download(p, ch, it)
    }
  } catch (e) { res = {ok: false, msg: e.message} }
  await finish(it, res)
  pump()
}
async function finish(it, res) {
  smooth.delete(it.qid)
  const i = queue.indexOf(it)
  if (i < 0) return
  if (res.ok) {
    const sz = await sizeOf(res.rec.files)
    if (!sz.n) res = {ok: false, msg: 'The download finished, but the file is not in the folder any more. Was it moved or deleted while downloading?'}
    else res.rec.size = sz.size
  }
  if (res.ok) {
    addHist(res.rec)
    queue.splice(i, 1); hdrs.delete(it.qid)
    const pw = pwins.has(it.qid)
    pwSend(it.qid, 'pw:done', {rec: res.rec, warn: res.warn})
    send('dl:done', {qid: it.qid, rec: res.rec, warn: res.warn, showDone: it.showDone && !pw})
    win?.isFocused() || notify(L('Download complete'), res.rec.title, () => { show(); res.rec.file ? shell.showItemInFolder(res.rec.file) : shell.openPath(res.rec.folder) })
  } else if (res.paused) { Object.assign(it, {status: 'paused', dests: res.dests}); pwSend(it.qid, 'pw:state', {status: 'paused'}) }
  else if (res.cancelled) { queue.splice(i, 1); hdrs.delete(it.qid); pwins.get(it.qid)?.close() }
  else {
    Object.assign(it, {status: 'failed', err: res.msg, dests: res.dests || []})
    pwSend(it.qid, 'pw:state', {status: 'failed', err: res.msg})
    send('dl:failed', {qid: it.qid, msg: res.msg, title: it.title})
    win?.isFocused() || notify(L('Download failed'), `${it.title}: ${L(res.msg)}`, show)
  }
  saveQ(); sendQ()
}

function notify(title, body, onClick) {
  if (cfg().notify === false || !Notification.isSupported()) return
  const n = new Notification({title, body: String(body).slice(0, 200), icon: ICON})
  onClick && n.on('click', onClick)
  n.show()
}

// app updates from github releases
let au = null, upd = {state: 'idle', version: '', pct: 0, msg: ''}
const setUpd = o => { upd = {...upd, ...o}; send('app:update', upd) }
function initUpdater() {
  if (!app.isPackaged) return
  ;({autoUpdater: au} = require('electron-updater'))
  au.autoDownload = true
  au.autoInstallOnAppQuit = true
  au.on('checking-for-update', () => upd.state !== 'ready' && setUpd({state: 'checking', msg: ''}))
  au.on('update-available', i => setUpd({state: 'downloading', version: i.version, pct: 0}))
  au.on('update-not-available', () => setUpd({state: 'latest'}))
  au.on('download-progress', p => setUpd({state: 'downloading', pct: Math.round(p.percent)}))
  au.on('update-downloaded', i => setUpd({state: 'ready', version: i.version}))
  au.on('error', e => setUpd({state: 'error', msg: /404|not found|unable to find latest|no published versions/i.test(String(e?.message)) ? 'No update has been published yet.' : 'Could not check for updates. Check the internet.'}))
  const chk = () => ['downloading', 'ready'].includes(upd.state) || au.checkForUpdates().catch(() => {})
  setTimeout(chk, 8000)
  setInterval(chk, 3600e3)
}

// USB drives, SD cards, external disks (drive letters) and phones (MTP) for copy / move
const PS = path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe')
const PS_DEVICES = `[Console]::OutputEncoding = [Text.Encoding]::UTF8
$out = @(); $map = @{}
try { Get-Disk -ErrorAction Stop | ForEach-Object { $d = $_; Get-Partition -DiskNumber $d.Number -ErrorAction SilentlyContinue | Where-Object DriveLetter | ForEach-Object { $map["$($_.DriveLetter):"] = @{ bus = [string]$d.BusType; fn = [string]$d.FriendlyName } } } } catch {}
Get-CimInstance Win32_LogicalDisk | Where-Object { $_.DriveType -eq 2 -or ($map[$_.DeviceID] -and $map[$_.DeviceID].bus -in 'USB','SD','MMC') } | ForEach-Object {
  $m = $map[$_.DeviceID]
  # type for the icon: memory card, external hard disk, else usb
  $t = if ($m -and ($m.bus -in 'SD','MMC' -or $m.fn -match 'SD|MMC|Card|Reader')) { 'card' } elseif ($_.DriveType -eq 3) { 'hdd' } else { 'usb' }
  $out += [pscustomobject]@{ kind='drive'; type=$t; id=$_.DeviceID; name=$(if ($_.VolumeName) { $_.VolumeName } else { 'USB Drive' }); free=[int64]$_.FreeSpace; size=[int64]$_.Size; fs=[string]$_.FileSystem }
}
try {
  $sh = New-Object -ComObject Shell.Application
  foreach ($d in $sh.NameSpace(17).Items()) {
    if ($d.IsFileSystem) { continue }
    $f = $d.GetFolder; if (-not $f) { continue }
    foreach ($s in $f.Items()) { if ($s.IsFolder) { $out += [pscustomobject]@{ kind='phone'; type='phone'; id="$($d.Name)|$($s.Name)"; name="$($d.Name) - $($s.Name)"; free=0; size=0; fs='' } } }
  }
} catch {}
ConvertTo-Json -InputObject @($out) -Compress`
// copies a list of files into a phone folder through the Windows shell, waits until each one is there
const PS_MTP = `param([string]$Phone, [string]$Storage, [string]$Sub, [string]$ListFile)
[Console]::OutputEncoding = [Text.Encoding]::UTF8
$files = @(Get-Content -LiteralPath $ListFile -Encoding UTF8 | Where-Object { $_ })
$sh = New-Object -ComObject Shell.Application
$dev = $sh.NameSpace(17).Items() | Where-Object { $_.Name -eq $Phone } | Select-Object -First 1
if (-not $dev) { 'ERR:The phone is not connected any more.'; exit 2 }
$st = $dev.GetFolder.Items() | Where-Object { $_.Name -eq $Storage } | Select-Object -First 1
if (-not $st) { 'ERR:The phone storage was not found. Unlock the phone and pick File transfer.'; exit 2 }
$dest = $st.GetFolder
if ($Sub) {
  $sf = $dest.Items() | Where-Object { $_.Name -eq $Sub -and $_.IsFolder } | Select-Object -First 1
  if (-not $sf) { $dest.NewFolder($Sub); Start-Sleep -Milliseconds 1500; $sf = $dest.Items() | Where-Object { $_.Name -eq $Sub } | Select-Object -First 1 }
  if ($sf) { $dest = $sf.GetFolder }
}
$i = 0
foreach ($f in $files) {
  $i++; $name = Split-Path $f -Leaf; $bare = [IO.Path]::GetFileNameWithoutExtension($name); $len = (Get-Item -LiteralPath $f).Length
  "START:$($i):$name"
  $dest.CopyHere($f, 16)
  $t = [Diagnostics.Stopwatch]::StartNew(); $limit = [math]::Max(180, $len / 1MB * 3)
  do { Start-Sleep -Milliseconds 800; $it = $dest.Items() | Where-Object { $_.Name -eq $name -or $_.Name -eq $bare } | Select-Object -First 1 } while (-not $it -and $t.Elapsed.TotalSeconds -lt $limit)
  if (-not $it) { "ERR:$name did not reach the phone in time."; exit 3 }
  "DONE:$($i):$name"
}
'OK'`
let devs = [], devBusy = false
async function scanDevices() {
  if (!WIN || devBusy) return devs
  devBusy = true
  try {
    const r = await run(PS, ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-Command', PS_DEVICES], {timeout: 20000})
    let list = []
    try { list = JSON.parse(r.out.trim() || '[]') } catch {}
    list = (Array.isArray(list) ? list : [list]).filter(d => d && d.id)
    if (JSON.stringify(list) !== JSON.stringify(devs)) { devs = list; send('devices', devs) }
  } finally { devBusy = false }
  return devs
}
// phone folders by kind
const PHONE_SUB = {video: 'Movies', audio: 'Music', image: 'Pictures'}
const xfers = new Map() // tid -> {ctrl, child}
async function copyOne(src, dest, onBytes, signal) {
  await fsp.mkdir(path.dirname(dest), {recursive: true})
  const tmp = dest + '.rsdl-part'
  const rs = fs.createReadStream(src, {highWaterMark: 4 << 20})
  rs.on('data', c => onBytes(c.length))
  try { await pipeline(rs, fs.createWriteStream(tmp), {signal}) } catch (e) { await fsp.rm(tmp, {force: true}); throw e }
  if ((await fsp.stat(tmp)).size !== (await fsp.stat(src)).size) { await fsp.rm(tmp, {force: true}); throw new Error('The copy came out a different size. Check the USB and try again.') }
  await fsp.rename(tmp, dest)
}
async function transfer(tid, recs, dev, mode) {
  const ctrl = new AbortController(), job = {ctrl, child: null}
  xfers.set(tid, job)
  const items = recs.flatMap(h => h.files.filter(f => fs.existsSync(f)).map(f => ({h, f, size: fs.statSync(f).size})))
  const total = items.reduce((t, x) => t + x.size, 0)
  let done = 0, t0 = Date.now(), last = 0, moved = 0
  const tick = (file, force) => {
    if (!force && Date.now() - last < 200) return
    last = Date.now()
    const sec = (Date.now() - t0) / 1000, speed = sec > .5 ? done / sec : 0
    send('xfer:progress', {tid, done, total, file, speed, eta: speed ? (total - done) / speed : null, dev: dev.name, mode})
  }
  try {
    if (!items.length) throw new Error('The files are not on this PC any more.')
    if (dev.kind === 'drive') {
      if (dev.free && total > dev.free) throw new Error(`Not enough space on ${dev.id} (${dev.name}): needs ${(total / 1073741824).toFixed(2)} GB, has ${(dev.free / 1073741824).toFixed(2)} GB free.`)
      const big = items.find(x => x.size >= 4294967296)
      if (/^FAT(32)?$/i.test(dev.fs || '') && big) throw new Error(`${dev.id} (${dev.name}) is FAT32, which cannot hold files of 4 GB or more ("${path.basename(big.f)}"). Format the USB as exFAT or NTFS, then try again.`)
      for (const x of items) {
        const sub = x.h.count > 1 ? path.basename(x.h.folder) : ''
        let dest = path.join(dev.id + '\\', sub, path.basename(x.f))
        if (fs.existsSync(dest) && fs.statSync(dest).size === x.size) { done += x.size; tick(x.f, true) }
        else { dest = await uniq(dest); await copyOne(x.f, dest, n => { done += n; tick(x.f) }, ctrl.signal) }
        x.dest = dest
      }
    } else {
      const [phone, storage] = dev.id.split('|')
      const groups = Object.entries(Object.groupBy(items, x => (x.h.kind === 'file' ? 'Download' : PHONE_SUB[x.h.kind] || 'Download') + (x.h.count > 1 ? '\\' + path.basename(x.h.folder) : '')))
      for (const [sub, list] of groups) {
        const listFile = path.join(app.getPath('temp'), `rsdl-mtp-${tid}.txt`), script = path.join(app.getPath('temp'), `rsdl-mtp-${tid}.ps1`)
        await fsp.writeFile(listFile, list.map(x => x.f).join('\r\n'), 'utf8')
        await fsp.writeFile(script, '\ufeff' + PS_MTP, 'utf8')
        const folder = sub.split('\\')[0]
        const err = await new Promise(res => {
          const child = spawn(PS, ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', script, '-Phone', phone, '-Storage', storage, '-Sub', folder, '-ListFile', listFile], {windowsHide: true})
          job.child = child
          let out = '', e = ''
          child.stdout.setEncoding('utf8')
          child.stdout.on('data', s => {
            out += s
            for (const m of s.matchAll(/DONE:(\d+):(.+)/g)) { const x = list[+m[1] - 1]; if (x) { done += x.size; x.dest = `${dev.name}\\${folder}\\${path.basename(x.f)}`; tick(x.f, true) } }
            for (const m of s.matchAll(/START:(\d+):(.+)/g)) tick(list[+m[1] - 1]?.f, true)
          })
          child.on('close', code => res(ctrl.signal.aborted ? 'Cancelled.' : code === 0 ? '' : (out.match(/ERR:(.+)/)?.[1] || e || 'The copy to the phone did not finish.').trim()))
          child.on('error', x => (e = x.message))
        })
        fsp.rm(listFile, {force: true}).catch(() => {}); fsp.rm(script, {force: true}).catch(() => {})
        if (err) throw new Error(err)
      }
    }
    // move: the PC copy goes once the device has it
    if (mode === 'move') {
      const all = hist()
      for (const h of recs) {
        const mine = items.filter(x => x.h.id === h.id && x.dest)
        for (const x of mine) { await fsp.rm(x.f, {force: true}); moved++ }
        if (h.count > 1) { try { (await fsp.readdir(h.folder)).length || (await fsp.rmdir(h.folder)) } catch {} }
        const row = all.find(r => r.id === h.id)
        if (row) Object.assign(row, {movedTo: `${dev.kind === 'drive' ? dev.id + ' ' : ''}${dev.name}`, files: dev.kind === 'drive' ? mine.map(x => x.dest) : row.files,
          file: dev.kind === 'drive' && mine.length === 1 ? mine[0].dest : row.file, folder: dev.kind === 'drive' && mine[0] ? path.dirname(mine[0].dest) : row.folder})
      }
      jwrite('history', all)
    }
    send('xfer:done', {tid, ok: true, n: items.length, mode, dev: dev.name, moved})
  } catch (e) {
    send('xfer:done', {tid, ok: false, msg: ctrl.signal.aborted ? 'Cancelled.' : e.message, mode, dev: dev.name})
  } finally { xfers.delete(tid); scanDevices() }
}

// browser extension: copied to a fixed folder so Chrome keeps it across app updates
const EXT_DIR = () => path.join(app.getPath('userData'), 'browser-extension')
async function placeExtension() {
  const src = app.isPackaged ? path.join(process.resourcesPath, 'extension') : path.join(__dirname, '..', 'extension')
  try {
    const v = f => JSON.parse(fs.readFileSync(path.join(f, 'manifest.json'), 'utf8')).version
    if (fs.existsSync(EXT_DIR()) && v(EXT_DIR()) === v(src)) return
    await fsp.cp(src, EXT_DIR(), {recursive: true, force: true})
  } catch {}
}
// last heartbeat from the extension, kept across restarts
let ext = null
const extInfo = () => (ext ||= jread('extension', {seen: 0, browser: '', version: ''}))
// local bridge: only an extension (chrome-/moz-/edge-extension origin + our header) is let in
function startBridge() {
  const srv = http.createServer((req, res) => {
    // the extension shows these messages as they come, so they go out in the app language
    const out = (code, v) => { res.writeHead(code, {'Content-Type': 'application/json'}); res.end(JSON.stringify(v?.msg ? {...v, msg: L(v.msg)} : v)) }
    if (!/^(chrome|moz|edge|safari-web)-extension:\/\//.test(req.headers.origin || '') || req.headers['x-rs-downloader'] !== '1') return out(403, {ok: false})
    const q = new URL(req.url, 'http://x')
    const first = !extInfo().seen
    Object.assign(extInfo(), {seen: Date.now(), browser: (q.searchParams.get('b') || extInfo().browser || 'Chrome').slice(0, 20), version: (q.searchParams.get('v') || extInfo().version || '').slice(0, 12)})
    // per browser too, so Options can tick each one
    const bn = ext.browser, newB = !ext.browsers?.[bn]
    ext.browsers = {...(ext.browsers || {}), [bn]: {seen: ext.seen, version: ext.version}}
    jwrite('extension', ext)
    ;(first || newB) && send('ext:status', {...extState(), added: bn})
    if (req.method === 'GET' && q.pathname === '/ping') return out(200, {ok: true, app: 'RS Downloader', version: app.getVersion(), clip: cfg().clip, lang: cfg().lang})
    if (req.method !== 'POST' || !['/add', '/probe'].includes(q.pathname)) return out(404, {ok: false})
    let body = ''
    req.setEncoding('utf8')
    req.on('data', c => { body += c; body.length > 65536 && req.destroy() })
    req.on('end', async () => {
      let a
      try { a = JSON.parse(body) } catch { return out(400, {ok: false}) }
      const u = okUrl(a.url)
      if (!u) return out(400, {ok: false, msg: 'Not a link.'})
      const h = cleanHdrs(a.headers)
      if (Object.keys(h).length) { hdrs.set(u, h); q.pathname === '/probe' && probes.delete(u + '|false') }
      // page menu: list the qualities of one video
      if (q.pathname === '/probe') {
        // a youtube home / channel / search page is not one video: say so at once instead of reading a whole channel
        const yu = new URL(u)
        if (/(^|\.)youtube\.com$/.test(yu.hostname) && !/^\/(watch|shorts\/|live\/|embed\/)/.test(yu.pathname)) return out(200, {ok: false, msg: 'This is a YouTube page, not one video. Open the video (or hover its thumbnail), then click Download this video.'})
        if (!fs.existsSync(YTDLP())) return out(200, {ok: false, msg: 'RS Downloader is still setting up. Open the app once, then try again.'})
        try { const p = await probeUrl(u, false); return out(200, p.ok ? pub(p) : {ok: false, msg: p.msg}) } catch (e) { return out(200, {ok: false, msg: e.message}) }
      }
      // a quality picked in the page menu goes straight in; the download window shows it
      // everything from the browser opens Download File Info on top of it (quality already picked when it came from the page menu)
      openInfo(u, {label: typeof a.label === 'string' ? a.label.slice(0, 40) : '', kind: a.kind, name: typeof a.filename === 'string' ? a.filename.slice(0, 200) : ''})
      out(200, {ok: true})
    })
  })
  srv.on('error', e => console.error('bridge', e.message))
  srv.listen(PORT, '127.0.0.1')
}

// ipc
// native text (tray, notifications, dialogs) in the app language
const L = (s, ...a) => a.length ? I18N.t(cfg().lang, s, ...a) : I18N.tr(cfg().lang, s)
const H = (ch, fn) => ipcMain.handle(ch, async (_e, a) => { try { return await fn(a ?? {}) } catch (e) { return {ok: false, msg: e.message} } })
const busyQ = () => queue.some(x => x.status === 'running')

H('boot', async () => ({cfg: {...cfg(), startup: app.getLoginItemSettings({args: ['--hidden']}).openAtLogin}, engine: await engineInfo(), version: app.getVersion(), upd, packaged: app.isPackaged, items: queue, run: qRun, extDir: EXT_DIR()}))
H('engine:install', async ({update}) => {
  if (busyQ()) return {ok: false, msg: 'Wait for the downloads to finish first.'}
  const before = (await run(YTDLP(), ['--version'])).out.trim()
  const engine = await installEngine(!!update)
  return {ok: true, engine, changed: !!before && before !== engine.ytdlp}
})
H('app:update', async ({install}) => {
  if (!au) return {ok: false, msg: 'App updates work in the installed app only.'}
  if (install && upd.state === 'ready') { quitting = true; killAll('pause'); saveQ(); setImmediate(() => au.quitAndInstall(true, true)); return {ok: true, upd} }
  if (!['downloading', 'ready'].includes(upd.state)) await au.checkForUpdates().catch(() => {})
  return {ok: true, upd}
})
H('probe', async ({url, playlist}) => {
  const u = okUrl(url)
  if (!u) return {ok: false, msg: 'Paste a full link that starts with http:// or https://'}
  if (!fs.existsSync(YTDLP())) return {ok: false, msg: 'The download engine is not installed yet.'}
  const p = await probeUrl(u, playlist)
  return p.ok ? pub(p) : p
})
H('enqueue', async a => {
  const u = okUrl(a.url)
  if (!u) return {ok: false, msg: 'Not a link.'}
  const waiting = queue.filter(x => x.status === 'running').length >= Math.max(1, +cfg().maxAt || 2)
  const it = addItem(u, a, !!a.now)
  saveQ(); sendQ(); pump()
  return {ok: true, qid: it.qid, waiting}
})
H('enqueue:many', async a => {
  const urls = [...new Set((Array.isArray(a.urls) ? a.urls : []).map(okUrl).filter(Boolean))].slice(0, 200)
  if (!urls.length) return {ok: false, msg: 'No links found. Put one link on each line.'}
  urls.forEach(u => addItem(u, a, false))
  if (a.start) qRun = true
  saveQ(); sendQ(); pump()
  return {ok: true, n: urls.length}
})
H('queue', async () => ({ok: true, items: queue, run: qRun}))
H('q:pause', async ({qids}) => {
  for (const q of qids || []) {
    const it = queue.find(x => x.qid === q)
    if (!it) continue
    if (it.status === 'running' && jobs.has(q)) killJob(q, 'pause')
    else if (['queued', 'running'].includes(it.status)) it.status = 'paused'
  }
  saveQ(); sendQ(); pump()
  return {ok: true}
})
H('q:resume', async ({qids}) => {
  queue.filter(x => (qids || []).includes(x.qid) && ['paused', 'failed'].includes(x.status)).forEach(x => { x.status = 'queued'; x.err = ''; x.now = true })
  saveQ(); sendQ(); pump()
  return {ok: true}
})
H('q:cancel', async ({qids}) => {
  const want = new Set(qids || [])
  for (const it of queue.filter(x => want.has(x.qid))) {
    if (jobs.has(it.qid)) { killJob(it.qid, 'cancel'); continue }
    await rmParts([...(it.dests || []), ...(it.dest ? [it.dest] : [])])
    queue.splice(queue.indexOf(it), 1); hdrs.delete(it.qid)
  }
  saveQ(); sendQ(); pump()
  return {ok: true}
})
H('q:run', async ({on}) => { qRun = !!on; sendQ(); on && pump(); return {ok: true} })
H('set', async ({key, value}) => {
  const bool = v => typeof v === 'boolean'
  const ok = {lang: v => I18N.ok(v), theme: v => ['light', 'dark'].includes(v), rate: v => RATES.includes(v), sort: bool, clip: bool, tray: bool, notify: bool, progressWin: bool,
    sched: v => v && bool(v.on) && /^\d{2}:\d{2}$/.test(v.time), maxAt: v => [1, 2, 3].includes(v), conns: v => [4, 8, 16].includes(v), startup: bool}[key]
  if (!ok?.(value)) return {ok: false}
  // start with Windows: opens quietly in the tray
  if (key === 'startup') { app.setLoginItemSettings({openAtLogin: value, args: ['--hidden']}); return {ok: true} }
  jwrite('settings', {...jread('settings', {}), [key]: key === 'sched' ? {on: value.on, time: value.time} : value})
  key === 'maxAt' && pump()
  return {ok: true}
})
// category folders for Options > Save to
H('cats', async () => { const c = cfg(); return {ok: true, list: Object.keys(CATS).map(k => ({cat: k, dir: catDir(c, k), custom: !!c.catDirs?.[k]}))} })
H('cat-dir', async ({cat, pick}) => {
  if (!CATS[cat]) return {ok: false}
  const c = cfg()
  let dir = ''
  if (pick) {
    const r = await dialog.showOpenDialog(win, {title: L('Folder for {0}', L(cat)), defaultPath: catDir(c, cat), properties: ['openDirectory', 'createDirectory']})
    if (r.canceled || !r.filePaths[0]) return {ok: false}
    dir = r.filePaths[0]
  }
  const cd = {...(c.catDirs || {})}
  dir ? (cd[cat] = dir) : delete cd[cat]
  jwrite('settings', {...jread('settings', {}), catDirs: cd})
  return {ok: true, dir: catDir(cfg(), cat), custom: !!dir}
})
H('pick-folder', async () => {
  const r = await dialog.showOpenDialog(win, {title: L('Save downloads in'), defaultPath: cfg().outDir, properties: ['openDirectory', 'createDirectory']})
  if (r.canceled || !r.filePaths[0]) return {ok: false}
  jwrite('settings', {...jread('settings', {}), outDir: r.filePaths[0]})
  return {ok: true, outDir: r.filePaths[0]}
})
// list with live size + missing flag
H('history', async () => ({ok: true, rows: await Promise.all(hist().map(async h => { const s = await sizeOf(h.files); return {...h, size: s.size || h.size || 0, exists: s.n, missing: h.files.length - s.n} }))}))
H('open', async ({id}) => {
  const h = byId(id), p = h?.file ?? h?.folder
  if (!p || !fs.existsSync(p)) return {ok: false, msg: 'This file was moved or deleted.'}
  const e = await shell.openPath(p)
  return e ? {ok: false, msg: e} : {ok: true}
})
H('reveal', async ({id}) => {
  const h = byId(id), f = h?.files.find(x => fs.existsSync(x))
  if (f) return shell.showItemInFolder(f), {ok: true}
  if (h?.folder && fs.existsSync(h.folder)) return {ok: !(await shell.openPath(h.folder))}
  return {ok: false, msg: 'This file was moved or deleted.'}
})
// files go to the recycle bin, then the row leaves the list
H('delete', async ({ids}) => {
  const want = new Set(Array.isArray(ids) ? ids : []), all = hist(), fail = []
  const keepDirs = [cfg().outDir, ...[...Object.values(FOLDERS), ...FTYPES.map(t => t[0]), 'Other'].map(x => path.join(cfg().outDir, x))]
  let gone = 0
  for (const h of all.filter(x => want.has(x.id))) {
    for (const f of h.files) {
      if (!fs.existsSync(f)) continue
      try { await shell.trashItem(f); gone++ } catch { fail.push(path.basename(f)) }
    }
    // empty playlist / picture folder goes too
    if (h.count > 1 && !keepDirs.includes(h.folder)) { try { (await fsp.readdir(h.folder)).length || (await fsp.rmdir(h.folder)) } catch {} }
  }
  const failSet = new Set(fail)
  jwrite('history', all.filter(h => !want.has(h.id) || h.files.some(f => failSet.has(path.basename(f)) && fs.existsSync(f))))
  return {ok: !fail.length, gone, msg: fail.length ? `${fail.length} file(s) could not be deleted (open in another app?): ${fail.slice(0, 3).join(', ')}` : ''}
})
H('open-out', async () => ({ok: !(await shell.openPath(cfg().outDir))}))
// on = heartbeat in the last 3 min; idle = installed but the browser is closed; none = never seen
const extState = () => { const e = extInfo(), age = Date.now() - e.seen
  return {ok: true, state: !e.seen ? 'none' : age < 180e3 ? 'on' : 'idle', browser: e.browser, version: e.version, seen: e.seen, dir: EXT_DIR(),
    latest: (() => { try { return JSON.parse(fs.readFileSync(path.join(EXT_DIR(), 'manifest.json'), 'utf8')).version } catch { return '' } })()} }
// Download File Info: one window for every new download (app, browser menu, right-click, caught downloads)
const finfo = new Set()
function openInfo(u, preset = {}, playlist = false) {
  const w = new BrowserWindow({width: 760, height: 480, minWidth: 600, minHeight: 420, title: L('Download File Info'), icon: ICON, autoHideMenuBar: true, maximizable: false, fullscreenable: false,
    alwaysOnTop: true, backgroundColor: cfg().theme === 'dark' ? '#1e1e1e' : '#ffffff', webPreferences: {preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: true}})
  w.removeMenu()
  w.webContents.setWindowOpenHandler(() => ({action: 'deny'}))
  w.webContents.on('will-navigate', e => e.preventDefault())
  finfo.add(w); w.on('closed', () => finfo.delete(w))
  const ready = new Promise(r => w.webContents.once('did-finish-load', r))
  w.loadFile(path.join(__dirname, 'ui', 'fileinfo.html'))
  w.once('ready-to-show', () => w.focus())
  ready.then(() => !w.isDestroyed() && w.webContents.send('fi:loading', {url: u}))
  ;(async () => {
    let data
    if (!fs.existsSync(YTDLP())) data = {ok: false, msg: 'RS Downloader is still setting up its engine. Open the app once, then try again.'}
    else try { const p = await probeUrl(u, playlist); data = p.ok ? pub(p) : {ok: false, msg: p.msg} } catch (e) { data = {ok: false, msg: e.message} }
    const c = cfg()
    await ready
    if (w.isDestroyed()) return
    w.webContents.send('fi:init', {...data, url: u, playlist, preset, cats: Object.keys(CATS), catDirs: Object.fromEntries(Object.keys(CATS).map(k => [k, catDir(c, k)])),
      remembered: c.catDirs || {}, cat: data.ok ? catOf(data.choices.find(x => x.label === preset.label)?.kind || data.choices[0]?.kind, data.info.fcat) : 'Other'})
  })()
}
H('fi:open', async ({url, playlist, name}) => { const u = okUrl(url); if (!u) return {ok: false, msg: 'Not a link.'}; openInfo(u, {name: name || ''}, !!playlist); return {ok: true} })
H('fi:browse', async ({file}) => {
  const w = BrowserWindow.getFocusedWindow() || win
  const r = await dialog.showSaveDialog(w, {title: L('Save As'), defaultPath: typeof file === 'string' ? file : cfg().outDir})
  return r.canceled || !r.filePath ? {ok: false} : {ok: true, file: r.filePath}
})
H('fi:go', async a => {
  const u = okUrl(a.url)
  if (!u) return {ok: false, msg: 'Not a link.'}
  const o = a.opts || {}
  if (!okDir(o.dir)) return {ok: false, msg: 'Pick a folder on this PC to save in (click ...).'}
  if (!o.name || /[<>:"/\\|?*]/.test(o.name)) return {ok: false, msg: 'A file name cannot be empty or contain < > : " / \\ | ? *'}
  try { await fsp.mkdir(o.dir, {recursive: true}) } catch { return {ok: false, msg: 'That folder cannot be created. Pick another one.'} }
  const dup = queue.find(x => x.url === u && x.label === a.label && ['queued', 'running', 'paused'].includes(x.status))
  if (dup) return {ok: false, msg: `This ${a.kind === 'audio' ? 'audio' : 'video'} in ${a.label} is already in the list (${dup.status}). Find it under Unfinished.`}
  // remember this folder for the category
  if (a.remember && CATS[o.cat]) jwrite('settings', {...jread('settings', {}), catDirs: {...(cfg().catDirs || {}), [o.cat]: path.normalize(o.dir)}})
  const it = addItem(u, {playlist: !!a.playlist, label: a.label, kind: a.kind, opts: o, now: !!a.now, showDone: !!a.now}, !!a.now)
  saveQ(); sendQ(); pump()
  return {ok: true, qid: it.qid, waiting: !a.now ? false : queue.filter(x => x.status === 'running' && x.qid !== it.qid).length >= Math.max(1, +cfg().maxAt || 2)}
})

// download window buttons
H('pw:open', async ({qid}) => { const it = queue.find(x => x.qid === qid); if (!it) return {ok: false}; openPw(it); return {ok: true} })
H('pw:act', async ({qid, act, id}) => {
  const it = queue.find(x => x.qid === qid)
  if (act === 'pause' && it) { jobs.has(qid) ? killJob(qid, 'pause') : (it.status = 'paused'); saveQ(); sendQ(); pwSend(qid, 'pw:state', {status: 'paused'}) }
  else if (act === 'resume' && it && ['paused', 'failed'].includes(it.status)) { Object.assign(it, {status: 'queued', err: '', now: true}); saveQ(); sendQ(); pwSend(qid, 'pw:state', {status: 'queued'}); pump() }
  else if (act === 'cancel' && it) {
    if (jobs.has(qid)) killJob(qid, 'cancel')
    else { await rmParts([...(it.dests || []), ...(it.dest ? [it.dest] : [])]); queue.splice(queue.indexOf(it), 1); saveQ(); sendQ(); pwins.get(qid)?.close() }
  } else if (act === 'open' || act === 'reveal') {
    const h = byId(id), f = h?.files.find(x => fs.existsSync(x))
    if (!h || (!f && !fs.existsSync(h.folder))) return {ok: false, msg: 'This file was moved or deleted.'}
    if (act === 'open') { const e = await shell.openPath(h.file || h.folder); if (e) return {ok: false, msg: e} }
    else f ? shell.showItemInFolder(f) : shell.openPath(h.folder)
    pwins.get(qid)?.close()
  } else if (act === 'close') pwins.get(qid)?.close()
  return {ok: true}
})
H('devices', async () => ({ok: true, devs: await scanDevices()}))
H('xfer', async ({ids, dev, mode}) => {
  if (!WIN) return {ok: false, msg: 'Copying to a USB or phone works on Windows.'}
  const d = (await scanDevices()).find(x => x.id === dev)
  if (!d) return {ok: false, msg: 'That USB or phone is not connected any more.'}
  const want = new Set(Array.isArray(ids) ? ids : []), recs = hist().filter(h => want.has(h.id))
  if (!recs.length) return {ok: false, msg: 'Pick at least one finished download.'}
  const tid = rid()
  transfer(tid, recs, d, mode === 'move' ? 'move' : 'copy')
  return {ok: true, tid}
})
H('xfer:cancel', async ({tid}) => { const j = xfers.get(tid); if (j) { j.ctrl.abort(); j.child && killTree(j.child) } return {ok: true} })
// browsers on this PC (default first) and a one-click setup for each
const BROWSERS = [
  ['Chrome', 'chrome.exe', ['%ProgramFiles%\\Google\\Chrome\\Application', '%ProgramFiles(x86)%\\Google\\Chrome\\Application', '%LOCALAPPDATA%\\Google\\Chrome\\Application'], 'chrome://extensions', /chrome/i],
  ['Edge', 'msedge.exe', ['%ProgramFiles(x86)%\\Microsoft\\Edge\\Application', '%ProgramFiles%\\Microsoft\\Edge\\Application'], 'edge://extensions', /msedge/i],
  ['Brave', 'brave.exe', ['%ProgramFiles%\\BraveSoftware\\Brave-Browser\\Application', '%LOCALAPPDATA%\\BraveSoftware\\Brave-Browser\\Application'], 'brave://extensions', /brave/i],
  ['Opera', 'opera.exe', ['%LOCALAPPDATA%\\Programs\\Opera', '%ProgramFiles%\\Opera'], 'opera://extensions', /opera/i],
  ['Vivaldi', 'vivaldi.exe', ['%LOCALAPPDATA%\\Vivaldi\\Application', '%ProgramFiles%\\Vivaldi\\Application'], 'vivaldi://extensions', /vivaldi/i],
]
const envx = p => p.replace(/%([^%]+)%/g, (_, k) => process.env[k] || '')
async function browsers() {
  if (!WIN) return []
  const r = await run('reg', ['query', 'HKCU\\Software\\Microsoft\\Windows\\Shell\\Associations\\UrlAssociations\\https\\UserChoice', '/v', 'ProgId'], {timeout: 8000})
  const prog = r.out.match(/ProgId\s+REG_SZ\s+(\S+)/)?.[1] || '', seen = extInfo().browsers || {}
  return BROWSERS.map(([name, exe, dirs, page, re]) => {
    const p = dirs.map(d => path.join(envx(d), exe)).find(f => fs.existsSync(f))
    return p && {name, exe: p, page, def: re.test(prog), seen: seen[name]?.seen || 0, version: seen[name]?.version || ''}
  }).filter(Boolean).sort((a, b) => b.def - a.def)
}
H('browsers', async () => ({ok: true, list: (await browsers()).map(({exe, ...b}) => b), dir: EXT_DIR()}))
// opens that browser's extensions page + the folder, path already on the clipboard
H('ext-setup', async ({name}) => {
  const b = (await browsers()).find(x => x.name === name)
  if (!b) return {ok: false, msg: 'That browser was not found on this PC.'}
  await placeExtension()
  lastClip = EXT_DIR(); await clipboard.writeText(EXT_DIR())
  spawn(b.exe, [b.page], {detached: true, stdio: 'ignore'}).unref()
  shell.openPath(EXT_DIR())
  return {ok: true, dir: EXT_DIR(), page: b.page}
})
H('ext-folder', async () => { await placeExtension(); return {ok: !(await shell.openPath(EXT_DIR())), dir: EXT_DIR()} })
H('ext-status', async () => extState())
// clipboard read works whether this Electron returns text or a promise
const clipText = async () => { try { return String((await clipboard.readText()) ?? '').trim() } catch { return '' } }
H('paste', async () => ({ok: true, text: await clipText()}))
let lastClip = ''
H('copy', async ({text}) => { lastClip = String(text || '').slice(0, 4000); await clipboard.writeText(lastClip); return {ok: true} })
H('ext', async ({url}) => (/^(https:\/\/(wa\.me|rameezscripts\.com|www\.youtube\.com)\/|mailto:)/.test(String(url)) ? (shell.openExternal(url), {ok: true}) : {ok: false}))

// clipboard watch: a copied video / picture link is offered for download
function watchClipboard() {
  clipText().then(t => (lastClip = t))
  let reading = false
  setInterval(async () => {
    if (!cfg().clip || reading) return
    reading = true
    const t = await clipText()
    reading = false
    if (t === lastClip) return
    lastClip = t
    if (t.length > 2000 || !CLIP_RE.test(t)) return
    send('clip:link', t)
    win?.isFocused() || notify(L('Link copied'), L('Click to download it with RS Downloader'), () => { show(); send('clip:open', t) })
  }, 1200)
}

// scheduler: starts the queue at the set time, once a day
let firedOn = ''
setInterval(() => {
  const s = cfg().sched
  if (!s?.on) return
  const d = new Date(), hm = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  if (hm !== s.time || firedOn === d.toDateString()) return
  firedOn = d.toDateString()
  if (!queue.some(x => x.status === 'queued')) return
  qRun = true; sendQ(); pump()
  notify(L('Scheduled downloads started'), L('{0} in the queue', queue.filter(x => x.status === 'queued').length), show)
}, 20000)

function makeTray() {
  tray = new Tray(nativeImage.createFromPath(ICON).resize({width: 16, height: 16}))
  tray.setToolTip('RS Downloader')
  const menu = () => Menu.buildFromTemplate([
    {label: L('Open RS Downloader'), click: show},
    {label: L('Download link from clipboard'), click: async () => { show(); send('clip:open', await clipText()) }},
    {type: 'separator'},
    {label: L(qRun ? 'Stop queue' : 'Start queue'), click: () => { qRun = !qRun; sendQ(); qRun && pump() }},
    {type: 'separator'},
    {label: L('Quit'), click: () => { quitting = true; app.quit() }},
  ])
  tray.on('click', show)
  tray.on('right-click', () => tray.popUpContextMenu(menu()))
}

function createWindow() {
  win = new BrowserWindow({
    width: 1280, height: 820, minWidth: 420, minHeight: 560, title: 'RS Downloader', show: !process.argv.includes('--hidden'), backgroundColor: cfg().theme === 'dark' ? '#121212' : '#f5f5f5',
    autoHideMenuBar: true, icon: ICON,
    webPreferences: {preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: true},
  })
  win.removeMenu()
  win.webContents.setWindowOpenHandler(() => ({action: 'deny'}))
  win.webContents.on('will-navigate', e => e.preventDefault())
  // close = hide to the tray (downloads keep going); Quit lives in the tray menu
  let told = false
  win.on('close', e => {
    if (quitting || !tray || cfg().tray === false) return
    e.preventDefault(); win.hide()
    told || notify(L('RS Downloader is still running'), L('Downloads continue in the background. Right-click the tray icon to quit.'))
    told = true
  })
  win.loadFile(path.join(__dirname, 'ui', 'index.html'))
}

if (!app.requestSingleInstanceLock()) app.quit()
else {
  WIN && app.setAppUserModelId('com.rameezscripts.rsdownloader')
  app.on('second-instance', show)
  app.whenReady().then(async () => {
    // a download cut off by closing the app comes back paused (its .part file resumes)
    queue = jread('queue', []).map(x => ({...x, status: x.status === 'running' ? 'paused' : x.status, now: false}))
    await seedEngines()
    // each part starts on its own, so one failing never stops the others (the bridge most of all)
    // devices: checked every 4 s while the window is on screen
    setInterval(() => win?.isVisible() && scanDevices(), 4000)
    for (const f of [createWindow, startBridge, makeTray, watchClipboard, initUpdater, placeExtension]) {
      try { Promise.resolve(f()).catch(e => console.error(f.name, e)) } catch (e) { console.error(f.name, e) }
    }
    setTimeout(pump, 3000)
    setTimeout(fillEngines, 4000)
  })
  app.on('before-quit', () => { quitting = true; killAll('pause'); saveQ() })
  app.on('window-all-closed', () => app.quit())
}
