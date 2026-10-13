/* =========================================================
   KMK Campus — stockage local, session, utilitaires
   ========================================================= */
(function () {
  var DB_KEY = 'kmk-demo-db-v1';
  var SES_KEY = 'kmk-demo-session';
  var MFA_KEY = 'kmk-demo-mfa';
  var mem = {};

  function store(kind) {
    try { var s = window[kind]; var t = '__kmk'; s.setItem(t, t); s.removeItem(t); return s; } catch (e) { return null; }
  }
  var LS = store('localStorage'), SS = store('sessionStorage');
  function get(s, k) { try { return s ? s.getItem(k) : (mem[k] || null); } catch (e) { return mem[k] || null; } }
  function set(s, k, v) { try { if (s) s.setItem(k, v); else mem[k] = v; } catch (e) { mem[k] = v; } }
  function del(s, k) { try { if (s) s.removeItem(k); else delete mem[k]; } catch (e) { delete mem[k]; } }

  /* ---------- base de données ---------- */
  var db = null;
  function load() {
    var raw = get(LS, DB_KEY);
    if (raw) { try { db = JSON.parse(raw); } catch (e) { db = null; } }
    if (!db || db.version !== 1) { db = window.KMK_SEED(); save(); }
    return db;
  }
  function save() { set(LS, DB_KEY, JSON.stringify(db)); }
  function reset() { db = window.KMK_SEED(); save(); del(SS, SES_KEY); del(LS, SES_KEY); del(SS, MFA_KEY); }

  /* ---------- utilitaires ---------- */
  var seq = 0;
  function uid(p) { seq++; return (p || 'id') + '-' + Date.now().toString(36) + seq.toString(36); }
  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  /* « maintenant » de la démo : la date fixe de la maquette, l'heure réelle */
  function nowISO() { var d = new Date(); return window.KMK_DEMO_TODAY + 'T' + pad(d.getHours()) + ':' + pad(d.getMinutes()); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function parse(iso) {
    var p = String(iso).split(/[-T:]/);
    return new Date(+p[0], (+p[1] || 1) - 1, +p[2] || 1, +p[3] || 0, +p[4] || 0);
  }
  var MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  var DAYS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
  var fmt = {
    num: function (v, d) { if (v == null || isNaN(v)) return '—'; return Number(v).toFixed(d == null ? 1 : d).replace('.', ','); },
    money: function (v) { return Math.round(v).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0') + '\u00a0€'; },
    date: function (iso) { var d = parse(iso); return pad(d.getDate()) + '/' + pad(d.getMonth() + 1); },
    dateY: function (iso) { var d = parse(iso); return pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear(); },
    long: function (iso) { var d = parse(iso); return DAYS[d.getDay()] + ' ' + d.getDate() + ' ' + MONTHS[d.getMonth()]; },
    longY: function (iso) { var d = parse(iso); return d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear(); },
    time: function (iso) { var d = parse(iso); return pad(d.getHours()) + ':' + pad(d.getMinutes()); },
    day: function (iso) { return DAYS[parse(iso).getDay()]; },
    rel: function (iso) {
      var diff = (parse(nowISO()) - parse(iso)) / 60000;
      if (diff < 1) return 'à l’instant';
      if (diff < 60) return 'il y a ' + Math.round(diff) + ' min';
      var d0 = parse(window.KMK_DEMO_TODAY), d = parse(iso);
      var days = Math.round((d0 - new Date(d.getFullYear(), d.getMonth(), d.getDate())) / 86400000);
      if (days <= 0) return 'aujourd’hui ' + fmt.time(iso);
      if (days === 1) return 'hier ' + fmt.time(iso);
      if (days < 7) return 'il y a ' + days + ' j';
      return fmt.date(iso);
    },
    pct: function (v) { return Math.round(v) + ' %'; }
  };
  function daysBetween(a, b) { return Math.round((parse(b) - parse(a)) / 86400000); }
  function addDays(iso, n) { var d = parse(iso); d.setDate(d.getDate() + n); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }

  /* ---------- requêtes métier ---------- */
  function user(id) { return db.users.filter(function (u) { return u.id === id; })[0] || null; }
  function userByEmail(email) { email = String(email || '').trim().toLowerCase(); return db.users.filter(function (u) { return u.email.toLowerCase() === email; })[0] || null; }
  function student(id) { return db.students.filter(function (s) { return s.id === id; })[0] || null; }
  function userOfStudent(sid) { return db.users.filter(function (u) { return u.studentId === sid; })[0] || null; }
  function parentsOf(sid) { return db.users.filter(function (u) { return u.childId === sid; }); }
  function studentGrades(sid) { return db.grades.filter(function (g) { return g.studentId === sid; }); }
  function moduleAvgs(sid) {
    var out = {};
    studentGrades(sid).forEach(function (g) { (out[g.module] = out[g.module] || []).push(g.value); });
    Object.keys(out).forEach(function (m) { var a = out[m]; out[m] = a.reduce(function (x, y) { return x + y; }, 0) / a.length; });
    return out;
  }
  function studentAvg(sid) {
    var m = moduleAvgs(sid), keys = Object.keys(m);
    if (!keys.length) { var s = student(sid); return s ? s.avg : null; }
    var tot = 0, w = 0;
    keys.forEach(function (k) { var e = (window.KMK_MODULES[k] || {}).ects || 1; tot += m[k] * e; w += e; });
    return tot / w;
  }
  function invoiceStatus(inv) {
    if (inv.paidAt) return 'paye';
    var d = daysBetween(window.KMK_DEMO_TODAY, inv.due);
    if (d < 0) return 'retard';
    if (d <= 30) return 'a_payer';
    return 'a_venir';
  }
  function sessionsFor(opts) {
    return db.sessions.filter(function (s) {
      if (opts.teacherId && s.teacherId !== opts.teacherId) return false;
      if (opts.group && s.groups.indexOf(opts.group) < 0) return false;
      return true;
    });
  }
  function roster(group, formation) {
    return db.students.filter(function (s) { return s.group === group && s.formation === (formation || 'Licence Informatique') && s.level === 'L2'; });
  }

  /* ---------- journal & notifications ---------- */
  function audit(action, detail, userId) {
    var ses = currentSession();
    db.audit.unshift({ at: nowISO(), userId: userId || (ses && ses.userId) || null, action: action, detail: detail, ip: '192.168.1.' + (10 + db.audit.length % 80) });
    if (db.audit.length > 300) db.audit.length = 300;
  }
  function notify(to, n) {
    if (!to || !to.length) return;
    db.notifications.unshift({ id: uid('n'), to: to, title: n.title, body: n.body || '', icon: n.icon || 'bell', tone: n.tone || 'blue', route: n.route || '', at: nowISO(), readBy: [] });
  }
  function notifsFor(uid_) {
    return db.notifications.filter(function (n) { return n.to.indexOf(uid_) >= 0; });
  }
  function isRead(n, uid_) { return (n.readBy || []).indexOf(uid_) >= 0; }
  function unreadCount(uid_) { return notifsFor(uid_).filter(function (n) { return !isRead(n, uid_); }).length; }
  function markRead(id, uid_) {
    db.notifications.forEach(function (n) { if (n.id === id) { n.readBy = n.readBy || []; if (n.readBy.indexOf(uid_) < 0) n.readBy.push(uid_); } });
    save();
  }
  function markAllRead(uid_) {
    notifsFor(uid_).forEach(function (n) { n.readBy = n.readBy || []; if (n.readBy.indexOf(uid_) < 0) n.readBy.push(uid_); });
    save();
  }

  /* ---------- authentification ---------- */
  var MAX_FAILS = 5, LOCK_SEC = 30;
  function lockInfo(email) {
    db.lock = db.lock || {};
    var l = db.lock[String(email).toLowerCase()];
    if (!l) return { fails: 0, remaining: 0 };
    var rem = l.until ? Math.ceil((l.until - Date.now()) / 1000) : 0;
    return { fails: l.fails || 0, remaining: rem > 0 ? rem : 0 };
  }
  function login(email, password) {
    load();
    var key = String(email).trim().toLowerCase();
    var li = lockInfo(key);
    if (li.remaining > 0) return { ok: false, locked: li.remaining };
    var u = userByEmail(key);
    if (!u || u.password !== password) {
      db.lock[key] = db.lock[key] || { fails: 0 };
      db.lock[key].fails++;
      var left = MAX_FAILS - db.lock[key].fails;
      if (left <= 0) { db.lock[key] = { fails: 0, until: Date.now() + LOCK_SEC * 1000 }; }
      if (u) audit('auth.fail', 'Mot de passe incorrect', u.id);
      save();
      return { ok: false, error: !u ? 'unknown' : 'password', left: Math.max(left, 0), locked: left <= 0 ? LOCK_SEC : 0 };
    }
    delete db.lock[key];
    save();
    var mfaRequired = u.mfa || (db.settings.mfaStaff && ['formateur', 'direction', 'finance'].indexOf(u.role) >= 0);
    return { ok: true, user: u, mfa: mfaRequired };
  }
  function startMfa(u, remember) {
    var code = String(Math.floor(100000 + Math.random() * 900000));
    set(SS, MFA_KEY, JSON.stringify({ userId: u.id, code: code, exp: Date.now() + 5 * 60000, remember: !!remember, tries: 0 }));
    return code;
  }
  function pendingMfa() { var r = get(SS, MFA_KEY); try { return r ? JSON.parse(r) : null; } catch (e) { return null; } }
  function verifyMfa(code) {
    var p = pendingMfa();
    if (!p) return { ok: false, error: 'expired' };
    if (Date.now() > p.exp) { del(SS, MFA_KEY); return { ok: false, error: 'expired' }; }
    if (String(code) !== p.code) {
      p.tries++; set(SS, MFA_KEY, JSON.stringify(p));
      if (p.tries >= 3) { del(SS, MFA_KEY); return { ok: false, error: 'toomany' }; }
      return { ok: false, error: 'bad', left: 3 - p.tries };
    }
    del(SS, MFA_KEY);
    var u = user(p.userId);
    openSession(u, p.remember, true);
    return { ok: true, user: u };
  }
  function openSession(u, remember, viaMfa) {
    var s = { userId: u.id, at: Date.now(), exp: Date.now() + (remember ? 7 * 86400000 : 8 * 3600000), remember: !!remember, mfa: !!viaMfa,
      device: (navigator.userAgent.indexOf('Mobile') >= 0 ? 'Mobile' : 'Navigateur web') };
    del(SS, SES_KEY); del(LS, SES_KEY);
    set(remember ? LS : SS, SES_KEY, JSON.stringify(s));
    audit('auth.login', 'Connexion réussie' + (viaMfa ? ' (MFA)' : ''), u.id);
    if (viaMfa && u.mfa) db.flags.mfa = true;
    save();
    return s;
  }
  function currentSession() {
    var raw = get(SS, SES_KEY) || get(LS, SES_KEY);
    if (!raw) return null;
    try { var s = JSON.parse(raw); if (Date.now() > s.exp) { logout(true); return null; } return s; } catch (e) { return null; }
  }
  function currentUser() { var s = currentSession(); return s ? user(s.userId) : null; }
  function logout(silent) {
    var s = null; try { s = JSON.parse(get(SS, SES_KEY) || get(LS, SES_KEY)); } catch (e) {}
    if (s && !silent && db) { audit('auth.logout', 'Déconnexion', s.userId); save(); }
    del(SS, SES_KEY); del(LS, SES_KEY);
  }
  function passwordScore(p) {
    var s = 0; if (!p) return 0;
    if (p.length >= 8) s++; if (p.length >= 12) s++;
    if (/[A-Z]/.test(p) && /[a-z]/.test(p)) s++;
    if (/\d/.test(p)) s++; if (/[^A-Za-z0-9]/.test(p)) s++;
    return Math.min(s, 4);
  }

  /* ---------- fichiers téléchargés / imprimés ---------- */
  function download(name, content, type) {
    var blob = new Blob([content], { type: type || 'text/plain;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 400);
  }
  function csv(rows) {
    return '﻿' + rows.map(function (r) {
      return r.map(function (c) { c = String(c == null ? '' : c); return /[;"\n]/.test(c) ? '"' + c.replace(/"/g, '""') + '"' : c; }).join(';');
    }).join('\n');
  }

  load();
  window.addEventListener('storage', function (e) { if (e.key === DB_KEY && e.newValue) { try { db = JSON.parse(e.newValue); } catch (x) {} if (window.KMK && KMK.onExternalChange) KMK.onExternalChange(); } });

  window.KMK = window.KMK || {};
  KMK.db = function () { return db; };
  KMK.store = { load: load, save: save, reset: reset };
  KMK.util = { uid: uid, esc: esc, nowISO: nowISO, parse: parse, pad: pad, daysBetween: daysBetween, addDays: addDays, download: download, csv: csv, MONTHS: MONTHS, DAYS: DAYS };
  KMK.fmt = fmt;
  KMK.q = { user: user, userByEmail: userByEmail, student: student, userOfStudent: userOfStudent, parentsOf: parentsOf, grades: studentGrades,
    moduleAvgs: moduleAvgs, studentAvg: studentAvg, invoiceStatus: invoiceStatus, sessionsFor: sessionsFor, roster: roster };
  KMK.log = audit;
  KMK.notify = notify;
  KMK.notifs = { forUser: notifsFor, isRead: isRead, unread: unreadCount, read: markRead, readAll: markAllRead };
  KMK.auth = { login: login, startMfa: startMfa, pendingMfa: pendingMfa, verifyMfa: verifyMfa, openSession: openSession,
    session: currentSession, user: currentUser, logout: logout, lockInfo: lockInfo, score: passwordScore };
})();
