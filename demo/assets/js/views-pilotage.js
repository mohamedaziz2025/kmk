/* =========================================================
   KMK Campus — pilotage : direction et service financier
   ========================================================= */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var U = KMK.util, esc = U.esc, fmt = KMK.fmt, q = KMK.q, H = KMK.H, ui = KMK.ui, A = KMK.actions;
  var TODAY = window.KMK_DEMO_TODAY;
  function db() { return KMK.db(); }
  function ctx() { return KMK.ctx(); }

  var FORMATIONS = [
    { id: 'LIA', code: 'LI', name: 'Licence Informatique A', n: 68, att: 94, avg: 12.8, ok: 88, prog: 72, trend: [92, 93, 95, 94, 93, 94] },
    { id: 'LIB', code: 'LI', name: 'Licence Informatique B', n: 61, att: 91, avg: 12.1, ok: 85, prog: 64, trend: [90, 92, 91, 89, 90, 91] },
    { id: 'MA', code: 'MA', name: 'Licence Mathématiques', n: 44, att: 96, avg: 13.4, ok: 93, prog: 88, trend: [95, 96, 96, 97, 95, 96] },
    { id: 'BUT', code: 'BU', name: 'BUT Informatique', n: 57, att: 89, avg: 11.7, ok: 79, prog: 51, trend: [91, 90, 88, 87, 89, 89] },
    { id: 'MS', code: 'MS', name: 'Mastère Data', n: 23, att: 97, avg: 14.6, ok: 100, prog: 95, trend: [97, 98, 97, 96, 97, 97] }
  ];
  var MONTHS6 = ['Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sept'];
  var ATT_TREND = [92.1, 93.0, 93.8, 92.6, 92.9, 93.4];
  function late() { return db().invoices.filter(function (i) { return q.invoiceStatus(i) === 'retard'; }); }
  function sum(a) { return a.reduce(function (t, i) { return t + i.amount; }, 0); }
  function cashTotal() { return db().cashflow.reduce(function (t, m) { return t + m.v; }, 0) + 0; }
  function atRisk(min) { return db().students.filter(function (s) { return s.risk >= min; }).sort(function (a, b) { return b.risk - a.risk; }); }

  /* ---------------------------------------------------------
     Direction — Campus Health
     --------------------------------------------------------- */
  var RECO = [
    { id: 'rdv', ic: 'calendar-clock', t: 'Rendez-vous pédagogiques', s: '7 étudiants à risque élevé · cette semaine', run: 'Rendez-vous proposés à 7 étudiants — tuteurs prévenus' },
    { id: 'tut', ic: 'book-open', t: 'Tutorat Algorithmique renforcé', s: '6 étudiants · jeudi 16:30', run: 'Séance de tutorat ouverte — 6 étudiants invités' },
    { id: 'pay', ic: 'wallet', t: 'Relance impayés J+3', s: 'échéances en retard · SMS + e-mail', run: null },
    { id: 'l1', ic: 'users', t: 'Contacter les familles de L1', s: 'absences du lundi matin +18 %', run: 'Message envoyé à 8 familles de première année' }
  ];
  KMK.part('tableau-de-bord', ['direction'], {
    label: 'Campus Health', icon: 'activity',
    sub: function () { return 'Vue consolidée du campus · recalculée en continu · ' + fmt.long(TODAY); },
    render: function (c) {
      var d = db(), l = late(), open = d.requests.filter(function (r) { return r.stage < 4 && !r.rejected; }).length;
      var cash = cashTotal(), applied = d.flags.reco || {};
      return '<div class="welcome"><div><h2>Campus Health · 82 / 100</h2><p>Bonjour ' + esc(c.me.name.split(' ')[0]) + '. Situation stable : assiduité 93,4 %, ' + atRisk(40).length + ' étudiants à suivre et ' + l.length + ' échéances en retard. KMK AI propose 4 actions prioritaires.</p></div>' +
        '<div class="acts"><button class="btn white" data-go="ia?q=' + encodeURIComponent('Comment va mon campus aujourd’hui ?') + '">' + icon('sparkles', 15) + 'Demander à KMK AI</button><button class="btn ghost" data-act="monthly-report">' + icon('file-text', 15) + 'Rapport mensuel</button></div></div>' +
        '<div class="grid g4">' + H.kpi({ icon: 'users', label: 'Étudiants inscrits', value: '253', delta: '+18 vs septembre 2025', tone: 'good', go: 'etudiants' }) +
        H.kpi({ icon: 'user-check', label: 'Assiduité moyenne', value: '93,4 %', delta: 'objectif 95 %', tone: 'warn', go: 'formations' }) +
        H.kpi({ icon: 'alert-triangle', label: 'Étudiants à risque', value: atRisk(40).length + ' / ' + d.students.length, delta: atRisk(65).length + ' à risque élevé (échantillon démo)', tone: 'warn', go: 'early-warning' }) +
        H.kpi({ icon: 'wallet', label: 'Encaissements', value: fmt.num(cash / 1000, 2) + ' M€', delta: 'sur 1,55 M€ attendus · ' + Math.round(cash / 1550 * 100) + ' %', go: 'encaissements' }) + '</div>' +
        '<div class="grid g4 mt">' + [[94, 'Assiduité', '61 200 h / 65 480 h'], [70, 'Crédits validés', '142 / 203 ECTS'], [88, 'Taux de réussite', '221 étudiants sur 253'], [Math.round(cash / 1550 * 100), 'Encaissements', fmt.num(cash / 1000, 2) + ' M€ / 1,55 M€']].map(function (g) {
          return '<div class="card gcard">' + H.ring(g[0], 104, 11, g[0] < 80 ? 'var(--amber)' : 'var(--g500)', '<b style="font-size:19px">' + g[0] + '%</b>') + '<div class="gt">' + g[1] + '</div><div class="gs">' + g[2] + '</div></div>'; }).join('') + '</div>' +
        '<div class="grid g2 mt">' + H.card('AI Insights', H.pill('analyse automatique', 'soft', 'sparkles'), '<div class="pad"><div class="hintx">« Les absences augmentent de <b>18 %</b> chez les étudiants de première année. Le pic se concentre sur les cours du <b>lundi matin</b>. »</div>' +
          '<div class="hintx">« Le BUT Informatique progresse moins vite : <b>51 %</b> d’avancement contre 72 % en Licence A. »</div><div class="hintx">« Les étudiants qui ouvrent l’application plus de 4 fois par semaine réussissent leur semestre <b>2,3 fois plus souvent</b>. »</div></div>') +
        H.card('Actions recommandées', '<span class="m">validées en un clic</span>', '<div class="list">' + RECO.map(function (r) {
          var done = applied[r.id];
          return H.li({ icon: r.ic, tone: done ? 'green' : 'blue', title: esc(r.t), sub: esc(r.id === 'pay' ? l.length + ' échéances en retard · SMS + e-mail' : r.s), right: done ? H.pill('Appliquée', 'green', 'check') : '<button class="btn sm" data-act="apply-reco" data-id="' + r.id + '">Appliquer</button>' }); }).join('') + '</div>') + '</div>' +
        '<div class="grid g21 mt">' + H.card('Assiduité sur 6 mois', '<span class="m sp">objectif 95 %</span>', '<div class="pad">' + H.bars(MONTHS6.map(function (m, k) { return { l: m, v: ATT_TREND[k] - 85, on: k === 5, tip: fmt.num(ATT_TREND[k]) + ' %' }; }), 12) + '</div>') +
        H.card('Early Warning', '<button class="lk" data-go="early-warning">Tout voir</button>', '<div class="list">' + atRisk(55).slice(0, 5).map(function (s) { return '<div class="li click" data-act="open-student" data-sid="' + s.id + '" role="button" tabindex="0">' + H.av(s.initials, H.riskColor(s.risk)) + '<div class="tx"><div class="tt">' + esc(s.name) + '</div><div class="ss">' + esc(s.signal) + '</div></div><b class="vv" style="color:' + H.riskColor(s.risk) + '">' + s.risk + '</b></div>'; }).join('') + '</div>') + '</div>' +
        '<div class="hstack mt m" style="font-size:12px">' + icon('info', 14) + 'Demandes ouvertes : ' + open + ' · Journal d’audit et réglages dans « Sécurité & audit ».</div>';
    }
  });
  A['apply-reco'] = function (b) {
    var r = RECO.filter(function (x) { return x.id === b.dataset.id; })[0], d = db();
    d.flags.reco = d.flags.reco || {}; d.flags.reco[r.id] = true;
    if (r.id === 'pay') { KMK.remindAll(true); }
    else {
      if (r.id === 'tut') KMK.notify(['u-lea', 'u-claire'], { title: 'Tutorat Algorithmique', body: 'Séance renforcée jeudi 16:30 · Salle A204', icon: 'book-open', tone: 'blue', route: 'emploi-du-temps' });
      if (r.id === 'rdv') KMK.notify(['u-scol', 'u-claire'], { title: 'Rendez-vous pédagogiques à planifier', body: '7 étudiants à risque élevé — demande de la direction', icon: 'calendar-clock', tone: 'amber', route: 'etudiants' });
      if (r.id === 'l1') KMK.notify(['u-parent'], { title: 'Message de la direction', body: 'Point sur l’assiduité en début d’année — nous restons disponibles.', icon: 'megaphone', tone: 'blue', route: 'notifications' });
      KMK.log('reco.apply', 'Recommandation appliquée : ' + r.t);
      KMK.commit(r.run);
    }
  };
  A['monthly-report'] = function () {
    var d = db(), l = late(), cash = cashTotal();
    var w = window.open('', '_blank');
    var rows = FORMATIONS.map(function (f) { return '<tr><td>' + f.name + '</td><td>' + f.n + '</td><td>' + f.att + ' %</td><td>' + fmt.num(f.avg) + '</td><td>' + f.ok + ' %</td><td>' + f.prog + ' %</td></tr>'; }).join('');
    var html = '<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Rapport mensuel — septembre 2026</title><style>body{font-family:Arial,sans-serif;color:#121A2A;max-width:820px;margin:30px auto;padding:0 28px;line-height:1.55}h1{color:#0A2A6E;margin-bottom:4px}h2{color:#1257E0;font-size:16px;margin-top:26px;border-bottom:2px solid #E8F0FD;padding-bottom:6px}.k{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}.k div{background:#F3F6FB;border-radius:10px;padding:12px}.k b{font-size:20px;display:block}table{width:100%;border-collapse:collapse;font-size:13px}th{background:#E8F0FD;text-align:left;padding:7px}td{padding:7px;border-bottom:1px solid #E1E7F2}.bar{background:#0A2A6E;color:#fff;padding:10px 14px;border-radius:10px;display:flex;align-items:center}.bar button{margin-left:auto;background:#38BDF8;border:0;border-radius:8px;padding:7px 12px;font-weight:700;cursor:pointer}@media print{.bar{display:none}}</style></head><body>' +
      '<div class="bar">Rapport généré par KMK Campus — données de démonstration<button onclick="print()">Imprimer / PDF</button></div><h1>Rapport mensuel de direction</h1><div style="color:#66748A">Septembre 2026 · généré le ' + fmt.longY(TODAY) + '</div>' +
      '<h2>Indicateurs clés</h2><div class="k"><div><b>82/100</b>Campus Health</div><div><b>93,4 %</b>Assiduité</div><div><b>' + atRisk(40).length + '</b>Étudiants à suivre (démo)</div><div><b>' + fmt.num(cash / 1000, 2) + ' M€</b>Encaissés</div></div>' +
      '<h2>Résultats par formation</h2><table><thead><tr><th>Formation</th><th>Effectif</th><th>Assiduité</th><th>Moyenne</th><th>Réussite</th><th>Avancement</th></tr></thead><tbody>' + rows + '</tbody></table>' +
      '<h2>Finances</h2><p>' + l.length + ' échéances en retard pour ' + fmt.money(sum(l)) + '. Encaissement du mois : ' + d.cashflow[d.cashflow.length - 1].v + ' k€.</p>' +
      '<h2>Recommandations KMK AI</h2><ul>' + RECO.map(function (r) { return '<li>' + r.t + ' — ' + r.s + '</li>'; }).join('') + '</ul></body></html>';
    if (w) { w.document.open(); w.document.write(html); w.document.close(); } else U.download('rapport-mensuel-septembre-2026.html', html, 'text/html;charset=utf-8');
    KMK.log('report.monthly', 'Rapport mensuel de direction généré'); KMK.commit();
  };

  /* ---------------------------------------------------------
     Early Warning
     --------------------------------------------------------- */
  var PLAN = [['rdv', 'Rendez-vous pédagogique', 'calendar-clock'], ['tut', 'Inscription au tutorat', 'book-open'], ['fam', 'Contact de la famille', 'phone'], ['ech', 'Échéancier de paiement', 'wallet']];
  KMK.route('early-warning', {
    label: 'Early Warning', icon: 'alert-triangle', roles: ['direction'],
    sub: function () { return 'Student Risk Score — absences, notes, devoirs, activité et impayés'; },
    badge: function () { return atRisk(65).filter(function (s) { return !s.ewPlan; }).length; },
    render: function (c) {
      var list = atRisk(30), high = atRisk(65), followed = db().students.filter(function (s) { return s.ewPlan; });
      return '<div class="grid g4 mb">' + H.kpi({ icon: 'users', label: 'Étudiants à risque', value: atRisk(40).length, delta: '+4 cette semaine', tone: 'warn' }) +
        H.kpi({ icon: 'alert-triangle', label: 'Risque élevé', value: high.length, delta: high.filter(function (s) { return !s.ewPlan; }).length + ' sans plan d’action', tone: 'bad' }) +
        H.kpi({ icon: 'list-checks', label: 'Plans d’action actifs', value: followed.length, delta: 'suivis par les tuteurs' }) +
        H.kpi({ icon: 'user-check', label: 'Dossiers sauvés', value: 12 + followed.length, delta: 'après intervention cette année', tone: 'good' }) + '</div>' +
        '<div class="grid g-rail"><div class="card"><div class="ch"><h3>Student Risk Score</h3>' + H.pill('mis à jour cette nuit', 'soft', 'sparkles') + '</div><div class="tbl-wrap"><table><thead><tr><th>Étudiant</th><th>Score</th><th>Signal principal</th><th>Suivi</th><th></th></tr></thead><tbody>' +
        list.map(function (s) {
          return '<tr class="click" data-act="open-student" data-sid="' + s.id + '"><td>' + H.who(s.name, s.level + ' ' + s.formation.replace('Licence ', '') + ' · Gr. ' + s.group, s.initials) + '</td>' +
            '<td><div style="display:flex;align-items:center;gap:8px;min-width:120px"><b style="color:' + H.riskColor(s.risk) + ';width:24px">' + s.risk + '</b><div class="bar" style="flex:1"><i style="width:' + s.risk + '%;background:' + H.riskColor(s.risk) + '"></i></div></div></td>' +
            '<td>' + esc(s.signal) + '</td><td>' + (s.ewPlan ? H.pill(s.ewPlan.length + ' action(s)', 'green', 'check') : s.risk >= 65 ? H.pill('À traiter', 'red') : H.riskPill(s.risk)) + '</td>' +
            '<td class="tar"><button class="btn sm' + (s.ewPlan ? ' ghost' : '') + '" data-act="ew-plan" data-sid="' + s.id + '">' + (s.ewPlan ? 'Modifier' : 'Plan d’action') + '</button></td></tr>'; }).join('') +
        '</tbody></table></div></div>' +
        '<div class="grid" style="align-content:start">' + H.card('Facteurs de risque', '<span class="m">poids moyen</span>', '<div class="pad">' + [['Absences répétées', 34], ['Baisse de moyenne', 27], ['Devoirs non remis', 18], ['Impayés', 12], ['Faible activité', 9]].map(function (f) { return H.progress(f[0], f[1] + ' %', f[1] / 34 * 100); }).join('') + '</div>') +
        '<div class="hintx"><b>Comment est calculé le score ?</b> KMK AI pondère chaque nuit les absences, l’évolution des notes, les dépôts manquants, l’activité sur la plateforme et la situation financière. Au-delà de 65, une alerte est envoyée au tuteur et à la direction.</div></div></div>';
    }
  });
  A['ew-plan'] = function (b) {
    var s = q.student(b.dataset.sid), cur = s.ewPlan || [];
    ui.modal({
      title: 'Plan d’action — ' + esc(s.name), sub: 'Risk Score ' + s.risk + ' · ' + esc(s.signal),
      body: '<div class="list card">' + PLAN.map(function (p) { return '<label class="li" style="cursor:pointer"><input type="checkbox" value="' + p[0] + '"' + (cur.indexOf(p[0]) >= 0 ? ' checked' : '') + ' style="width:17px;height:17px;accent-color:var(--g500)"><span class="ico">' + icon(p[2], 16) + '</span><span class="tx"><span class="tt" style="display:block">' + p[1] + '</span></span></label>'; }).join('') + '</div>' +
        '<div class="field mt"><label for="ewN">Note pour le tuteur</label><textarea class="textarea" id="ewN" placeholder="Contexte, objectifs, échéance…">' + esc(s.ewNote || '') + '</textarea></div>',
      foot: '<button class="btn ghost" data-act="close-modal">Annuler</button><button class="btn" id="ewOk">' + icon('check', 15) + 'Enregistrer et notifier</button>',
      onMount: function (m) {
        $('#ewOk', m).addEventListener('click', function () {
          var sel = $$('input:checked', m).map(function (i) { return i.value; });
          if (!sel.length) { ui.toast('Choisissez au moins une action', 'err'); return; }
          s.ewPlan = sel; s.ewNote = $('#ewN', m).value.trim();
          KMK.notify(['u-scol', 'u-claire'], { title: 'Plan d’action — ' + s.name, body: sel.map(function (k) { return PLAN.filter(function (p) { return p[0] === k; })[0][1]; }).join(' · '), icon: 'list-checks', tone: 'amber', route: 'etudiants' });
          var u = q.userOfStudent(s.id); if (u && sel.indexOf('rdv') >= 0) KMK.notify([u.id], { title: 'Rendez-vous pédagogique proposé', body: 'Votre responsable pédagogique souhaite faire un point cette semaine.', icon: 'calendar-clock', tone: 'blue', route: 'messagerie' });
          KMK.log('earlywarning.plan', 'Plan d’action pour ' + s.name + ' : ' + sel.join(', '));
          ui.closeModal(true); KMK.commit('Plan d’action enregistré — tuteur et scolarité notifiés');
        });
      }
    });
  };

  /* ---------------------------------------------------------
     Formations
     --------------------------------------------------------- */
  KMK.route('formations', {
    label: 'Formations', icon: 'bar-chart-3', roles: ['direction'],
    sub: function () { return 'Résultats par formation — septembre 2026'; },
    render: function (c) {
      var k = c.params.sort || 'prog', dir = c.params.dir === 'asc' ? 1 : -1;
      var list = FORMATIONS.slice().sort(function (a, b) { return (a[k] > b[k] ? 1 : a[k] < b[k] ? -1 : 0) * (k === 'name' ? -dir : dir); });
      function th(key, lbl, cls) { return '<th class="sort ' + (cls || '') + '" data-act="sort-form" data-k="' + key + '">' + lbl + ' ' + (k === key ? icon(dir > 0 ? 'chevron-down' : 'chevron-down', 12) : '') + '</th>'; }
      return '<div class="grid g4 mb">' + H.kpi({ icon: 'graduation-cap', label: 'Formations', value: FORMATIONS.length, delta: '253 étudiants' }) + H.kpi({ icon: 'award', label: 'Meilleure réussite', value: 'Mastère Data', delta: '100 % · moyenne 14,6', tone: 'good' }) +
        H.kpi({ icon: 'trending-down', label: 'À accompagner', value: 'BUT Info', delta: 'avancement 51 %', tone: 'warn' }) + H.kpi({ icon: 'user-check', label: 'Assiduité moyenne', value: '93,4 %', delta: 'pondérée par effectif' }) + '</div>' +
        '<div class="card"><div class="ch"><h3>Résultats par formation</h3><span class="m">cliquez un en-tête pour trier · une ligne pour le détail</span></div><div class="tbl-wrap"><table><thead><tr>' + th('name', 'Formation') + th('n', 'Effectif', 'tar') + th('att', 'Assiduité', 'tar') + th('avg', 'Moyenne', 'tar') + th('ok', 'Réussite', 'tar') + th('prog', 'Avancement') + '</tr></thead><tbody>' +
        list.map(function (f) { return '<tr class="click" data-act="formation" data-id="' + f.id + '"><td>' + H.who(f.name, '', f.code) + '</td><td class="tar">' + f.n + '</td><td class="tar">' + f.att + ' %</td><td class="tar">' + fmt.num(f.avg) + '</td><td class="tar">' + f.ok + ' %</td>' +
          '<td style="min-width:180px"><div class="hstack"><div class="bar" style="flex:1"><i style="width:' + f.prog + '%;' + (f.prog < 60 ? 'background:var(--amber)' : '') + '"></i></div><b style="width:42px;text-align:right;' + (f.prog < 60 ? 'color:var(--amber)' : '') + '">' + f.prog + ' %</b></div></td></tr>'; }).join('') +
        '</tbody></table></div></div>' +
        '<div class="grid g2 mt">' + H.card('Moyenne par formation', '', '<div class="pad">' + H.bars(FORMATIONS.map(function (f) { return { l: f.code + (f.id === 'LIA' ? ' A' : f.id === 'LIB' ? ' B' : ''), v: f.avg, on: f.avg >= 12.5, tip: fmt.num(f.avg) }; }), 16) + '</div>') +
        H.card('Taux de réussite', '', '<div class="pad">' + FORMATIONS.map(function (f) { return H.progress(esc(f.name), f.ok + ' %', f.ok, f.ok < 80 ? 'var(--amber)' : ''); }).join('') + '</div>') + '</div>';
    }
  });
  A['sort-form'] = function (b) { var p = ctx().params, k = b.dataset.k; KMK.replaceParams('formations', { sort: k, dir: p.sort === k && p.dir !== 'asc' ? 'asc' : 'desc' }); };
  A.formation = function (b) {
    var f = FORMATIONS.filter(function (x) { return x.id === b.dataset.id; })[0];
    ui.modal({ title: esc(f.name), sub: f.n + ' étudiants · année 2026-2027', wide: true,
      body: '<div class="grid g4" style="grid-template-columns:repeat(4,1fr)"><div class="dst"><b>' + f.att + ' %</b><span>Assiduité</span></div><div class="dst"><b>' + fmt.num(f.avg) + '</b><span>Moyenne</span></div><div class="dst"><b>' + f.ok + ' %</b><span>Réussite</span></div><div class="dst"><b>' + f.prog + ' %</b><span>Avancement</span></div></div>' +
        '<div class="lbl">Assiduité sur 6 mois</div>' + H.bars(MONTHS6.map(function (m, k) { return { l: m, v: f.trend[k] - 80, on: k === 5, tip: f.trend[k] + ' %' }; }), 20, 120) +
        '<div class="hintx mt">' + icon('sparkles', 13) + ' <b>KMK AI :</b> ' + (f.prog < 60 ? 'avancement en retard de ' + (72 - f.prog) + ' points sur la moyenne ; prioriser le tutorat et un point avec l’équipe pédagogique.' : 'formation dans les objectifs ; maintenir le suivi des signaux faibles.') + '</div>',
      foot: '<button class="btn" data-act="close-modal">Fermer</button>' });
  };

  /* ---------------------------------------------------------
     Encaissements (finance, direction)
     --------------------------------------------------------- */
  KMK.part('encaissements', ['finance', 'direction'], {
    label: 'Encaissements', icon: 'bar-chart-3',
    sub: function () { return 'Flux encaissés, moyens de paiement et journal en temps réel'; },
    render: function (c) {
      var d = db(), cf = d.cashflow, cash = cashTotal(), l = late();
      var paid = d.invoices.filter(function (i) { return i.paidAt; }).sort(function (a, b) { return (a.paidAt + (a.ref || '')) < (b.paidAt + (b.ref || '')) ? 1 : -1; });
      var methods = {}; paid.forEach(function (i) { methods[i.method] = (methods[i.method] || 0) + i.amount; });
      var mt = sum(paid);
      return '<div class="grid g4 mb">' + H.kpi({ icon: 'wallet', label: 'Encaissé (6 mois)', value: fmt.num(cash / 1000, 2) + ' M€', delta: 'sur 1,55 M€ attendus' }) +
        H.kpi({ icon: 'trending-up', label: 'Septembre', value: fmt.num(cf[cf.length - 1].v, 1) + ' k€', delta: '+' + fmt.num((cf[cf.length - 1].v / cf[cf.length - 2].v - 1) * 100, 1) + ' % vs août', tone: 'good' }) +
        H.kpi({ icon: 'percent', label: 'Taux de recouvrement', value: Math.round(cash / 1550 * 100) + ' %', delta: 'objectif 92 % en fin d’année' }) +
        H.kpi({ icon: 'alert-triangle', label: 'En retard', value: fmt.money(sum(l)), delta: l.length + ' échéance(s)', tone: 'bad', go: c.role === 'finance' ? 'echeances?f=retard' : '' }) + '</div>' +
        '<div class="grid g21">' + H.card('Encaissements mensuels', '<span class="m sp">k€</span>', '<div class="pad">' + H.bars(cf.map(function (m, k) { return { l: m.m, v: m.v, on: k === cf.length - 1, tip: fmt.num(m.v, 1) + ' k€' }; })) + '</div>') +
        H.card('Moyens de paiement', '<span class="m">échantillon démo</span>', '<div class="pad">' + Object.keys(methods).map(function (k) { return H.progress(esc(k), fmt.money(methods[k]), methods[k] / mt * 100); }).join('') + '</div>') + '</div>' +
        '<div class="card mt"><div class="ch"><h3>Journal des paiements</h3>' + H.pill('temps réel', 'green', 'activity') + '<button class="btn ghost sm sp" data-act="export-payments">' + icon('download', 14) + 'Export comptable</button></div><div class="tbl-wrap"><table><thead><tr><th>Date</th><th>Étudiant</th><th>Objet</th><th>Moyen</th><th class="tar">Montant</th><th>Réf.</th></tr></thead><tbody>' +
        paid.slice(0, 15).map(function (i) { var s = q.student(i.studentId); return '<tr><td class="mu nowrap">' + fmt.dateY(i.paidAt) + '</td><td>' + H.who(s.name, s.formation, s.initials) + '</td><td>' + esc(i.label) + (i.paidBy ? ' ' + H.pill('en ligne', 'soft') : '') + '</td><td>' + esc(i.method) + '</td><td class="tar"><b>' + fmt.money(i.amount) + '</b></td><td class="log mu">' + esc(i.ref || '—') + '</td></tr>'; }).join('') +
        '</tbody></table></div></div>';
    }
  });
  A['export-payments'] = function () {
    var rows = [['Date', 'Étudiant', 'Objet', 'Moyen', 'Montant', 'Référence']].concat(db().invoices.filter(function (i) { return i.paidAt; }).map(function (i) { return [i.paidAt, q.student(i.studentId).name, i.label, i.method, i.amount, i.ref || '']; }));
    U.download('kmk-paiements.csv', U.csv(rows), 'text/csv;charset=utf-8');
    KMK.log('finance.export', 'Export comptable des paiements'); KMK.commit('Export comptable téléchargé');
  };

  /* ---------------------------------------------------------
     Service financier — tableau de bord et échéances
     --------------------------------------------------------- */
  KMK.remindAll = function (fromReco) {
    var l = late(), n = 0;
    l.forEach(function (i) {
      i.reminders = (i.reminders || 0) + 1; i.lastReminder = TODAY; n++;
      var to = [], u = q.userOfStudent(i.studentId); if (u) to.push(u.id); q.parentsOf(i.studentId).forEach(function (p) { to.push(p.id); });
      KMK.notify(to, { title: 'Relance — échéance en retard', body: i.label + ' · ' + fmt.money(i.amount) + ' — payer en ligne', icon: 'wallet', tone: 'red', route: 'finances' });
    });
    var a = db().automations.filter(function (x) { return x.id === 'echeance'; })[0]; if (a) a.runs += n;
    KMK.log('finance.remind_all', n + ' relances envoyées (SMS + e-mail)' + (fromReco ? ' — recommandation direction' : ''));
    KMK.commit(n + ' relance(s) envoyée(s) par SMS et e-mail');
  };
  A['remind-all'] = function () { KMK.remindAll(); };
  A.remind = function (b) {
    var i = db().invoices.filter(function (x) { return x.id === b.dataset.id; })[0], s = q.student(i.studentId);
    if (i.lastReminder === TODAY) { ui.toast('Déjà relancé aujourd’hui — prochaine relance automatique à J+3', 'info'); return; }
    i.reminders = (i.reminders || 0) + 1; i.lastReminder = TODAY;
    var to = [], u = q.userOfStudent(s.id); if (u) to.push(u.id); q.parentsOf(s.id).forEach(function (p) { to.push(p.id); });
    KMK.notify(to, { title: 'Rappel de paiement', body: i.label + ' · ' + fmt.money(i.amount) + ' avant le ' + fmt.date(i.due), icon: 'wallet', tone: 'amber', route: 'finances' });
    KMK.log('finance.remind', 'Relance ' + s.name + ' — ' + i.label);
    KMK.commit('Relance envoyée à ' + esc(s.name) + (to.length ? ' (notification reçue dans son espace)' : ' (SMS + e-mail)'));
  };
  A['mark-paid'] = function (b) {
    var i = db().invoices.filter(function (x) { return x.id === b.dataset.id; })[0], s = q.student(i.studentId);
    ui.modal({ title: 'Enregistrer un paiement', sub: esc(s.name) + ' · ' + esc(i.label) + ' · ' + fmt.money(i.amount),
      body: '<div class="row2"><div class="field"><label for="mpM">Moyen</label><select class="select" id="mpM"><option>Virement</option><option>Chèque</option><option>Espèces</option><option>Carte bancaire (guichet)</option></select></div><div class="field"><label for="mpD">Date</label><input class="input" type="date" id="mpD" value="' + TODAY + '"></div></div>' +
        '<div class="field"><label for="mpR">Référence / n° de chèque</label><input class="input" id="mpR" placeholder="facultatif"></div>',
      foot: '<button class="btn ghost" data-act="close-modal">Annuler</button><button class="btn success" id="mpOk">' + icon('check', 15) + 'Enregistrer</button>',
      onMount: function (m) {
        $('#mpOk', m).addEventListener('click', function () {
          i.paidAt = $('#mpD', m).value || TODAY; i.method = $('#mpM', m).value; i.ref = $('#mpR', m).value.trim() || 'GUI-' + Math.random().toString(36).slice(2, 7).toUpperCase();
          var cf = db().cashflow; cf[cf.length - 1].v = Math.round((cf[cf.length - 1].v + i.amount / 1000) * 10) / 10;
          var to = [], u = q.userOfStudent(s.id); if (u) to.push(u.id); q.parentsOf(s.id).forEach(function (p) { to.push(p.id); });
          KMK.notify(to, { title: 'Paiement enregistré', body: i.label + ' · ' + fmt.money(i.amount) + ' (' + i.method + ')', icon: 'check-circle-2', tone: 'green', route: 'finances' });
          KMK.log('finance.manual_payment', s.name + ' — ' + i.label + ' (' + i.method + ')');
          ui.closeModal(true); KMK.commit('Paiement de ' + fmt.money(i.amount) + ' enregistré');
        });
      } });
  };

  KMK.part('tableau-de-bord', ['finance'], {
    label: 'Tableau de bord', icon: 'layout-dashboard',
    sub: function () { return 'Service financier · ' + fmt.long(TODAY); },
    render: function (c) {
      var d = db(), l = late(), cf = d.cashflow;
      var soon = d.invoices.filter(function (i) { return !i.paidAt && q.invoiceStatus(i) === 'a_payer'; });
      var recent = d.invoices.filter(function (i) { return i.paidAt; }).sort(function (a, b) { return (a.paidAt + (a.ref || '')) < (b.paidAt + (b.ref || '')) ? 1 : -1; }).slice(0, 5);
      return '<div class="welcome"><div><h2>Bonjour ' + esc(c.me.name.split(' ')[0]) + '</h2><p>' + l.length + ' échéance(s) en retard (' + fmt.money(sum(l)) + '), ' + soon.length + ' à échoir sous 30 jours. Les relances J-7, J-3, J, J+3 partent automatiquement.</p></div>' +
        '<div class="acts"><button class="btn white" data-act="remind-all">' + icon('send', 15) + 'Relancer tous les retards</button><button class="btn ghost" data-go="echeances">' + icon('wallet', 15) + 'Échéancier</button></div></div>' +
        '<div class="grid g4">' + H.kpi({ icon: 'trending-up', label: 'Encaissé en septembre', value: fmt.num(cf[cf.length - 1].v, 1) + ' k€', delta: '+' + fmt.num((cf[cf.length - 1].v / cf[cf.length - 2].v - 1) * 100, 1) + ' % vs août', tone: 'good', go: 'encaissements' }) +
        H.kpi({ icon: 'alert-triangle', label: 'En retard', value: fmt.money(sum(l)), delta: l.length + ' échéance(s)', tone: 'bad', go: 'echeances?f=retard' }) +
        H.kpi({ icon: 'calendar-clock', label: 'À échoir (30 j)', value: fmt.money(sum(soon)), delta: soon.length + ' échéance(s)', go: 'echeances?f=a_payer' }) +
        H.kpi({ icon: 'percent', label: 'Recouvrement', value: Math.round(cashTotal() / 1550 * 100) + ' %', delta: 'objectif 92 %' }) + '</div>' +
        '<div class="grid g21 mt">' + H.card('Retards à traiter', '<button class="lk" data-go="echeances?f=retard">Tout voir</button>', l.length ? '<div class="list">' + l.map(function (i) { var s = q.student(i.studentId);
          return '<div class="li">' + H.av(s.initials, '#D64545') + '<div class="tx"><div class="tt">' + esc(s.name) + ' · ' + fmt.money(i.amount) + '</div><div class="ss">' + esc(i.label) + ' · J+' + U.daysBetween(i.due, TODAY) + ' · ' + (i.reminders || 0) + ' relance(s)</div></div><button class="btn ghost sm" data-act="remind" data-id="' + i.id + '">' + icon('send', 13) + 'Relancer</button></div>'; }).join('') + '</div>' : H.empty('check-circle-2', 'Aucun retard', '')) +
        H.card('Prédiction du risque d’impayé', H.pill('KMK AI', 'soft', 'sparkles'), '<div class="list">' + [['s-sarah', 82], ['s-omar', 64], ['s-yanis', 47], ['s-samir', 31]].map(function (p) { var s = q.student(p[0]); return '<div class="li click" data-act="open-student" data-sid="' + s.id + '" role="button" tabindex="0">' + H.av(s.initials) + '<div class="tx"><div class="tt">' + esc(s.name) + '</div><div class="bar" style="margin-top:6px"><i style="width:' + p[1] + '%;background:' + (p[1] > 60 ? 'var(--red)' : 'var(--amber)') + '"></i></div></div><b class="vv">' + p[1] + ' %</b></div>'; }).join('') + '</div>') + '</div>' +
        '<div class="grid g21 mt">' + H.card('Encaissements mensuels', '<span class="m sp">k€</span>', '<div class="pad">' + H.bars(cf.map(function (m, k) { return { l: m.m, v: m.v, on: k === cf.length - 1, tip: fmt.num(m.v, 1) + ' k€' }; })) + '</div>') +
        H.card('Derniers paiements', '<button class="lk" data-go="encaissements">Journal</button>', '<div class="list">' + recent.map(function (i) { var s = q.student(i.studentId); return H.li({ icon: 'check-circle-2', tone: 'green', title: esc(s.name) + ' · ' + fmt.money(i.amount), sub: esc(i.label) + ' · ' + esc(i.method) + ' · ' + fmt.date(i.paidAt) }); }).join('') + '</div>') + '</div>';
    }
  });

  KMK.route('echeances', {
    label: 'Échéances', icon: 'wallet', roles: ['finance'],
    sub: function () { return 'Échéancier de tous les étudiants · relances et paiements au guichet'; },
    badge: function () { return late().length; },
    render: function (c) {
      var f = c.params.f || '', sq = (c.params.q || '').toLowerCase();
      var all = db().invoices.slice().sort(function (a, b) { return a.due < b.due ? -1 : 1; });
      var list = all.filter(function (i) { var s = q.student(i.studentId); return (!f || q.invoiceStatus(i) === f) && (!sq || s.name.toLowerCase().indexOf(sq) >= 0); });
      var cnt = function (st) { return all.filter(function (i) { return q.invoiceStatus(i) === st; }).length; };
      return '<div class="toolbar"><div class="seg" style="flex-wrap:wrap">' + [['', 'Toutes', all.length], ['retard', 'En retard', cnt('retard')], ['a_payer', 'À payer', cnt('a_payer')], ['a_venir', 'À venir', cnt('a_venir')], ['paye', 'Réglées', cnt('paye')]].map(function (t) {
          return '<button class="' + (f === t[0] ? 'on' : '') + '" data-go="echeances' + (t[0] ? '?f=' + t[0] : '') + '">' + t[1] + ' (' + t[2] + ')</button>'; }).join('') + '</div>' +
        '<div class="inwrap">' + icon('search', 16) + '<input class="input" id="eq" placeholder="Étudiant…" value="' + esc(c.params.q || '') + '"></div>' +
        (cnt('retard') ? '<button class="btn sp" data-act="remind-all">' + icon('send', 15) + 'Relancer les ' + cnt('retard') + ' retards</button>' : '') + '</div>' +
        '<div class="card"><div class="tbl-wrap"><table><thead><tr><th>Étudiant</th><th>Objet</th><th>Échéance</th><th class="tar">Montant</th><th>Statut</th><th>Relances</th><th></th></tr></thead><tbody>' +
        list.map(function (i) { var s = q.student(i.studentId), st = q.invoiceStatus(i);
          return '<tr><td><button type="button" class="who" style="background:none;border:0;padding:0;text-align:left" data-act="open-student" data-sid="' + s.id + '">' + H.av(s.initials) + '<div><div class="n">' + esc(s.name) + '</div><div class="s">' + esc(s.level + ' ' + s.formation.replace('Licence ', '')) + '</div></div></button></td>' +
            '<td>' + esc(i.label) + '</td><td>' + fmt.date(i.due) + (st === 'retard' ? '<div class="sub" style="color:var(--red)">J+' + U.daysBetween(i.due, TODAY) + '</div>' : '') + '</td><td class="tar"><b>' + fmt.money(i.amount) + '</b></td><td>' + H.invPill(i) + (i.paidAt ? '<div class="sub">' + esc(i.method) + '</div>' : '') + '</td>' +
            '<td class="mu">' + (i.reminders || 0) + (i.lastReminder === TODAY ? ' · aujourd’hui' : '') + '</td>' +
            '<td class="tar nowrap">' + (i.paidAt ? '<button class="act" data-act="receipt" data-id="' + i.id + '">' + icon('download', 13) + 'Reçu</button>' : '<span class="hstack" style="justify-content:flex-end;gap:6px"><button class="act" data-act="remind" data-id="' + i.id + '">' + icon('send', 13) + 'Relancer</button><button class="act" data-act="mark-paid" data-id="' + i.id + '">' + icon('check', 13) + 'Encaisser</button></span>') + '</td></tr>'; }).join('') +
        '</tbody></table></div>' + (list.length ? '' : H.empty('search', 'Aucune échéance', '')) + '</div>';
    },
    mount: function (el, c) {
      var t; $('#eq', el).addEventListener('input', function () { clearTimeout(t); var v = this.value.trim(); t = setTimeout(function () { var p = {}; if (c.params.f) p.f = c.params.f; if (v) p.q = v; KMK.replaceParams('echeances', p); }, 300); });
    }
  });

  /* ---------------------------------------------------------
     Rapports et exports (direction, finance)
     --------------------------------------------------------- */
  var REPORTS = {
    direction: [['formations', 'Résultats par formation', 'Effectifs, assiduité, moyennes, réussite', 'bar-chart-3'], ['risk', 'Early Warning', 'Étudiants à risque et plans d’action', 'alert-triangle'], ['students', 'Annuaire étudiants', 'Formation, moyenne, assiduité, risque', 'graduation-cap'], ['late', 'Impayés', 'Échéances en retard et relances', 'wallet'], ['audit', 'Journal d’audit', 'Toutes les actions tracées', 'history']],
    finance: [['late', 'Impayés', 'Échéances en retard et relances', 'wallet'], ['payments', 'Paiements (export comptable)', 'Journal des encaissements', 'credit-card'], ['schedule', 'Échéancier complet', 'Toutes les échéances de l’année', 'calendar-clock'], ['students', 'Situation par étudiant', 'Reste dû et retards', 'graduation-cap']]
  };
  function reportRows(k) {
    var d = db();
    if (k === 'formations') return [['Formation', 'Effectif', 'Assiduité %', 'Moyenne', 'Réussite %', 'Avancement %']].concat(FORMATIONS.map(function (f) { return [f.name, f.n, f.att, fmt.num(f.avg), f.ok, f.prog]; }));
    if (k === 'risk') return [['Étudiant', 'Formation', 'Score', 'Signal', 'Plan d’action']].concat(atRisk(30).map(function (s) { return [s.name, s.formation, s.risk, s.signal, (s.ewPlan || []).join(' + ')]; }));
    if (k === 'students') return [['Étudiant', 'Formation', 'Groupe', 'Moyenne', 'Assiduité %', 'Risque', 'Reste dû €']].concat(d.students.map(function (s) { return [s.name, s.formation, s.group, fmt.num(q.studentAvg(s.id)), s.att, s.risk, sum(d.invoices.filter(function (i) { return i.studentId === s.id && !i.paidAt; }))]; }));
    if (k === 'late') return [['Étudiant', 'Objet', 'Échéance', 'Montant €', 'Jours de retard', 'Relances']].concat(late().map(function (i) { return [q.student(i.studentId).name, i.label, i.due, i.amount, U.daysBetween(i.due, TODAY), i.reminders || 0]; }));
    if (k === 'payments') return [['Date', 'Étudiant', 'Objet', 'Moyen', 'Montant €', 'Référence']].concat(d.invoices.filter(function (i) { return i.paidAt; }).map(function (i) { return [i.paidAt, q.student(i.studentId).name, i.label, i.method, i.amount, i.ref || '']; }));
    if (k === 'schedule') return [['Étudiant', 'Objet', 'Échéance', 'Montant €', 'Statut']].concat(d.invoices.map(function (i) { return [q.student(i.studentId).name, i.label, i.due, i.amount, q.invoiceStatus(i)]; }));
    return [['Horodatage', 'Compte', 'Action', 'Détail']].concat(d.audit.map(function (a) { var u = q.user(a.userId); return [a.at, u ? u.name : 'Système', a.action, a.detail]; }));
  }
  KMK.part('rapports', ['direction', 'finance'], {
    label: 'Rapports', icon: 'sheet',
    sub: function () { return 'Exports CSV (Excel, séparateur ;) générés à partir des données en direct'; },
    render: function (c) {
      return '<div class="grid g3">' + REPORTS[c.role].map(function (r) {
        var n = reportRows(r[0]).length - 1;
        return '<div class="card pad" style="display:flex;flex-direction:column;gap:12px"><span class="ico" style="width:42px;height:42px;border-radius:12px;display:flex;align-items:center;justify-content:center;background:var(--soft);color:var(--g700)">' + icon(r[3], 19) + '</span>' +
          '<div><div class="b" style="font-size:14px">' + r[1] + '</div><div class="m">' + r[2] + ' · ' + n + ' ligne(s)</div></div><div class="hstack" style="margin-top:auto"><button class="btn sm" data-act="report" data-k="' + r[0] + '" data-n="' + esc(r[1]) + '">' + icon('download', 13) + 'CSV</button><button class="act" data-act="report-view" data-k="' + r[0] + '" data-n="' + esc(r[1]) + '">' + icon('eye', 13) + 'Aperçu</button></div></div>'; }).join('') +
        (c.role === 'direction' ? '<div class="card pad" style="display:flex;flex-direction:column;gap:12px;background:var(--g900);color:#fff;border-color:var(--g900)"><span class="ico" style="width:42px;height:42px;border-radius:12px;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,.12);color:var(--leaf)">' + icon('file-text', 19) + '</span><div><div class="b" style="font-size:14px">Rapport mensuel de direction</div><div style="color:#C3D6F7;font-size:11.5px">Synthèse imprimable : KPI, formations, finances, recommandations IA</div></div><div style="margin-top:auto"><button class="btn sm" style="background:var(--leaf);color:var(--g900)" data-act="monthly-report">' + icon('printer', 13) + 'Générer</button></div></div>' : '') + '</div>';
    }
  });
  A.report = function (b) { U.download('kmk-' + b.dataset.k + '-' + TODAY + '.csv', U.csv(reportRows(b.dataset.k)), 'text/csv;charset=utf-8'); KMK.log('report.export', 'Export « ' + b.dataset.n + ' »'); KMK.commit('Export « ' + esc(b.dataset.n) + ' » téléchargé'); };
  A['report-view'] = function (b) {
    var rows = reportRows(b.dataset.k);
    ui.modal({ title: esc(b.dataset.n), sub: (rows.length - 1) + ' ligne(s) · aperçu des 12 premières', wide: true,
      body: '<div class="tbl-wrap card"><table><thead><tr>' + rows[0].map(function (h) { return '<th>' + esc(h) + '</th>'; }).join('') + '</tr></thead><tbody>' + rows.slice(1, 13).map(function (r) { return '<tr>' + r.map(function (v) { return '<td>' + esc(v) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>',
      foot: '<button class="btn ghost" data-act="close-modal">Fermer</button><button class="btn" data-act="report" data-k="' + b.dataset.k + '" data-n="' + esc(b.dataset.n) + '">' + icon('download', 15) + 'Télécharger le CSV</button>' });
  };

  KMK.commands.direction = [
    { ic: 'sparkles', t: 'Comment va mon campus ?', run: function () { ui.navigate('ia', { q: 'Comment va mon campus aujourd’hui ?' }); } },
    { ic: 'file-text', t: 'Rapport mensuel de direction', run: function () { A['monthly-report'](); } }
  ];
  KMK.commands.finance = [
    { ic: 'send', t: 'Relancer tous les retards', run: function () { KMK.remindAll(); } },
    { ic: 'download', t: 'Export comptable', run: function () { A['export-payments'](); } }
  ];
})();
