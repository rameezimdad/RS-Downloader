/**
 * Developed by Mohammad Rameez Imdad (Rameez Scripts)
 * WhatsApp: https://wa.me/923435347417 (For Custom Projects)
 * YouTube: https://www.youtube.com/@rameezimdad (Subscribe for more!)
 */
// ==================== POPUPS — themed dialog + corner toasts ====================
// rsPop(o) | rsPop(title, text, icon) -> Promise {isConfirmed, isDenied, isDismissed, value, dismiss}. one dialog at a time, toasts stack.
// o: title, text, html, icon (success|error|warning|info|question), input (text|number|email|tel|date|password|textarea|select), inputValue, inputPlaceholder,
//    inputLabel, inputOptions, inputAttributes, inputValidator, preConfirm, showConfirmButton, showCancelButton, showDenyButton,
//    confirmButtonText, cancelButtonText, denyButtonText, danger, focusCancel, allowOutsideClick, allowEscapeKey, width, timer, didOpen,
//    help {title, steps[], acts[{label, href, icon, fn, arg}]} -> "how to fix it" steps + buttons that go there. toast:true -> corner toast
var rsPop = (function () {
    var ICO = { success: 'fa-check', error: 'fa-xmark', warning: 'fa-exclamation', info: 'fa-info', question: 'fa-question' },
        cur = null, busy = null, tray = null, seq = 0;

    function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
    function node(tag, cls, html) { var e = document.createElement(tag); e.className = cls || ''; if (html != null) e.innerHTML = html; return e; }
    function rich(s) { return esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>'); }   // **bold** in server text, rest escaped
    function ico(k) { return '<span class="rs-pop-ico"><i class="fas ' + (ICO[k] || ICO.info) + '"></i></span>'; }
    function fa(i) { return '<i class="' + esc(/\s/.test(i || '') ? i : 'fas ' + (i || 'fa-arrow-right')) + '"></i> '; }
    // button text: a leading icon tag is kept, the words are escaped (some labels carry a client name)
    function lbl(s) { var m = /^(<i class="[\w -]+"><\/i>)\s*([\s\S]*)$/.exec(String(s)); return m ? m[1] + ' ' + esc(m[2]) : esc(s); }
    function settle(r) { return Object.assign({ isConfirmed: false, isDenied: false, isDismissed: false, value: undefined }, r); }

    function toast(o) {
        if (!tray) { tray = node('div', 'rs-toasts'); tray.setAttribute('aria-live', 'polite'); document.body.appendChild(tray); }
        var t = node('div', 'rs-toast rs-pop-' + (ICO[o.icon] ? o.icon : 'info'), ico(o.icon) + '<div><b>' + esc(o.title || o.text || '') + '</b>' + (o.title && o.text ? '<p>' + esc(o.text) + '</p>' : '') + '</div>');
        t.setAttribute('role', o.icon === 'error' ? 'alert' : 'status');
        tray.appendChild(t);
        return new Promise(function (res) {
            var gone = function () { if (t._out) return; t._out = 1; t.classList.add('out'); setTimeout(function () { t.remove(); }, 200); res(settle({ isDismissed: true, dismiss: 'timer' })); };
            setTimeout(gone, o.timer || 2600);
            t.onclick = gone;
        });
    }

    function teardown(c, now) {
        document.removeEventListener('keydown', c.key, true);
        document.body.classList.remove('rs-pop-open');
        if (now) return c.wrap.remove();
        c.wrap.classList.add('out');
        setTimeout(function () { c.wrap.remove(); }, 160);
        if (c.back && c.back.isConnected && c.back.focus) try { c.back.focus({ preventScroll: true }); } catch (e) {}
    }
    function close(r) { if (!cur) return; var c = cur; cur = null; teardown(c); c.res(settle(r)); }
    function stopBusy() { if (!busy) return; var b = busy; busy = null; b.done(); b.res(settle({ isDismissed: true })); }

    // a "please wait" popup turns into the branded write overlay — one signal per write
    function loading() {
        var c = cur;
        if (!c) return;
        if (!window.rsOverlay) { c.pop.classList.add('rs-pop-busy'); return; }   // no overlay on this page -> bar inside the dialog
        cur = null; teardown(c, true);
        busy = { done: rsOverlay(c.title || 'Working…'), res: c.res };
    }
    function invalid(m) {
        if (!cur) return;
        cur.bad = !!m;
        cur.msg.hidden = !m;
        cur.msg.innerHTML = m ? '<i class="fas fa-circle-exclamation"></i> ' + esc(m) : '';
        if (cur.inp) { cur.inp.setAttribute('aria-invalid', m ? 'true' : 'false'); if (m) cur.inp.focus(); }
    }

    function open(o) {
        stopBusy();
        // a timed popup with nothing to answer is a toast
        if (o.toast || (o.timer && o.showConfirmButton === false && !o.showCancelButton && !o.input && !o.html)) return toast(o);
        var was = null;
        if (cur) { was = cur; cur = null; teardown(was, true); was.res(settle({ isDismissed: true })); }   // a new popup replaces the open one at once
        return new Promise(function (res) {
            var id = 'rsp' + (++seq), acts = (o.help && o.help.acts) || [], steps = (o.help && o.help.steps) || [],
                wrap = node('div', 'rs-pop-wrap'), pop = node('div', 'rs-pop' + (ICO[o.icon] ? ' rs-pop-' + o.icon : '')), inp = null, c;
            pop.setAttribute('role', o.icon === 'error' || o.icon === 'warning' ? 'alertdialog' : 'dialog');
            pop.setAttribute('aria-modal', 'true');
            pop.setAttribute('aria-labelledby', id + 't');
            if (o.text) pop.setAttribute('aria-describedby', id + 'd');
            if (o.width) pop.style.maxWidth = typeof o.width === 'number' ? o.width + 'px' : o.width;
            pop.innerHTML = (o.allowEscapeKey === false || (o.allowOutsideClick === false && o.showConfirmButton === false && !o.showCancelButton) ? '' : '<button type="button" class="rs-pop-x" aria-label="Close"><i class="fas fa-xmark"></i></button>')
                + '<div class="rs-pop-head">' + (ICO[o.icon] ? ico(o.icon) : '') + '<div class="rs-pop-hd"><h3 class="rs-pop-title" id="' + id + 't">' + esc(o.title || '') + '</h3>'
                + (o.text ? '<p class="rs-pop-text" id="' + id + 'd">' + rich(o.text) + '</p>' : '') + '</div></div>'
                + '<div class="rs-pop-body"></div><div class="rs-pop-msg" role="alert" hidden></div><div class="rs-pop-foot"></div><div class="rs-pop-wait"><i></i></div>';
            var body = pop.querySelector('.rs-pop-body'), foot = pop.querySelector('.rs-pop-foot');

            if (o.html != null && o.html !== '') o.html instanceof Node ? body.appendChild(o.html) : body.insertAdjacentHTML('beforeend', String(o.html));
            if (o.input) {
                var f = node('div', 'rs-pop-field'), ops = o.inputOptions || {}, t = o.input;
                inp = document.createElement(t === 'select' || t === 'textarea' ? t : 'input');
                if (t === 'select') inp.innerHTML = (o.inputPlaceholder ? '<option value="">' + esc(o.inputPlaceholder) + '</option>' : '')
                    + Object.keys(ops).map(function (k) { return '<option value="' + esc(k) + '">' + esc(ops[k]) + '</option>'; }).join('');
                else if (t === 'textarea') inp.rows = 4;
                else inp.type = t;
                inp.className = 'rs-pop-input';
                inp.id = id + 'i';
                if (o.inputPlaceholder && t !== 'select') inp.placeholder = o.inputPlaceholder;
                Object.keys(o.inputAttributes || {}).forEach(function (k) { inp.setAttribute(k, o.inputAttributes[k]); });
                if (o.inputValue != null) inp.value = o.inputValue;
                if (o.inputLabel) f.appendChild(node('label', 'rs-pop-label', esc(o.inputLabel))).htmlFor = inp.id;
                f.appendChild(inp);
                body.appendChild(f);
            }
            if (steps.length) body.insertAdjacentHTML('beforeend', '<div class="rs-pop-help"><div class="rs-pop-help-h"><i class="fas fa-route"></i> ' + esc(o.help.title || 'How to fix it') + '</div><ol>'
                + steps.map(function (s) { return '<li>' + rich(s) + '</li>'; }).join('') + '</ol></div>');

            var btn = function (cls, html, fn) { var b = node('button', 'btn ' + cls, html); b.type = 'button'; b.onclick = fn; foot.appendChild(b); return b; };
            acts.forEach(function (a, i) {   // first = the main way out. fn runs a function this page has, else href goes there
                var k = i ? 'rs-pop-alt' : 'btn-primary', h = fa(a.icon) + esc(a.label);
                if (a.fn && /^\w+$/.test(a.fn) && typeof window[a.fn] === 'function') btn(k, h, function () { close({ isDismissed: true, dismiss: 'act' }); window[a.fn](a.arg); });
                else if (a.href && !/^\s*javascript:/i.test(a.href)) {
                    var l = node('a', 'btn ' + k, h);
                    l.href = a.href;
                    l.onclick = function (e) {   // same page, other tab -> just switch the tab (pages listen to hashchange)
                        close({ isDismissed: true, dismiss: 'act' });
                        if (l.pathname === location.pathname && l.search === location.search) { e.preventDefault(); if (l.hash !== location.hash) location.hash = l.hash; }
                    };
                    foot.appendChild(l);
                }
            });
            var ways = foot.childElementCount,   // help buttons on screen -> OK reads "Close" and steps back
                cancel = o.showCancelButton ? btn('rs-pop-ghost', lbl(o.cancelButtonText || 'Cancel'), function () { close({ isDismissed: true, dismiss: 'cancel' }); }) : null;
            if (o.showDenyButton) btn('rs-pop-alt', lbl(o.denyButtonText || 'No'), function () { close({ isDenied: true, value: false }); });
            var ok = o.showConfirmButton === false ? null : btn(o.danger ? 'btn-danger' : ways && !cancel ? 'rs-pop-ghost rs-pop-close' : 'btn-primary',
                lbl(o.confirmButtonText || (ways ? 'Close' : 'OK')), confirm);

            function confirm() {
                if (c.wait || cur !== c) return;
                var v = inp ? inp.value : true;
                invalid('');
                c.wait = true;
                Promise.resolve(inp && o.inputValidator ? o.inputValidator(v) : null)
                    .then(function (err) {
                        if (err) return invalid(err);
                        return Promise.resolve(o.preConfirm ? o.preConfirm(v) : undefined).then(function (pv) {
                            if (pv !== false && !c.bad) close({ isConfirmed: true, value: pv === undefined ? v : pv });
                        });
                    })
                    .catch(function (e) { invalid((e && e.message) || 'Something went wrong'); })
                    .finally(function () { c.wait = false; });
            }
            function trap(e) {
                var f = [].filter.call(pop.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]'),
                    function (x) { return x.offsetParent !== null && x.tabIndex > -1; });
                if (!f.length) return;
                var a = f[0], z = f[f.length - 1], at = document.activeElement;
                if (!pop.contains(at) || (e.shiftKey ? at === a : at === z)) { e.preventDefault(); (e.shiftKey && pop.contains(at) ? z : a).focus(); }
            }

            c = { wrap: wrap, pop: pop, inp: inp, msg: pop.querySelector('.rs-pop-msg'), res: res, title: o.title, back: (was && was.back) || document.activeElement, bad: false };
            c.key = function (e) {
                if (cur !== c || document.querySelector('.sd-panel, .searchable-dropdown-list')) return;   // an open dropdown handles its own keys
                var free = !pop.classList.contains('rs-pop-busy');
                if (e.key === 'Escape' && free && o.allowEscapeKey !== false) { e.preventDefault(); e.stopPropagation(); close({ isDismissed: true, dismiss: 'esc' }); }
                else if (e.key === 'Enter' && inp && e.target === inp && inp.tagName === 'INPUT') { e.preventDefault(); e.stopPropagation(); confirm(); }
                else if (e.key === 'Tab') trap(e);
            };
            var x = pop.querySelector('.rs-pop-x');
            if (x) x.onclick = function () { close({ isDismissed: true, dismiss: 'close' }); };
            wrap.addEventListener('mousedown', function (e) { c.down = e.target === wrap; });
            wrap.addEventListener('click', function (e) {
                if (e.target === wrap && c.down && o.allowOutsideClick !== false && !pop.classList.contains('rs-pop-busy')) close({ isDismissed: true, dismiss: 'backdrop' });
            });

            wrap.appendChild(pop);
            document.body.appendChild(wrap);
            document.body.classList.add('rs-pop-open');
            cur = c;
            document.addEventListener('keydown', c.key, true);
            if (inp && o.input === 'select' && window.rsSelect) rsSelect(inp);   // searchable, like every other picker
            var first = inp ? (o.input === 'select' && inp.parentNode.querySelector('.sd-trigger')) || inp : (o.focusCancel && cancel) || (ways && ok) || foot.querySelector('.btn-primary, .btn-danger') || ok || x;
            if (first) try { first.focus({ preventScroll: true }); } catch (e) {}
            if (o.didOpen) o.didOpen(pop);
            if (o.timer) setTimeout(function () { if (cur === c) close({ isDismissed: true, dismiss: 'timer' }); }, o.timer);
        });
    }

    var api = function (a, b, c) { return open(a && typeof a === 'object' ? a : { title: a, text: b, icon: c }); };
    api.toast = function (title, icon, text) { return toast({ title: title, icon: icon || 'info', text: text }); };
    api.confirm = function (o) {
        return open(Object.assign({ icon: o.danger ? 'warning' : 'question', showCancelButton: true, confirmButtonText: o.yes || 'Yes', cancelButtonText: o.no || 'Cancel', focusCancel: !!o.danger }, o))
            .then(function (r) { return r.isConfirmed; });
    };
    api.ask = function (o) {   // one field -> value, or null when dismissed
        return open(Object.assign({ icon: 'question', input: o.type || 'text', inputLabel: o.label, inputValue: o.value, inputPlaceholder: o.placeholder, inputOptions: o.options,
            inputValidator: o.validate, showCancelButton: true, confirmButtonText: o.yes || 'Save' }, o)).then(function (r) { return r.isConfirmed ? r.value : null; });
    };
    api.close = function () { stopBusy(); close({ isDismissed: true }); };
    api.loading = loading;
    api.invalid = invalid;
    api.isOpen = function () { return !!(cur || busy); };
    return api;
})();

