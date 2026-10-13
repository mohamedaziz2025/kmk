/* =========================================================
   KMK Campus — espace formateur
   ========================================================= */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var U = KMK.util, esc = U.esc, fmt = KMK.fmt, q = KMK.q, H = KMK.H, ui = KMK.ui, A = KMK.actions;
  var TODAY = window.KMK_DEMO_TODAY;
  function db() { return KMK.db(); }
  function ctx() { return KMK.ctx(); }
  function toMin(t) { var p = t.split(':'); return +p[0] * 60 + +p[1]; }
  function nowMin() { var d = new Date(); return d.getHours() * 60 + d.getMinutes(); }

  function mySessions(c) { return db().sessions.filter(function (s) { return s.teacherId === c.me.id; }); }
  function todayMine(c) { return mySessions(c).filter(function (s) { return s.date === TODAY; }).sort(function (a, b) { return a.start < b.start ? -1 : 1; }); }
  function attOf(sid) { return db().attendance.filter(function (a) { return a.sessionId === sid; })[0]; }
  function groupRoster(g) { return q.roster(g); }
  function missing(e) { return groupRoster(e.group).filter(function (s) { return e.grades[s.id] == null || e.grades[s.id] === ''; }).length; }

  /* ---------------------------------------------------------
     Tableau de bord formateur
     --------------------------------------------------------- */
  KMK.part('tableau-de-bord', ['formateur'], {
    label: 'Tableau de bord', icon: 'layout-dashboard',
    sub: function (c) { return c.me.title + ' · 3 groupes · 84 étudiants'; },
    render: function (c) {
      var today = todayMine(c), todo = today.filter(function (s) { return !attOf(s.id) && !s.cancelled; });
      var drafts = db().evaluations.filter(function (e) { return e.status === 'draft'; });
      var miss = drafts.reduce(function (t, e) { return t + missing(e); }, 0);
      var risk = groupRoster('A').concat(groupRoster('B')).filter(function (s) { return s.risk >= 40; }).sort(function (a, b) { return b.risk - a.risk; });
      var n = nowMin();
      var threads = db().threads.filter(function (t) { return t.participants.indexOf(c.me.id) >= 0; }).slice(0, 3);
      return '<div class="welcome"><div><h2>Bonjour ' + esc(c.me.name.split(' ')[0]) + '</h2><p>' + today.length + ' séance(s) aujourd’hui · ' + todo.length + ' appel(s) à faire · ' + miss + ' note(s) à saisir. KMK AI a repéré ' + risk.length + ' étudiants à accompagner.</p></div>' +
        '<div class="acts"><button class="btn white" data-go="appel">' + icon('user-check', 15) + 'Faire l’appel</button><button class="btn ghost" data-go="saisie-notes">' + icon('clipboard-check', 15) + 'Saisir les notes</button></div></div>' +
        '<div class="grid g4">' + H.kpi({ icon: 'users', label: 'Mes groupes', value: '3', delta: '84 étudiants · L2 A, L2 B, L1 C', go: 'groupes' }) +
        H.kpi({ icon: 'user-check', label: 'Appels du jour', value: (today.length - todo.length) + ' / ' + today.length, delta: todo.length ? todo.length + ' à faire' : 'tous réalisés', tone: todo.length ? 'warn' : 'good', go: 'appel' }) +
        H.kpi({ icon: 'clipboard-check', label: 'Notes à saisir', value: miss, delta: drafts.length + ' évaluation(s) en brouillon', tone: miss ? 'warn' : 'good', go: 'saisie-notes' }) +
        H.kpi({ icon: 'alert-triangle', label: 'Étudiants à risque', value: risk.length, delta: 'Student Risk Score ≥ 40', tone: 'warn', go: 'groupes' }) + '</div>' +
        '<div class="grid g21 mt">' + H.card('Mes séances du jour', '<button class="lk" data-go="emploi-du-temps">Planning</button>', '<div class="list">' + today.map(function (s) {
          var att = attOf(s.id), st = n >= toMin(s.end) ? 'Terminé' : n >= toMin(s.start) ? 'En cours' : 'À venir';
          return '<div class="li"><span class="ico" style="width:46px;flex:0 0 46px;font-weight:700;font-size:11px">' + s.start + '</span><div class="tx"><div class="tt">' + esc(s.title) + ' · Groupe ' + s.groups.join(', ') + '</div><div class="ss">' + esc(s.room) + ' · ' + s.start + ' – ' + s.end + ' · ' + st + '</div></div>' +
            (att ? H.pill('Appel fait', 'green', 'check') : '<button class="btn sm" data-go="appel?s=' + s.id + '">' + icon('user-check', 13) + 'Appel</button>') + '</div>'; }).join('') + '</div>') +
        H.card('À accompagner', H.pill('KMK AI', 'soft', 'sparkles'), '<div class="list">' + risk.slice(0, 5).map(function (s) { return '<div class="li click" data-act="open-student" data-sid="' + s.id + '" role="button" tabindex="0">' + H.av(s.initials, H.riskColor(s.risk)) + '<div class="tx"><div class="tt">' + esc(s.name) + '</div><div class="ss">' + esc(s.signal) + '</div></div><b class="vv" style="color:' + H.riskColor(s.risk) + '">' + s.risk + '</b></div>'; }).join('') + '</div>') + '</div>' +
        '<div class="grid g2 mt">' + H.card('Évaluations', '<button class="lk" data-go="saisie-notes">Saisie</button>', '<div class="list">' + db().evaluations.map(function (e) {
          var m = missing(e); return H.li({ icon: 'clipboard-check', tone: e.status === 'published' ? 'green' : 'amber', title: esc(KMK_MODULES[e.module].name + ' — ' + e.label) + ' · Groupe ' + e.group, sub: e.status === 'published' ? 'Publiée ' + fmt.rel(e.publishedAt) : m + ' note(s) manquante(s)', go: 'saisie-notes?e=' + e.id, right: e.status === 'published' ? H.pill('Publiée', 'green') : H.pill('Brouillon', 'amber') }); }).join('') + '</div>') +
        H.card('Messages récents', '<button class="lk" data-go="messagerie">Messagerie</button>', '<div class="list">' + threads.map(function (t) { var last = t.messages[t.messages.length - 1], u = q.user(last.from); return H.li({ icon: 'message-square', title: esc(t.subject), sub: esc(u.name) + ' · ' + esc(last.text.slice(0, 70)) + '…', go: 'messagerie?t=' + t.id }); }).join('') + '</div>') + '</div>';
    }
  });

  /* ---------------------------------------------------------
     Emploi du temps formateur
     --------------------------------------------------------- */
  KMK.part('emploi-du-temps', ['formateur'], {
    label: 'Emploi du temps', icon: 'calendar',
    sub: function (c) { return 'Mes séances · tous groupes'; },
    render: function (c) {
      var w = +(c.params.w || 0), start = U.addDays('2026-09-07', 7 * w), end = U.addDays(start, 6);
      var ss = mySessions(c).filter(function (s) { return s.date >= start && s.date < end; });
      var hours = ss.reduce(function (t, s) { return t + (toMin(s.end) - toMin(s.start)) / 60; }, 0);
      return '<div class="toolbar"><button class="ibtn" data-go="emploi-du-temps?w=' + (w - 1) + '" aria-label="Semaine précédente">' + icon('chevron-left', 17) + '</button><b>Semaine du ' + U.parse(start).getDate() + ' au ' + fmt.longY(U.addDays(start, 5)) + '</b><button class="ibtn" data-go="emploi-du-temps?w=' + (w + 1) + '" aria-label="Semaine suivante">' + icon('chevron-right', 17) + '</button>' +
        (w !== 0 ? '<button class="btn ghost sm" data-go="emploi-du-temps">Cette semaine</button>' : '') + '<span class="sp m">' + ss.length + ' séance(s) · ' + fmt.num(hours, 1) + ' h de face-à-face</span></div>' +
        '<div class="card">' + (ss.length ? KMK.calendar(ss, w) : H.empty('calendar', 'Aucune séance cette semaine', '')) + '</div>';
    }
  });

  /* ---------------------------------------------------------
     Appel (feuille de présence)
     --------------------------------------------------------- */
  var draftMarks = {};
  KMK.route('appel', {
    label: 'Appel', icon: 'user-check', roles: ['formateur'],
    sub: function () { return 'Feuille de présence numérique — l’étudiant et sa famille sont prévenus immédiatement'; },
    badge: function (c) { return todayMine(c).filter(function (s) { return !attOf(s.id) && !s.cancelled; }).length; },
    render: function (c) {
      var mine = mySessions(c).filter(function (s) { return s.date <= TODAY && s.date >= '2026-09-07'; }).sort(function (a, b) { return (a.date + a.start) < (b.date + b.start) ? 1 : -1; });
      var today = todayMine(c);
      var sid = c.params.s || (today.filter(function (s) { return !attOf(s.id); })[0] || today[0] || mine[0] || {}).id;
      var s = db().sessions.filter(function (x) { return x.id === sid; })[0];
      if (!s) return H.empty('calendar', 'Aucune séance', 'Vous n’avez pas de séance à appeler.');
      var att = attOf(s.id), editing = !att || c.params.edit === '1';
      var roster = [].concat.apply([], s.groups.map(groupRoster));
      var marks = draftMarks[s.id] = draftMarks[s.id] || (att ? JSON.parse(JSON.stringify(att.marks)) : {});
      roster.forEach(function (st) { if (!marks[st.id]) marks[st.id] = 'P'; });
      var cnt = { P: 0, R: 0, A: 0 }; roster.forEach(function (st) { cnt[marks[st.id]]++; });
      var opts = mine.map(function (x) { return '<option value="' + x.id + '"' + (x.id === s.id ? ' selected' : '') + '>' + fmt.date(x.date) + ' ' + x.start + ' — ' + esc(x.title) + ' (Gr. ' + x.groups.join(', ') + ')' + (attOf(x.id) ? ' ✓' : '') + '</option>'; }).join('');
      return '<div class="toolbar"><label class="flabel" for="sessSel">Séance</label><select class="select" id="sessSel" style="max-width:420px">' + opts + '</select>' +
        '<span class="sp">' + (att ? H.pill('Appel validé ' + fmt.rel(att.takenAt), 'green', 'check') : H.pill('Appel à faire', 'amber')) + '</span></div>' +
        '<div class="grid g21"><div class="card"><div class="ch"><div><h3>' + esc(s.title) + ' · Groupe ' + s.groups.join(', ') + '</h3><div class="m">' + fmt.long(s.date) + ' · ' + s.start + ' – ' + s.end + ' · ' + esc(s.room) + '</div></div>' +
        (editing ? '<button class="btn ghost sm sp" data-act="all-present" data-s="' + s.id + '">' + icon('check', 13) + 'Tous présents</button>' : '<button class="btn ghost sm sp" data-go="appel?s=' + s.id + '&edit=1">' + icon('pencil', 13) + 'Modifier</button>') + '</div>' +
        '<div class="tbl-wrap"><table><thead><tr><th>Étudiant</th><th>Risque</th><th class="tar">Présence</th></tr></thead><tbody>' + roster.map(function (st) {
          var m = marks[st.id];
          return '<tr><td><button type="button" class="who" style="background:none;border:0;padding:0;text-align:left" data-act="open-student" data-sid="' + st.id + '">' + H.av(st.initials, '#2E8BFF') + '<div><div class="n">' + esc(st.name) + '</div><div class="s">assiduité ' + st.att + ' %</div></div></button></td><td>' + H.riskPill(st.risk) + '</td>' +
            '<td class="tar"><div class="pres" role="group" aria-label="Présence de ' + esc(st.name) + '">' + ['P', 'R', 'A'].map(function (v) { return '<button type="button" data-act="mark" data-s="' + s.id + '" data-st="' + st.id + '" data-v="' + v + '" class="' + (m === v ? 'on' : '') + '"' + (editing ? '' : ' disabled') + ' aria-pressed="' + (m === v) + '" title="' + { P: 'Présent', R: 'Retard', A: 'Absent' }[v] + '">' + v + '</button>'; }).join('') + '</div></td></tr>';
        }).join('') + '</tbody></table></div>' +
        (editing ? '<div class="mf" style="border-radius:0 0 14px 14px"><span class="m" style="margin-right:auto">' + cnt.P + ' présent(s) · ' + cnt.R + ' retard(s) · <b style="color:var(--red)">' + cnt.A + ' absent(s)</b></span><button class="btn" data-act="save-appel" data-s="' + s.id + '">' + icon('check', 15) + 'Valider l’appel</button></div>' : '') + '</div>' +
        '<div class="grid" style="align-content:start"><div class="card"><div class="ch"><h3>Synthèse</h3></div><div class="pad"><div class="dgrid"><div class="dst"><b style="color:var(--green)">' + cnt.P + '</b><span>Présents</span></div><div class="dst"><b style="color:var(--amber)">' + cnt.R + '</b><span>Retards</span></div><div class="dst"><b style="color:var(--red)">' + cnt.A + '</b><span>Absents</span></div></div></div></div>' +
        '<div class="card"><div class="ch"><h3>Ce qui se déclenche</h3>' + H.pill('Automation', 'soft', 'zap') + '</div><div class="list">' +
        H.li({ icon: 'bell', title: 'Notification immédiate', sub: 'Push à l’étudiant absent et à son parent' }) +
        H.li({ icon: 'paperclip', tone: 'amber', title: 'Justificatif ouvert', sub: 'Dépôt en ligne possible pendant 5 jours' }) +
        H.li({ icon: 'alert-triangle', tone: 'red', title: 'Escalade', sub: 'Plus de 2 absences en 3 semaines → responsable pédagogique' }) + '</div></div></div></div>';
    },
    mount: function (el) {
      var sel = $('#sessSel', el);
      if (sel) sel.addEventListener('change', function () { ui.navigate('appel', { s: sel.value }); });
    }
  });
  A.mark = function (b) {
    var m = draftMarks[b.dataset.s] = draftMarks[b.dataset.s] || {};
    m[b.dataset.st] = b.dataset.v;
    ui.refresh();
  };
  A['all-present'] = function (b) { var m = draftMarks[b.dataset.s] || {}; Object.keys(m).forEach(function (k) { m[k] = 'P'; }); draftMarks[b.dataset.s] = m; ui.refresh(); };
  A['save-appel'] = function (b) {
    var c = ctx(), d = db(), s = d.sessions.filter(function (x) { return x.id === b.dataset.s; })[0], marks = draftMarks[s.id];
    var prev = attOf(s.id), prevMarks = prev ? prev.marks : {};
    if (prev) { prev.marks = JSON.parse(JSON.stringify(marks)); prev.takenAt = U.nowISO(); }
    else d.attendance.push({ sessionId: s.id, takenAt: U.nowISO(), by: c.me.id, marks: JSON.parse(JSON.stringify(marks)) });
    var absent = Object.keys(marks).filter(function (k) { return marks[k] === 'A'; });
    var newAbs = absent.filter(function (k) { return prevMarks[k] !== 'A'; });
    newAbs.forEach(function (sid) {
      var st = q.student(sid);
      d.absences.unshift({ id: U.uid('ab'), studentId: sid, module: s.module, date: s.date, slot: s.start + ' – ' + s.end, status: 'a_justifier', deadline: U.addDays(s.date, 5), sessionId: s.id });
      var to = []; var u = q.userOfStudent(sid); if (u) to.push(u.id); q.parentsOf(sid).forEach(function (p) { to.push(p.id); });
      KMK.notify(to, { title: 'Absence enregistrée', body: KMK_MODULES[s.module].name + ' · ' + fmt.long(s.date) + ' ' + s.start + ' — justificatif à déposer avant le ' + fmt.date(U.addDays(s.date, 5)), icon: 'alert-triangle', tone: 'amber', route: 'absences' });
      st.att = Math.max(50, st.att - 1);
      var abs3 = d.absences.filter(function (a) { return a.studentId === sid && a.status === 'a_justifier'; }).length;
      if (abs3 > 2) KMK.notify(['u-scol'], { title: 'Escalade — ' + st.name, body: abs3 + ' absences non justifiées · Student Risk Score mis à jour', icon: 'alert-triangle', tone: 'red', route: 'etudiants' });
    });
    /* absence annulée lors d’une modification */
    Object.keys(prevMarks).forEach(function (sid) { if (prevMarks[sid] === 'A' && marks[sid] !== 'A') d.absences = d.absences.filter(function (a) { return !(a.sessionId === s.id && a.studentId === sid && a.status === 'a_justifier'); }); });
    var auto = d.automations.filter(function (a) { return a.id === 'absence'; })[0]; if (auto) auto.runs += newAbs.length;
    KMK.log('attendance.save', 'Appel ' + s.title + ' (Gr. ' + s.groups.join(', ') + ') — ' + absent.length + ' absent(s)');
    KMK.flag('appel');
    delete draftMarks[s.id];
    KMK.store.save();
    ui.navigate('appel', { s: s.id });
    ui.toast('Appel validé' + (newAbs.length ? ' — ' + newAbs.length + ' absence(s) notifiée(s) aux étudiants et familles' : ''));
  };

  /* ---------------------------------------------------------
     Saisie des notes
     --------------------------------------------------------- */
  function parseGrade(v) {
    v = String(v).trim().replace(',', '.');
    if (v === '') return { ok: true, v: null };
    if (!/^\d{1,2}(\.\d{1,2})?$/.test(v)) return { ok: false };
    var n = +v; return n >= 0 && n <= 20 ? { ok: true, v: n } : { ok: false };
  }
  function stats(e) {
    var vals = groupRoster(e.group).map(function (s) { return e.grades[s.id]; }).filter(function (v) { return v != null && v !== ''; });
    if (!vals.length) return { n: 0 };
    var sum = vals.reduce(function (a, b) { return a + b; }, 0);
    return { n: vals.length, avg: sum / vals.length, min: Math.min.apply(null, vals), max: Math.max.apply(null, vals), under: vals.filter(function (v) { return v < 10; }).length, vals: vals };
  }
  function statsHtml(e) {
    var st = stats(e), total = groupRoster(e.group).length;
    var bands = [0, 0, 0, 0, 0]; (st.vals || []).forEach(function (v) { bands[Math.min(4, Math.floor(v / 4))]++; });
    return '<div class="dgrid" style="grid-template-columns:repeat(2,1fr)"><div class="dst"><b>' + (st.n ? fmt.num(st.avg) : '—') + '</b><span>Moyenne</span></div><div class="dst"><b>' + st.n + ' / ' + total + '</b><span>Saisies</span></div>' +
      '<div class="dst"><b>' + (st.n ? fmt.num(st.min) + ' – ' + fmt.num(st.max) : '—') + '</b><span>Min – max</span></div><div class="dst"><b style="color:' + (st.under ? 'var(--red)' : 'inherit') + '">' + (st.under || 0) + '</b><span>Sous 10</span></div></div>' +
      '<div class="lbl">Répartition</div>' + H.bars(bands.map(function (v, k) { return { l: (k * 4) + '-' + (k * 4 + 4), v: v, on: true, tip: v + ' étudiant(s)' }; }), Math.max(1, Math.max.apply(null, bands)), 100);
  }
  KMK.route('saisie-notes', {
    label: 'Saisie des notes', icon: 'clipboard-check', roles: ['formateur'],
    sub: function () { return 'Brouillon enregistré automatiquement · publication notifiée aux étudiants'; },
    badge: function () { return db().evaluations.filter(function (e) { return e.status === 'draft'; }).reduce(function (t, e) { return t + missing(e); }, 0); },
    render: function (c) {
      var evs = db().evaluations, e = evs.filter(function (x) { return x.id === c.params.e; })[0] || evs.filter(function (x) { return x.status === 'draft'; })[0] || evs[0];
      var pub = e.status === 'published', roster = groupRoster(e.group);
      var list = '<div class="list">' + evs.map(function (x) {
        return '<div class="li click' + (x.id === e.id ? '" style="background:#F2F6FE;box-shadow:inset 3px 0 0 var(--g500)' : '') + '" data-go="saisie-notes?e=' + x.id + '" role="link" tabindex="0"><div class="tx"><div class="tt">' + esc(KMK_MODULES[x.module].name) + ' — ' + esc(x.label) + '</div><div class="ss">Groupe ' + x.group + ' · ' + fmt.date(x.date) + (x.status === 'draft' ? ' · ' + missing(x) + ' manquante(s)' : '') + '</div></div>' + (x.status === 'published' ? H.pill('Publiée', 'green') : H.pill('Brouillon', 'amber')) + '</div>'; }).join('') + '</div>';
      return '<div class="pagehead"><div><h2>' + esc(KMK_MODULES[e.module].name) + ' — ' + esc(e.label) + '</h2><p>Groupe ' + e.group + ' · ' + fmt.long(e.date) + ' · ' + roster.length + ' étudiants' + (pub ? ' · publiée ' + fmt.rel(e.publishedAt) : '') + '</p></div>' +
        '<div class="acts"><button class="btn ghost" data-act="new-eval">' + icon('plus', 15) + 'Nouvelle évaluation</button>' + (pub ? '' : '<button class="btn" data-act="publish" data-e="' + e.id + '">' + icon('send', 15) + 'Publier les notes</button>') + '</div></div>' +
        '<div class="grid g-3col">' +
        H.card('Évaluations', '', list) +
        '<div class="card"><div class="ch"><h3>Notes /20</h3>' + (pub ? H.pill('Lecture seule', 'grey', 'lock') : '<span class="m sp" id="saveState">' + icon('check', 13) + ' brouillon enregistré</span>') + '</div>' +
        '<div class="tbl-wrap"><table><thead><tr><th>Étudiant</th><th>Assiduité</th><th class="tar">Note</th></tr></thead><tbody>' + roster.map(function (s, k) {
          var v = e.grades[s.id];
          return '<tr><td>' + H.who(s.name, s.level + ' ' + s.formation.replace('Licence ', ''), s.initials) + '</td><td class="mu">' + s.att + ' %</td><td class="tar"><input class="gin" data-st="' + s.id + '" data-k="' + k + '" value="' + (v == null ? '' : fmt.num(v, v % 1 ? 2 : 1).replace(/,0+$/, '').replace(/(,\d)0$/, '$1')) + '" inputmode="decimal" placeholder="—" aria-label="Note de ' + esc(s.name) + '"' + (pub ? ' disabled' : '') + '></td></tr>';
        }).join('') + '</tbody></table></div>' +
        (pub ? '' : '<div class="pad" style="padding-top:10px"><div class="hintx">Saisissez une note entre 0 et 20 (virgule acceptée). <b>Entrée</b> passe à l’étudiant suivant. À la publication, chaque étudiant reçoit une notification qui ouvre directement sa note.</div></div>') + '</div>' +
        '<div class="card"><div class="ch"><h3>Statistiques</h3></div><div class="pad" id="evStats">' + statsHtml(e) + '</div></div></div>';
    },
    mount: function (el, c) {
      var evs = db().evaluations, e = evs.filter(function (x) { return x.id === c.params.e; })[0] || evs.filter(function (x) { return x.status === 'draft'; })[0] || evs[0];
      if (e.status === 'published') return;
      var inputs = $$('.gin', el), t;
      inputs.forEach(function (inp) {
        inp.addEventListener('input', function () {
          var r = parseGrade(inp.value);
          inp.classList.toggle('invalid', !r.ok);
          if (!r.ok) return;
          e.grades[inp.dataset.st] = r.v;
          $('#evStats', el).innerHTML = statsHtml(e);
          $('#saveState', el).innerHTML = '<span class="spin" style="width:11px;height:11px;border-color:rgba(46,139,255,.3);border-top-color:#2E8BFF;display:inline-block;vertical-align:-1px"></span> enregistrement…';
          clearTimeout(t); t = setTimeout(function () { KMK.store.save(); var s = $('#saveState'); if (s) s.innerHTML = icon('check', 13) + ' brouillon enregistré'; KMK.ui.chrome(); }, 500);
        });
        inp.addEventListener('keydown', function (ev) { if (ev.key === 'Enter' || ev.key === 'ArrowDown') { ev.preventDefault(); var n = inputs[+inp.dataset.k + 1]; if (n) { n.focus(); n.select(); } } if (ev.key === 'ArrowUp') { ev.preventDefault(); var p = inputs[+inp.dataset.k - 1]; if (p) { p.focus(); p.select(); } } });
        inp.addEventListener('focus', function () { inp.select(); });
      });
    }
  });
  A.publish = function (b) {
    var d = db(), e = d.evaluations.filter(function (x) { return x.id === b.dataset.e; })[0];
    if ($$('.gin.invalid').length) { ui.toast('Corrigez les notes invalides avant de publier', 'err'); return; }
    var m = missing(e), st = stats(e);
    if (!st.n) { ui.toast('Aucune note saisie', 'err'); return; }
    ui.confirm({ title: 'Publier les notes ?', body: '<b>' + st.n + ' note(s)</b> de « ' + esc(KMK_MODULES[e.module].name + ' — ' + e.label) + ' » seront publiées. Moyenne du groupe : <b>' + fmt.num(st.avg) + '</b>.' + (m ? '<br><br>' + m + ' étudiant(s) sans note seront marqué(s) « absent à l’épreuve ».' : '') + '<br><br>Chaque étudiant et sa famille recevront une notification.', ok: 'Publier' }).then(function (ok) {
      if (!ok) return;
      e.status = 'published'; e.publishedAt = U.nowISO();
      var promo = Math.round(st.avg * 10) / 10, notified = 0;
      groupRoster(e.group).forEach(function (s) {
        var v = e.grades[s.id]; if (v == null || v === '') return;
        var u = q.userOfStudent(s.id);
        if (u) {
          d.grades.push({ id: U.uid('g'), studentId: s.id, module: e.module, label: e.label, value: v, promo: promo, date: TODAY, comment: '', isNew: true });
          var to = [u.id]; q.parentsOf(s.id).forEach(function (p) { to.push(p.id); });
          KMK.notify(to, { title: 'Nouvelle note — ' + KMK_MODULES[e.module].name, body: e.label + ' · ' + fmt.num(v) + '/20 (promo ' + fmt.num(promo) + ')', icon: 'award', tone: 'blue', route: 'notes?module=' + e.module });
        }
        notified++;
      });
      var auto = d.automations.filter(function (a) { return a.id === 'note'; })[0]; if (auto) auto.runs += notified;
      KMK.log('grades.publish', KMK_MODULES[e.module].name + ' — ' + e.label + ' publié (' + notified + ' notes, moyenne ' + fmt.num(promo) + ')');
      KMK.flag('notesPublished');
      KMK.commit('Notes publiées — ' + notified + ' étudiants notifiés, moyennes recalculées');
    });
  };
  A['new-eval'] = function () {
    ui.modal({
      title: 'Nouvelle évaluation', sub: 'Créée en brouillon, publiée quand vous le décidez',
      body: '<div class="row2"><div class="field"><label for="eM">Module</label><select class="select" id="eM"><option value="ALG">Algorithmique</option><option value="BD">Base de données</option></select></div>' +
        '<div class="field"><label for="eG">Groupe</label><select class="select" id="eG"><option value="A">L2 Informatique — A</option><option value="B">L2 Informatique — B</option></select></div></div>' +
        '<div class="row2"><div class="field"><label for="eL">Intitulé</label><input class="input" id="eL" placeholder="Ex. : TP noté n°3" maxlength="40"></div><div class="field"><label for="eD">Date</label><input class="input" type="date" id="eD" value="' + TODAY + '"></div></div>',
      foot: '<button class="btn ghost" data-act="close-modal">Annuler</button><button class="btn" id="eOk">' + icon('plus', 15) + 'Créer</button>',
      onMount: function (m) {
        $('#eOk', m).addEventListener('click', function () {
          var l = $('#eL', m).value.trim(); if (l.length < 2) { ui.toast('Indiquez un intitulé', 'err'); return; }
          var ev = { id: U.uid('ev'), module: $('#eM', m).value, label: l, group: $('#eG', m).value, date: $('#eD', m).value || TODAY, status: 'draft', grades: {} };
          db().evaluations.unshift(ev);
          KMK.log('grades.create', 'Évaluation créée — ' + KMK_MODULES[ev.module].name + ' ' + l);
          ui.closeModal(true); KMK.store.save();
          ui.navigate('saisie-notes', { e: ev.id }); ui.toast('Évaluation créée en brouillon');
        });
      }
    });
  };

  /* ---------------------------------------------------------
     Mes groupes
     --------------------------------------------------------- */
  KMK.route('groupes', {
    label: 'Mes groupes', icon: 'users', roles: ['formateur'],
    sub: function () { return 'Suivi des étudiants · Student Risk Score calculé chaque nuit'; },
    render: function (c) {
      var g = c.params.g || 'A', r = groupRoster(g).slice().sort(function (a, b) { return b.risk - a.risk; });
      var avg = r.reduce(function (t, s) { return t + q.studentAvg(s.id); }, 0) / r.length, att = r.reduce(function (t, s) { return t + s.att; }, 0) / r.length;
      return '<div class="toolbar"><div class="seg"><button class="' + (g === 'A' ? 'on' : '') + '" data-go="groupes?g=A">L2 Informatique — A</button><button class="' + (g === 'B' ? 'on' : '') + '" data-go="groupes?g=B">L2 Informatique — B</button></div>' +
        '<button class="btn sp" data-act="msg-group" data-g="' + g + '">' + icon('megaphone', 15) + 'Écrire au groupe</button></div>' +
        '<div class="grid g4 mb">' + H.kpi({ icon: 'users', label: 'Effectif', value: r.length, delta: 'Groupe ' + g }) + H.kpi({ icon: 'award', label: 'Moyenne du groupe', value: fmt.num(avg), delta: 'tous modules' }) +
        H.kpi({ icon: 'user-check', label: 'Assiduité moyenne', value: fmt.num(att, 0) + ' %', delta: 'objectif 95 %', tone: att < 90 ? 'warn' : '' }) + H.kpi({ icon: 'alert-triangle', label: 'À accompagner', value: r.filter(function (s) { return s.risk >= 40; }).length, delta: 'risque moyen ou élevé', tone: 'warn' }) + '</div>' +
        '<div class="card"><div class="ch"><h3>Étudiants</h3><span class="m">trié par risque · cliquez pour la fiche</span></div><div class="tbl-wrap"><table><thead><tr><th>Étudiant</th><th class="tar">Moyenne</th><th class="tar">Assiduité</th><th>Risk Score</th><th>Signal principal</th></tr></thead><tbody>' +
        r.map(function (s) { return '<tr class="click" data-act="open-student" data-sid="' + s.id + '"><td>' + H.who(s.name, 'Groupe ' + s.group, s.initials) + '</td><td class="tar"><b>' + fmt.num(q.studentAvg(s.id)) + '</b></td><td class="tar">' + s.att + ' %</td><td><span class="hstack" style="gap:8px"><b style="color:' + H.riskColor(s.risk) + '">' + s.risk + '</b>' + H.riskPill(s.risk) + '</span></td><td class="mu">' + esc(s.signal) + '</td></tr>'; }).join('') +
        '</tbody></table></div></div>';
    }
  });
  A['msg-group'] = function (b) {
    var g = b.dataset.g, r = groupRoster(g);
    ui.modal({
      title: 'Message au groupe ' + g, sub: r.length + ' étudiants · push + e-mail',
      body: '<div class="field"><label for="gS">Objet</label><input class="input" id="gS" value="Information — Algorithmique"></div><div class="field"><label for="gT">Message</label><textarea class="textarea" id="gT">Bonjour à tous, le support du chapitre 4 est disponible dans l’espace du cours. Pensez à le lire avant jeudi.</textarea></div>',
      foot: '<button class="btn ghost" data-act="close-modal">Annuler</button><button class="btn" id="gOk">' + icon('send', 15) + 'Envoyer</button>',
      onMount: function (m) {
        $('#gOk', m).addEventListener('click', function () {
          var s = $('#gS', m).value.trim(), t = $('#gT', m).value.trim(); if (!s || !t) { ui.toast('Objet et message requis', 'err'); return; }
          var to = r.map(function (st) { var u = q.userOfStudent(st.id); return u && u.id; }).filter(Boolean);
          KMK.notify(to, { title: s, body: t.slice(0, 100) + ' — ' + ctx().me.name, icon: 'megaphone', tone: 'blue', route: 'notifications' });
          KMK.log('group.message', 'Message au groupe ' + g + ' : « ' + s + ' »');
          ui.closeModal(true); KMK.commit('Message envoyé aux ' + r.length + ' étudiants du groupe ' + g);
        });
      }
    });
  };

  KMK.commands.formateur = [
    { ic: 'user-check', t: 'Faire l’appel', run: function () { ui.navigate('appel'); } },
    { ic: 'clipboard-check', t: 'Saisir des notes', run: function () { ui.navigate('saisie-notes'); } },
    { ic: 'plus', t: 'Nouvelle évaluation', run: function () { A['new-eval'](); } }
  ];
})();
