/* =========================================================
   KMK Campus — écrans communs : IA, messagerie, notifications,
   profil, sécurité, fiche étudiant, documents
   ========================================================= */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var U = KMK.util, esc = U.esc, fmt = KMK.fmt, q = KMK.q, H = KMK.H, ui = KMK.ui, A = KMK.actions;
  var ALL = ['etudiant', 'formateur', 'scolarite', 'direction', 'finance', 'parent'];
  var STAFF = ['scolarite', 'direction', 'finance', 'formateur'];
  function db() { return KMK.db(); }
  function me() { return KMK.ctx().me; }

  /* =========================================================
     Documents imprimables (attestation, relevé, reçu…)
     ========================================================= */
  function hash() { var s = ''; for (var i = 0; i < 40; i++) s += '0123456789abcdef'[Math.floor(Math.random() * 16)]; return s; }
  function qr() {
    var cells = '', n = 21;
    for (var y = 0; y < n; y++) for (var x = 0; x < n; x++) {
      var finder = (x < 7 && y < 7) || (x > 13 && y < 7) || (x < 7 && y > 13);
      var on = finder ? ((x % 6 === 0 || y % 6 === 0 || (x > 13 && (x - 14) % 6 === 0) || (y > 13 && (y - 14) % 6 === 0)) || ((x % 7 > 1 && x % 7 < 5) && (y % 7 > 1 && y % 7 < 5))) : Math.random() > .55;
      if (on) cells += '<rect x="' + x + '" y="' + y + '" width="1" height="1"/>';
    }
    return '<svg viewBox="0 0 21 21" width="84" height="84" fill="#0A2A6E">' + cells + '</svg>';
  }
  KMK.printDoc = function (kind, sid, extra) {
    var s = q.student(sid) || {}, today = window.KMK_DEMO_TODAY, title = '', body = '';
    var ident = '<table class="id"><tr><td>Nom</td><td><b>' + esc(s.name) + '</b></td></tr><tr><td>N° étudiant</td><td>KMK-' + esc((s.id || '').replace('s-', '').toUpperCase()) + '-2026</td></tr>' +
      '<tr><td>Formation</td><td>' + esc(s.formation) + ' · ' + esc(s.level) + ' · Groupe ' + esc(s.group) + '</td></tr><tr><td>Année</td><td>2026-2027</td></tr></table>';
    if (kind === 'att-scol' || kind === 'certif') {
      title = kind === 'certif' ? 'Certificat de scolarité' : 'Attestation de scolarité';
      body = '<p>La direction de KMK Campus certifie que l’étudiant(e) désigné(e) ci-dessous est régulièrement inscrit(e) pour l’année universitaire 2026-2027 et suit les enseignements de la formation indiquée.</p>' + ident +
        '<p>Cette attestation est délivrée à l’intéressé(e) pour servir et valoir ce que de droit.</p>';
    } else if (kind === 'releve') {
      title = 'Relevé de notes';
      var rows = q.grades(sid).map(function (g) { return '<tr><td>' + esc(KMK_MODULES[g.module].name) + '</td><td>' + esc(g.label) + '</td><td>' + fmt.date(g.date) + '</td><td class="r"><b>' + fmt.num(g.value) + '</b></td><td class="r">' + fmt.num(g.promo) + '</td></tr>'; }).join('');
      body = ident + '<table class="grid"><thead><tr><th>Module</th><th>Évaluation</th><th>Date</th><th class="r">Note /20</th><th class="r">Promo</th></tr></thead><tbody>' + rows + '</tbody></table>' +
        '<p class="tot">Moyenne générale pondérée (ECTS) : <b>' + fmt.num(q.studentAvg(sid)) + ' / 20</b> · Crédits validés : <b>' + (s.credits || 0) + ' / 60</b></p>';
    } else if (kind === 'cert-reu') {
      title = 'Attestation de réussite';
      body = '<p>La direction de KMK Campus atteste que l’étudiant(e) ci-dessous a validé l’année précédente de sa formation avec une moyenne générale de <b>' + fmt.num(q.studentAvg(sid)) + ' / 20</b>.</p>' + ident;
    } else if (kind === 'stage') {
      title = 'Convention de stage';
      body = ident + '<p>La présente convention règle les rapports entre KMK Campus, l’organisme d’accueil et l’étudiant(e). Durée prévisionnelle : 8 semaines. Tuteur pédagogique : Claire Fontaine.</p><p><i>Document à compléter et signer par l’organisme d’accueil.</i></p>';
    } else if (kind === 'convoc') {
      title = 'Convocation à un examen';
      body = ident + '<table class="id"><tr><td>Épreuve</td><td><b>Algorithmique — examen</b></td></tr><tr><td>Date</td><td>vendredi 11 septembre 2026 · 13:00 – 14:45</td></tr><tr><td>Salle</td><td>Amphi A</td></tr></table><p>Présentez-vous 15 minutes avant le début de l’épreuve muni(e) de votre carte étudiante. Calculatrice non autorisée.</p>';
    } else if (kind === 'recu') {
      var inv = extra;
      title = 'Reçu de paiement';
      body = ident + '<table class="id"><tr><td>Objet</td><td><b>' + esc(inv.label) + '</b></td></tr><tr><td>Montant</td><td><b>' + fmt.money(inv.amount) + '</b></td></tr><tr><td>Date de paiement</td><td>' + fmt.longY(inv.paidAt) + '</td></tr><tr><td>Moyen</td><td>' + esc(inv.method) + '</td></tr><tr><td>Référence</td><td>' + esc(inv.ref || ('PAY-' + inv.id.toUpperCase())) + '</td></tr></table><p>Paiement reçu et rapproché automatiquement du dossier financier.</p>';
    } else {
      title = 'Règlement des études 2026-2027';
      body = '<p>Article 1 — Assiduité : la présence aux enseignements est obligatoire. Toute absence doit être justifiée sous 10 jours.</p><p>Article 2 — Évaluations : le contrôle continu représente 40 % de la note de chaque module.</p><p>Article 3 — Compensation : les modules d’une même UE se compensent entre eux à partir de 10/20.</p>';
    }
    var html = '<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>' + esc(title) + ' — ' + esc(s.name || '') + '</title><style>' +
      'body{font-family:Georgia,"Times New Roman",serif;color:#121A2A;max-width:760px;margin:30px auto;padding:0 30px;line-height:1.65;font-size:14.5px}' +
      'header{display:flex;align-items:center;gap:14px;border-bottom:3px solid #0A2A6E;padding-bottom:14px}header b{font:700 20px Arial,sans-serif;color:#0A2A6E;display:block}header small{font:12px Arial,sans-serif;color:#66748A}' +
      'h1{font:700 24px Arial,sans-serif;text-align:center;margin:36px 0 26px;letter-spacing:.02em;text-transform:uppercase;color:#0A2A6E}' +
      'table.id{margin:18px 0;border-collapse:collapse}table.id td{padding:5px 18px 5px 0;vertical-align:top}table.id td:first-child{color:#66748A;font-family:Arial,sans-serif;font-size:13px}' +
      'table.grid{width:100%;border-collapse:collapse;margin:16px 0;font-family:Arial,sans-serif;font-size:13px}table.grid th{background:#E8F0FD;text-align:left;padding:8px}table.grid td{padding:7px 8px;border-bottom:1px solid #E1E7F2}.r{text-align:right}' +
      '.tot{font-family:Arial,sans-serif}.sign{display:flex;justify-content:space-between;align-items:flex-end;margin-top:46px;gap:20px}.sign .t{font-family:Arial,sans-serif;font-size:12px;color:#66748A;max-width:420px}' +
      '.stamp{border:2px solid #1257E0;color:#1257E0;border-radius:10px;padding:8px 12px;font:700 12px Arial,sans-serif;display:inline-block;transform:rotate(-3deg)}' +
      '.bar{position:sticky;top:0;background:#0A2A6E;color:#fff;font:13px Arial,sans-serif;padding:10px 14px;border-radius:10px;display:flex;gap:10px;align-items:center;margin-bottom:24px}.bar button{margin-left:auto;background:#38BDF8;color:#0A2A6E;border:0;border-radius:8px;padding:8px 14px;font-weight:700;cursor:pointer}' +
      '@media print{.bar{display:none}body{margin:0}}</style></head><body>' +
      '<div class="bar">Document de démonstration — généré par KMK Campus<button onclick="print()">Imprimer / PDF</button></div>' +
      '<header><svg viewBox="0 0 64 64" width="52" height="52"><rect width="64" height="64" rx="16" fill="#E8F0FD"/><path d="M32 15 55 24.5 32 34 9 24.5Z" fill="#1257E0"/><path d="M17 28.5v9c0 4.5 6.7 8 15 8s15-3.5 15-8v-9" fill="none" stroke="#1257E0" stroke-width="3" stroke-linecap="round"/><path d="M55 24.5v11" stroke="#38BDF8" stroke-width="3" stroke-linecap="round"/></svg>' +
      '<div><b>KMK Campus</b><small>Établissement d’enseignement supérieur · Service de la scolarité</small></div></header>' +
      '<h1>' + esc(title) + '</h1>' + body +
      '<p>Fait à Lyon, le ' + fmt.longY(today) + '.</p>' +
      '<div class="sign"><div class="t"><span class="stamp">SIGNÉ ÉLECTRONIQUEMENT</span><br><br>Hélène Garnier, directrice générale<br>Empreinte : ' + hash() + '<br>Vérification : kmk-campus.fr/verifier</div>' + qr() + '</div>' +
      '</body></html>';
    var w = window.open('', '_blank');
    if (w) { w.document.open(); w.document.write(html); w.document.close(); }
    else U.download(title.replace(/\s+/g, '-').toLowerCase() + '.html', html, 'text/html;charset=utf-8');
  };

  /* =========================================================
     Fiche étudiant (tiroir) — personnel
     ========================================================= */
  KMK.openStudent = function (sid) {
    var c = KMK.ctx(), s = q.student(sid); if (!s) return;
    var avg = q.studentAvg(sid), role = c.role;
    var invs = db().invoices.filter(function (i) { return i.studentId === sid; });
    var due = invs.filter(function (i) { return !i.paidAt; }).reduce(function (t, i) { return t + i.amount; }, 0);
    var late = invs.filter(function (i) { return q.invoiceStatus(i) === 'retard'; });
    var abs = db().absences.filter(function (a) { return a.studentId === sid; });
    var reqs = db().requests.filter(function (r) { return r.studentId === sid; });
    var signals = [];
    if (s.att < 85) signals.push(['red', 'Assiduité ' + s.att + ' %', 'sous le seuil de 85 %']);
    if (avg < 10.5) signals.push(['red', 'Moyenne ' + fmt.num(avg), 'risque d’échec']);
    if (late.length) signals.push(['amber', 'Impayé ' + fmt.money(late.reduce(function (t, i) { return t + i.amount; }, 0)), late.length + ' échéance(s) en retard']);
    abs.filter(function (a) { return a.status === 'a_justifier'; }).forEach(function (a) { signals.push(['amber', 'Absence à justifier', KMK_MODULES[a.module].name + ' · ' + fmt.date(a.date)]); });
    if (!signals.length) signals.push(['green', 'Aucun signal', 'dossier stable']);
    var body = '<div class="dgrid">' +
      '<div class="dst"><b>' + fmt.num(avg) + '</b><span>Moyenne</span></div>' +
      '<div class="dst"><b>' + s.att + ' %</b><span>Assiduité</span></div>' +
      '<div class="dst"><b style="color:' + H.riskColor(s.risk) + '">' + s.risk + '</b><span>Risk Score</span></div></div>' +
      '<div class="lbl">Signaux détectés par KMK AI</div><div class="card list">' + signals.map(function (x) { return H.li({ icon: x[0] === 'green' ? 'check' : 'alert-triangle', tone: x[0], title: esc(x[1]), sub: esc(x[2]) }); }).join('') + '</div>' +
      (s.risk >= 40 ? '<div class="hintx mt"><b>Action recommandée :</b> rendez-vous pédagogique avant vendredi et plan de rattrapage ciblé ; prévenir le tuteur si pas de réponse sous 48 h.</div>' : '');
    if (role !== 'formateur') {
      body += '<div class="lbl">Situation financière</div><div class="card pad"><div class="hstack"><div><div class="m">Reste dû</div><b style="font-size:18px">' + fmt.money(due) + '</b></div><div class="sp">' + (late.length ? H.pill(late.length + ' en retard', 'red') : H.pill('À jour', 'green')) + '</div></div></div>';
    }
    if (role === 'scolarite' || role === 'direction') {
      body += '<div class="lbl">Demandes</div>' + (reqs.length ? '<div class="card list">' + reqs.slice(0, 4).map(function (r) { return H.li({ icon: 'inbox', title: esc(typeLabel(r.type)), sub: esc(r.ref) + ' · ' + fmt.rel(r.createdAt), right: H.stagePill(r) }); }).join('') + '</div>' : '<div class="m">Aucune demande.</div>');
    }
    var u = q.userOfStudent(sid);
    ui.drawer({
      title: H.who(s.name, s.level + ' ' + s.formation + ' · Groupe ' + s.group, s.initials),
      body: body,
      foot: '<button class="btn ghost" type="button" data-act="student-rdv" data-sid="' + sid + '">' + icon('calendar-clock', 15) + 'Rendez-vous</button>' +
        '<button class="btn" type="button" data-act="student-msg" data-sid="' + sid + '">' + icon('send', 15) + (u ? 'Écrire' : 'Contacter') + '</button>'
    });
    KMK.log('student.view', 'Consultation du dossier de ' + s.name); KMK.store.save();
  };
  function typeLabel(t) { var x = KMK_REQUEST_TYPES.filter(function (r) { return r.id === t; })[0]; return x ? x.label : t; }
  KMK.typeLabel = typeLabel;

  A['open-student'] = function (el) { KMK.openStudent(el.dataset.sid); };
  A['student-msg'] = function (el) {
    var s = q.student(el.dataset.sid), u = q.userOfStudent(s.id);
    ui.closeDrawer();
    if (u) { KMK.composeMessage(u.id, 'Suivi pédagogique', 'Bonjour ' + s.name.split(' ')[0] + ', '); return; }
    ui.modal({
      title: 'Contacter ' + esc(s.name), sub: 'Envoi par e-mail et SMS (simulé : cet étudiant n’a pas de compte de démo)',
      body: '<div class="field"><label>Message</label><textarea class="textarea" id="cm">Bonjour ' + esc(s.name.split(' ')[0]) + ', merci de prendre contact avec le service pédagogique cette semaine.</textarea></div>',
      foot: '<button class="btn ghost" data-act="close-modal">Annuler</button><button class="btn" id="cmSend">' + icon('send', 15) + 'Envoyer</button>',
      onMount: function (m) { $('#cmSend', m).addEventListener('click', function () { KMK.log('student.contact', 'Message envoyé à ' + s.name); ui.closeModal(true); KMK.commit('Message envoyé à ' + esc(s.name) + ' (e-mail + SMS)'); }); }
    });
  };
  A['student-rdv'] = function (el) {
    var s = q.student(el.dataset.sid), u = q.userOfStudent(s.id);
    ui.closeDrawer();
    ui.modal({
      title: 'Planifier un rendez-vous', sub: esc(s.name),
      body: '<div class="row2"><div class="field"><label for="rd">Date</label><input class="input" type="date" id="rd" value="' + U.addDays(window.KMK_DEMO_TODAY, 3) + '"></div>' +
        '<div class="field"><label for="rh">Heure</label><input class="input" type="time" id="rh" value="14:00"></div></div>' +
        '<div class="field"><label for="rm">Objet</label><select class="select" id="rm"><option>Rendez-vous pédagogique</option><option>Plan de rattrapage</option><option>Point financier</option><option>Orientation</option></select></div>',
      foot: '<button class="btn ghost" data-act="close-modal">Annuler</button><button class="btn" id="rdOk">' + icon('calendar-check', 15) + 'Planifier et notifier</button>',
      onMount: function (m) {
        $('#rdOk', m).addEventListener('click', function () {
          var d = $('#rd', m).value, h = $('#rh', m).value, o = $('#rm', m).value;
          if (!d || !h) { ui.toast('Choisissez une date et une heure', 'err'); return; }
          var to = u ? [u.id] : []; q.parentsOf(s.id).forEach(function (p) { to.push(p.id); });
          KMK.notify(to, { title: o, body: fmt.long(d) + ' à ' + h + ' · avec ' + me().name, icon: 'calendar-clock', tone: 'blue', route: 'messagerie' });
          KMK.log('student.rdv', o + ' planifié avec ' + s.name + ' le ' + fmt.date(d) + ' à ' + h);
          ui.closeModal(true);
          KMK.commit(o + ' planifié le ' + fmt.date(d) + ' à ' + h + ' — ' + esc(s.name) + ' notifié(e)');
        });
      }
    });
  };

  /* =========================================================
     Notifications
     ========================================================= */
  KMK.route('notifications', {
    label: 'Notifications', icon: 'bell', roles: ALL,
    sub: function () { return 'Chaque alerte ouvre directement l’élément concerné'; },
    badge: function (c) { return KMK.notifs.unread(c.me.id); },
    render: function (c) {
      var tab = c.params.f || 'all', list = KMK.notifs.forUser(c.me.id);
      var unread = list.filter(function (n) { return !KMK.notifs.isRead(n, c.me.id); });
      var shown = tab === 'unread' ? unread : list;
      var tones = { blue: ['var(--soft)', 'var(--g700)'], amber: ['var(--ambersoft)', '#B4700F'], red: ['var(--redsoft)', '#B23434'], green: ['var(--greensoft)', '#167A53'] };
      return '<div class="toolbar"><div class="seg"><button class="' + (tab === 'all' ? 'on' : '') + '" data-go="notifications">Toutes (' + list.length + ')</button><button class="' + (tab === 'unread' ? 'on' : '') + '" data-go="notifications?f=unread">Non lues (' + unread.length + ')</button></div>' +
        '<div class="sp hstack"><button class="btn ghost sm" data-go="profil?tab=notifications">' + icon('sliders-horizontal', 14) + 'Préférences</button>' + (unread.length ? '<button class="btn sm" data-act="read-all">' + icon('check', 14) + 'Tout marquer comme lu</button>' : '') + '</div></div>' +
        '<div class="card">' + (shown.length ? '<div class="pop-list" style="max-height:none">' + shown.map(function (n) {
          var t = tones[n.tone] || tones.blue, u = !KMK.notifs.isRead(n, c.me.id);
          return '<button type="button" class="nrow' + (u ? ' unread' : '') + '" data-act="open-notif" data-id="' + n.id + '" style="padding:15px 18px"><span class="ic" style="background:' + t[0] + ';color:' + t[1] + '">' + icon(n.icon, 16) + '</span>' +
            '<span style="min-width:0;flex:1"><span class="t" style="display:block;font-size:13.5px">' + esc(n.title) + '</span><span class="d" style="display:block">' + esc(n.body) + '</span></span><span class="w" style="white-space:nowrap;margin-right:14px">' + fmt.rel(n.at) + '</span></button>';
        }).join('') + '</div>' : H.empty('bell', tab === 'unread' ? 'Tout est lu' : 'Aucune notification', 'Les nouvelles alertes apparaîtront ici en temps réel.')) + '</div>';
    }
  });

  /* =========================================================
     Messagerie
     ========================================================= */
  var CONTACTS = {
    etudiant: ['u-claire', 'u-scol', 'u-fin'], parent: ['u-scol', 'u-claire', 'u-fin'],
    formateur: ['u-lea', 'u-parent', 'u-scol', 'u-dir'], finance: ['u-dir', 'u-scol', 'u-lea', 'u-parent'],
    scolarite: ['u-lea', 'u-parent', 'u-claire', 'u-dir', 'u-fin'], direction: ['u-scol', 'u-fin', 'u-claire', 'u-lea', 'u-parent']
  };
  function myThreads(uid) {
    return db().threads.filter(function (t) { return t.participants.indexOf(uid) >= 0; })
      .sort(function (a, b) { return a.messages[a.messages.length - 1].at < b.messages[b.messages.length - 1].at ? 1 : -1; });
  }
  function unreadThreads(uid) { return myThreads(uid).filter(function (t) { return ((t.readBy || {})[uid] || 0) < t.messages.length; }).length; }
  function other(t, uid) { return q.user(t.participants.filter(function (p) { return p !== uid; })[0]) || { name: '—', initials: '?', role: 'scolarite' }; }

  KMK.composeMessage = function (toId, subject, text) {
    var c = KMK.ctx(), opts = (CONTACTS[c.role] || []).map(function (id) { var u = q.user(id); return '<option value="' + id + '"' + (id === toId ? ' selected' : '') + '>' + esc(u.name) + ' — ' + esc(KMK_ROLES[u.role].label) + '</option>'; }).join('');
    ui.modal({
      title: 'Nouveau message', sub: 'Messagerie interne KMK Campus',
      body: '<div class="field"><label for="mTo">Destinataire</label><select class="select" id="mTo">' + opts + '</select></div>' +
        '<div class="field"><label for="mSub">Objet</label><input class="input" id="mSub" value="' + esc(subject || '') + '" maxlength="80"></div>' +
        '<div class="field"><label for="mTxt">Message</label><textarea class="textarea" id="mTxt" maxlength="1000">' + esc(text || '') + '</textarea></div>',
      foot: '<button class="btn ghost" data-act="close-modal">Annuler</button><button class="btn" id="mSend">' + icon('send', 15) + 'Envoyer</button>',
      onMount: function (m) {
        $('#mSend', m).addEventListener('click', function () {
          var to = $('#mTo', m).value, sub = $('#mSub', m).value.trim(), txt = $('#mTxt', m).value.trim();
          if (!sub || !txt) { ui.toast('Renseignez l’objet et le message', 'err'); return; }
          var t = { id: U.uid('t'), subject: sub, participants: [c.me.id, to], messages: [{ from: c.me.id, text: txt, at: U.nowISO() }], readBy: {} };
          t.readBy[c.me.id] = 1;
          db().threads.unshift(t);
          KMK.notify([to], { title: 'Nouveau message de ' + c.me.name, body: sub, icon: 'message-square', tone: 'blue', route: 'messagerie?t=' + t.id });
          KMK.log('message.send', 'Message « ' + sub + ' » envoyé à ' + q.user(to).name);
          ui.closeModal(true);
          KMK.store.save();
          ui.navigate('messagerie', { t: t.id });
          ui.toast('Message envoyé à ' + esc(q.user(to).name));
        });
      }
    });
  };
  A['new-message'] = function (el) { KMK.composeMessage(el.dataset.to || null, el.dataset.subject || '', ''); };

  KMK.route('messagerie', {
    label: 'Messagerie', icon: 'message-square', roles: ALL,
    sub: function () { return 'Échanges avec les formateurs, la scolarité et les familles'; },
    badge: function (c) { return unreadThreads(c.me.id); },
    render: function (c) {
      var list = myThreads(c.me.id), tid = c.params.t, t = list.filter(function (x) { return x.id === tid; })[0];
      if (t) { t.readBy = t.readBy || {}; if ((t.readBy[c.me.id] || 0) < t.messages.length) { t.readBy[c.me.id] = t.messages.length; KMK.store.save(); } }
      var threads = list.length ? list.map(function (x) {
        var o = other(x, c.me.id), last = x.messages[x.messages.length - 1], unread = ((x.readBy || {})[c.me.id] || 0) < x.messages.length;
        return '<button type="button" class="thr' + (t && t.id === x.id ? ' on' : '') + '" data-go="messagerie?t=' + x.id + '">' + H.av(o.initials, KMK_ROLES[o.role].color) +
          '<div><div class="n">' + (unread ? '<span class="ud"></span>' : '') + esc(o.name) + '<span class="w">' + fmt.rel(last.at) + '</span></div><div class="s"><b style="font-weight:600;color:var(--ink)">' + esc(x.subject) + '</b> — ' + esc(last.text) + '</div></div></button>';
      }).join('') : H.empty('message-square', 'Aucune conversation', 'Démarrez un échange avec le bouton « Nouveau ».');
      var conv;
      if (t) {
        var o = other(t, c.me.id);
        conv = '<div class="conv-h"><button class="ibtn back" data-go="messagerie" aria-label="Retour">' + icon('arrow-left', 16) + '</button>' + H.av(o.initials, KMK_ROLES[o.role].color) +
          '<div style="min-width:0"><div class="b" style="font-size:13.5px">' + esc(t.subject) + '</div><div class="m">' + esc(o.name) + ' · ' + esc(KMK_ROLES[o.role].label) + '</div></div></div>' +
          '<div class="chat" id="convChat">' + t.messages.map(function (m) {
            var mine = m.from === c.me.id, u = q.user(m.from) || {};
            return '<div class="bub ' + (mine ? 'me' : 'them') + '"><span class="who2">' + esc(mine ? 'Vous' : u.name) + '</span>' + esc(m.text).replace(/\n/g, '<br>') + '<span class="when">' + fmt.rel(m.at) + (mine && m === t.messages[t.messages.length - 1] && ((t.readBy || {})[o.id] || 0) >= t.messages.length ? ' · lu' : '') + '</span></div>';
          }).join('') + '</div>' +
          '<form class="composer" id="convForm"><textarea class="input" id="convInput" rows="1" placeholder="Écrire à ' + esc(o.name.split(' ')[0]) + '… (Entrée pour envoyer)" aria-label="Message" style="resize:none"></textarea><button class="btn" type="submit">' + icon('send', 15) + '<span class="hide-sm">Envoyer</span></button></form>';
      } else {
        conv = H.empty('message-square', 'Sélectionnez une conversation', 'Ou démarrez un nouvel échange.', '<button class="btn" data-act="new-message">' + icon('plus', 15) + 'Nouveau message</button>');
      }
      return '<div class="pagehead"><div><h2>Messagerie</h2><p>' + list.length + ' conversation(s) · ' + unreadThreads(c.me.id) + ' non lue(s)</p></div><div class="acts"><button class="btn" data-act="new-message">' + icon('plus', 15) + 'Nouveau</button></div></div>' +
        '<div class="card msgs' + (t ? ' open' : '') + '"><div class="threads">' + threads + '</div><div class="conv">' + conv + '</div></div>';
    },
    mount: function (el, c) {
      var chat = $('#convChat', el); if (chat) chat.scrollTop = chat.scrollHeight;
      var f = $('#convForm', el); if (!f) return;
      var inp = $('#convInput', el);
      inp.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); f.requestSubmit ? f.requestSubmit() : f.dispatchEvent(new Event('submit')); } });
      f.addEventListener('submit', function (e) {
        e.preventDefault();
        var txt = inp.value.trim(); if (!txt) return;
        var t = db().threads.filter(function (x) { return x.id === c.params.t; })[0];
        t.messages.push({ from: c.me.id, text: txt, at: U.nowISO() });
        t.readBy = t.readBy || {}; t.readBy[c.me.id] = t.messages.length;
        var o = other(t, c.me.id);
        KMK.notify([o.id], { title: 'Message de ' + c.me.name, body: txt.slice(0, 90), icon: 'message-square', tone: 'blue', route: 'messagerie?t=' + t.id });
        KMK.log('message.send', 'Réponse dans « ' + t.subject + ' »');
        inp.value = ''; inp.blur();
        KMK.commit();
        setTimeout(function () { var i = $('#convInput'); if (i) i.focus(); }, 30);
      });
    }
  });

  /* =========================================================
     KMK AI — copilote par rôle (réponses calculées sur les données)
     ========================================================= */
  var aiHistory = {};     // par utilisateur, le temps de la session
  var aiActions = [];     // actions proposées dans les réponses
  function act(label, ic, run) { aiActions.push(run); return '<button type="button" data-act="ai-run" data-i="' + (aiActions.length - 1) + '">' + icon(ic, 13) + esc(label) + '</button>'; }
  A['ai-run'] = function (el) { var f = aiActions[+el.dataset.i]; if (f) f(); };

  function nextInvoice(sid) { return db().invoices.filter(function (i) { return i.studentId === sid && !i.paidAt; }).sort(function (a, b) { return a.due < b.due ? -1 : 1; })[0]; }
  function todaySessions(group) { return db().sessions.filter(function (s) { return s.date === window.KMK_DEMO_TODAY && s.groups.indexOf(group) >= 0 && !s.cancelled; }).sort(function (a, b) { return a.start < b.start ? -1 : 1; }); }
  function lateInvoices() { return db().invoices.filter(function (i) { return q.invoiceStatus(i) === 'retard'; }); }

  var INTENTS = {
    etudiant: [
      { chip: 'Que dois-je faire aujourd’hui ?', re: /aujourd|faire|journ|programme|priorit/, a: function (c) {
        var ss = todaySessions(c.stu.group), abs = db().absences.filter(function (a) { return a.studentId === c.sid && a.status === 'a_justifier'; }), inv = nextInvoice(c.sid);
        return { h: '<b>Votre journée du ' + fmt.long(window.KMK_DEMO_TODAY) + ' :</b><br>' + ss.map(function (s) { return '• ' + s.start + ' ' + esc(s.title) + ' — ' + esc(s.room); }).join('<br>') +
          (abs.length ? '<br>• <b>' + abs.length + ' absence(s) à justifier</b> avant le ' + fmt.date(abs[0].deadline) : '') + (inv ? '<br>• Échéance de <b>' + fmt.money(inv.amount) + '</b> le ' + fmt.date(inv.due) : ''),
          src: 'Emploi du temps · présences · situation financière',
          acts: (abs.length ? act('Justifier', 'paperclip', function () { ui.navigate('absences'); }) : '') + (inv ? act('Payer', 'wallet', function () { KMK.payInvoice(inv.id); }) : '') + act('Planning', 'calendar', function () { ui.navigate('emploi-du-temps'); }) };
      } },
      { chip: 'Ma moyenne et mes crédits ?', re: /moyenne|cr[eé]dit|ects|note|r[eé]sultat/, a: function (c) {
        var m = q.moduleAvgs(c.sid), keys = Object.keys(m).sort(function (a, b) { return m[b] - m[a]; });
        return { h: 'Moyenne générale pondérée : <b>' + fmt.num(q.studentAvg(c.sid)) + ' / 20</b> (promo 12,8) · <b>' + c.stu.credits + ' / 60 crédits</b>, ' + (60 - c.stu.credits) + ' restants.<br>Point fort : <b>' + esc(KMK_MODULES[keys[0]].name) + '</b> (' + fmt.num(m[keys[0]]) + '). À consolider : <b>' + esc(KMK_MODULES[keys[keys.length - 1]].name) + '</b> (' + fmt.num(m[keys[keys.length - 1]]) + ').',
          src: 'Relevé de notes · pondération ECTS', acts: act('Voir mes notes', 'award', function () { ui.navigate('notes'); }) };
      } },
      { chip: 'Risque en Algorithmique ?', re: /algo|risque|d[eé]croch|difficult/, a: function () {
        return { h: '<b>Risque estimé : 34 %</b> en Algorithmique. Signaux : 2 absences non justifiées, 2 devoirs non remis et une activité en baisse sur la plateforme. Votre dernière note (15,5) reste au-dessus de la promo.<br>Je vous propose 3 séances de révision et le tutorat de jeudi 16:30.',
          src: 'Student Risk Score · feuilles de présence · dépôts', acts: act('Écrire à Claire Fontaine', 'send', function () { KMK.composeMessage('u-claire', 'Tutorat Algorithmique', 'Bonjour Madame, je souhaiterais participer au tutorat de jeudi. '); }) + act('Planning', 'calendar', function () { ui.navigate('emploi-du-temps', { w: 1 }); }) };
      } },
      { chip: 'Réclame mon attestation', re: /attestation|certificat|scolarit/, a: function (c) {
        var r = KMK.createRequest(c.sid, 'att-scol', 'Demande générée par KMK AI.', 'KMK AI');
        return { h: 'C’est fait : <b>demande ' + esc(r.ref) + '</b> créée et transmise à la scolarité (traitement sous 48 h). Vous serez notifiée dès que le PDF signé sera prêt.',
          src: 'Document Center · cycle de traitement', acts: act('Suivre la demande', 'inbox', function () { ui.navigate('demandes'); }) };
      } },
      { chip: 'Quand dois-je payer ?', re: /pai|factur|[eé]ch[eé]ance|argent|frais|dois/, a: function (c) {
        var inv = nextInvoice(c.sid);
        if (!inv) return { h: 'Vous êtes à jour : aucune échéance en attente.', src: 'Situation financière' };
        return { h: 'Prochaine échéance : <b>' + esc(inv.label) + ' — ' + fmt.money(inv.amount) + '</b> le ' + fmt.long(inv.due) + '. Rappel automatique à J-3 ; paiement par carte en 30 secondes.',
          src: 'Situation financière · Automation Engine', acts: act('Payer maintenant', 'credit-card', function () { KMK.payInvoice(inv.id); }) };
      } },
      { chip: 'Mes prochains examens ?', re: /examen|partiel|ds|convoc|[eé]preuve/, a: function () {
        return { h: '<b>Examen d’Algorithmique</b> vendredi 11/09 à 13:00 en Amphi A (convocation disponible). Puis TP noté de Base de données et oral d’anglais la semaine du 14.',
          src: 'Calendrier des évaluations', acts: act('Ma convocation', 'file-text', function () { ui.navigate('documents'); }) };
      } },
      { chip: 'Résume le cours d’Algorithmique', re: /r[eé]sum|cours|r[eé]vis|chapitre/, a: function () {
        return { h: '<b>Algorithmique — chapitre 3 :</b> récursivité (cas de base, appel récursif), complexité O(n) vs O(n log n), tri fusion et théorème maître. À retenir pour le DS : toujours traiter la liste vide.',
          src: 'Supports de Claire Fontaine · DS n°2' };
      } },
      { chip: 'Événements à venir ?', re: /[eé]v[eé]nement|conf[eé]rence|club|hackathon|forum/, a: function () {
        var ev = db().events.slice(0, 3);
        return { h: ev.map(function (e) { var left = e.capacity - e.base - e.attendees.length; return '• <b>' + esc(e.title) + '</b> — ' + fmt.date(e.date) + ' · ' + (left > 0 ? left + ' place(s)' : 'complet'); }).join('<br>'),
          src: 'Vie étudiante', acts: act('Voir les événements', 'calendar-check', function () { ui.navigate('evenements'); }) };
      } }
    ],
    parent: [
      { chip: 'Comment va Léa ?', re: /comment|va|r[eé]sum|situation|bilan/, a: function (c) {
        var abs = db().absences.filter(function (a) { return a.studentId === c.sid && a.status === 'a_justifier'; }).length;
        return { h: '<b>' + esc(c.stu.name) + '</b> : moyenne <b>' + fmt.num(q.studentAvg(c.sid)) + '</b> (promo 12,8), assiduité <b>' + c.stu.att + ' %</b>, ' + c.stu.credits + ' crédits validés. ' + (abs ? abs + ' absence(s) restent à justifier.' : 'Aucune absence en attente.'),
          src: 'Dossier étudiant (accès parent)', acts: act('Voir les notes', 'award', function () { ui.navigate('notes'); }) };
      } },
      { chip: 'Ses absences ?', re: /absence|absent|pr[eé]sence/, a: function (c) {
        var abs = db().absences.filter(function (a) { return a.studentId === c.sid; });
        return { h: abs.map(function (a) { return '• ' + esc(KMK_MODULES[a.module].name) + ' — ' + fmt.date(a.date) + ' : ' + { a_justifier: 'à justifier', en_attente: 'en validation', justifiee: 'justifiée', refusee: 'refusée' }[a.status]; }).join('<br>'),
          src: 'Feuilles de présence', acts: act('Justifier', 'paperclip', function () { ui.navigate('absences'); }) };
      } },
      { chip: 'Prochaine échéance ?', re: /pai|factur|[eé]ch[eé]ance|frais|argent/, a: function (c) {
        var inv = nextInvoice(c.sid);
        return inv ? { h: '<b>' + esc(inv.label) + ' — ' + fmt.money(inv.amount) + '</b> à régler avant le ' + fmt.long(inv.due) + '.', src: 'Situation financière', acts: act('Payer', 'credit-card', function () { KMK.payInvoice(inv.id); }) } : { h: 'Aucune échéance en attente.', src: 'Situation financière' };
      } },
      { chip: 'Contacter la scolarité', re: /contact|[eé]crire|scolarit|parler/, a: function () {
        return { h: 'Je prépare un message pour la scolarité.', src: 'Messagerie', acts: act('Rédiger', 'send', function () { KMK.composeMessage('u-scol', 'Question d’un parent', ''); }) };
      } }
    ],
    formateur: [
      { chip: 'Qui est en difficulté dans mon groupe ?', re: /difficult|risque|d[eé]croch|faible|alerte/, a: function () {
        var g = q.roster('A').filter(function (s) { return s.risk >= 40; }).sort(function (a, b) { return b.risk - a.risk; });
        return { h: '<b>' + g.length + ' étudiants à surveiller</b> dans le Groupe A :<br>' + g.map(function (s) { return '• ' + esc(s.name) + ' — risque ' + s.risk + ' · ' + esc(s.signal); }).join('<br>'),
          src: 'Student Risk Score · notes · présences', acts: act('Mes groupes', 'users', function () { ui.navigate('groupes'); }) + act('Écrire à la scolarité', 'send', function () { KMK.composeMessage('u-scol', 'Étudiants en difficulté — Groupe A', 'Bonjour, je signale les étudiants suivants : ' + g.map(function (s) { return s.name; }).join(', ') + '.'); }) };
      } },
      { chip: 'Génère un QCM sur la récursivité', re: /qcm|quiz|question|exercice/, a: function () {
        return { h: '<b>QCM — Récursivité (3 questions)</b><br>1. Quel est le rôle du cas de base ? <i>(a) arrêter la récursion ✔</i><br>2. Complexité du tri fusion ? <i>(c) O(n log n) ✔</i><br>3. Que renvoie fact(0) ? <i>(b) 1 ✔</i>',
          src: 'AI Teacher Copilot · supports du module', acts: act('Publier dans le cours', 'upload', function () { KMK.log('ai.qcm', 'QCM publié — Algorithmique'); KMK.commit('QCM publié dans le cours d’Algorithmique — Groupe A notifié'); }) };
      } },
      { chip: 'Notes à saisir ?', re: /note|saisie|ds|copie|corriger/, a: function () {
        var ev = db().evaluations.filter(function (e) { return e.status === 'draft'; });
        return { h: ev.map(function (e) { var n = q.roster(e.group).filter(function (s) { return e.grades[s.id] == null; }).length; return '• <b>' + esc(KMK_MODULES[e.module].name + ' — ' + e.label) + '</b> : ' + n + ' note(s) manquante(s)'; }).join('<br>') || 'Toutes vos évaluations sont publiées.',
          src: 'Évaluations en brouillon', acts: act('Saisir les notes', 'clipboard-check', function () { ui.navigate('saisie-notes'); }) };
      } },
      { chip: 'Mon planning du jour', re: /planning|cours|aujourd|journ|appel|pr[eé]sence/, a: function (c) {
        var ss = db().sessions.filter(function (s) { return s.teacherId === c.me.id && s.date === window.KMK_DEMO_TODAY; });
        return { h: ss.map(function (s) { var done = db().attendance.some(function (a) { return a.sessionId === s.id; }); return '• ' + s.start + ' <b>' + esc(s.title) + '</b> — Groupe ' + s.groups.join(', ') + ' · ' + esc(s.room) + (done ? ' · appel fait' : ' · <b>appel à faire</b>'); }).join('<br>'),
          src: 'Emploi du temps formateur', acts: act('Faire l’appel', 'user-check', function () { ui.navigate('appel'); }) };
      } }
    ],
    scolarite: [
      { chip: 'Demandes en attente ?', re: /demande|attente|retard|en cours|traiter/, a: function () {
        var open = db().requests.filter(function (r) { return r.stage < 4 && !r.rejected; });
        var by = [0, 0, 0, 0]; open.forEach(function (r) { by[r.stage]++; });
        return { h: '<b>' + open.length + ' demandes ouvertes</b> : ' + by[0] + ' déposées, ' + by[1] + ' en vérification, ' + by[2] + ' en traitement, ' + by[3] + ' prêtes à remettre. Délai moyen : 1,4 jour.',
          src: 'Cycle de traitement des demandes', acts: act('Ouvrir le tableau', 'inbox', function () { ui.navigate('demandes'); }) };
      } },
      { chip: 'Justificatifs à valider ?', re: /justif|absence|valider/, a: function () {
        var p = db().absences.filter(function (a) { return a.status === 'en_attente'; });
        return { h: '<b>' + p.length + ' justificatif(s)</b> en attente : ' + p.map(function (a) { return esc(q.student(a.studentId).name); }).join(', ') + '.', src: 'Absences', acts: act('Valider', 'paperclip', function () { ui.navigate('justificatifs'); }) };
      } },
      { chip: 'Étudiants à risque ?', re: /risque|alerte|d[eé]croch/, a: function () {
        var g = db().students.filter(function (s) { return s.risk >= 55; }).sort(function (a, b) { return b.risk - a.risk; });
        return { h: g.map(function (s) { return '• <b>' + esc(s.name) + '</b> (' + s.risk + ') — ' + esc(s.signal); }).join('<br>'), src: 'Early Warning', acts: act('Annuaire', 'users', function () { ui.navigate('etudiants'); }) };
      } },
      { chip: 'Prévenir le Groupe A d’un changement', re: /annonce|informer|pr[eé]venir|changement|salle/, a: function () {
        return { h: 'Je prépare une annonce ciblée pour les étudiants du Groupe A (push + e-mail).', src: 'Smart Communication', acts: act('Rédiger l’annonce', 'megaphone', function () { ui.navigate('annonces', { g: 'A' }); }) };
      } }
    ],
    direction: [
      { chip: 'Comment va mon campus aujourd’hui ?', re: /campus|aujourd|comment|sant|health|va/, a: function () {
        var late = lateInvoices(), open = db().requests.filter(function (r) { return r.stage < 4 && !r.rejected; }).length;
        return { h: '<b>Campus Health : 82 / 100</b><br>• Assiduité 93,4 % (objectif 95 %)<br>• 37 étudiants à risque dont 7 élevés<br>• ' + late.length + ' échéances en retard (' + fmt.money(late.reduce(function (t, i) { return t + i.amount; }, 0)) + ')<br>• ' + open + ' demandes ouvertes, 94 % traitées dans les délais<br>Point d’attention : les absences du <b>lundi matin</b> augmentent de 18 % en première année.',
          src: 'Campus Intelligence · données consolidées', acts: act('Early Warning', 'alert-triangle', function () { ui.navigate('early-warning'); }) + act('Encaissements', 'wallet', function () { ui.navigate('encaissements'); }) };
      } },
      { chip: 'Quels étudiants risquent d’abandonner ?', re: /risque|abandon|d[eé]croch|early/, a: function () {
        var g = db().students.filter(function (s) { return s.risk >= 55; }).sort(function (a, b) { return b.risk - a.risk; });
        return { h: g.map(function (s) { return '• <b>' + esc(s.name) + '</b> — ' + s.risk + '/100 · ' + esc(s.signal); }).join('<br>') + '<br>Action prioritaire : rendez-vous pédagogique cette semaine.', src: 'Student Risk Score', acts: act('Ouvrir Early Warning', 'alert-triangle', function () { ui.navigate('early-warning'); }) };
      } },
      { chip: 'Où en sont les impayés ?', re: /impay|paiement|encaiss|financ|argent/, a: function () {
        var late = lateInvoices();
        return { h: '<b>' + late.length + ' échéances en retard</b> pour ' + fmt.money(late.reduce(function (t, i) { return t + i.amount; }, 0)) + '. Encaissé : 1,32 M€ sur 1,55 M€ attendus (85 %). Le BTS Tourisme concentre 6 retards de plus de 30 jours.', src: 'Financial Intelligence', acts: act('Encaissements', 'wallet', function () { ui.navigate('encaissements'); }) };
      } },
      { chip: 'Quelle formation progresse le moins ?', re: /formation|fili|meilleur|moins|progress/, a: function () {
        return { h: '<b>BUT Informatique</b> : avancement 51 %, assiduité 89 %, moyenne 11,7. À l’inverse, le <b>Mastère Data</b> est à 95 %. Recommandation : renforcer le tutorat du BUT en début de semestre.', src: 'Résultats par formation', acts: act('Formations', 'bar-chart-3', function () { ui.navigate('formations'); }) };
      } }
    ],
    finance: [
      { chip: 'Quels impayés relancer ?', re: /impay|retard|relanc/, a: function () {
        var late = lateInvoices();
        return { h: '<b>' + late.length + ' échéances en retard</b> :<br>' + late.map(function (i) { return '• ' + esc(q.student(i.studentId).name) + ' — ' + fmt.money(i.amount) + ' (J+' + U.daysBetween(i.due, window.KMK_DEMO_TODAY) + ')'; }).join('<br>'),
          src: 'Échéancier', acts: act('Relancer tout', 'send', function () { KMK.remindAll(); }) + act('Échéances', 'wallet', function () { ui.navigate('echeances'); }) };
      } },
      { chip: 'Encaissements du mois ?', re: /encaiss|mois|septembre|chiffre/, a: function () {
        var cf = db().cashflow[db().cashflow.length - 1];
        return { h: 'Septembre : <b>' + cf.v + ' k€</b> encaissés (+5,6 % vs août). Cumul annuel : 1,32 M€ sur 1,55 M€ attendus.', src: 'Encaissements', acts: act('Voir le détail', 'bar-chart-3', function () { ui.navigate('encaissements'); }) };
      } },
      { chip: 'Risque d’impayé à venir ?', re: /risque|pr[eé]vi|pr[eé]di|futur/, a: function () {
        return { h: 'Probabilité d’impayé élevée pour <b>Sarah Benali</b> (82 %) et <b>Omar Haddou</b> (64 %) : historique de retard et activité en baisse. Proposer un échéancier avant le 15/09.', src: 'Prédiction du risque d’impayé' };
      } }
    ]
  };

  function answer(c, text, intent) {
    aiActions = aiActions.slice(-60);
    var list = INTENTS[c.role] || [];
    var it = intent != null ? list[intent] : list.filter(function (i) { return i.re.test(text.toLowerCase()); })[0];
    if (!it) return { h: 'Je n’ai pas trouvé de réponse précise à « ' + esc(text) + ' ». Voici ce que je sais faire pour vous :<br>' + list.map(function (i) { return '• ' + esc(i.chip); }).join('<br>'), src: 'KMK AI · données KMK Campus' };
    return it.a(c);
  }
  function aiBubble(m) {
    if (m.me) return '<div class="bub me"><span class="who2">Vous</span>' + esc(m.text) + '</div>';
    return '<div class="bub them"><span class="who2">KMK AI</span>' + m.h + (m.acts ? '<div class="acts2">' + m.acts + '</div>' : '') + (m.src ? '<span class="src">' + icon('database', 11) + ' Source : ' + esc(m.src) + '</span>' : '') + '</div>';
  }
  function greet(c) {
    var first = c.me.name.split(' ')[0];
    var t = { etudiant: 'Je connais vos notes, vos présences, vos demandes et vos échéances. Posez votre question : je réponds, puis j’agis.',
      parent: 'Je vous informe sur la scolarité de ' + (c.stu ? esc(c.stu.name.split(' ')[0]) : 'votre enfant') + ' : résultats, absences et échéances.',
      formateur: 'Je suis votre AI Teacher Copilot : étudiants en difficulté, QCM, notes à saisir et appels.',
      scolarite: 'Je suis l’assistant AI Administration : demandes, justificatifs, annonces et étudiants à risque.',
      direction: 'Je consolide les données du campus pour vous : santé, risques, finances et formations.',
      finance: 'Je suis votre copilote financier : impayés, encaissements et prédiction du risque.' }[c.role];
    return { h: 'Bonjour ' + esc(first) + '. ' + t, src: '' };
  }

  KMK.route('ia', {
    label: 'KMK AI', icon: 'sparkles', roles: ALL,
    sub: function () { return 'Copilote campus — questions en langage naturel, réponses sourcées, actions exécutées'; },
    render: function (c) {
      var h = aiHistory[c.me.id] = aiHistory[c.me.id] || [greet(c)];
      var chips = (INTENTS[c.role] || []).map(function (i, k) { return '<button type="button" class="chipq" data-act="ai-ask" data-k="' + k + '">' + esc(i.chip) + '</button>'; }).join('');
      var sources = { etudiant: ['Notes et crédits', 'Présences', 'Demandes et documents', 'Échéances', 'Emploi du temps'], parent: ['Résultats', 'Présences', 'Échéances'], formateur: ['Groupes et étudiants', 'Évaluations', 'Feuilles de présence', 'Supports de cours'],
        scolarite: ['Demandes', 'Justificatifs', 'Dossiers étudiants', 'Annonces'], direction: ['Effectifs', 'Assiduité', 'Résultats', 'Finances', 'Early Warning'], finance: ['Échéancier', 'Encaissements', 'Relances', 'Historique de paiement'] }[c.role];
      return '<div class="grid g21">' +
        '<div class="card ai-card"><div class="ch"><h3>' + icon('sparkles', 16) + ' KMK AI</h3>' + H.pill('en ligne', 'green') + '</div>' +
        '<div class="chat" id="aiChat" aria-live="polite">' + h.map(aiBubble).join('') + '</div>' +
        '<form class="composer" id="aiForm"><input class="input" id="aiInput" placeholder="Posez votre question à KMK AI…" autocomplete="off" aria-label="Question"><button class="btn" type="submit">' + icon('send', 15) + '<span class="hide-sm">Envoyer</span></button></form></div>' +
        '<div class="grid" style="align-content:start">' +
        H.card('Suggestions', '', '<div class="pad"><div class="chips">' + chips + '</div></div>') +
        H.card('Données consultées', H.pill('droits ' + c.R.label, 'soft'), '<div class="list">' + sources.map(function (s) { return H.li({ icon: 'database', title: esc(s), sub: 'lecture seule · tracée au journal' }); }).join('') + '</div>') +
        '<div class="hintx"><b>Démo statique :</b> les réponses sont calculées en JavaScript à partir des données de la démo (aucun serveur, aucun modèle externe). En production, le même écran interroge le moteur KMK AI avec les droits KMK ID de l’utilisateur.</div>' +
        '</div></div>';
    },
    mount: function (el, c) {
      var chat = $('#aiChat', el), h = aiHistory[c.me.id];
      chat.scrollTop = chat.scrollHeight;
      function ask(text, k) {
        h.push({ me: true, text: text });
        chat.insertAdjacentHTML('beforeend', aiBubble({ me: true, text: text }) + '<div class="bub them" id="typing"><span class="who2">KMK AI</span><span class="typing"><i></i><i></i><i></i></span></div>');
        chat.scrollTop = chat.scrollHeight;
        KMK.log('ai.ask', '« ' + text.slice(0, 80) + ' »');
        KMK.flag('ai');
        KMK.store.save();
        setTimeout(function () {
          var r = answer(KMK.ctx(), text, k);
          h.push(r);
          var t = $('#typing'); if (t) t.outerHTML = aiBubble(r);
          var ch = $('#aiChat'); if (ch) ch.scrollTop = ch.scrollHeight;
          KMK.ui.chrome();
        }, 650 + Math.random() * 450);
      }
      A['ai-ask'] = function (b) { ask(b.textContent, +b.dataset.k); };
      $('#aiForm', el).addEventListener('submit', function (e) { e.preventDefault(); var i = $('#aiInput'); var v = i.value.trim(); if (!v) return; i.value = ''; ask(v); });
      if (c.params.q) { var qv = c.params.q; window.history.replaceState(null, '', '#/ia'); setTimeout(function () { ask(qv); }, 300); }
    }
  });

  /* =========================================================
     Profil (tous les rôles)
     ========================================================= */
  var CHANNELS = ['Push', 'E-mail', 'SMS', 'WhatsApp'];
  var CATS = [['notes', 'Notes et résultats'], ['absences', 'Absences et présences'], ['demandes', 'Demandes et documents'], ['finances', 'Paiements et échéances'], ['vie', 'Événements et annonces']];
  KMK.route('profil', {
    label: 'Mon profil', icon: 'user', roles: ALL,
    sub: function (c) { return c.me.email; },
    render: function (c) {
      var tab = c.params.tab || 'infos', u = c.me, ses = c.session;
      var tabs = '<div class="tabs" role="tablist">' + [['infos', 'Informations'], ['securite', 'Sécurité'], ['notifications', 'Notifications'], ['donnees', 'Mes données']].map(function (t) {
        return '<button role="tab" aria-selected="' + (tab === t[0]) + '" class="' + (tab === t[0] ? 'on' : '') + '" data-go="profil?tab=' + t[0] + '">' + t[1] + '</button>'; }).join('') + '</div>';
      var head = '<div class="card prof"><span class="av xl">' + esc(u.initials) + '</span><div style="min-width:0"><h3>' + esc(u.name) + '</h3><div class="m">' + esc(u.title) + '</div><div class="hstack wrap" style="margin-top:8px">' + H.pill(c.R.label, 'soft', c.R.icon) +
        (ses && ses.mfa ? H.pill('Connecté avec MFA', 'green', 'shield-check') : '') + H.pill('KMK ID actif', 'blue', 'check') + '</div></div></div>';
      var body = '';
      if (tab === 'infos') {
        body = '<div class="grid g2"><div class="card pad"><form id="profForm"><div class="lbl">Coordonnées</div>' +
          '<div class="field"><label>Adresse e-mail</label><input class="input" value="' + esc(u.email) + '" disabled><div class="help">Identifiant KMK ID — modifiable uniquement par la scolarité.</div></div>' +
          '<div class="field"><label for="pPhone">Téléphone</label><input class="input" id="pPhone" value="' + esc(u.phone || '') + '" inputmode="tel"></div>' +
          '<div class="field"><label for="pAddr">Adresse postale</label><input class="input" id="pAddr" value="' + esc(u.address || '') + '"></div>' +
          '<button class="btn" type="submit">' + icon('check', 15) + 'Enregistrer</button></form></div>' +
          (c.stu ? H.card(c.role === 'parent' ? 'Enfant suivi' : 'Ma scolarité', '', '<div class="pad"><dl class="kv"><dt>Étudiant</dt><dd>' + esc(c.stu.name) + '</dd><dt>Formation</dt><dd>' + esc(c.stu.formation) + '</dd><dt>Niveau</dt><dd>' + esc(c.stu.level) + ' · Groupe ' + esc(c.stu.group) + '</dd><dt>Année</dt><dd>2026-2027</dd><dt>Référent</dt><dd>Claire Fontaine</dd></dl></div>')
            : H.card('Mon rôle', '', '<div class="pad"><dl class="kv"><dt>Profil</dt><dd>' + esc(c.R.label) + '</dd><dt>Espace</dt><dd>' + esc(c.R.space) + '</dd><dt>Établissement</dt><dd>KMK Campus — Lyon</dd><dt>Accès</dt><dd>selon les droits KMK ID du profil</dd></dl></div>')) + '</div>';
      } else if (tab === 'securite') {
        var forced = KMK.db().settings.mfaStaff && ['formateur', 'direction', 'finance'].indexOf(c.role) >= 0;
        var logins = KMK.db().audit.filter(function (a) { return a.userId === u.id && /^auth\./.test(a.action); }).slice(0, 6);
        body = '<div class="grid g2"><div class="card pad"><form id="pwdForm"><div class="lbl">Changer le mot de passe</div>' +
          '<div class="field"><label for="op">Mot de passe actuel</label><input class="input" type="password" id="op" autocomplete="current-password"></div>' +
          '<div class="field"><label for="np">Nouveau mot de passe</label><input class="input" type="password" id="np" autocomplete="new-password"><div class="strength"><i id="pStr"></i></div></div>' +
          '<div class="field"><label for="np2">Confirmation</label><input class="input" type="password" id="np2" autocomplete="new-password"></div>' +
          '<button class="btn" type="submit">' + icon('key-round', 15) + 'Mettre à jour</button></form></div>' +
          '<div class="grid" style="align-content:start">' +
          H.card('Double authentification', forced ? H.pill('Obligatoire', 'dark') : '', '<div class="setrow"><div class="tx"><div class="n">Code par SMS à la connexion</div><div class="s">' + (forced ? 'Imposé par la politique de sécurité pour votre profil.' : 'Recommandé : protège votre compte même si votre mot de passe fuite.') + '</div></div>' +
            '<button type="button" class="sw' + (u.mfa || forced ? ' on' : '') + '" data-act="toggle-mfa"' + (forced ? ' disabled title="Imposé par l’établissement"' : '') + ' aria-label="Activer la double authentification"><i></i></button></div>') +
          H.card('Sessions actives', '', '<div class="list">' + H.li({ icon: 'monitor', title: esc(ses ? ses.device : 'Navigateur web') + ' · cet appareil', sub: 'Ouverte ' + fmt.rel(U.nowISO()) + (ses && ses.remember ? ' · « rester connecté »' : ' · expire dans 8 h'), right: H.pill('Actuelle', 'green') }) +
            H.li({ icon: 'smartphone', tone: 'grey', title: 'Application mobile KMK', sub: 'Lyon · dernière activité il y a 2 j', right: '<button class="act danger" data-act="kill-session">Déconnecter</button>' }) + '</div>') +
          H.card('Activité de connexion', '', '<div class="list">' + (logins.length ? logins.map(function (a) { return H.li({ icon: a.action === 'auth.fail' ? 'x-circle' : 'log-in', tone: a.action === 'auth.fail' ? 'red' : 'blue', title: esc(a.detail), sub: fmt.rel(a.at) + ' · IP ' + esc(a.ip) }); }).join('') : '<div class="pad m">Aucune activité.</div>') + '</div>') +
          '</div></div>';
      } else if (tab === 'notifications') {
        var prefs = u.prefs || {};
        body = H.card('Préférences de notification', '<span class="m">par catégorie et par canal</span>', '<div class="tbl-wrap"><table class="matrix"><thead><tr><th>Catégorie</th>' + CHANNELS.map(function (ch) { return '<th>' + ch + '</th>'; }).join('') + '</tr></thead><tbody>' +
          CATS.map(function (cat) { return '<tr><td class="nm">' + cat[1] + '</td>' + CHANNELS.map(function (ch) { var k = cat[0] + ':' + ch, on = prefs[k] != null ? prefs[k] : (ch === 'Push' || ch === 'E-mail' || (ch === 'SMS' && cat[0] === 'finances')); return '<td><button type="button" class="sw' + (on ? ' on' : '') + '" data-act="toggle-pref" data-k="' + k + '" aria-label="' + cat[1] + ' par ' + ch + '"><i></i></button></td>'; }).join('') + '</tr>'; }).join('') +
          '</tbody></table></div><div class="pad"><div class="hintx">Les alertes critiques (sécurité du compte, convocations d’examen) sont toujours envoyées, quel que soit votre choix.</div></div>');
      } else {
        body = '<div class="grid g2">' + H.card('Exporter mes données', H.pill('RGPD', 'soft'), '<div class="pad"><p class="m" style="margin-bottom:14px">Téléchargez une copie de vos données personnelles au format JSON : profil, notes, demandes, paiements, messages et journal de connexion.</p><button class="btn" data-act="export-me">' + icon('download', 15) + 'Télécharger mes données</button></div>') +
          H.card('Confidentialité', '', '<div class="list">' + H.li({ icon: 'lock', title: 'Données chiffrées', sub: 'Notes, documents et données financières chiffrés au repos.' }) + H.li({ icon: 'history', title: 'Accès tracés', sub: 'Chaque consultation de votre dossier est inscrite au journal.' }) + H.li({ icon: 'shield-check', title: 'Conservation', sub: 'Données conservées pendant la scolarité puis archivées 5 ans.' }) + '</div>') + '</div>';
      }
      return head + '<div class="mt2">' + tabs + body + '</div>';
    },
    mount: function (el, c) {
      var pf = $('#profForm', el);
      if (pf) pf.addEventListener('submit', function (e) {
        e.preventDefault();
        var ph = $('#pPhone', el).value.trim();
        if (ph && !/^[+\d][\d\s.]{8,}$/.test(ph)) { ui.toast('Numéro de téléphone invalide', 'err'); return; }
        c.me.phone = ph; c.me.address = $('#pAddr', el).value.trim();
        KMK.log('profile.update', 'Coordonnées mises à jour');
        KMK.commit('Coordonnées enregistrées');
      });
      var pw = $('#pwdForm', el);
      if (pw) {
        $('#np', el).addEventListener('input', function () { var s = KMK.auth.score(this.value); var b = $('#pStr', el); b.style.width = (this.value ? (s + 1) * 20 : 0) + '%'; b.style.background = ['#D64545', '#D64545', '#E0912A', '#2E8BFF', '#1F9D6B'][s]; });
        pw.addEventListener('submit', function (e) {
          e.preventDefault();
          var o = $('#op', el).value, n = $('#np', el).value, n2 = $('#np2', el).value;
          if (o !== c.me.password) { ui.toast('Mot de passe actuel incorrect', 'err'); KMK.log('auth.fail', 'Changement de mot de passe refusé'); KMK.store.save(); return; }
          if (n.length < 8 || KMK.auth.score(n) < 3) { ui.toast('Nouveau mot de passe trop faible', 'err'); return; }
          if (n !== n2) { ui.toast('La confirmation ne correspond pas', 'err'); return; }
          c.me.password = n;
          KMK.log('auth.password', 'Mot de passe modifié');
          KMK.commit('Mot de passe mis à jour — utilisez-le à la prochaine connexion');
        });
      }
    }
  });
  A['toggle-mfa'] = function (b) {
    var u = me(); u.mfa = !u.mfa;
    KMK.log('auth.mfa', 'Double authentification ' + (u.mfa ? 'activée' : 'désactivée'));
    KMK.commit('Double authentification ' + (u.mfa ? 'activée — un code sera demandé à la prochaine connexion' : 'désactivée'));
  };
  A['toggle-pref'] = function (b) {
    var u = me(); u.prefs = u.prefs || {};
    var on = !b.classList.contains('on'); u.prefs[b.dataset.k] = on; b.classList.toggle('on', on);
    KMK.store.save(); ui.toast('Préférence enregistrée', 'info');
  };
  A['kill-session'] = function (b) { b.closest('.li').remove(); KMK.log('auth.session_revoked', 'Session mobile révoquée'); KMK.store.save(); ui.toast('Session de l’application mobile fermée'); };
  A['export-me'] = function () {
    var c = KMK.ctx(), d = KMK.db(), u = c.me;
    var data = { exporte_le: U.nowISO(), compte: { nom: u.name, email: u.email, role: c.R.label, telephone: u.phone, adresse: u.address },
      scolarite: c.sid ? { etudiant: q.student(c.sid), notes: q.grades(c.sid), absences: d.absences.filter(function (a) { return a.studentId === c.sid; }), demandes: d.requests.filter(function (r) { return r.studentId === c.sid; }), echeances: d.invoices.filter(function (i) { return i.studentId === c.sid; }) } : null,
      messages: d.threads.filter(function (t) { return t.participants.indexOf(u.id) >= 0; }),
      journal: d.audit.filter(function (a) { return a.userId === u.id; }) };
    U.download('kmk-mes-donnees-' + u.initials.toLowerCase() + '.json', JSON.stringify(data, null, 2), 'application/json');
    KMK.log('rgpd.export', 'Export des données personnelles'); KMK.commit('Export téléchargé');
  };

  /* =========================================================
     Sécurité & audit (scolarité, direction)
     ========================================================= */
  var PERMS = [
    ['Consulter ses notes et absences', ['etudiant', 'parent']],
    ['Déposer une demande', ['etudiant']],
    ['Payer une échéance', ['etudiant', 'parent']],
    ['Faire l’appel / saisir des notes', ['formateur']],
    ['Traiter les demandes', ['scolarite']],
    ['Valider les justificatifs', ['scolarite']],
    ['Envoyer des annonces', ['scolarite', 'direction']],
    ['Consulter les dossiers étudiants', ['formateur', 'scolarite', 'direction', 'finance']],
    ['Gérer les échéances et relances', ['finance']],
    ['Campus Health & Early Warning', ['direction', 'scolarite']],
    ['Journal d’audit et réglages', ['direction', 'scolarite']]
  ];
  var SETTINGS = [['mfaStaff', 'Double authentification du personnel', 'Obligatoire pour la direction, la finance et les formateurs (appliqué à la connexion)'],
    ['auditLog', 'Journalisation des accès', 'Chaque consultation de dossier est tracée et consultable'],
    ['backups', 'Sauvegardes quotidiennes', 'Copies chiffrées conservées 30 jours, restauration en 1 clic'],
    ['encryption', 'Chiffrement des données', 'Notes, documents et données financières chiffrés'],
    ['sessionTimeout', 'Expiration des sessions', 'Déconnexion automatique après 8 h'],
    ['multiCampus', 'Multi-établissements', 'Données cloisonnées par campus, rôles partagés']];
  var ACTION_LABEL = { 'auth.login': 'Connexion', 'auth.logout': 'Déconnexion', 'auth.fail': 'Échec', 'auth.sso': 'SSO', 'auth.reset': 'Mot de passe', 'auth.reset_request': 'Mot de passe', 'auth.password': 'Mot de passe', 'auth.mfa': 'MFA', 'access.denied': 'Accès refusé' };
  KMK.route('securite', {
    label: { '*': 'Sécurité & audit' }, icon: 'shield-check', roles: ['scolarite', 'direction'],
    sub: function () { return 'Rôles, permissions, réglages et journal d’audit en direct'; },
    render: function (c) {
      var d = c.db, fq = (c.params.q || '').toLowerCase(), fu = c.params.u || '';
      var logs = d.audit.filter(function (a) { return (!fu || a.userId === fu) && (!fq || (a.detail + ' ' + a.action).toLowerCase().indexOf(fq) >= 0); });
      var today = d.audit.filter(function (a) { return a.at.indexOf(window.KMK_DEMO_TODAY) === 0; });
      var fails = d.audit.filter(function (a) { return a.action === 'auth.fail' || a.action === 'access.denied'; }).length;
      var mfaOn = d.users.filter(function (u) { return u.mfa || (d.settings.mfaStaff && ['formateur', 'direction', 'finance'].indexOf(u.role) >= 0); }).length;
      var kpis = '<div class="grid g4 mb">' + H.kpi({ icon: 'users', label: 'Comptes actifs', value: '1 254', delta: '6 comptes de démo' }) +
        H.kpi({ icon: 'shield-check', label: 'MFA activée', value: Math.round(mfaOn / d.users.length * 100) + ' %', delta: mfaOn + ' / ' + d.users.length + ' comptes de démo' }) +
        H.kpi({ icon: 'log-in', label: 'Événements aujourd’hui', value: today.length, delta: 'journal en direct' }) +
        H.kpi({ icon: 'alert-triangle', label: 'Tentatives refusées', value: fails, delta: 'échecs + accès refusés', tone: fails ? 'warn' : '' }) + '</div>';
      var settings = H.card('Politique de sécurité', '<span class="m">cliquez pour modifier</span>', '<div>' + SETTINGS.map(function (s) {
        return '<div class="setrow"><div class="tx"><div class="n">' + s[1] + '</div><div class="s">' + s[2] + '</div></div><button type="button" class="sw' + (d.settings[s[0]] ? ' on' : '') + '" data-act="toggle-setting" data-k="' + s[0] + '" aria-label="' + s[1] + '"><i></i></button></div>'; }).join('') + '</div>');
      var roles = ['etudiant', 'formateur', 'scolarite', 'direction', 'finance', 'parent'];
      var matrix = H.card('Matrice des droits (RBAC)', '<span class="m">6 profils</span>', '<div class="tbl-wrap"><table class="matrix"><thead><tr><th>Permission</th>' + roles.map(function (r) { return '<th>' + KMK_ROLES[r].label + '</th>'; }).join('') + '</tr></thead><tbody>' +
        PERMS.map(function (p) { return '<tr><td class="nm">' + p[0] + '</td>' + roles.map(function (r) { return '<td>' + (p[1].indexOf(r) >= 0 ? '<span class="yes">' + icon('check', 16) + '</span>' : '<span class="no">' + icon('x', 14) + '</span>') + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>');
      var accounts = H.card('Comptes de démonstration', '', '<div class="list">' + d.users.map(function (u) {
        var last = d.audit.filter(function (a) { return a.userId === u.id && a.action === 'auth.login'; })[0];
        var mfa = u.mfa || (d.settings.mfaStaff && ['formateur', 'direction', 'finance'].indexOf(u.role) >= 0);
        return '<div class="li">' + H.av(u.initials, KMK_ROLES[u.role].color) + '<div class="tx"><div class="tt">' + esc(u.name) + ' ' + H.pill(KMK_ROLES[u.role].label, 'grey') + '</div><div class="ss">' + esc(u.email) + ' · ' + (last ? 'connexion ' + fmt.rel(last.at) : 'jamais connecté') + '</div></div>' +
          (mfa ? H.pill('MFA', 'green', 'shield-check') : H.pill('Sans MFA', 'amber')) + '<button class="act" data-act="reset-pwd" data-u="' + u.id + '" title="Réinitialiser le mot de passe">' + icon('key-round', 13) + '<span class="hide-sm">Réinitialiser</span></button></div>'; }).join('') + '</div>');
      var users = '<option value="">Tous les comptes</option>' + d.users.map(function (u) { return '<option value="' + u.id + '"' + (fu === u.id ? ' selected' : '') + '>' + esc(u.name) + '</option>'; }).join('');
      var journal = '<div class="card mt"><div class="ch"><h3>Journal d’audit</h3>' + H.pill('en direct', 'green', 'activity') + '<div class="sp hstack"><button class="btn ghost sm" data-act="export-audit">' + icon('download', 14) + 'Exporter CSV</button></div></div>' +
        '<div class="pad" style="padding-bottom:0"><div class="toolbar"><div class="inwrap">' + icon('search', 16) + '<input class="input" id="auQ" placeholder="Filtrer : connexion, demande, paiement…" value="' + esc(c.params.q || '') + '"></div><select class="select" id="auU">' + users + '</select><span class="m">' + logs.length + ' événement(s)</span></div></div>' +
        '<div class="tbl-wrap"><table><thead><tr><th>Horodatage</th><th>Compte</th><th>Action</th><th>Détail</th><th>IP</th></tr></thead><tbody>' +
        logs.slice(0, 60).map(function (a) { var u = q.user(a.userId) || { name: 'Système', initials: 'SY', role: 'direction' }; var bad = a.action === 'auth.fail' || a.action === 'access.denied';
          return '<tr><td class="nowrap mu">' + fmt.dateY(a.at) + ' ' + fmt.time(a.at) + '</td><td>' + H.who(u.name, KMK_ROLES[u.role] ? KMK_ROLES[u.role].label : '', u.initials) + '</td><td>' + H.pill(ACTION_LABEL[a.action] || a.action.split('.')[0], bad ? 'red' : 'grey') + '</td><td>' + esc(a.detail) + '</td><td class="log mu">' + esc(a.ip) + '</td></tr>'; }).join('') +
        '</tbody></table></div>' + (logs.length ? '' : H.empty('history', 'Aucun événement', 'Modifiez les filtres.')) + '</div>';
      return kpis + '<div class="grid g2">' + settings + accounts + '</div><div class="mt">' + matrix + '</div>' + journal;
    },
    mount: function (el, c) {
      KMK.flag('audit'); KMK.store.save();
      var t;
      function apply() { var p = {}; var qv = $('#auQ', el).value.trim(), uv = $('#auU', el).value; if (qv) p.q = qv; if (uv) p.u = uv; KMK.replaceParams('securite', p); }
      $('#auQ', el).addEventListener('input', function () { clearTimeout(t); t = setTimeout(apply, 350); });
      $('#auU', el).addEventListener('change', apply);
    }
  });
  KMK.replaceParams = function (path, params) {
    var qs = Object.keys(params).length ? '?' + new URLSearchParams(params).toString() : '';
    history.replaceState(null, '', '#/' + path + qs);
    var a = document.activeElement, id = a && a.id, pos = a && a.selectionStart;
    if (a && a.blur) a.blur();
    ui.refresh();
    if (id) { var n = document.getElementById(id); if (n) { n.focus(); try { n.setSelectionRange(pos, pos); } catch (e) {} } }
  };

  A['toggle-setting'] = function (b) {
    var d = KMK.db(), k = b.dataset.k; d.settings[k] = !d.settings[k];
    var s = SETTINGS.filter(function (x) { return x[0] === k; })[0];
    KMK.log('security.setting', s[1] + ' : ' + (d.settings[k] ? 'activé' : 'désactivé'));
    KMK.commit(s[1] + ' ' + (d.settings[k] ? 'activé' : 'désactivé'));
  };
  A['reset-pwd'] = function (b) {
    var u = q.user(b.dataset.u);
    ui.confirm({ title: 'Réinitialiser le mot de passe ?', body: 'Le mot de passe de <b>' + esc(u.name) + '</b> sera remis à <code>' + esc(window.KMK_DEMO_PASSWORD) + '</code>.', ok: 'Réinitialiser' }).then(function (ok) {
      if (!ok) return; u.password = window.KMK_DEMO_PASSWORD;
      KMK.log('auth.reset', 'Mot de passe de ' + u.name + ' réinitialisé par l’administration');
      KMK.commit('Mot de passe de ' + esc(u.name) + ' réinitialisé');
    });
  };
  A['export-audit'] = function () {
    var rows = [['Horodatage', 'Compte', 'Action', 'Détail', 'IP']].concat(KMK.db().audit.map(function (a) { var u = q.user(a.userId); return [a.at.replace('T', ' '), u ? u.name : 'Système', a.action, a.detail, a.ip]; }));
    U.download('kmk-journal-audit.csv', U.csv(rows), 'text/csv;charset=utf-8');
    KMK.log('audit.export', 'Export du journal d’audit'); KMK.commit('Journal exporté (CSV)');
  };
})();