// refused replies can carry help {title, steps, acts}; a popup showing that same message picks it up (for call sites that only have the string)
var rsLastHelp = null;
function rsKeepHelp(j) { if (j && j.help && j.message) rsLastHelp = { m: j.message, h: j.help }; return j; }   // call it on every API reply (rsApi / gsCall)
function rsHelpFor(msg) { return rsLastHelp && msg && rsLastHelp.m === msg ? rsLastHelp.h : null; }

function rsOk(msg) { rsPop({ toast: true, icon: 'success', title: msg, timer: 2200 }); }
// msg = text or the api reply itself; help comes from the reply when the server sent one
function rsErr(msg, title, help) {
    if (msg && typeof msg === 'object') { help = msg.help; msg = msg.message; }
    return rsPop({ icon: 'error', title: title || 'Not saved', text: msg || 'Something went wrong', help: help || rsHelpFor(msg) });
}
function rsAsk(title, text, yes, danger) { return rsPop.confirm({ title: title, text: text || '', yes: yes || 'Yes', danger: !!danger }); }
// <a onclick="return rsConfirmLink(event, this, 'Reset?', 'There is no undo.', 'Reset')"> — asks in the popup, then follows the link
function rsConfirmLink(e, a, title, text, yes) {
    if (e) e.preventDefault();
    rsAsk(title, text || '', yes || 'Continue', true).then(function (y) { if (y) location.href = a.href; });
    return false;
}
