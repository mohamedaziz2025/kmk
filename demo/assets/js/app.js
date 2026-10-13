/* =========================================================
   KMK Campus — application : routeur, rôles, interface
   ========================================================= */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var U = KMK.util, esc = U.esc, fmt = KMK.fmt;

  var ROUTES = {}, ACTIONS = {};
  var ctx = null, cur = { path: '', params: {} }, pendingRefresh = false;

  /* ---------------------------------------------------------
     Navigation par rôle (« |Titre » = séparateur)
     --------------------------------------------------------- */
  var NAV = {
    etudiant:  ['tableau-de-bord', 'ia', 'emploi-du-temps', 'notes', 'absences', '|Démarches', 'demandes', 'documents', 'finances', '|Vie étudiante', 'evenements', 'messagerie', 'notifications'],
    formateur: ['tableau-de-bord', 'ia', 'emploi-du-temps', '|Pédagogie', 'appel', 'saisie-notes', 'groupes', '|Échanges', 'messagerie', 'notifications'],
    scolarite: ['tableau-de-bord', 'ia', '|Administration', 'demandes', 'justificatifs', 'etudiants', '|Communication', 'annonces', 'automatisations', 'messagerie', '|Sécurité', 'securite'],
    direction: ['tableau-de-bord', 'ia', '|Pilotage', 'early-warning', 'formations', 'etudiants', 'encaissements', 'rapports', '|Gouvernance', 'securite', 'messagerie'],
    finance:   ['tableau-de-bord', 'ia', '|Finances', 'echeances', 'encaissements', 'etudiants', 'rapports', '|Échanges', 'messagerie', 'notifications'],
    parent:    ['tableau-de-bord', 'ia', '|Scolarité', 'notes', 'absences', 'emploi-du-temps', 'finances', '|Échanges', 'messagerie', 'notifications']
  };
  var HOME = 'tableau-de-bord';

  function route(path, def) { def.path = path; ROUTES[path] = def; }

  /* écran partagé : même chemin, rendu propre à chaque rôle */
  var PARTS = {};
  function part(path, roles, impl, meta) {
    meta = meta || {};
    if (!ROUTES[path]) {
      PARTS[path] = {};
      route(path, {
        roles: [], label: {}, icon: {},
        title: function (c) { var i = PARTS[path][c.role]; return i && i.title ? i.title(c) : label(ROUTES[path], c.role); },
        sub: function (c) { var i = PARTS[path][c.role]; return i && i.sub ? i.sub(c) : ''; },
        badge: function (c) { var i = PARTS[path][c.role]; return i && i.badge ? i.badge(c) : 0; },
        render: function (c) { return PARTS[path][c.role].render(c); },
        mount: function (el, c) { var i = PARTS[path][c.role]; if (i.mount) i.mount(el, c); }
      });
    }
    var d = ROUTES[path];
    roles.forEach(function (r) {
      PARTS[path][r] = impl;
      if (d.roles.indexOf(r) < 0) d.roles.push(r);
      d.label[r] = meta.label || impl.label; if (!d.label['*']) d.label['*'] = d.label[r];
      d.icon[r] = meta.icon || impl.icon; if (!d.icon['*']) d.icon['*'] = d.icon[r];
    });
  }
  function label(def, role) { return typeof def.label === 'object' ? (def.label[role] || def.label['*']) : def.label; }

  /* ---------------------------------------------------------
     Icônes et fragments HTML
     --------------------------------------------------------- */
  function hydrate(root) {
    $$('[data-ic]', root).forEach(function (el) {
      var size = +(el.getAttribute('data-ic-size') || 18);
      var svg = icon(el.getAttribute('data-ic'), size);
      if (el.tagName === 'SPAN' && !el.childNodes.length && el.attributes.length === 1) el.outerHTML = svg;
      else { el.insertAdjacentHTML('afterbegin', svg); el.removeAttribute('data-ic'); }
    });
  }

  var TONES = { blue: ['var(--soft)', 'var(--g700)'], amber: ['var(--ambersoft)', '#B4700F'], red: ['var(--redsoft)', '#B23434'], green: ['var(--greensoft)', '#167A53'], grey: ['#EFF3F9', 'var(--mu)'], dark: ['var(--g900)', '#fff'] };
  var H = {
    pill: function (t, tone, ic) { return '<span class="pill ' + (tone || 'grey') + '">' + (ic ? icon(ic, 12) : '') + esc(t) + '</span>'; },
    av: function (initials, color, cls) {
      var st = color ? ' style="background:' + color + '1f;color:' + color + '"' : '';
      return '<span class="av ' + (cls || '') + '"' + st + '>' + esc(initials) + '</span>';
    },
    who: function (name, sub, initials, color) {
      return '<div class="who">' + H.av(initials || name.split(' ').map(function (w) { return w[0]; }).join('').slice(0, 2), color) +
        '<div><div class="n">' + esc(name) + '</div>' + (sub ? '<div class="s">' + esc(sub) + '</div>' : '') + '</div></div>';
    },
    kpi: function (o) {
      var a = o.go ? ' click" data-go="' + o.go + '" role="link" tabindex="0' : '';
      return '<div class="card kpi' + a + '"><div class="l">' + icon(o.icon, 15) + esc(o.label) + '</div><div class="v">' + o.value + '</div>' +
        (o.delta ? '<div class="d ' + (o.tone || '') + '">' + o.delta + '</div>' : '') + '</div>';
    },
    card: function (title, right, body, cls) {
      return '<div class="card ' + (cls || '') + '"><div class="ch"><h3>' + title + '</h3>' + (right || '') + '</div>' + body + '</div>';
    },
    li: function (o) {
      var t = TONES[o.tone || 'blue'];
      var attrs = o.go ? ' click" data-go="' + o.go + '" role="link" tabindex="0' : (o.act ? ' click" data-act="' + o.act + '"' + (o.data || '') + ' role="button" tabindex="0' : '');
      return '<div class="li' + attrs + '">' + (o.icon ? '<span class="ico" style="background:' + t[0] + ';color:' + t[1] + '">' + icon(o.icon, 16) + '</span>' : '') +
        '<div class="tx"><div class="tt">' + o.title + '</div>' + (o.sub ? '<div class="ss">' + o.sub + '</div>' : '') + '</div>' + (o.right || '') + '</div>';
    },
    empty: function (ic, title, text, btn) {
      return '<div class="empty">' + icon(ic, 30) + '<b>' + esc(title) + '</b>' + (text ? '<span>' + text + '</span>' : '') + (btn || '') + '</div>';
    },
    ring: function (pct, size, stroke, color, inner) {
      var r = (size - stroke) / 2, c = 2 * Math.PI * r, p = Math.max(0, Math.min(100, pct));
      return '<span class="ring" style="width:' + size + 'px;height:' + size + 'px"><svg width="' + size + '" height="' + size + '" aria-hidden="true">' +
        '<circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" fill="none" stroke="#E9EEF7" stroke-width="' + stroke + '"/>' +
        '<circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" fill="none" stroke="' + (color || 'var(--g500)') + '" stroke-width="' + stroke + '" stroke-linecap="round" stroke-dasharray="' + c.toFixed(1) + '" stroke-dashoffset="' + (c * (1 - p / 100)).toFixed(1) + '"/></svg>' +
        '<span class="rv">' + inner + '</span></span>';
    },
    /* items : [{l, v, v2, on, tip, tip2}] — v2 = série de comparaison */
    bars: function (items, max, h) {
      max = max || Math.max.apply(null, items.map(function (i) { return Math.max(i.v, i.v2 || 0); })) || 1;
      return '<div class="bars"' + (h ? ' style="height:' + h + 'px"' : '') + '>' + items.map(function (i) {
        return '<div class="bcol"><div class="bwrap">' +
          '<i class="' + (i.on ? 'on' : '') + '" style="height:' + Math.max(3, i.v / max * 100) + '%" data-v="' + esc(i.tip || i.v) + '"></i>' +
          (i.v2 != null ? '<i class="alt" style="height:' + Math.max(3, i.v2 / max * 100) + '%" data-v="' + esc(i.tip2 || i.v2) + '"></i>' : '') +
          '</div><span>' + esc(i.l) + '</span></div>';
      }).join('') + '</div>';
    },
    progress: function (labelTxt, val, pct, color) {
      return '<div class="ob"><div class="obl"><span>' + labelTxt + '</span><b>' + val + '</b></div><div class="bar"><i style="width:' + Math.min(100, pct) + '%' + (color ? ';background:' + color : '') + '"></i></div></div>';
    },
    stagePill: function (r) {
      if (r.rejected) return H.pill('Refusée', 'red', 'x');
      var tones = ['grey', 'blue', 'amber', 'green', 'solid'];
      return H.pill(KMK_STAGES[r.stage].label, tones[r.stage]);
    },
    invPill: function (inv) {
      var s = KMK.q.invoiceStatus(inv);
      return { paye: H.pill('Réglé', 'green', 'check'), retard: H.pill('En retard', 'red'), a_payer: H.pill('À payer', 'amber'), a_venir: H.pill('À venir', 'grey') }[s];
    },
    absPill: function (a) {
      return { a_justifier: H.pill('À justifier', 'amber'), en_attente: H.pill('En validation', 'blue'), justifiee: H.pill('Justifiée', 'green', 'check'), refusee: H.pill('Refusée', 'red') }[a.status];
    },
    riskPill: function (score) {
      return score >= 65 ? H.pill('Élevé', 'red') : score >= 40 ? H.pill('Moyen', 'amber') : H.pill('Faible', 'green');
    },
    riskColor: function (score) { return score >= 65 ? '#C0392B' : score >= 40 ? '#E0912A' : '#1257E0'; }
  };

  /* ---------------------------------------------------------
     Toasts
     --------------------------------------------------------- */
  function toast(msg, kind) {
    var t = document.createElement('div');
    t.className = 'toast' + (kind === 'err' ? ' err' : '');
    t.innerHTML = icon(kind === 'err' ? 'alert-triangle' : (kind === 'info' ? 'info' : 'check-circle-2'), 17) + '<span>' + msg + '</span>';
    $('#toasts').appendChild(t);
    while ($('#toasts').children.length > 3) $('#toasts').firstChild.remove();
    setTimeout(function () { t.classList.add('out'); setTimeout(function () { t.remove(); }, 260); }, 3400);
  }

  /* ---------------------------------------------------------
     Couches : modale, tiroir, popovers, palette
     --------------------------------------------------------- */
  var layers = [];
  function showMask() { $('#mask').classList.add('on'); }
  function hideMaskIfIdle() { if (!$('#modal.on') && !$('#drawer.on') && !$('#palette.on')) $('#mask').classList.remove('on'); }

  var modalCfg = null;
  function openModal(o) {
    var m = $('#modal');
    if (m.classList.contains('on')) closeModal(true);
    m.className = 'modal' + (o.wide ? ' wide' : '');
    m.innerHTML = '<div class="mh"><div><div class="t">' + o.title + '</div>' + (o.sub ? '<div class="s">' + o.sub + '</div>' : '') + '</div>' +
      '<button class="ibtn" type="button" data-act="close-modal" aria-label="Fermer">' + icon('x', 16) + '</button></div>' +
      '<div class="mb2">' + o.body + '</div>' + (o.foot ? '<div class="mf">' + o.foot + '</div>' : '');
    hydrate(m);
    modalCfg = { onClose: o.onClose, prev: document.activeElement };
    showMask(); m.offsetWidth; m.classList.add('on');
    if (o.onMount) o.onMount(m);
    var f = $('input:not([type=hidden]):not([disabled]),select,textarea', m) || $('.mf .btn', m);
    if (f) setTimeout(function () { f.focus(); }, 80);
    layers.push('modal');
    return m;
  }
  function closeModal(silent) {
    var m = $('#modal'); if (!m.classList.contains('on')) return;
    m.classList.remove('on');
    layers = layers.filter(function (l) { return l !== 'modal'; });
    var cfg = modalCfg; modalCfg = null;
    hideMaskIfIdle();
    if (cfg && cfg.onClose && !silent) cfg.onClose();
    if (cfg && cfg.prev && cfg.prev.focus && !silent) try { cfg.prev.focus(); } catch (e) {}
  }
  function confirmBox(o) {
    return new Promise(function (resolve) {
      var done = false;
      openModal({
        title: o.title, body: '<p style="color:var(--mu);line-height:1.6">' + o.body + '</p>',
        foot: '<button class="btn ghost" type="button" data-r="0">Annuler</button><button class="btn ' + (o.danger ? 'danger' : '') + '" type="button" data-r="1">' + (o.ok || 'Confirmer') + '</button>',
        onMount: function (m) { $$('[data-r]', m).forEach(function (b) { b.addEventListener('click', function () { done = true; closeModal(true); resolve(b.dataset.r === '1'); }); }); },
        onClose: function () { if (!done) resolve(false); }
      });
    });
  }
  function openDrawer(o) {
    var d = $('#drawer');
    d.innerHTML = '<div class="mh"><div style="min-width:0">' + o.title + '</div><button class="ibtn" type="button" data-act="close-drawer" aria-label="Fermer">' + icon('x', 16) + '</button></div>' +
      '<div class="mb2">' + o.body + '</div>' + (o.foot ? '<div class="mf">' + o.foot + '</div>' : '');
    hydrate(d);
    showMask(); d.classList.add('on');
    if (layers.indexOf('drawer') < 0) layers.push('drawer');
    if (o.onMount) o.onMount(d);
    setTimeout(function () { var b = $('.mh .ibtn', d); if (b) b.focus(); }, 60);
  }
  function closeDrawer() { $('#drawer').classList.remove('on'); layers = layers.filter(function (l) { return l !== 'drawer'; }); hideMaskIfIdle(); }

  function placePop(p) { var r = $('#topbar').getBoundingClientRect(); p.style.top = (r.bottom + 6) + 'px'; }
  function closePops() { $('#popNotif').classList.remove('on'); $('#popUser').classList.remove('on'); }

  /* ---------------------------------------------------------
     Rendu de l’interface fixe (barre latérale, en-tête)
     --------------------------------------------------------- */
  function buildCtx() {
    var me = KMK.auth.user();
    if (!me) return null;
    var sid = me.studentId || me.childId || null;
    return { me: me, role: me.role, R: KMK_ROLES[me.role], sid: sid, stu: sid ? KMK.q.student(sid) : null, params: cur.params, db: KMK.db(), session: KMK.auth.session() };
  }

  function renderChrome() {
    var c = ctx, items = NAV[c.role] || [];
    $('#roleChip').innerHTML = icon(c.R.icon, 16) + '<span><b>' + esc(c.R.space) + '</b>' + (c.role === 'parent' && c.stu ? '<br><span style="font-size:11px;color:#8FB3EA">Suivi de ' + esc(c.stu.name) + '</span>' : '') + '</span>';
    $('#nav').innerHTML = items.map(function (p) {
      if (p[0] === '|') return '<div class="sep">' + esc(p.slice(1)) + '</div>';
      var d = ROUTES[p]; if (!d) return '';
      var n = d.badge ? d.badge(c) : 0;
      return '<a href="#/' + p + '" data-path="' + p + '" class="' + (cur.path === p ? 'on' : '') + '">' + icon(typeof d.icon === 'object' ? (d.icon[c.role] || d.icon['*']) : d.icon, 17) +
        '<span>' + esc(label(d, c.role)) + '</span>' + (n ? '<span class="cnt">' + n + '</span>' : '') + '</a>';
    }).join('');
    $('#sfoot').innerHTML = '<span class="av">' + esc(c.me.initials) + '</span><div><div class="n">' + esc(c.me.name) + '</div><div class="r">' + esc(c.me.title) + '</div></div>' +
      '<button type="button" data-act="logout" aria-label="Se déconnecter" title="Se déconnecter">' + icon('log-out', 16) + '</button>';
    var unread = KMK.notifs.unread(c.me.id);
    $('#bellBtn').innerHTML = icon('bell', 18) + (unread ? '<span class="badge">' + (unread > 9 ? '9+' : unread) + '</span>' : '');
    $('#bellBtn').setAttribute('aria-label', 'Notifications' + (unread ? ' (' + unread + ' non lues)' : ''));
    $('#userBtn').innerHTML = '<span class="av" style="background:' + c.R.color + '1f;color:' + c.R.color + '">' + esc(c.me.initials) + '</span><span><span class="n">' + esc(c.me.name) + '</span><span class="r">' + esc(c.R.label) + '</span></span>' + icon('chevron-down', 15);
    renderGuideFab();
    if ($('#popNotif').classList.contains('on')) renderNotifPop();
  }

  /* ---------------------------------------------------------
     Routeur
     --------------------------------------------------------- */
  function parseHash() {
    var h = location.hash.replace(/^#\/?/, ''), parts = h.split('?'), params = {};
    if (parts[1]) new URLSearchParams(parts[1]).forEach(function (v, k) { params[k] = v; });
    return { path: decodeURIComponent(parts[0] || ''), params: params };
  }
  function navigate(path, params) {
    var qs = params ? '?' + new URLSearchParams(params).toString() : '';
    var h = '#/' + path + qs;
    if (location.hash === h) render(); else location.hash = h;
  }
  function canSee(path, role) { var d = ROUTES[path]; return !!d && d.roles.indexOf(role) >= 0; }

  function render(keepScroll) {
    var p = parseHash();
    cur = p;
    ctx = buildCtx();
    if (!ctx) { location.replace('index.html?expired=1'); return; }
    if (!p.path) { navigate(HOME); return; }
    var def = ROUTES[p.path], html, title, sub;
    var main = $('#main'), scroll = main.scrollTop;
    if (!def) {
      title = 'Page introuvable'; sub = '';
      html = '<div class="denied"><div class="ic" style="background:var(--soft);color:var(--g700)">' + icon('compass', 30) + '</div><h2>Cette page n’existe pas</h2><p>Le lien « ' + esc(p.path) + ' » ne correspond à aucun écran.</p><button class="btn" data-go="' + HOME + '">' + icon('home', 16) + 'Retour à l’accueil</button></div>';
    } else if (def.roles.indexOf(ctx.role) < 0) {
      title = 'Accès refusé'; sub = 'Contrôle des droits KMK ID';
      var allowed = def.roles.map(function (r) { return KMK_ROLES[r].label; }).join(', ');
      html = '<div class="denied"><div class="ic">' + icon('lock', 30) + '</div><h2>Accès réservé</h2><p>L’écran « ' + esc(label(def, def.roles[0])) + ' » est réservé aux profils : <b>' + esc(allowed) + '</b>.<br>Votre profil <b>' + esc(ctx.R.label) + '</b> n’y a pas accès — la tentative est inscrite au journal d’audit.</p>' +
        '<div class="hstack" style="justify-content:center"><button class="btn" data-go="' + HOME + '">' + icon('home', 16) + 'Mon accueil</button><button class="btn ghost" data-act="switch-role">' + icon('users', 16) + 'Changer de profil</button></div></div>';
      if (!keepScroll) { KMK.log('access.denied', 'Accès refusé à « ' + p.path + ' »'); KMK.store.save(); }
    } else {
      title = def.title ? (typeof def.title === 'function' ? def.title(ctx) : def.title) : label(def, ctx.role);
      sub = def.sub ? def.sub(ctx) : '';
      try { html = def.render(ctx); }
      catch (err) { console.error(err); html = H.empty('alert-triangle', 'Erreur d’affichage', esc(err.message)); }
    }
    var stage = $('#stage');
    stage.innerHTML = html;
    if (!keepScroll) { stage.classList.remove('view-enter'); stage.offsetWidth; stage.classList.add('view-enter'); }
    hydrate(stage);
    $('#pageTitle').textContent = title;
    $('#pageSub').textContent = sub || '';
    document.title = title + ' · KMK Campus';
    renderChrome();
    if (def && def.mount && def.roles.indexOf(ctx.role) >= 0) def.mount(stage, ctx);
    if (keepScroll) main.scrollTop = scroll; else main.scrollTop = 0;
    document.body.classList.remove('nav-open');
    closePops();
  }
  function refresh() {
    var a = document.activeElement;
    if (a && $('#stage').contains(a) && /INPUT|TEXTAREA|SELECT/.test(a.tagName)) { pendingRefresh = true; return; }
    render(true);
  }
  document.addEventListener('focusout', function () { if (pendingRefresh) setTimeout(function () { var a = document.activeElement; if (!(a && $('#stage').contains(a) && /INPUT|TEXTAREA|SELECT/.test(a.tagName))) { pendingRefresh = false; render(true); } }, 50); });

  /* enregistre et redessine */
  function commit(msg, kind) { KMK.store.save(); refresh(); if (msg) toast(msg, kind); }

  /* changement des données depuis un autre onglet */
  KMK.onExternalChange = function () {
    if (!KMK.auth.user()) { location.replace('index.html?expired=1'); return; }
    if ($('#modal.on')) { ctx = buildCtx(); renderChrome(); return; }
    refresh();
    if (KMK.onLiveUpdate) KMK.onLiveUpdate();
  };

  /* ---------------------------------------------------------
     Notifications (popover)
     --------------------------------------------------------- */
  var NTONE = { blue: ['var(--soft)', 'var(--g700)'], amber: ['var(--ambersoft)', '#B4700F'], red: ['var(--redsoft)', '#B23434'], green: ['var(--greensoft)', '#167A53'] };
  function notifRow(n, me) {
    var t = NTONE[n.tone] || NTONE.blue, unread = !KMK.notifs.isRead(n, me);
    return '<button type="button" class="nrow' + (unread ? ' unread' : '') + '" data-act="open-notif" data-id="' + n.id + '">' +
      '<span class="ic" style="background:' + t[0] + ';color:' + t[1] + '">' + icon(n.icon, 16) + '</span>' +
      '<span style="min-width:0"><span class="t" style="display:block">' + esc(n.title) + '</span><span class="d" style="display:block">' + esc(n.body) + '</span><span class="w" style="display:block">' + fmt.rel(n.at) + '</span></span></button>';
  }
  function renderNotifPop() {
    var me = ctx.me.id, list = KMK.notifs.forUser(me).slice(0, 8), unread = KMK.notifs.unread(me);
    $('#popNotif').innerHTML = '<div class="pop-h"><b>Notifications</b>' + (unread ? '&nbsp;' + H.pill(unread + ' non lue' + (unread > 1 ? 's' : ''), 'amber') : '') +
      (unread ? '<button class="lk" type="button" data-act="read-all">Tout marquer comme lu</button>' : '') + '</div>' +
      '<div class="pop-list">' + (list.length ? list.map(function (n) { return notifRow(n, me); }).join('') : H.empty('bell', 'Aucune notification', '')) + '</div>' +
      (ROUTES.notifications && canSee('notifications', ctx.role) ? '<div class="pop-f"><button class="lk" type="button" data-go="notifications">Voir toutes les notifications</button></div>' : '');
  }

  /* ---------------------------------------------------------
     Palette de commandes (Ctrl/Cmd + K)
     --------------------------------------------------------- */
  var palItems = [], palIdx = 0;
  function paletteSource() {
    var c = ctx, out = [];
    (NAV[c.role] || []).forEach(function (p) {
      if (p[0] === '|' || !ROUTES[p]) return;
      var d = ROUTES[p];
      out.push({ g: 'Écrans', ic: typeof d.icon === 'object' ? (d.icon[c.role] || d.icon['*']) : d.icon, t: label(d, c.role), s: '', run: function () { navigate(p); } });
    });
    out.push({ g: 'Écrans', ic: 'user', t: 'Mon profil', s: 'compte et sécurité', run: function () { navigate('profil'); } });
    if (['scolarite', 'direction', 'finance', 'formateur'].indexOf(c.role) >= 0) {
      c.db.students.forEach(function (s) {
        out.push({ g: 'Étudiants', ic: 'graduation-cap', t: s.name, s: s.level + ' ' + s.formation.replace('Licence ', '') + ' · Gr. ' + s.group, run: function () { KMK.openStudent(s.id); } });
      });
    }
    if (c.role === 'etudiant' || c.role === 'parent') {
      Object.keys(KMK_MODULES).forEach(function (k) {
        out.push({ g: 'Modules', ic: 'book-open', t: KMK_MODULES[k].name, s: KMK_MODULES[k].teacher, run: function () { navigate('notes', { module: k }); } });
      });
    }
    (KMK.commands[c.role] || []).forEach(function (cmd) { out.push({ g: 'Actions', ic: cmd.ic, t: cmd.t, s: cmd.s || '', run: cmd.run }); });
    out.push({ g: 'Actions', ic: 'users', t: 'Changer de profil', s: '', run: function () { ACTIONS['switch-role'](); } });
    out.push({ g: 'Actions', ic: 'log-out', t: 'Se déconnecter', s: '', run: function () { ACTIONS.logout(); } });
    return out;
  }
  function norm(s) { return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
  function openPalette() {
    closePops();
    var p = $('#palette');
    p.innerHTML = '<div class="pal-in">' + icon('search', 18) + '<input id="palInput" placeholder="Rechercher un écran, un étudiant, une action…" autocomplete="off" aria-label="Rechercher"><kbd class="kbd">Échap</kbd></div><div class="pal-list" id="palList" role="listbox"></div>';
    showMask(); p.classList.add('on'); layers.push('palette');
    var inp = $('#palInput');
    function draw() {
      var qv = norm(inp.value.trim());
      palItems = paletteSource().filter(function (i) { return !qv || norm(i.t + ' ' + i.s + ' ' + i.g).indexOf(qv) >= 0; }).slice(0, 40);
      palIdx = 0;
      var html = '', g = '';
      palItems.forEach(function (i, k) {
        if (i.g !== g) { g = i.g; html += '<div class="pal-g">' + esc(g) + '</div>'; }
        html += '<button type="button" class="pal-i' + (k === 0 ? ' on' : '') + '" data-k="' + k + '" role="option">' + icon(i.ic, 16) + '<span>' + esc(i.t) + '</span><span class="s">' + esc(i.s) + '</span></button>';
      });
      $('#palList').innerHTML = html || H.empty('search', 'Aucun résultat', 'Essayez « notes », « paiement » ou un nom d’étudiant.');
    }
    inp.addEventListener('input', draw);
    inp.addEventListener('keydown', function (e) {
      var rows = $$('.pal-i');
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault(); if (!rows.length) return;
        palIdx = (palIdx + (e.key === 'ArrowDown' ? 1 : -1) + rows.length) % rows.length;
        rows.forEach(function (r, k) { r.classList.toggle('on', k === palIdx); });
        rows[palIdx].scrollIntoView({ block: 'nearest' });
      }
      if (e.key === 'Enter' && palItems[palIdx]) { e.preventDefault(); runPal(palIdx); }
    });
    $('#palList').addEventListener('click', function (e) { var b = e.target.closest('.pal-i'); if (b) runPal(+b.dataset.k); });
    draw(); setTimeout(function () { inp.focus(); }, 40);
  }
  function runPal(k) { var i = palItems[k]; closePalette(); if (i) i.run(); }
  function closePalette() { $('#palette').classList.remove('on'); layers = layers.filter(function (l) { return l !== 'palette'; }); hideMaskIfIdle(); }

  /* ---------------------------------------------------------
     Parcours guidé : scénarios inter-profils
     --------------------------------------------------------- */
  var GUIDE = [
    { f: 'mfa', role: 'formateur', go: 'tableau-de-bord', t: 'Connexion avec double authentification', d: 'Connectez-vous en formatrice : un code SMS simulé s’affiche en haut à droite.' },
    { f: 'reqCreated', role: 'etudiant', go: 'demandes', t: 'Déposer une demande d’attestation', d: 'Étudiante → Demandes → « Nouvelle demande ».' },
    { f: 'reqReady', role: 'scolarite', go: 'demandes', t: 'Traiter la demande jusqu’à « Prête »', d: 'Scolarité → glissez la carte ou cliquez sur la flèche : l’étudiante est notifiée.' },
    { f: 'docDownloaded', role: 'etudiant', go: 'documents', t: 'Télécharger le document généré', d: 'Étudiante → Documents → Télécharger : PDF imprimable signé.' },
    { f: 'appel', role: 'formateur', go: 'appel', t: 'Faire l’appel du TP de 14:00', d: 'Formatrice → Appel : marquez une absence, l’étudiant et le parent sont alertés.' },
    { f: 'notesPublished', role: 'formateur', go: 'saisie-notes', t: 'Publier les notes du DS n°3', d: 'Formatrice → Saisie des notes : la moyenne de l’étudiante est recalculée.' },
    { f: 'paid', role: 'parent', go: 'finances', t: 'Payer l’échéance de 250 €', d: 'Parent ou étudiante → Finances → Payer (carte de test 4242 4242 4242 4242).' },
    { f: 'annonce', role: 'scolarite', go: 'annonces', t: 'Envoyer une annonce ciblée', d: 'Scolarité → Annonces : les destinataires la reçoivent dans leurs notifications.' },
    { f: 'ai', role: 'direction', go: 'ia', t: 'Interroger KMK AI', d: 'Direction → KMK AI : « Comment va mon campus aujourd’hui ? »' },
    { f: 'audit', role: 'direction', go: 'securite', t: 'Consulter le journal d’audit', d: 'Direction → Sécurité : toutes les actions précédentes y sont tracées.' }
  ];
  function guideDone() { var f = KMK.db().flags || {}; return GUIDE.filter(function (g) { return f[g.f]; }).length; }
  function renderGuideFab() {
    var n = guideDone();
    $('#guideFab').innerHTML = icon('compass', 17) + '<span class="hide-sm">Parcours guidé</span><span class="gp">' + n + '/' + GUIDE.length + '</span>';
    if ($('#guide').classList.contains('on')) renderGuide();
  }
  function renderGuide() {
    var f = KMK.db().flags || {};
    $('#guide').innerHTML = '<div class="gh"><b>Parcours guidé de la démo</b><p>Enchaînez les profils pour voir les données circuler. ' + guideDone() + ' étape(s) sur ' + GUIDE.length + ' réalisée(s).</p></div>' +
      GUIDE.map(function (g, k) {
        var R = KMK_ROLES[g.role], done = !!f[g.f], mine = ctx.role === g.role;
        return '<div class="gstep' + (done ? ' done' : '') + '"><span class="n">' + (done ? icon('check', 13) : k + 1) + '</span><div style="min-width:0"><div class="t">' + esc(g.t) + '</div><div class="d">' + esc(g.d) + '</div>' +
          '<div class="who3"><button type="button" class="act" data-act="guide-go" data-k="' + k + '">' + icon(mine ? 'arrow-right' : 'log-in', 13) + (mine ? 'Ouvrir l’écran' : 'Se connecter en ' + esc(R.label)) + '</button></div></div></div>';
      }).join('');
  }

  /* ---------------------------------------------------------
     Actions globales (data-act)
     --------------------------------------------------------- */
  ACTIONS['close-modal'] = function () { closeModal(); };
  ACTIONS['close-drawer'] = function () { closeDrawer(); };
  ACTIONS['open-nav'] = function () { document.body.classList.add('nav-open'); };
  ACTIONS['close-nav'] = function () { document.body.classList.remove('nav-open'); };
  ACTIONS.palette = function () { openPalette(); };
  ACTIONS['toggle-notifs'] = function () {
    var p = $('#popNotif'), on = !p.classList.contains('on');
    closePops(); if (!on) return;
    renderNotifPop(); placePop(p); p.classList.add('on');
  };
  ACTIONS['toggle-user'] = function () {
    var p = $('#popUser'), on = !p.classList.contains('on');
    closePops(); if (!on) return;
    var c = ctx, s = c.session;
    p.innerHTML = '<div class="mi-head"><span class="av lg" style="background:' + c.R.color + '1f;color:' + c.R.color + '">' + esc(c.me.initials) + '</span><div style="min-width:0"><div class="n">' + esc(c.me.name) + '</div><div class="s">' + esc(c.me.email) + '</div>' +
      '<div style="margin-top:5px">' + H.pill(c.R.label, 'soft') + (s && s.mfa ? ' ' + H.pill('MFA', 'green', 'shield-check') : '') + '</div></div></div><div class="mi-sep"></div>' +
      '<a class="mi" href="#/profil">' + icon('user', 16) + 'Mon profil</a>' +
      '<a class="mi" href="#/profil?tab=securite">' + icon('shield-check', 16) + 'Sécurité du compte</a>' +
      '<button type="button" class="mi" data-act="palette">' + icon('search', 16) + 'Rechercher<span class="kbd" style="margin-left:auto">Ctrl K</span></button>' +
      '<button type="button" class="mi" data-act="switch-role">' + icon('users', 16) + 'Changer de profil</button>' +
      '<button type="button" class="mi" data-act="reset-demo">' + icon('rotate-ccw', 16) + 'Réinitialiser la démo</button>' +
      '<div class="mi-sep"></div><button type="button" class="mi danger" data-act="logout">' + icon('log-out', 16) + 'Se déconnecter</button>';
    placePop(p); p.classList.add('on');
  };
  ACTIONS['open-notif'] = function (el) {
    var n = KMK.db().notifications.filter(function (x) { return x.id === el.dataset.id; })[0];
    if (!n) return;
    KMK.notifs.read(n.id, ctx.me.id);
    closePops();
    if (n.route && canSee(n.route.split('?')[0], ctx.role)) location.hash = '#/' + n.route; else refresh();
  };
  ACTIONS['read-all'] = function () { KMK.notifs.readAll(ctx.me.id); renderChrome(); renderNotifPop(); if (cur.path === 'notifications') refresh(); toast('Toutes les notifications sont marquées comme lues'); };
  ACTIONS.logout = function () {
    confirmBox({ title: 'Se déconnecter ?', body: 'Votre session KMK ID sera fermée sur cet appareil.', ok: 'Se déconnecter', danger: true }).then(function (ok) {
      if (!ok) return; KMK.auth.logout(); location.href = 'index.html?logout=1';
    });
  };
  ACTIONS['switch-role'] = function () { closePops(); KMK.auth.logout(); location.href = 'index.html?switch=1'; };
  ACTIONS['reset-demo'] = function () {
    closePops();
    confirmBox({ title: 'Réinitialiser la démo ?', body: 'Toutes les actions réalisées (demandes, notes, paiements, messages, journal) seront effacées et vous serez déconnecté.', ok: 'Réinitialiser', danger: true }).then(function (ok) {
      if (!ok) return; KMK.store.reset(); location.href = 'index.html?reset=1';
    });
  };
  ACTIONS['toggle-guide'] = function () { var g = $('#guide'); g.classList.toggle('on'); if (g.classList.contains('on')) renderGuide(); };
  ACTIONS['guide-go'] = function (el) {
    var g = GUIDE[+el.dataset.k];
    $('#guide').classList.remove('on');
    if (ctx.role === g.role) navigate(g.go);
    else { KMK.auth.logout(); location.href = 'index.html?as=' + g.role + '&next=' + encodeURIComponent(g.go); }
  };

  document.addEventListener('click', function (e) {
    /* l’élément interactif le plus proche l’emporte (un interrupteur dans une ligne cliquable, par ex.) */
    var el = e.target.closest('[data-go],[data-act]');
    if (el && !el.disabled) {
      var fn = el.hasAttribute('data-act') && ACTIONS[el.getAttribute('data-act')];
      if (fn) { e.preventDefault(); fn(el, e); return; }
      if (el.hasAttribute('data-go')) { e.preventDefault(); closePops(); if (el.closest('#drawer')) closeDrawer(); if (el.closest('#modal')) closeModal(true); location.hash = '#/' + el.getAttribute('data-go'); return; }
    }
    if (!e.target.closest('.pop') && !e.target.closest('#bellBtn') && !e.target.closest('#userBtn')) closePops();
    if (!e.target.closest('#guide') && !e.target.closest('#guideFab')) $('#guide').classList.remove('on');
  });
  $('#mask').addEventListener('click', function () {
    if ($('#palette.on')) return closePalette();
    if ($('#modal.on')) return closeModal();
    closeDrawer();
  });
  document.addEventListener('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); if ($('#palette.on')) closePalette(); else openPalette(); return; }
    if (e.key === '/' && !/INPUT|TEXTAREA|SELECT/.test((document.activeElement || {}).tagName) && !$('#modal.on')) { e.preventDefault(); openPalette(); return; }
    if (e.key === 'Escape') {
      if ($('#palette.on')) return closePalette();
      if ($('#modal.on')) return closeModal();
      if ($('#drawer.on')) return closeDrawer();
      closePops(); $('#guide').classList.remove('on'); document.body.classList.remove('nav-open');
    }
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches && e.target.matches('[role=link][data-go],[role=button][data-act]') && e.target.tagName !== 'BUTTON') { e.preventDefault(); e.target.click(); }
    /* focus piégé dans la modale */
    if (e.key === 'Tab' && $('#modal.on')) {
      var f = $$('#modal button,#modal input,#modal select,#modal textarea,#modal [tabindex]:not([tabindex="-1"])').filter(function (x) { return !x.disabled && x.offsetParent; });
      if (!f.length) return;
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    }
  });
  window.addEventListener('hashchange', function () { closeModal(true); closeDrawer(); closePalette(); render(); });
  window.addEventListener('resize', function () { if ($('#popNotif.on')) placePop($('#popNotif')); if ($('#popUser.on')) placePop($('#popUser')); });

  /* ---------------------------------------------------------
     API publique
     --------------------------------------------------------- */
  KMK.route = route;
  KMK.part = part;
  KMK.actions = ACTIONS;
  KMK.commands = {};
  KMK.H = H;
  KMK.ui = { toast: toast, modal: openModal, closeModal: closeModal, confirm: confirmBox, drawer: openDrawer, closeDrawer: closeDrawer, hydrate: hydrate, refresh: refresh, navigate: navigate, chrome: function () { ctx = buildCtx(); renderChrome(); } };
  KMK.commit = commit;
  KMK.ctx = function () { return ctx; };
  KMK.flag = function (name) { var d = KMK.db(); d.flags = d.flags || {}; if (!d.flags[name]) { d.flags[name] = true; setTimeout(function () { toast('Étape du parcours guidé validée', 'info'); if (ctx) renderGuideFab(); }, 600); } };
  KMK.canSee = function (path) { return canSee(path, ctx.role); };
  KMK.boot = function () {
    hydrate(document.querySelector('.demobar'));
    hydrate($('#topbar'));
    render();
  };
})();
