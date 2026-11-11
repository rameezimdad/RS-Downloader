/**
 * Developed by Mohammad Rameez Imdad (Rameez Scripts)
 * WhatsApp: https://wa.me/923435347417 (For Custom Projects)
 * YouTube: https://www.youtube.com/@rameezimdad (Subscribe for more!)
 */
// app language: English text in the code is the key; main process + every window use this
;(function () {
  'use strict'
  const NODE = typeof module !== 'undefined' && module.exports
  const ROWS = NODE ? require('./strings.js') : self.RS_STRINGS || []
  const LANGS = [['en', 'English'], ['ar', 'العربية'], ['es', 'Español'], ['hi', 'हिन्दी'], ['ur', 'اردو']]
  const COL = {ar: 1, es: 2, hi: 3, ur: 4}
  const RTL = ['ar', 'ur']
  const MARK = '⁠' // text already translated by t(), the page pass leaves it alone
  const NUM = '(\\d[\\d.,:]*(?:\\s?(?:B|KB|MB|GB|TB|Bytes))?)'
  const PH = /\{([#=]?)(\d)\}/g
  const norm = s => s.replace(/\s+/g, ' ').trim()
  const reEsc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const ok = l => l === 'en' || !!COL[l]
  const packs = {}

  function pack(lang) {
    if (packs[lang] || lang === 'en' || !ok(lang)) return packs[lang]
    const map = new Map(), pats = []
    for (const r of ROWS) {
      const en = r[0], v = r[COL[lang]]
      if (!v) continue
      const k = norm(en)
      map.set(k.replace(PH, '{$2}'), v)
      if (!/\{[#=]?\d\}/.test(k)) continue
      const caps = [] // per capture: [placeholder no, mode]
      const src = k.split(/(\{[#=]?\d\})/).map(p => {
        const m = p.match(/^\{([#=]?)(\d)\}$/)
        if (!m) return reEsc(p)
        caps.push([+m[2], m[1]])
        return m[1] === '#' ? NUM : '(.+?)'
      }).join('')
      pats.push({re: new RegExp('^' + src + '$'), v, caps, lit: k.replace(PH, '').length})
    }
    pats.sort((a, b) => b.lit - a.lit)
    return (packs[lang] = {map, pats})
  }

  // one string: exact match, then patterns, then " · " parts
  function tr(lang, s, depth = 0) {
    if (typeof s !== 'string' || !/[A-Za-z]/.test(s) || s.includes(MARK)) return s
    const p = pack(lang)
    if (!p) return s
    if (s.includes('\n')) return s.split('\n').map(x => tr(lang, x, depth)).join('\n')
    const lead = s.match(/^\s*/)[0], tail = s.slice(lead.length).match(/\s*$/)[0], k = norm(s)
    let out = p.map.get(k)
    if (out == null && depth < 3 && k.includes(' · ')) {
      const parts = k.split(' · '), done = parts.map(x => tr(lang, x, depth + 1))
      if (done.some((x, i) => x !== parts[i])) out = done.join(' · ')
    }
    if (out == null && depth < 3) {
      for (const x of p.pats) {
        const m = k.match(x.re)
        if (!m) continue
        const val = {}
        x.caps.forEach(([n, mode], i) => (val[n] = mode ? m[i + 1] : tr(lang, m[i + 1], depth + 1)))
        out = x.v.replace(PH, (_, __, n) => val[n] ?? '')
        break
      }
    }
    return out == null ? s : lead + out + tail
  }
  // key with {0} {1} filled from args
  const t = (lang, key, ...a) => (pack(lang)?.map.get(norm(key).replace(PH, '{$2}')) ?? key).replace(PH, (_, __, n) => a[n] ?? '')

  if (NODE) { module.exports = {LANGS, RTL, ok, tr, t}; return }

  // windows: language from the shared local storage, set before paint
  let lang = 'en'
  try { lang = localStorage.getItem('rsdl_lang') || 'en' } catch {}
  if (!ok(lang)) lang = 'en'
  const de = document.documentElement
  de.lang = lang
  de.dir = RTL.includes(lang) ? 'rtl' : 'ltr'
  window.t = (key, ...a) => (lang === 'en' ? t(lang, key, ...a) : MARK + t(lang, key, ...a))
  window.RSI18N = {lang, LANGS, rtl: RTL.includes(lang), raw: x => (lang === 'en' ? x : MARK + x), save: l => { try { localStorage.setItem('rsdl_lang', l); return localStorage.getItem('rsdl_lang') === l } catch { return false } }}
  if (lang === 'en') return

  // translate text + a few attributes as they reach the page; titles, names and paths sit under translate="no"
  const ATTRS = ['title', 'placeholder', 'aria-label']
  const SKIP = '[translate="no"], script, style, textarea'
  const seen = new WeakMap() // node -> what we wrote last
  const T = s => tr(lang, s)
  function text(n) {
    if (seen.get(n) === n.data || n.parentElement?.closest(SKIP)) return
    const v = T(n.data)
    seen.set(n, v)
    v !== n.data && (n.data = v)
  }
  function attrs(el) {
    if (!el.hasAttribute || el.closest(SKIP)) return
    for (const a of ATTRS) {
      const o = el.getAttribute(a)
      if (!o) continue
      const s = seen.get(el) || {}
      if (s[a] === o) continue
      const v = T(o)
      s[a] = v; seen.set(el, s)
      v !== o && el.setAttribute(a, v)
    }
  }
  function walk(root) {
    if (root.nodeType === 3) return text(root)
    if (root.nodeType !== 1) return
    attrs(root)
    const w = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT)
    for (let n = w.nextNode(); n; n = w.nextNode()) n.nodeType === 3 ? text(n) : attrs(n)
  }
  new MutationObserver(ms => {
    for (const m of ms) m.type === 'childList' ? m.addedNodes.forEach(walk) : m.type === 'characterData' ? text(m.target) : attrs(m.target)
  }).observe(de, {subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS})
  walk(de)
})()
