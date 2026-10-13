/* =========================================================
   KMK Campus — administration / scolarité (+ annuaire partagé)
   ========================================================= */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var U = KMK.util, esc = U.esc, fmt = KMK.fmt, q = KMK.q, H = KMK.H, ui = KMK.ui, A = KMK.actions;
  var TODAY = window.KMK_DEMO_TODAY;
  function db() { return KMK.db(); }
  function ctx() { return KMK.ctx(); }
  function rtype(id) { return KMK_REQUEST_TYPES.filter(function (t) { return t.id === id; })[0] || { label: id, sla: '48 h', icon: 'inbox' }; }
  function slaHours(t) { var m = /(\d+)\s*(h|j)/.exec(t.sla); return m ? (+m[1]) * (m[2] === 'j' ? 24 : 1) : 48; }
  function ageHours(r) { return (U.parse(U.nowISO()) - U.parse(r.createdAt)) / 3600000; }
  function getReq(id) { return db().requests.filter(function (r) { return r.id === id; })[0]; }

  /* ---------------------------------------------------------
     Cycle de vie d’une demande (effets de bord)
     --------------------------------------------------------- */
  KMK.advanceRequest = function (r, to) {
    var c = ctx(), d = db(), s = q.student(r.studentId), t = rtype(r.type);
    if (to === r.stage || to < 0 || to > 4) return;
    r.stage = to; r.rejected = false;
    r.history.push({ stage: to, at: U.nowISO(), by: c.me.name });
    var u = q.userOfStudent(s.id), route = 'demandes';
    if (to >= 3 && t.doc && !r.docId) {
      var doc = { id: U.uid('d'), studentId: s.id, kind: r.type, title: t.label + ' — ' + r.ref, date: TODAY, signed: true, isNew: true, reqId: r.id };
      d.documents.unshift(doc); r.docId = doc.id; route = 'documents';
    }
    if (u) {
      var msg = to === 3 ? (t.doc ? 'Document signé prêt à télécharger' : 'Votre demande est traitée') : to === 4 ? 'Demande clôturée et remise' : 'Nouvelle étape : ' + KMK_STAGES[to].label;
      KMK.notify([u.id], { title: t.label + ' — ' + KMK_STAGES[to].label, body: r.ref + ' · ' + msg, icon: to >= 3 ? 'check-circle-2' : 'inbox', tone: to >= 3 ? 'green' : 'blue', route: to >= 3 && r.docId ? 'documents' : route });
    }
    KMK.log('request.stage', r.ref + ' → ' + KMK_STAGES[to].label);
    if (to >= 3) KMK.flag('reqReady');
  };
  KMK.rejectRequest = function (r, reason) {
    var c = ctx(), s = q.student(r.studentId), u = q.userOfStudent(s.id);
    r.rejected = true; r.note = reason;
    r.history.push({ stage: r.stage, at: U.nowISO(), by: c.me.name, rejected: true });
    if (u) KMK.notify([u.id], { title: 'Demande refusée — ' + r.ref, body: reason, icon: 'x-circle', tone: 'red', route: 'demandes?f=done' });
    KMK.log('request.reject', r.ref + ' refusée : ' + reason);
  };

  /* ---------------------------------------------------------
     Tableau de bord scolarité
     --------------------------------------------------------- */
  KMK.part('tableau-de-bord', ['scolarite'], {
    label: 'Tableau de bord', icon: 'layout-dashboard',
    sub: function () { return 'Service scolarité et examens · ' + fmt.long(TODAY); },
    render: function (c) {
      var d = db(), open = d.requests.filter(function (r) { return r.stage < 4 && !r.rejected; });
      var fresh = d.requests.filter(function (r) { return r.stage === 0 && !r.rejected; });
      var pend = d.absences.filter(function (a) { return a.status === 'en_attente'; });
      var late = open.filter(function (r) { return r.stage < 3 && ageHours(r) > slaHours(rtype(r.type)); });
      var delivered = 128 + d.requests.filter(function (r) { return r.demo && r.stage >= 3; }).length;
      var byType = KMK_REQUEST_TYPES.map(function (t) { return { l: t.label.split(' ')[0].replace('Changement', 'Adresse').replace('Duplicata', 'Carte'), v: d.requests.filter(function (r) { return r.type === t.id; }).length, on: true }; });
      return '<div class="welcome"><div><h2>Bonjour ' + esc(c.me.name.split(' ')[0]) + '</h2><p>' + fresh.length + ' nouvelle(s) demande(s), ' + pend.length + ' justificatif(s) à valider' + (late.length ? ', <b>' + late.length + ' hors délai</b>' : '') + '. KMK AI a déjà classé et attribué les demandes du jour.</p></div>' +
        '<div class="acts"><button class="btn white" data-go="demandes">' + icon('inbox', 15) + 'Traiter les demandes</button><button class="btn ghost" data-go="annonces">' + icon('megaphone', 15) + 'Nouvelle annonce</button></div></div>' +
        '<div class="grid g4">' + H.kpi({ icon: 'inbox', label: 'Demandes ouvertes', value: open.length, delta: fresh.length + ' nouvelle(s) · ' + late.length + ' hors délai', tone: late.length ? 'warn' : '', go: 'demandes' }) +
        H.kpi({ icon: 'paperclip', label: 'Justificatifs à valider', value: pend.length, delta: 'délai cible : 48 h', tone: pend.length ? 'warn' : 'good', go: 'justificatifs' }) +
        H.kpi({ icon: 'clock', label: 'Délai moyen de traitement', value: '1,4 j', delta: '−0,6 j depuis l’automatisation', tone: 'good' }) +
        H.kpi({ icon: 'file-text', label: 'Documents délivrés', value: delivered, delta: 'ce mois-ci · signés électroniquement' }) + '</div>' +
        '<div class="grid g21 mt">' + H.card('Nouvelles demandes', '<button class="lk" data-go="demandes">Tableau complet</button>', fresh.length ? '<div class="list">' + fresh.map(function (r) { var s = q.student(r.studentId);
          return '<div class="li">' + H.av(s.initials) + '<div class="tx"><div class="tt">' + esc(rtype(r.type).label) + (r.demo ? ' ' + H.pill('Nouveau', 'solid') : '') + '</div><div class="ss">' + esc(s.name) + ' · ' + esc(r.ref) + ' · ' + fmt.rel(r.createdAt) + '</div></div><button class="btn sm" data-act="req-take" data-id="' + r.id + '">Prendre en charge</button></div>'; }).join('') + '</div>' : H.empty('check-circle-2', 'Aucune nouvelle demande', '')) +
        H.card('Justificatifs', '<button class="lk" data-go="justificatifs">Tout voir</button>', pend.length ? '<div class="list">' + pend.slice(0, 4).map(function (a) { var s = q.student(a.studentId);
          return '<div class="li">' + H.av(s.initials, '#E0912A') + '<div class="tx"><div class="tt">' + esc(s.name) + '</div><div class="ss">' + esc(KMK_MODULES[a.module].name) + ' · ' + fmt.date(a.date) + ' · ' + esc(a.reason) + '</div></div><button class="ibtn" data-act="abs-ok" data-id="' + a.id + '" aria-label="Valider" title="Valider" style="color:var(--green)">' + icon('check', 16) + '</button></div>'; }).join('') + '</div>' : H.empty('check-circle-2', 'Tout est validé', '')) + '</div>' +
        '<div class="grid g2 mt">' + H.card('Demandes par type', '<span class="m">année en cours</span>', '<div class="pad">' + H.bars(byType) + '</div>') +
        H.card('Activité récente', '<button class="lk" data-go="securite">Journal</button>', '<div class="list">' + d.audit.slice(0, 6).map(function (a) { var u = q.user(a.userId) || { name: 'Système', initials: 'SY' }; return '<div class="li">' + H.av(u.initials) + '<div class="tx"><div class="tt">' + esc(a.detail) + '</div><div class="ss">' + esc(u.name) + ' · ' + fmt.rel(a.at) + '</div></div></div>'; }).join('') + '</div>') + '</div>';
    }
  });
  A['req-take'] = function (b) { var r = getReq(b.dataset.id); KMK.advanceRequest(r, 1); KMK.commit(r.ref + ' prise en charge — étudiant notifié'); };

  /* ---------------------------------------------------------
     Demandes — tableau Kanban
     --------------------------------------------------------- */
  KMK.part('demandes', ['scolarite'], {
    label: 'Demandes', icon: 'inbox',
    sub: function () { return 'Glissez une carte d’une colonne à l’autre : l’étudiant est notifié à chaque étape'; },
    badge: function () { return db().requests.filter(function (r) { return r.stage === 0 && !r.rejected; }).length; },
    render: function (c) {
      var tf = c.params.type || '', sq = (c.params.q || '').toLowerCase();
      var list = db().requests.filter(function (r) { var s = q.student(r.studentId); return !r.rejected && (!tf || r.type === tf) && (!sq || (s.name + ' ' + r.ref).toLowerCase().indexOf(sq) >= 0); });
      var rejected = db().requests.filter(function (r) { return r.rejected; }).length;
      return '<div class="toolbar"><div class="inwrap">' + icon('search', 16) + '<input class="input" id="kq" placeholder="Étudiant ou référence…" value="' + esc(c.params.q || '') + '"></div>' +
        '<select class="select" id="kt"><option value="">Tous les types</option>' + KMK_REQUEST_TYPES.map(function (t) { return '<option value="' + t.id + '"' + (tf === t.id ? ' selected' : '') + '>' + esc(t.label) + '</option>'; }).join('') + '</select>' +
        '<span class="m">' + list.length + ' demande(s)' + (rejected ? ' · ' + rejected + ' refusée(s)' : '') + '</span><span class="sp m hide-sm">' + icon('info', 14) + ' Glisser-déposer ou flèche →</span></div>' +
        '<div class="kan" id="kan">' + KMK_STAGES.map(function (st, k) {
          var items = list.filter(function (r) { return r.stage === k; });
          return '<div class="kcol" data-stage="' + k + '"><div class="kh"><span class="kd" style="background:' + st.color + '"></span><b>' + st.label + '</b><span class="kn">' + items.length + '</span></div><div class="kbody">' +
            items.map(function (r) {
              var s = q.student(r.studentId), t = rtype(r.type), late = k < 3 && ageHours(r) > slaHours(t);
              return '<div class="kc' + (r.demo && k === 0 ? ' new' : '') + '" draggable="true" data-id="' + r.id + '" tabindex="0" role="button" aria-label="' + esc(t.label + ' — ' + s.name) + '">' +
                '<div class="ref">' + esc(r.ref) + (r.file ? ' · ' + icon('paperclip', 11) : '') + '</div><div class="ty">' + esc(t.label) + '</div>' + H.who(s.name, s.level + ' ' + s.formation.replace('Licence ', '') + ' · ' + fmt.rel(r.createdAt), s.initials) +
                '<div class="kf">' + (late ? H.pill('Hors délai', 'red', 'clock') : k === 4 ? H.pill('Remise', 'green') : H.pill('Sous ' + t.sla, 'grey', 'clock')) +
                (k < 4 ? '<button type="button" class="adv" data-act="req-next" data-id="' + r.id + '" title="Étape suivante : ' + KMK_STAGES[k + 1].label + '" aria-label="Étape suivante">' + icon('arrow-right', 15) + '</button>' : '') + '</div></div>';
            }).join('') + (items.length ? '' : '<div class="m" style="text-align:center;padding:18px 6px;border:1px dashed #C9D3E2;border-radius:10px">Déposez une carte ici</div>') + '</div></div>';
        }).join('') + '</div>';
    },
    mount: function (el, c) {
      var drag = null;
      $$('.kc', el).forEach(function (card) {
        card.addEventListener('dragstart', function (e) { drag = card.dataset.id; card.classList.add('drag'); try { e.dataTransfer.setData('text/plain', drag); e.dataTransfer.effectAllowed = 'move'; } catch (x) {} });
        card.addEventListener('dragend', function () { card.classList.remove('drag'); });
        card.addEventListener('click', function (e) { if (!e.target.closest('.adv')) openReq(card.dataset.id); });
        card.addEventListener('keydown', function (e) { if (e.key === 'Enter') openReq(card.dataset.id); });
      });
      $$('.kcol', el).forEach(function (col) {
        col.addEventListener('dragover', function (e) { e.preventDefault(); col.classList.add('over'); });
        col.addEventListener('dragleave', function (e) { if (!col.contains(e.relatedTarget)) col.classList.remove('over'); });
        col.addEventListener('drop', function (e) {
          e.preventDefault(); col.classList.remove('over');
          var id = drag || (e.dataTransfer && e.dataTransfer.getData('text/plain')); drag = null;
          var r = getReq(id), to = +col.dataset.stage; if (!r || r.stage === to) return;
          KMK.advanceRequest(r, to);
          KMK.commit(r.ref + ' → ' + KMK_STAGES[to].label + ' · étudiant notifié');
        });
      });
      var t;
      $('#kq', el).addEventListener('input', function () { clearTimeout(t); var v = this.value.trim(); t = setTimeout(function () { var p = {}; if (v) p.q = v; if ($('#kt').value) p.type = $('#kt').value; KMK.replaceParams('demandes', p); }, 300); });
      $('#kt', el).addEventListener('change', function () { var p = {}; if (this.value) p.type = this.value; if ($('#kq').value.trim()) p.q = $('#kq').value.trim(); KMK.replaceParams('demandes', p); });
      if (c.params.r) { var id = c.params.r; setTimeout(function () { openReq(id); }, 150); }
    }
  });
  A['req-next'] = function (b) { var r = getReq(b.dataset.id); if (!r || r.stage >= 4) return; KMK.advanceRequest(r, r.stage + 1); KMK.commit(r.ref + ' → ' + KMK_STAGES[r.stage].label + ' · étudiant notifié'); };

  function openReq(id) {
    var r = getReq(id); if (!r) return;
    var s = q.student(r.studentId), t = rtype(r.type);
    ui.drawer({
      title: '<div class="b" style="font-size:16px">' + esc(t.label) + '</div><div class="m">' + esc(r.ref) + ' · déposée ' + fmt.rel(r.createdAt) + '</div>',
      body: '<div class="card pad" style="margin-bottom:14px">' + H.who(s.name, s.level + ' ' + s.formation + ' · Groupe ' + s.group, s.initials) + '</div>' +
        KMK.requestSteps(r) +
        '<div class="lbl">Détails</div><div class="hintx">' + (r.details ? esc(r.details) : '<span class="m">Aucune précision.</span>') + '</div>' +
        (r.file ? '<div class="filechip">' + icon('paperclip', 15) + esc(r.file) + '</div>' : '') +
        (r.note ? '<div class="alert warn" style="margin-top:12px">' + icon('info', 16) + '<div>' + esc(r.note) + '</div></div>' : '') +
        '<div class="lbl">KMK AI</div><div class="hintx">' + icon('sparkles', 13) + ' Classée automatiquement « ' + esc(t.label) + ' » · ' + (t.doc ? 'document généré et signé à l’étape « Prête »' : 'traitement manuel') + ' · délai cible ' + esc(t.sla) + '.</div>' +
        '<div class="lbl">Historique</div><div class="tline">' + r.history.map(function (h) { return '<div class="tl-i"><div class="t">' + (h.rejected ? 'Refusée' : KMK_STAGES[h.stage].label) + '</div><div class="d">' + fmt.rel(h.at) + ' · ' + esc(h.by) + '</div></div>'; }).join('') + '</div>',
      foot: (r.stage < 4 && !r.rejected ? '<button class="btn ghost" data-act="req-ask" data-id="' + r.id + '">' + icon('paperclip', 15) + 'Demander une pièce</button><button class="btn danger" data-act="req-reject" data-id="' + r.id + '">' + icon('x', 15) + 'Refuser</button>' : '') +
        (r.stage < 4 && !r.rejected ? '<button class="btn" data-act="req-adv" data-id="' + r.id + '">' + icon('arrow-right', 15) + KMK_STAGES[r.stage + 1].label + '</button>' : '<button class="btn" data-act="close-drawer">Fermer</button>')
    });
  }
  A['req-adv'] = function (b) { var r = getReq(b.dataset.id); KMK.advanceRequest(r, r.stage + 1); ui.closeDrawer(); KMK.commit(r.ref + ' → ' + KMK_STAGES[r.stage].label + ' · étudiant notifié'); };
  A['req-reject'] = function (b) {
    var r = getReq(b.dataset.id); ui.closeDrawer();
    ui.modal({ title: 'Refuser la demande ' + esc(r.ref), sub: 'Le motif est communiqué à l’étudiant',
      body: '<div class="field"><label for="rjR">Motif</label><select class="select" id="rjR"><option>Pièce justificative manquante</option><option>Demande en doublon</option><option>Hors délai réglementaire</option><option>Informations incorrectes</option></select></div><div class="field"><label for="rjC">Précision</label><textarea class="textarea" id="rjC"></textarea></div>',
      foot: '<button class="btn ghost" data-act="close-modal">Annuler</button><button class="btn danger" id="rjOk">Refuser</button>',
      onMount: function (m) { $('#rjOk', m).addEventListener('click', function () { var reason = $('#rjR', m).value + ($('#rjC', m).value.trim() ? ' — ' + $('#rjC', m).value.trim() : ''); KMK.rejectRequest(r, reason); ui.closeModal(true); KMK.commit(r.ref + ' refusée — étudiant informé du motif'); }); } });
  };
  A['req-ask'] = function (b) {
    var r = getReq(b.dataset.id), s = q.student(r.studentId), u = q.userOfStudent(s.id);
    r.note = 'Pièce complémentaire demandée : justificatif d’identité en cours de validité.';
    if (r.stage === 0) { r.stage = 1; r.history.push({ stage: 1, at: U.nowISO(), by: ctx().me.name }); }
    if (u) KMK.notify([u.id], { title: 'Pièce complémentaire — ' + r.ref, body: 'Merci de fournir un justificatif d’identité en cours de validité.', icon: 'paperclip', tone: 'amber', route: 'demandes' });
    KMK.log('request.ask', 'Pièce demandée pour ' + r.ref);
    ui.closeDrawer(); KMK.commit('Demande de pièce envoyée à ' + esc(s.name));
  };

  /* ---------------------------------------------------------
     Justificatifs d’absence
     --------------------------------------------------------- */
  KMK.route('justificatifs', {
    label: 'Justificatifs', icon: 'paperclip', roles: ['scolarite'],
    sub: function () { return 'Validation des absences justifiées · étudiant et parent informés'; },
    badge: function () { return db().absences.filter(function (a) { return a.status === 'en_attente'; }).length; },
    render: function (c) {
      var f = c.params.f || 'todo', all = db().absences;
      var list = all.filter(function (a) { return f === 'todo' ? a.status === 'en_attente' : (a.status === 'justifiee' || a.status === 'refusee'); });
      var unj = all.filter(function (a) { return a.status === 'a_justifier'; }).length;
      return '<div class="toolbar"><div class="seg"><button class="' + (f === 'todo' ? 'on' : '') + '" data-go="justificatifs">À valider (' + all.filter(function (a) { return a.status === 'en_attente'; }).length + ')</button><button class="' + (f === 'done' ? 'on' : '') + '" data-go="justificatifs?f=done">Traités</button></div>' +
        '<span class="sp m">' + unj + ' absence(s) encore sans justificatif · relance automatique à J+2</span></div>' +
        '<div class="card">' + (list.length ? '<div class="tbl-wrap"><table><thead><tr><th>Étudiant</th><th>Absence</th><th>Motif</th><th>Justificatif</th><th>Déposé</th><th class="tar">Décision</th></tr></thead><tbody>' + list.map(function (a) {
          var s = q.student(a.studentId);
          return '<tr><td>' + H.who(s.name, s.level + ' · Gr. ' + s.group, s.initials) + '</td><td>' + esc(KMK_MODULES[a.module].name) + '<div class="sub">' + fmt.long(a.date) + ' · ' + esc(a.slot) + '</div></td><td>' + esc(a.reason || '—') + (a.comment ? '<div class="sub">« ' + esc(a.comment) + ' »</div>' : '') + '</td>' +
            '<td>' + (a.file ? '<button class="act" data-act="abs-preview" data-id="' + a.id + '">' + icon('paperclip', 13) + esc(a.file) + '</button>' : '—') + '</td><td class="mu">' + (a.submittedAt ? fmt.rel(a.submittedAt) : '—') + '</td>' +
            '<td class="tar">' + (a.status === 'en_attente' ? '<span class="hstack" style="justify-content:flex-end"><button class="btn sm success" data-act="abs-ok" data-id="' + a.id + '">' + icon('check', 13) + 'Valider</button><button class="act danger" data-act="abs-ko" data-id="' + a.id + '">Refuser</button></span>' : H.absPill(a)) + '</td></tr>';
        }).join('') + '</tbody></table></div>' : H.empty('check-circle-2', f === 'todo' ? 'Aucun justificatif en attente' : 'Aucun justificatif traité', f === 'todo' ? 'Les nouveaux dépôts des étudiants arrivent ici en temps réel.' : '')) + '</div>';
    }
  });
  function absNotify(a, ok, reason) {
    var s = q.student(a.studentId), to = [], u = q.userOfStudent(s.id); if (u) to.push(u.id); q.parentsOf(s.id).forEach(function (p) { to.push(p.id); });
    KMK.notify(to, { title: ok ? 'Absence justifiée' : 'Justificatif refusé', body: KMK_MODULES[a.module].name + ' du ' + fmt.date(a.date) + (ok ? ' — validé par la scolarité' : ' — ' + reason), icon: ok ? 'check-circle-2' : 'x-circle', tone: ok ? 'green' : 'red', route: 'absences' });
  }
  A['abs-ok'] = function (b) {
    var a = db().absences.filter(function (x) { return x.id === b.dataset.id; })[0]; a.status = 'justifiee'; a.decidedAt = U.nowISO();
    absNotify(a, true); KMK.log('absence.validate', 'Justificatif validé — ' + q.student(a.studentId).name + ' (' + KMK_MODULES[a.module].name + ')');
    ui.closeModal(true); KMK.commit('Absence justifiée — étudiant et famille informés');
  };
  A['abs-ko'] = function (b) {
    var a = db().absences.filter(function (x) { return x.id === b.dataset.id; })[0];
    ui.modal({ title: 'Refuser le justificatif', sub: esc(q.student(a.studentId).name),
      body: '<div class="field"><label for="akR">Motif communiqué</label><select class="select" id="akR"><option>Document illisible</option><option>Date ne correspondant pas à l’absence</option><option>Motif non recevable selon le règlement</option></select></div>',
      foot: '<button class="btn ghost" data-act="close-modal">Annuler</button><button class="btn danger" id="akOk">Refuser</button>',
      onMount: function (m) { $('#akOk', m).addEventListener('click', function () { a.status = 'refusee'; a.refuseReason = $('#akR', m).value; absNotify(a, false, a.refuseReason); KMK.log('absence.refuse', 'Justificatif refusé — ' + q.student(a.studentId).name); ui.closeModal(true); KMK.commit('Justificatif refusé — motif envoyé à l’étudiant'); }); } });
  };
  A['abs-preview'] = function (b) {
    var a = db().absences.filter(function (x) { return x.id === b.dataset.id; })[0], s = q.student(a.studentId);
    ui.modal({ title: esc(a.file), sub: 'Aperçu du justificatif · ' + esc(s.name),
      body: '<div class="docprev"><div class="hstack"><b style="font-size:15px">' + esc(a.reason === 'Maladie' || a.reason === 'Rendez-vous médical' ? 'Certificat médical' : 'Attestation') + '</b><span class="sp m">document déposé par l’étudiant</span></div><hr style="border:0;border-top:1px solid var(--bd);margin:12px 0">' +
        '<p>Je soussigné(e) certifie que <b>' + esc(s.name) + '</b> n’a pas pu assister aux enseignements le <b>' + fmt.longY(a.date) + '</b> (' + esc(a.slot) + ').</p><p class="m" style="margin-top:10px">Motif déclaré : ' + esc(a.reason || '') + '</p>' +
        '<div style="margin-top:22px;height:46px;width:150px;border-bottom:1px solid #121A2A;font-family:cursive;color:#1257E0;font-size:20px">Signature</div></div>' +
        '<div class="hintx mt">' + icon('sparkles', 13) + ' <b>KMK AI :</b> document lisible, date cohérente avec l’absence du ' + fmt.date(a.date) + ', aucun doublon détecté.</div>',
      foot: a.status === 'en_attente' ? '<button class="act danger" data-act="abs-ko" data-id="' + a.id + '">Refuser</button><button class="btn success" data-act="abs-ok" data-id="' + a.id + '">' + icon('check', 15) + 'Valider</button>' : '<button class="btn" data-act="close-modal">Fermer</button>' });
  };

  /* ---------------------------------------------------------
     Annuaire étudiants (scolarité, direction, finance)
     --------------------------------------------------------- */
  KMK.part('etudiants', ['scolarite', 'direction', 'finance'], {
    label: 'Étudiants', icon: 'graduation-cap',
    sub: function () { return 'Annuaire et dossiers — chaque consultation est tracée'; },
    render: function (c) {
      var p = c.params, sq = (p.q || '').toLowerCase(), ff = p.form || '', fr = p.risk || '';
      var forms = db().students.map(function (s) { return s.formation; }).filter(function (v, i, a) { return a.indexOf(v) === i; });
      var showFin = true;
      var list = db().students.filter(function (s) {
        return (!sq || s.name.toLowerCase().indexOf(sq) >= 0) && (!ff || s.formation === ff) && (!fr || (fr === 'high' ? s.risk >= 65 : fr === 'mid' ? s.risk >= 40 && s.risk < 65 : s.risk < 40));
      }).sort(function (a, b) { return p.sort === 'name' ? a.name.localeCompare(b.name) : b.risk - a.risk; });
      function dueOf(s) { return db().invoices.filter(function (i) { return i.studentId === s.id && !i.paidAt; }).reduce(function (t, i) { return t + i.amount; }, 0); }
      function lateOf(s) { return db().invoices.some(function (i) { return i.studentId === s.id && q.invoiceStatus(i) === 'retard'; }); }
      return '<div class="toolbar"><div class="inwrap">' + icon('search', 16) + '<input class="input" id="dq" placeholder="Rechercher un étudiant…" value="' + esc(p.q || '') + '"></div>' +
        '<select class="select" id="df"><option value="">Toutes les formations</option>' + forms.map(function (f) { return '<option' + (ff === f ? ' selected' : '') + '>' + esc(f) + '</option>'; }).join('') + '</select>' +
        '<select class="select" id="dr"><option value="">Tous les risques</option><option value="high"' + (fr === 'high' ? ' selected' : '') + '>Risque élevé</option><option value="mid"' + (fr === 'mid' ? ' selected' : '') + '>Risque moyen</option><option value="low"' + (fr === 'low' ? ' selected' : '') + '>Risque faible</option></select>' +
        '<span class="m">' + list.length + ' étudiant(s)</span><button class="btn ghost sm sp" data-act="export-students">' + icon('download', 14) + 'Exporter CSV</button></div>' +
        '<div class="card"><div class="tbl-wrap"><table><thead><tr><th class="sort" data-act="sort-students" data-k="name">Étudiant ' + icon('chevron-down', 12) + '</th><th>Formation</th><th class="tar">Moyenne</th><th class="tar">Assiduité</th><th class="sort" data-act="sort-students" data-k="risk">Risque ' + icon('chevron-down', 12) + '</th>' + (showFin ? '<th class="tar">Reste dû</th>' : '') + '<th></th></tr></thead><tbody>' +
        list.map(function (s) { var due = dueOf(s);
          return '<tr class="click" data-act="open-student" data-sid="' + s.id + '"><td>' + H.who(s.name, s.email || (s.name.toLowerCase().replace(/[^a-z]+/g, '.').replace(/\.$/, '') + '@kmk-campus.fr'), s.initials) + '</td><td>' + esc(s.formation) + '<div class="sub">' + esc(s.level) + ' · Groupe ' + esc(s.group) + '</div></td>' +
            '<td class="tar"><b>' + fmt.num(q.studentAvg(s.id)) + '</b></td><td class="tar">' + s.att + ' %</td><td><span class="hstack" style="gap:8px"><b style="color:' + H.riskColor(s.risk) + '">' + s.risk + '</b>' + H.riskPill(s.risk) + '</span></td>' +
            (showFin ? '<td class="tar">' + (due ? '<b style="color:' + (lateOf(s) ? 'var(--red)' : 'inherit') + '">' + fmt.money(due) + '</b>' : '<span class="mu">—</span>') + '</td>' : '') + '<td class="tar">' + icon('chevron-right', 15) + '</td></tr>'; }).join('') +
        '</tbody></table></div>' + (list.length ? '' : H.empty('search', 'Aucun étudiant', 'Modifiez la recherche ou les filtres.')) + '</div>';
    },
    mount: function (el, c) {
      function apply() { var p = {}; var v = $('#dq', el).value.trim(); if (v) p.q = v; if ($('#df', el).value) p.form = $('#df', el).value; if ($('#dr', el).value) p.risk = $('#dr', el).value; if (c.params.sort) p.sort = c.params.sort; KMK.replaceParams('etudiants', p); }
      var t; $('#dq', el).addEventListener('input', function () { clearTimeout(t); t = setTimeout(apply, 300); });
      $('#df', el).addEventListener('change', apply); $('#dr', el).addEventListener('change', apply);
    }
  });
  A['sort-students'] = function (b) { var p = Object.assign({}, ctx().params); p.sort = b.dataset.k; KMK.replaceParams('etudiants', p); };
  A['export-students'] = function () {
    var rows = [['Nom', 'Formation', 'Niveau', 'Groupe', 'Moyenne', 'Assiduité', 'Risk Score', 'Signal']].concat(db().students.map(function (s) { return [s.name, s.formation, s.level, s.group, fmt.num(q.studentAvg(s.id)), s.att + ' %', s.risk, s.signal]; }));
    U.download('kmk-etudiants.csv', U.csv(rows), 'text/csv;charset=utf-8');
    KMK.log('students.export', 'Export de l’annuaire étudiants'); KMK.commit('Annuaire exporté (CSV, séparateur ;)');
  };

  /* ---------------------------------------------------------
     Annonces ciblées (Smart Communication)
     --------------------------------------------------------- */
  var AUD = [
    { id: 'all', label: 'Tous les étudiants', n: 253, to: ['u-lea'] },
    { id: 'A', label: 'L2 Informatique — Groupe A', n: 68, to: ['u-lea'] },
    { id: 'B', label: 'L2 Informatique — Groupe B', n: 61, to: [] },
    { id: 'parents', label: 'Parents et tuteurs', n: 241, to: ['u-parent'] },
    { id: 'staff', label: 'Formateurs', n: 18, to: ['u-claire'] },
    { id: 'everyone', label: 'Toute l’école', n: 512, to: ['u-lea', 'u-parent', 'u-claire', 'u-dir', 'u-fin'] }
  ];
  var CH = ['Push', 'E-mail', 'SMS', 'WhatsApp'];
  KMK.route('annonces', {
    label: 'Annonces', icon: 'megaphone', roles: ['scolarite'],
    sub: function () { return 'Le bon message, aux bonnes personnes, sur le bon canal'; },
    render: function (c) {
      var g = c.params.g, pre = g === 'A';
      var hist = db().announcements;
      return '<div class="grid g12"><div class="card"><div class="ch"><h3>Nouvelle annonce</h3>' + H.pill('Smart Communication', 'soft', 'sparkles') + '</div><div class="pad"><form id="anForm">' +
        '<div class="field"><label for="anA">Destinataires</label><select class="select" id="anA">' + AUD.map(function (a) { return '<option value="' + a.id + '"' + ((pre && a.id === 'A') ? ' selected' : '') + '>' + esc(a.label) + ' (' + a.n + ')</option>'; }).join('') + '</select></div>' +
        '<div class="field"><label for="anT">Titre</label><input class="input" id="anT" maxlength="70" value="' + (pre ? 'Changement de salle — TP Base de données' : '') + '" placeholder="Ex. : Fermeture de la bibliothèque samedi"></div>' +
        '<div class="field"><label for="anB">Message</label><textarea class="textarea" id="anB" maxlength="400" placeholder="Votre message…">' + (pre ? 'Le TP de Base de données de lundi 14:00 a lieu en Labo 2 (au lieu de A204). Votre planning est à jour.' : '') + '</textarea><div class="help" id="anCount">0 / 400</div></div>' +
        '<div class="flabel" style="margin-bottom:8px">Canaux</div><div class="chips" id="anCh" style="margin-bottom:16px">' + CH.map(function (ch, k) { return '<button type="button" class="chipq" data-ch="' + ch + '" aria-pressed="' + (k < 2) + '" style="' + (k < 2 ? 'background:var(--g700);color:#fff;border-color:var(--g700)' : '') + '">' + ch + '</button>'; }).join('') + '</div>' +
        '<div class="row2"><div class="field"><label for="anW">Envoi</label><select class="select" id="anW"><option value="now">Immédiat</option><option value="later">Programmé</option></select></div><div class="field"><label for="anD">Date et heure</label><input class="input" type="datetime-local" id="anD" value="' + U.addDays(TODAY, 1) + 'T08:00" disabled></div></div>' +
        '<div class="hstack"><button class="btn" type="submit">' + icon('send', 15) + 'Envoyer</button><span class="m" id="anReach"></span></div></form></div></div>' +
        '<div class="grid" style="align-content:start"><div class="card"><div class="ch"><h3>Aperçu</h3><span class="m">notification push</span></div><div class="pad" style="background:linear-gradient(160deg,#232E42,#0B1222);border-radius:0 0 14px 14px">' +
        '<div style="background:rgba(255,255,255,.95);border-radius:16px;padding:12px 14px;display:flex;gap:11px;max-width:360px;margin:6px auto"><span class="av" style="border-radius:9px;background:var(--g500);color:#fff">' + icon('megaphone', 15) + '</span><div style="min-width:0"><div class="m" style="display:flex;justify-content:space-between"><span>KMK Campus</span><span>maintenant</span></div><b id="pvT" style="font-size:13px">Titre de l’annonce</b><div id="pvB" style="font-size:12.5px;color:var(--mu)">Votre message apparaîtra ici.</div></div></div></div></div>' +
        H.card('Annonces envoyées', '<span class="m">' + hist.length + '</span>', hist.length ? '<div class="list">' + hist.map(function (a) { return H.li({ icon: 'megaphone', title: esc(a.title), sub: esc(a.audience) + ' · ' + a.recipients + ' destinataires · ' + a.channels.join(', ') + ' · ' + (a.scheduled ? 'programmée le ' + fmt.date(a.scheduled) : fmt.rel(a.at)), right: '<span class="m nowrap">' + (a.scheduled ? H.pill('Programmée', 'blue') : a.opens + ' % ouv.') + '</span>' }); }).join('') + '</div>' : H.empty('megaphone', 'Aucune annonce', '')) + '</div></div>';
    },
    mount: function (el, c) {
      var f = $('#anForm', el);
      function upd() {
        $('#pvT', el).textContent = $('#anT', el).value || 'Titre de l’annonce';
        $('#pvB', el).textContent = $('#anB', el).value || 'Votre message apparaîtra ici.';
        $('#anCount', el).textContent = $('#anB', el).value.length + ' / 400';
        var a = AUD.filter(function (x) { return x.id === $('#anA', el).value; })[0];
        var chs = $$('#anCh [aria-pressed=true]', el).length;
        $('#anReach', el).textContent = a.n + ' destinataires · ' + chs + ' canal(aux) · ≈ ' + Math.round(a.n * (0.62 + chs * 0.08)) + ' lectures estimées';
      }
      ['#anT', '#anB'].forEach(function (s) { $(s, el).addEventListener('input', upd); });
      $('#anA', el).addEventListener('change', upd);
      $('#anW', el).addEventListener('change', function () { $('#anD', el).disabled = this.value !== 'later'; });
      $$('#anCh .chipq', el).forEach(function (b) { b.addEventListener('click', function () { var on = b.getAttribute('aria-pressed') !== 'true'; b.setAttribute('aria-pressed', on); b.style.cssText = on ? 'background:var(--g700);color:#fff;border-color:var(--g700)' : ''; upd(); }); });
      upd();
      f.addEventListener('submit', function (e) {
        e.preventDefault();
        var t = $('#anT', el).value.trim(), b = $('#anB', el).value.trim(), a = AUD.filter(function (x) { return x.id === $('#anA', el).value; })[0];
        var chs = $$('#anCh [aria-pressed=true]', el).map(function (x) { return x.dataset.ch; });
        if (t.length < 3) { ui.toast('Ajoutez un titre', 'err'); $('#anT', el).focus(); return; }
        if (b.length < 5) { ui.toast('Ajoutez un message', 'err'); $('#anB', el).focus(); return; }
        if (!chs.length) { ui.toast('Choisissez au moins un canal', 'err'); return; }
        var later = $('#anW', el).value === 'later';
        db().announcements.unshift({ id: U.uid('an'), title: t, body: b, audience: a.label, channels: chs, recipients: a.n, at: U.nowISO(), by: c.me.name, opens: later ? 0 : Math.round(55 + Math.random() * 30), scheduled: later ? $('#anD', el).value.slice(0, 10) : null });
        if (!later) KMK.notify(a.to.filter(function (x) { return x !== c.me.id; }), { title: t, body: b.slice(0, 110), icon: 'megaphone', tone: 'blue', route: 'notifications' });
        KMK.log('announcement.send', '« ' + t + ' » → ' + a.label + ' (' + chs.join(', ') + ')' + (later ? ' · programmée' : ''));
        KMK.flag('annonce');
        KMK.replaceParams('annonces', {});
        KMK.store.save();
        ui.toast(later ? 'Annonce programmée' : 'Annonce envoyée à ' + a.n + ' destinataires (' + chs.join(', ') + ')');
      });
    }
  });

  /* ---------------------------------------------------------
     Automation Studio
     --------------------------------------------------------- */
  var CHC = { Push: '#2E8BFF', 'E-mail': '#1257E0', SMS: '#3C7EA8' };
  var simRunning = false;
  KMK.route('automatisations', {
    label: 'Automation Studio', icon: 'zap', roles: ['scolarite'],
    sub: function () { return 'Scénarios WHEN → IF → THEN · simulation en direct'; },
    render: function (c) {
      var list = db().automations, a = list.filter(function (x) { return x.id === c.params.s; })[0] || list[0];
      var total = list.reduce(function (t, x) { return t + x.runs; }, 0);
      var steps = [['calendar-check', 'WHEN · Déclencheur', a.when, ['var(--soft)', 'var(--g700)']], ['filter', 'IF · Condition', a.cond, ['#E9F1F7', '#2E6488']], ['sparkles', 'AI · Analyse', 'Personnalisation du message, choix du canal et du moment', ['#EDF3FE', '#1257E0']], ['send', 'THEN · Action', a.then, ['var(--ambersoft)', '#B4700F']], ['check-circle-2', 'Fin', 'Historisé dans le dossier et le journal', ['var(--greensoft)', '#167A53']]];
      return '<div class="grid g4 mb">' + H.kpi({ icon: 'zap', label: 'Scénarios actifs', value: list.filter(function (x) { return x.on; }).length + ' / ' + list.length, delta: 'sans une ligne de code' }) +
        H.kpi({ icon: 'bell', label: 'Déclenchements', value: total.toLocaleString('fr-FR'), delta: 'ce mois-ci · en direct' }) +
        H.kpi({ icon: 'clock', label: 'Temps économisé', value: Math.round(total * 1.5 / 60) + ' h', delta: '≈ 1 min 30 par action manuelle', tone: 'good' }) +
        H.kpi({ icon: 'thumbs-up', label: 'Taux d’ouverture', value: '78 %', delta: 'notifications actionnables' }) + '</div>' +
        '<div class="grid g-lrail">' + H.card('Scénarios', '<span class="m">cliquez pour visualiser</span>', '<div class="list">' + list.map(function (x) {
          return '<div class="li click"' + (x.id === a.id ? ' style="background:#F2F6FE;box-shadow:inset 3px 0 0 var(--g500)"' : '') + ' data-go="automatisations?s=' + x.id + '" role="link" tabindex="0"><span class="pill" style="background:' + (CHC[x.channel] || '#2E8BFF') + ';color:#fff;min-width:58px;justify-content:center">' + x.channel + '</span><div class="tx"><div class="tt">' + esc(x.name) + '</div><div class="ss">' + x.runs + ' déclenchements</div></div><button type="button" class="sw' + (x.on ? ' on' : '') + '" data-act="auto-toggle" data-id="' + x.id + '" aria-label="Activer ' + esc(x.name) + '"><i></i></button></div>'; }).join('') + '</div>') +
        '<div class="card"><div class="ch"><div><h3>' + esc(a.name) + '</h3><div class="m">' + (a.on ? 'Actif' : 'En pause') + ' · canal ' + a.channel + '</div></div><button class="btn sp" data-act="auto-sim" data-id="' + a.id + '"' + (a.on ? '' : ' disabled title="Activez le scénario pour le simuler"') + '>' + icon('play', 15) + 'Simuler l’exécution</button></div>' +
        '<div class="grid g12" style="padding:18px"><div id="flow">' + steps.map(function (s, k) {
          return '<div class="hstack" data-step="' + k + '" style="align-items:flex-start;padding-bottom:14px;position:relative">' + (k < steps.length - 1 ? '<span style="position:absolute;left:19px;top:42px;bottom:0;width:2px;background:repeating-linear-gradient(to bottom,#D7DFEA 0 5px,transparent 5px 10px)"></span>' : '') +
            '<span class="ico" style="width:40px;height:40px;flex:0 0 40px;border-radius:13px;display:flex;align-items:center;justify-content:center;background:' + s[3][0] + ';color:' + s[3][1] + ';transition:transform .25s,box-shadow .25s">' + icon(s[0], 18) + '</span>' +
            '<div class="card" style="padding:10px 13px;flex:1;transition:.25s"><div class="b" style="font-size:12.5px">' + s[1] + '</div><div class="m" style="margin-top:2px">' + esc(s[2]) + '</div></div></div>'; }).join('') + '</div>' +
        '<div style="background:#0C1322;border-radius:12px;overflow:hidden;align-self:start"><div style="display:flex;align-items:center;gap:9px;padding:10px 14px;background:#131E33;color:#D6E4F8;font-size:12px">' + icon('history', 15) + '<b>Journal d’exécution</b><span id="simState" style="margin-left:auto;color:#7DA3E2">en attente</span></div>' +
        '<div id="simLog" class="log" style="padding:12px 14px;min-height:200px;color:#BBD3F5"><span style="color:#6C90D8;font-family:Inter">Lancez la simulation pour voir le scénario se dérouler pas à pas.</span></div></div></div></div></div>';
    }
  });
  A['auto-toggle'] = function (b) {
    var a = db().automations.filter(function (x) { return x.id === b.dataset.id; })[0]; a.on = !a.on;
    KMK.log('automation.toggle', 'Scénario « ' + a.name + ' » ' + (a.on ? 'activé' : 'mis en pause'));
    KMK.commit('Scénario « ' + esc(a.name) + ' » ' + (a.on ? 'activé' : 'mis en pause'));
  };
  A['auto-sim'] = function (b) {
    if (simRunning) return; simRunning = true;
    var a = db().automations.filter(function (x) { return x.id === b.dataset.id; })[0];
    var LOGS = {
      note: ['Évaluation « DS n°3 » validée par Claire Fontaine', '12 étudiants concernés — Groupe A', 'Messages personnalisés (note, promo, rang)', 'Push envoyé à 12 appareils', 'Moyennes et crédits recalculés'],
      absence: ['Absence saisie — Mathématiques, Groupe A', 'Seuil : 2 absences en 3 semaines dépassé', 'Canal choisi : push + e-mail parent', 'Notification et formulaire de justificatif envoyés', 'Relance programmée à J+2'],
      edt: ['TP Base de données déplacé en Labo 2', '31 étudiants du groupe concernés', 'Texte adapté au profil (étudiant / parent)', 'E-mail + push envoyés', 'Plannings synchronisés'],
      convoc: ['Examen Algorithmique dans 72 h', '68 étudiants inscrits', 'Convocations PDF générées', 'SMS envoyés · accusés de réception ouverts', 'Convocation ajoutée aux documents'],
      echeance: ['Échéance du 15/09 détectée (J-7)', 'Léa Bernard : 250 € non réglés', 'Canal : SMS + push parent', 'Rappel envoyé à l’étudiante et à sa famille', 'Relance J+3 programmée si impayé'],
      jury: ['Décision du jury publiée', '253 étudiants concernés', 'Relevés signés générés', 'E-mails envoyés', 'Dossiers mis à jour']
    }[a.id] || ['Déclencheur reçu', 'Condition vérifiée', 'Analyse IA', 'Action exécutée', 'Historisé'];
    var log = $('#simLog'), state = $('#simState'), rows = $$('#flow [data-step]');
    log.innerHTML = ''; state.textContent = 'exécution…'; b.disabled = true;
    var t0 = new Date();
    rows.forEach(function (r, k) {
      setTimeout(function () {
        rows.forEach(function (x) { var i = $('.ico', x), cd = $('.card', x); i.style.transform = ''; i.style.boxShadow = ''; cd.style.borderColor = ''; });
        var ic = $('.ico', r), cd = $('.card', r); ic.style.transform = 'scale(1.12)'; ic.style.boxShadow = '0 0 0 6px rgba(46,139,255,.16)'; cd.style.borderColor = 'var(--g500)';
        var tm = new Date(t0.getTime() + k * 900);
        log.insertAdjacentHTML('beforeend', '<div style="display:flex;gap:12px;padding:3px 0;animation:tin .3s"><b style="color:#38BDF8;font-weight:400;flex:0 0 62px">' + U.pad(tm.getHours()) + ':' + U.pad(tm.getMinutes()) + ':' + U.pad(tm.getSeconds()) + '</b><span>' + esc(LOGS[k] || '') + '</span></div>');
        if (k === rows.length - 1) setTimeout(function () {
          ic.style.transform = ''; ic.style.boxShadow = ''; cd.style.borderColor = '';
          state.textContent = 'terminé ✓'; simRunning = false;
          a.runs++;
          if (a.id === 'echeance') KMK.notify(['u-lea', 'u-parent'], { title: 'Rappel d’échéance', body: 'Solde frais de scolarité · 250 € avant le 15/09 — payer en ligne', icon: 'wallet', tone: 'amber', route: 'finances' });
          if (a.id === 'convoc') KMK.notify(['u-lea'], { title: 'Convocation — Examen d’Algorithmique', body: 'Vendredi 11/09 · 13:00 · Amphi A — convocation dans vos documents', icon: 'calendar-clock', tone: 'blue', route: 'documents' });
          KMK.log('automation.run', 'Simulation « ' + a.name + ' »');
          KMK.store.save(); KMK.ui.chrome();
          var bt = $('[data-act="auto-sim"]'); if (bt) bt.disabled = false;
          ui.toast('Scénario exécuté' + (a.id === 'echeance' || a.id === 'convoc' ? ' — notification réelle envoyée (voir l’espace étudiant)' : ''));
        }, 800);
      }, 900 * k + 150);
    });
  };

  KMK.commands.scolarite = [
    { ic: 'inbox', t: 'Traiter les demandes', run: function () { ui.navigate('demandes'); } },
    { ic: 'paperclip', t: 'Valider les justificatifs', run: function () { ui.navigate('justificatifs'); } },
    { ic: 'megaphone', t: 'Nouvelle annonce', run: function () { ui.navigate('annonces'); } }
  ];
})();
