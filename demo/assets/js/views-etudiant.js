/* =========================================================
   KMK Campus — espaces étudiant et parent
   ========================================================= */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var U = KMK.util, esc = U.esc, fmt = KMK.fmt, q = KMK.q, H = KMK.H, ui = KMK.ui, A = KMK.actions;
  var TODAY = window.KMK_DEMO_TODAY;
  function db() { return KMK.db(); }
  function ctx() { return KMK.ctx(); }
  var SP = ['etudiant', 'parent'];

  /* ---------------------------------------------------------
     Outils partagés : calendrier, fichiers, .ics
     --------------------------------------------------------- */
  var WEEK0 = '2026-09-07';
  function weekStart(w) { return U.addDays(WEEK0, 7 * (w || 0)); }
  function toMin(t) { var p = t.split(':'); return +p[0] * 60 + +p[1]; }
  function nowMin() { var d = new Date(); return d.getHours() * 60 + d.getMinutes(); }
  function sessColor(s) { return s.type === 'examen' ? '#E0912A' : (KMK_MODULES[s.module] || {}).color || '#2E8BFF'; }

  KMK.calendar = function (sessions, w) {
    var start = weekStart(w), days = [0, 1, 2, 3, 4, 5].map(function (i) { return U.addDays(start, i); });
    var hdr = '<div class="cal-hdr"><div></div>' + days.map(function (d) {
      return '<div class="dh' + (d === TODAY ? ' today' : '') + '"><b>' + fmt.day(d).replace(/^./, function (x) { return x.toUpperCase(); }) + '</b><span>' + U.parse(d).getDate() + '</span></div>'; }).join('') + '</div>';
    var hrs = '<div class="hrs">' + [8, 9, 10, 11, 12, 13, 14, 15, 16, 17].map(function (h) { return '<div class="hr">' + h + ':00</div>'; }).join('') + '</div>';
    var cols = days.map(function (d) {
      return '<div class="col">' + sessions.filter(function (s) { return s.date === d; }).map(function (s) {
        var top = (toMin(s.start) - 480) / 60 * 58, h = Math.max(26, (toMin(s.end) - toMin(s.start)) / 60 * 58 - 4);
        return '<button type="button" class="ev' + (s.cancelled ? ' cancel' : '') + '" data-act="session" data-id="' + s.id + '" style="top:' + top + 'px;height:' + h + 'px;background:' + sessColor(s) + '" aria-label="' + esc(s.title + ', ' + fmt.long(s.date) + ' ' + s.start) + '">' +
          '<b>' + esc(s.title) + '</b><span>' + esc(s.room) + ' · ' + s.start + ' – ' + s.end + '</span></button>';
      }).join('') + '</div>';
    }).join('');
    return '<div class="cal-wrap">' + hdr + '<div class="cal">' + hrs + cols + '</div></div>';
  };
  function ics(s) {
    var d = s.date.replace(/-/g, '');
    return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//KMK Campus//Demo//FR', 'BEGIN:VEVENT', 'UID:' + s.id + '@kmk-campus.fr', 'DTSTAMP:' + d + 'T070000Z',
      'DTSTART:' + d + 'T' + s.start.replace(':', '') + '00', 'DTEND:' + d + 'T' + s.end.replace(':', '') + '00', 'SUMMARY:' + s.title, 'LOCATION:' + s.room + ' — KMK Campus', 'DESCRIPTION:' + (s.teacher || ''), 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
  }
  A.session = function (el) {
    var s = db().sessions.filter(function (x) { return x.id === el.dataset.id; })[0]; if (!s) return;
    var c = ctx(), mine = s.teacherId === c.me.id, isToday = s.date === TODAY;
    var att = db().attendance.filter(function (a) { return a.sessionId === s.id; })[0];
    ui.modal({
      title: esc(s.title), sub: fmt.long(s.date) + ' · ' + s.start + ' – ' + s.end,
      body: (s.cancelled ? '<div class="alert err">' + icon('x-circle', 17) + '<div><b>Séance annulée.</b> Les étudiants concernés ont été notifiés.</div></div>' : '') +
        (s.changed ? '<div class="alert warn">' + icon('refresh-cw', 17) + '<div><b>Changement :</b> ' + esc(s.changed) + '</div></div>' : '') +
        '<dl class="kv"><dt>Module</dt><dd>' + esc((KMK_MODULES[s.module] || {}).name || '') + '</dd><dt>Type</dt><dd>' + esc({ cours: 'Cours', tp: 'Travaux pratiques', examen: 'Examen', reunion: 'Réunion / tutorat' }[s.type]) + '</dd>' +
        '<dt>Salle</dt><dd>' + esc(s.room) + '</dd><dt>Intervenant</dt><dd>' + esc(s.teacher) + '</dd><dt>Groupe(s)</dt><dd>' + esc(s.groups.join(', ')) + '</dd>' +
        (mine ? '<dt>Appel</dt><dd>' + (att ? 'réalisé ' + fmt.rel(att.takenAt) : 'non réalisé') + '</dd>' : '') + '</dl>',
      foot: '<button class="btn ghost" id="sIcs">' + icon('calendar-check', 15) + 'Ajouter à mon agenda</button>' +
        (mine && isToday && !att ? '<button class="btn" data-go="appel?s=' + s.id + '">' + icon('user-check', 15) + 'Faire l’appel</button>' : '<button class="btn" data-act="close-modal">Fermer</button>'),
      onMount: function (m) { $('#sIcs', m).addEventListener('click', function () { U.download('kmk-' + s.id + '.ics', ics(s), 'text/calendar;charset=utf-8'); ui.toast('Fichier agenda (.ics) téléchargé'); }); }
    });
  };

  /* zone de dépôt de fichier réutilisable */
  KMK.dropzone = function (box, accept) {
    var file = null;
    box.innerHTML = '<label class="drop" tabindex="0">' + icon('upload', 22) + '<span><b>Choisir un fichier</b> ou glisser-déposer ici</span><span style="font-size:11px">PDF, JPG ou PNG · 5 Mo maximum</span><input type="file" accept="' + (accept || '.pdf,.jpg,.jpeg,.png') + '" hidden></label><div class="fchip"></div>';
    var drop = $('.drop', box), input = $('input', box), chip = $('.fchip', box);
    function set(f) {
      if (f && f.size > 5 * 1024 * 1024) { ui.toast('Fichier trop volumineux (5 Mo maximum)', 'err'); return; }
      if (f && !/\.(pdf|jpe?g|png)$/i.test(f.name)) { ui.toast('Format non accepté : PDF, JPG ou PNG', 'err'); return; }
      file = f ? { name: f.name, size: f.size } : null;
      chip.innerHTML = file ? '<div class="filechip">' + icon('paperclip', 15) + '<span>' + esc(file.name) + ' · ' + Math.max(1, Math.round(file.size / 1024)) + ' Ko</span><button type="button" class="x" aria-label="Retirer">' + icon('x', 14) + '</button></div>' : '';
      drop.hidden = !!file;
      var x = $('.x', chip); if (x) x.addEventListener('click', function () { input.value = ''; set(null); });
    }
    input.addEventListener('change', function () { set(input.files[0]); });
    drop.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.click(); } });
    ['dragenter', 'dragover'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add('over'); }); });
    ['dragleave', 'drop'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove('over'); }); });
    drop.addEventListener('drop', function (e) { if (e.dataTransfer.files[0]) set(e.dataTransfer.files[0]); });
    return { get: function () { return file; } };
  };

  /* ---------------------------------------------------------
     Demandes : création (partagé avec KMK AI)
     --------------------------------------------------------- */
  KMK.createRequest = function (sid, type, details, by, file) {
    var d = db(), s = q.student(sid);
    d.requestSeq = (d.requestSeq || 118) + 1;
    var now = U.nowISO();
    var r = { id: U.uid('r'), ref: 'DEM-2026-' + d.requestSeq, studentId: sid, type: type, details: details || '', stage: 0, createdAt: now, history: [{ stage: 0, at: now, by: by || s.name }], demo: true, file: file || null };
    d.requests.unshift(r);
    KMK.notify(['u-scol'], { title: 'Nouvelle demande — ' + KMK.typeLabel(type), body: s.name + ' · ' + r.ref, icon: 'inbox', tone: 'blue', route: 'demandes?r=' + r.id });
    KMK.log('request.create', r.ref + ' — ' + KMK.typeLabel(type) + (by === 'KMK AI' ? ' (via KMK AI)' : ''));
    KMK.flag('reqCreated');
    KMK.store.save();
    return r;
  };
  KMK.newRequest = function (pre) {
    var c = ctx();
    var types = KMK_REQUEST_TYPES.map(function (t, k) {
      return '<label class="acct" style="cursor:pointer"><input type="radio" name="rt" value="' + t.id + '"' + ((pre ? t.id === pre : k === 0) ? ' checked' : '') + ' class="sr-only">' +
        '<span class="av">' + icon(t.icon, 16) + '</span><span><span class="n">' + esc(t.label) + '</span><span class="s">Délai ' + esc(t.sla) + (t.doc ? ' · PDF signé' : '') + '</span></span></label>';
    }).join('');
    ui.modal({
      title: 'Nouvelle demande', sub: 'Déposée en ligne, suivie en temps réel', wide: true,
      body: '<div class="flabel" style="margin-bottom:8px">Type de demande</div><div class="accts" id="rtGrid" style="margin-bottom:16px">' + types + '</div>' +
        '<div class="field"><label for="rDet">Précisions <span class="m" id="rDetHint">(facultatif)</span></label><textarea class="textarea" id="rDet" maxlength="500" placeholder="Ex. : pour mon dossier de logement CROUS"></textarea></div>' +
        '<div class="field"><span class="flabel">Pièce jointe <span class="m">(facultatif)</span></span><div id="rFile"></div></div>' +
        '<div class="hintx" id="rAi"></div>',
      foot: '<button class="btn ghost" data-act="close-modal">Annuler</button><button class="btn" id="rOk">' + icon('send', 15) + 'Déposer la demande</button>',
      onMount: function (m) {
        var dz = KMK.dropzone($('#rFile', m));
        function sel() { return ($('input[name=rt]:checked', m) || {}).value; }
        function upd() {
          var t = KMK_REQUEST_TYPES.filter(function (x) { return x.id === sel(); })[0];
          $$('#rtGrid .acct', m).forEach(function (a) { a.classList.toggle('on', $('input', a).checked); });
          var need = t.id === 'reclam' || t.id === 'adresse';
          $('#rDetHint', m).textContent = need ? '(obligatoire)' : '(facultatif)';
          $('#rAi', m).innerHTML = icon('sparkles', 14) + ' <b>KMK AI :</b> ' + (t.doc ? 'document généré et signé électroniquement dès validation, délai estimé ' + t.sla + '.' : t.id === 'adresse' ? 'un justificatif de domicile de moins de 3 mois sera demandé.' : t.id === 'reclam' ? 'votre réclamation sera transmise au formateur concerné et au responsable pédagogique.' : 'traitement par la scolarité sous ' + t.sla + '.');
        }
        $$('input[name=rt]', m).forEach(function (i) { i.addEventListener('change', upd); }); upd();
        $('#rOk', m).addEventListener('click', function () {
          var t = sel(), det = $('#rDet', m).value.trim();
          if ((t === 'reclam' || t === 'adresse') && det.length < 5) { ui.toast('Précisez votre demande', 'err'); $('#rDet', m).focus(); return; }
          var f = dz.get();
          var r = KMK.createRequest(c.sid, t, det, c.me.name, f ? f.name : null);
          ui.closeModal(true);
          if (location.hash.indexOf('#/demandes') === 0) KMK.commit(); else ui.navigate('demandes');
          ui.toast('Demande ' + r.ref + ' déposée — la scolarité est notifiée');
        });
      }
    });
  };
  A['new-request'] = function (el) { KMK.newRequest(el.dataset.type); };

  /* ---------------------------------------------------------
     Paiement en ligne (étudiant et parent)
     --------------------------------------------------------- */
  function luhn(n) { var s = 0, alt = false; for (var i = n.length - 1; i >= 0; i--) { var d = +n[i]; if (alt) { d *= 2; if (d > 9) d -= 9; } s += d; alt = !alt; } return s % 10 === 0; }
  KMK.payInvoice = function (id) {
    var c = ctx(), inv = db().invoices.filter(function (i) { return i.id === id; })[0];
    if (!inv || inv.paidAt) return;
    var s = q.student(inv.studentId);
    ui.modal({
      title: 'Paiement sécurisé', sub: esc(inv.label) + ' · ' + esc(s.name),
      body: '<div class="card pad" style="background:var(--bg);margin-bottom:16px"><div class="hstack"><div><div class="m">Montant à régler</div><div style="font-size:26px;font-weight:700">' + fmt.money(inv.amount) + '</div></div><div class="sp tar"><div class="m">Échéance</div><b>' + fmt.long(inv.due) + '</b></div></div></div>' +
        '<div class="seg" id="pm" style="margin-bottom:16px"><button type="button" class="on" data-m="card">' + icon('credit-card', 14) + ' Carte bancaire</button><button type="button" data-m="sepa">' + icon('building-2', 14) + ' Prélèvement SEPA</button></div>' +
        '<div id="pCard"><div class="field"><label for="cName">Titulaire de la carte</label><input class="input" id="cName" autocomplete="cc-name" value="' + esc(c.me.name) + '"></div>' +
        '<div class="field"><label for="cNum">Numéro de carte</label><div class="inwrap">' + icon('credit-card', 17) + '<input class="input" id="cNum" inputmode="numeric" autocomplete="cc-number" placeholder="4242 4242 4242 4242" maxlength="19"><span class="m" id="cBrand" style="position:absolute;right:12px"></span></div></div>' +
        '<div class="row2"><div class="field"><label for="cExp">Expiration</label><input class="input" id="cExp" placeholder="MM/AA" inputmode="numeric" autocomplete="cc-exp" maxlength="5"></div>' +
        '<div class="field"><label for="cCvc">Cryptogramme</label><input class="input" id="cCvc" placeholder="123" inputmode="numeric" autocomplete="cc-csc" maxlength="4"></div></div>' +
        '<div class="cred">' + icon('info', 15) + '<span>Carte de test acceptée : <code>4242 4242 4242 4242</code>, refusée : <code>4000 0000 0000 0002</code>. Date future et cryptogramme quelconques.</span></div></div>' +
        '<div id="pSepa" hidden><div class="field"><label for="iban">IBAN</label><input class="input" id="iban" placeholder="FR76 3000 6000 0112 3456 7890 189" autocomplete="off"></div>' +
        '<label class="check"><input type="checkbox" id="mand"> J’autorise KMK Campus à prélever ce montant (mandat SEPA).</label></div>' +
        '<div id="pErr" style="margin-top:14px"></div>',
      foot: '<span class="m" style="margin-right:auto;display:flex;gap:6px;align-items:center">' + icon('lock', 14) + 'Paiement chiffré · 3-D Secure</span><button class="btn ghost" data-act="close-modal">Annuler</button><button class="btn success" id="pOk">' + icon('lock', 15) + 'Payer ' + fmt.money(inv.amount) + '</button>',
      onMount: function (m) {
        var mode = 'card';
        $$('#pm button', m).forEach(function (b) { b.addEventListener('click', function () { mode = b.dataset.m; $$('#pm button', m).forEach(function (x) { x.classList.toggle('on', x === b); }); $('#pCard', m).hidden = mode !== 'card'; $('#pSepa', m).hidden = mode !== 'sepa'; $('#pErr', m).innerHTML = ''; }); });
        $('#cNum', m).addEventListener('input', function () {
          var d = this.value.replace(/\D/g, '').slice(0, 16); this.value = d.replace(/(.{4})/g, '$1 ').trim();
          $('#cBrand', m).textContent = /^4/.test(d) ? 'VISA' : /^5[1-5]/.test(d) ? 'MASTERCARD' : /^3[47]/.test(d) ? 'AMEX' : '';
        });
        $('#cExp', m).addEventListener('input', function () { var d = this.value.replace(/\D/g, '').slice(0, 4); this.value = d.length > 2 ? d.slice(0, 2) + '/' + d.slice(2) : d; });
        $('#cCvc', m).addEventListener('input', function () { this.value = this.value.replace(/\D/g, ''); });
        $('#iban', m).addEventListener('input', function () { var v = this.value.replace(/\s/g, '').toUpperCase().slice(0, 34); this.value = v.replace(/(.{4})/g, '$1 ').trim(); });
        function err(msg) { $('#pErr', m).innerHTML = '<div class="alert err">' + icon('alert-triangle', 17) + '<div>' + msg + '</div></div>'; }
        $('#pOk', m).addEventListener('click', function () {
          var btn = this, method, num = '';
          if (mode === 'card') {
            num = $('#cNum', m).value.replace(/\s/g, '');
            var exp = $('#cExp', m).value, cvc = $('#cCvc', m).value;
            if (!$('#cName', m).value.trim()) return err('Indiquez le titulaire de la carte.');
            if (num.length < 15 || !luhn(num)) return err('Numéro de carte invalide.');
            var em = /^(\d{2})\/(\d{2})$/.exec(exp);
            if (!em || +em[1] < 1 || +em[1] > 12) return err('Date d’expiration invalide (MM/AA).');
            if (+em[2] < 26 || (+em[2] === 26 && +em[1] < 9)) return err('Cette carte est expirée.');
            if (!/^\d{3,4}$/.test(cvc)) return err('Cryptogramme invalide.');
            method = 'Carte bancaire';
          } else {
            var iban = $('#iban', m).value.replace(/\s/g, '');
            if (!/^FR\d{2}[0-9A-Z]{23}$/.test(iban)) return err('IBAN français invalide (27 caractères commençant par FR).');
            if (!$('#mand', m).checked) return err('Cochez l’autorisation de prélèvement.');
            method = 'Prélèvement SEPA';
          }
          btn.disabled = true; btn.innerHTML = '<span class="spin"></span>' + (mode === 'card' ? 'Authentification 3-D Secure…' : 'Signature du mandat…');
          setTimeout(function () {
            if (num === '4000000000000002') {
              btn.disabled = false; btn.innerHTML = icon('lock', 15) + 'Payer ' + fmt.money(inv.amount);
              KMK.log('payment.declined', 'Paiement refusé — ' + inv.label); KMK.store.save();
              return err('<b>Paiement refusé</b> par la banque émettrice (fonds insuffisants). Aucun montant n’a été débité.');
            }
            inv.paidAt = TODAY; inv.method = method; inv.ref = 'PAY-' + Math.random().toString(36).slice(2, 8).toUpperCase(); inv.paidBy = c.me.id;
            var cf = db().cashflow; cf[cf.length - 1].v = Math.round((cf[cf.length - 1].v + inv.amount / 1000) * 10) / 10;
            var su = q.userOfStudent(s.id), to = [];
            if (su && su.id !== c.me.id) to.push(su.id);
            q.parentsOf(s.id).forEach(function (p) { if (p.id !== c.me.id) to.push(p.id); });
            KMK.notify(to, { title: 'Paiement reçu', body: inv.label + ' · ' + fmt.money(inv.amount) + ' réglé par ' + c.me.name, icon: 'wallet', tone: 'green', route: 'finances' });
            KMK.notify(['u-fin'], { title: 'Encaissement — ' + s.name, body: inv.label + ' · ' + fmt.money(inv.amount) + ' (' + method + ')', icon: 'wallet', tone: 'green', route: 'encaissements' });
            KMK.log('payment.success', inv.label + ' — ' + fmt.money(inv.amount) + ' (' + method + ', ' + inv.ref + ')');
            KMK.flag('paid');
            KMK.store.save();
            $('.mb2', m).innerHTML = '<div class="empty" style="padding:20px 10px"><span style="width:64px;height:64px;border-radius:50%;background:var(--greensoft);color:var(--green);display:flex;align-items:center;justify-content:center">' + icon('check', 32) + '</span>' +
              '<b style="font-size:18px">Paiement accepté</b><span>' + fmt.money(inv.amount) + ' · ' + esc(inv.label) + '<br>Référence <b>' + esc(inv.ref) + '</b> · reçu envoyé par e-mail</span></div>';
            $('.mf', m).innerHTML = '<button class="btn ghost" id="pRec">' + icon('download', 15) + 'Télécharger le reçu</button><button class="btn" data-act="close-modal">Terminer</button>';
            $('#pRec', m).addEventListener('click', function () { KMK.printDoc('recu', s.id, inv); });
            KMK.ui.refresh();
          }, 1300);
        });
      }
    });
  };
  A.pay = function (el) { KMK.payInvoice(el.dataset.id); };
  A.receipt = function (el) { var inv = db().invoices.filter(function (i) { return i.id === el.dataset.id; })[0]; KMK.printDoc('recu', inv.studentId, inv); };

  /* ---------------------------------------------------------
     Tableau de bord — étudiant
     --------------------------------------------------------- */
  function tasksFor(c) {
    var d = db(), out = [];
    var abs = d.absences.filter(function (a) { return a.studentId === c.sid && a.status === 'a_justifier'; });
    if (abs.length) out.push({ icon: 'paperclip', tone: 'amber', title: 'Justifier ' + abs.length + ' absence' + (abs.length > 1 ? 's' : ''), sub: 'Avant le ' + fmt.date(abs[0].deadline) + ' · ' + abs.map(function (a) { return KMK_MODULES[a.module].name; }).join(', '), go: 'absences' });
    d.invoices.filter(function (i) { return i.studentId === c.sid && !i.paidAt && U.daysBetween(TODAY, i.due) <= 10; }).forEach(function (i) {
      out.push({ icon: 'wallet', tone: q.invoiceStatus(i) === 'retard' ? 'red' : 'amber', title: 'Régler « ' + esc(i.label) + ' »', sub: fmt.money(i.amount) + ' avant le ' + fmt.date(i.due), act: 'pay', data: ' data-id="' + i.id + '"' });
    });
    d.requests.filter(function (r) { return r.studentId === c.sid && r.stage === 3 && !r.rejected; }).forEach(function (r) {
      out.push({ icon: 'download', tone: 'green', title: KMK.typeLabel(r.type) + ' prête', sub: r.ref + ' · document signé disponible', go: 'documents' });
    });
    var alumni = d.events.filter(function (e) { return e.id === 'e4'; })[0];
    if (c.role === 'etudiant' && alumni && alumni.attendees.indexOf(c.me.id) < 0) out.push({ icon: 'calendar-check', tone: 'blue', title: 'S’inscrire à la conférence Alumni', sub: 'Lundi 21/09 · ' + (alumni.capacity - alumni.base - alumni.attendees.length) + ' places restantes', go: 'evenements' });
    if (c.role === 'etudiant') out.push({ icon: 'book-open', tone: 'blue', title: 'Réviser l’examen d’Algorithmique', sub: 'Vendredi 11/09 · 13:00 · Amphi A', go: 'ia?q=' + encodeURIComponent('Résume le cours d’Algorithmique') });
    return out;
  }
  function todayCard(c) {
    var ss = db().sessions.filter(function (s) { return s.date === TODAY && s.groups.indexOf(c.stu.group) >= 0; }).sort(function (a, b) { return a.start < b.start ? -1 : 1; });
    var n = nowMin();
    var body = ss.length ? '<div class="list">' + ss.map(function (s) {
      var st = n >= toMin(s.end) ? H.pill('Terminé', 'grey') : n >= toMin(s.start) ? H.pill('En cours', 'green', 'activity') : H.pill('À venir', 'blue');
      return '<div class="li click" data-act="session" data-id="' + s.id + '" role="button" tabindex="0"><span class="ico" style="background:' + sessColor(s) + '1f;color:' + sessColor(s) + ';font-weight:700;font-size:11px;width:46px;flex:0 0 46px">' + s.start + '</span>' +
        '<div class="tx"><div class="tt">' + esc(s.title) + '</div><div class="ss">' + esc(s.room) + ' · ' + s.start + ' – ' + s.end + ' · ' + esc(s.teacher) + (s.changed ? ' · <b style="color:#B4700F">' + esc(s.changed) + '</b>' : '') + '</div></div>' + st + '</div>';
    }).join('') + '</div>' : H.empty('calendar', 'Pas de cours aujourd’hui', '');
    return H.card('Aujourd’hui · ' + fmt.long(TODAY), '<button class="lk" data-go="emploi-du-temps">Planning</button>', body);
  }
  function moduleChart(c) {
    var m = q.moduleAvgs(c.sid), promo = {};
    q.grades(c.sid).forEach(function (g) { (promo[g.module] = promo[g.module] || []).push(g.promo); });
    var items = Object.keys(KMK_MODULES).filter(function (k) { return m[k] != null; }).map(function (k) {
      var p = promo[k].reduce(function (a, b) { return a + b; }, 0) / promo[k].length;
      return { l: k === 'ANG' ? 'Anglais' : KMK_MODULES[k].name.split(' ')[0].replace('Mathématiques', 'Maths').replace('Algorithmique', 'Algo'), v: m[k], v2: p, on: true, tip: fmt.num(m[k]), tip2: 'promo ' + fmt.num(p) };
    });
    return H.card('Moyenne par module', '<div class="legend sp"><span><i style="background:var(--g500)"></i>' + (c.role === 'parent' ? esc(c.stu.name.split(' ')[0]) : 'Vous') + '</span><span><i style="background:#D9E2EF"></i>Promotion</span></div>', '<div class="pad">' + H.bars(items, 20) + '</div>');
  }
  function requestSteps(r) {
    if (r.rejected) return '<div class="alert err" style="margin:0">' + icon('x-circle', 16) + '<div>Refusée' + (r.note ? ' : ' + esc(r.note) : '') + '</div></div>';
    return '<div class="steps">' + KMK_STAGES.map(function (st, k) {
      return '<div class="stp' + (k < r.stage || r.stage === 4 ? ' done' : k === r.stage ? ' cur' : '') + '"><i>' + (k < r.stage || r.stage === 4 ? icon('check', 12) : '') + '</i>' + esc(st.label) + '</div>'; }).join('') + '</div>';
  }
  KMK.requestSteps = requestSteps;

  KMK.part('tableau-de-bord', ['etudiant'], {
    label: 'Tableau de bord', icon: 'layout-dashboard',
    sub: function (c) { return c.stu.formation + ' · ' + c.stu.level + ' — Groupe ' + c.stu.group + ' · année 2026-2027'; },
    render: function (c) {
      var d = db(), avg = q.studentAvg(c.sid);
      var absJ = d.absences.filter(function (a) { return a.studentId === c.sid && a.status === 'a_justifier'; }).length;
      var due = d.invoices.filter(function (i) { return i.studentId === c.sid && !i.paidAt; });
      var dueSum = due.reduce(function (t, i) { return t + i.amount; }, 0);
      var tasks = tasksFor(c);
      var ss = d.sessions.filter(function (s) { return s.date === TODAY && s.groups.indexOf(c.stu.group) >= 0; }).length;
      var reqs = d.requests.filter(function (r) { return r.studentId === c.sid; }).slice(0, 3);
      var notifs = KMK.notifs.forUser(c.me.id).slice(0, 4);
      return '<div class="welcome"><div><h2>Bonjour ' + esc(c.me.name.split(' ')[0]) + ' 👋</h2><p>' + fmt.long(TODAY).replace(/^./, function (x) { return x.toUpperCase(); }) + ' · ' + ss + ' cours aujourd’hui · ' + tasks.length + ' action(s) à traiter. KMK AI a préparé votre journée.</p></div>' +
        '<div class="acts"><button class="btn white" data-go="ia?q=' + encodeURIComponent('Que dois-je faire aujourd’hui ?') + '">' + icon('sparkles', 15) + 'Ma journée avec KMK AI</button><button class="btn ghost" data-act="new-request">' + icon('plus', 15) + 'Nouvelle demande</button></div></div>' +
        '<div class="grid g4">' +
        H.kpi({ icon: 'award', label: 'Moyenne générale', value: fmt.num(avg), delta: 'promotion : 12,8 · ' + (avg >= 12.8 ? '+' : '') + fmt.num(avg - 12.8) + ' pt', go: 'notes' }) +
        H.kpi({ icon: 'layers', label: 'Crédits acquis', value: c.stu.credits + ' / 60', delta: (60 - c.stu.credits) + ' crédits restants', go: 'notes' }) +
        H.kpi({ icon: 'user-check', label: 'Taux de présence', value: c.stu.att + ' %', delta: absJ ? absJ + ' absence(s) à justifier' : 'aucune absence en attente', tone: absJ ? 'warn' : 'good', go: 'absences' }) +
        H.kpi({ icon: 'wallet', label: 'Reste dû', value: fmt.money(dueSum), delta: due.length ? due.length + ' échéance(s) · prochaine le ' + fmt.date(due.sort(function (a, b) { return a.due < b.due ? -1 : 1; })[0].due) : 'à jour', tone: due.some(function (i) { return q.invoiceStatus(i) === 'retard'; }) ? 'bad' : '', go: 'finances' }) +
        '</div>' +
        '<div class="grid g21 mt">' + todayCard(c) +
        H.card('À faire', H.pill(tasks.length + '', tasks.length ? 'amber' : 'green'), tasks.length ? '<div class="list">' + tasks.map(function (t) { return H.li(Object.assign({ right: icon('chevron-right', 16) }, t)); }).join('') + '</div>' : H.empty('check-circle-2', 'Tout est à jour', 'Aucune action en attente.')) + '</div>' +
        '<div class="grid g21 mt">' + moduleChart(c) +
        H.card('Mes demandes', '<button class="lk" data-go="demandes">Tout voir</button>', reqs.length ? '<div class="list">' + reqs.map(function (r) {
          return '<div class="li" style="display:block"><div class="hstack"><div class="tx"><div class="tt">' + esc(KMK.typeLabel(r.type)) + '</div><div class="ss">' + esc(r.ref) + ' · ' + fmt.rel(r.createdAt) + '</div></div>' + H.stagePill(r) + '</div><div style="margin-top:10px">' + requestSteps(r) + '</div></div>'; }).join('') + '</div>' : H.empty('inbox', 'Aucune demande', '', '<button class="btn sm" data-act="new-request">Nouvelle demande</button>')) + '</div>' +
        '<div class="grid g2 mt">' +
        H.card('KMK AI vous suggère', H.pill('copilote', 'soft', 'sparkles'), '<div class="list">' +
          H.li({ icon: 'sparkles', title: '« Que dois-je faire aujourd’hui ? »', sub: 'Cours, absences et échéances priorisés', go: 'ia?q=' + encodeURIComponent('Que dois-je faire aujourd’hui ?'), right: icon('chevron-right', 16) }) +
          H.li({ icon: 'trending-down', tone: 'amber', title: '« Pourquoi je décroche en Algorithmique ? »', sub: 'Analyse des signaux et plan de révision', go: 'ia?q=' + encodeURIComponent('Risque en Algorithmique ?'), right: icon('chevron-right', 16) }) +
          H.li({ icon: 'file-text', tone: 'green', title: '« Réclame mon attestation »', sub: 'Demande créée et suivie automatiquement', go: 'ia?q=' + encodeURIComponent('Réclame mon attestation de scolarité'), right: icon('chevron-right', 16) }) + '</div>') +
        H.card('Dernières notifications', '<button class="lk" data-go="notifications">Tout voir</button>', '<div class="list">' + notifs.map(function (n) { return H.li({ icon: n.icon, tone: n.tone, title: esc(n.title), sub: esc(n.body) + ' · ' + fmt.rel(n.at), act: 'open-notif', data: ' data-id="' + n.id + '"' }); }).join('') + '</div>') +
        '</div>';
    }
  });

  /* ---------------------------------------------------------
     Tableau de bord — parent
     --------------------------------------------------------- */
  KMK.part('tableau-de-bord', ['parent'], {
    label: 'Tableau de bord', icon: 'layout-dashboard',
    sub: function (c) { return 'Suivi de ' + c.stu.name + ' · ' + c.stu.formation + ' ' + c.stu.level; },
    render: function (c) {
      var d = db(), avg = q.studentAvg(c.sid), first = c.stu.name.split(' ')[0];
      var abs = d.absences.filter(function (a) { return a.studentId === c.sid; });
      var absJ = abs.filter(function (a) { return a.status === 'a_justifier'; });
      var due = d.invoices.filter(function (i) { return i.studentId === c.sid && !i.paidAt; }).sort(function (a, b) { return a.due < b.due ? -1 : 1; });
      var grades = q.grades(c.sid).slice().sort(function (a, b) { return a.date < b.date ? 1 : -1; }).slice(0, 4);
      return '<div class="welcome"><div><h2>Bonjour ' + esc(c.me.name.split(' ')[0]) + '</h2><p>Voici la situation de ' + esc(first) + ' au ' + fmt.long(TODAY) + '. Chaque nouvelle note, absence ou échéance vous est notifiée en temps réel.</p></div>' +
        '<div class="acts"><button class="btn white" data-go="ia?q=' + encodeURIComponent('Comment va ' + first + ' ?') + '">' + icon('sparkles', 15) + 'Comment va ' + esc(first) + ' ?</button><button class="btn ghost" data-act="new-message" data-to="u-scol" data-subject="Question d’un parent">' + icon('message-square', 15) + 'Écrire à la scolarité</button></div></div>' +
        '<div class="grid g4">' +
        H.kpi({ icon: 'award', label: 'Moyenne de ' + first, value: fmt.num(avg), delta: 'promotion : 12,8', go: 'notes' }) +
        H.kpi({ icon: 'user-check', label: 'Assiduité', value: c.stu.att + ' %', delta: absJ.length ? absJ.length + ' absence(s) à justifier' : 'à jour', tone: absJ.length ? 'warn' : 'good', go: 'absences' }) +
        H.kpi({ icon: 'layers', label: 'Crédits validés', value: c.stu.credits + ' / 60', delta: 'rang ' + c.stu.rank + 'e / 68', go: 'notes' }) +
        H.kpi({ icon: 'wallet', label: 'Prochaine échéance', value: due.length ? fmt.money(due[0].amount) : '—', delta: due.length ? 'avant le ' + fmt.date(due[0].due) : 'aucune', tone: due.length ? 'warn' : 'good', go: 'finances' }) + '</div>' +
        '<div class="grid g2 mt">' +
        H.card('Dernières notes', '<button class="lk" data-go="notes">Toutes les notes</button>', '<div class="list">' + grades.map(function (g) { return H.li({ icon: 'award', tone: g.value >= g.promo ? 'green' : 'amber', title: esc(KMK_MODULES[g.module].name) + ' — ' + esc(g.label), sub: 'Promo ' + fmt.num(g.promo) + ' · ' + fmt.date(g.date), right: '<b class="vv">' + fmt.num(g.value) + '</b>' }); }).join('') + '</div>') +
        H.card('Absences', '<button class="lk" data-go="absences">Détail</button>', abs.length ? '<div class="list">' + abs.map(function (a) { return H.li({ icon: 'calendar', tone: a.status === 'a_justifier' ? 'amber' : 'grey', title: esc(KMK_MODULES[a.module].name), sub: fmt.long(a.date) + ' · ' + a.slot, right: H.absPill(a) }); }).join('') + '</div>' : H.empty('check-circle-2', 'Aucune absence', '')) +
        '</div><div class="grid g2 mt">' +
        H.card('Échéances à venir', '<button class="lk" data-go="finances">Situation</button>', due.length ? '<div class="list">' + due.map(function (i) { return H.li({ icon: 'wallet', tone: q.invoiceStatus(i) === 'retard' ? 'red' : 'amber', title: esc(i.label), sub: fmt.money(i.amount) + ' · avant le ' + fmt.date(i.due), right: '<button class="btn sm" data-act="pay" data-id="' + i.id + '">Payer</button>' }); }).join('') + '</div>' : H.empty('check-circle-2', 'Tout est réglé', '')) +
        todayCard(c) + '</div>';
    }
  });

  /* ---------------------------------------------------------
     Emploi du temps — étudiant / parent
     --------------------------------------------------------- */
  KMK.part('emploi-du-temps', SP, {
    label: 'Emploi du temps', icon: 'calendar',
    sub: function (c) { var w = +(c.params.w || 0), s = weekStart(w); return 'Semaine du ' + U.parse(s).getDate() + ' au ' + fmt.longY(U.addDays(s, 5)) + ' · Groupe ' + c.stu.group; },
    render: function (c) {
      var w = +(c.params.w || 0), start = weekStart(w), end = U.addDays(start, 6);
      var ss = db().sessions.filter(function (s) { return s.groups.indexOf(c.stu.group) >= 0 && s.date >= start && s.date < end; });
      var changes = db().sessions.filter(function (s) { return s.groups.indexOf(c.stu.group) >= 0 && (s.changed || s.cancelled); });
      var exams = db().sessions.filter(function (s) { return s.type === 'examen' && s.groups.indexOf(c.stu.group) >= 0; });
      return '<div class="toolbar"><button class="ibtn" data-go="emploi-du-temps?w=' + (w - 1) + '" aria-label="Semaine précédente">' + icon('chevron-left', 17) + '</button>' +
        '<b>Semaine du ' + U.parse(start).getDate() + ' au ' + fmt.longY(U.addDays(start, 5)) + '</b>' +
        '<button class="ibtn" data-go="emploi-du-temps?w=' + (w + 1) + '" aria-label="Semaine suivante">' + icon('chevron-right', 17) + '</button>' +
        (w !== 0 ? '<button class="btn ghost sm" data-go="emploi-du-temps">Cette semaine</button>' : '') +
        '<span class="sp m">' + ss.length + ' séance(s) · cliquez une séance pour le détail</span></div>' +
        '<div class="grid g-rail"><div class="card">' + (ss.length ? KMK.calendar(ss, w) : H.empty('calendar', 'Aucune séance planifiée', 'Le planning de cette semaine n’est pas encore publié.')) + '</div>' +
        '<div class="grid" style="align-content:start">' +
        H.card('Changements', H.pill(changes.length + '', 'amber'), '<div class="list">' + changes.map(function (s) { return H.li({ icon: s.cancelled ? 'x-circle' : 'refresh-cw', tone: s.cancelled ? 'red' : 'amber', title: s.cancelled ? 'Cours annulé — ' + esc(s.title) : esc(s.changed), sub: esc(s.title) + ' · ' + fmt.long(s.date) + ' ' + s.start, act: 'session', data: ' data-id="' + s.id + '"' }); }).join('') + '</div>') +
        H.card('Examens', '', '<div class="list">' + exams.map(function (s) { return H.li({ icon: 'clipboard-check', tone: 'amber', title: esc(s.title), sub: fmt.long(s.date) + ' · ' + s.start + ' · ' + esc(s.room), act: 'session', data: ' data-id="' + s.id + '"' }); }).join('') + '</div>') +
        '<div class="hintx"><b>Notifications actionnables :</b> un changement de salle ou une annulation est notifié immédiatement aux seuls étudiants concernés.</div>' +
        '</div></div>';
    }
  });

  /* ---------------------------------------------------------
     Notes — étudiant / parent
     --------------------------------------------------------- */
  KMK.part('notes', SP, {
    label: 'Notes & crédits', icon: 'award',
    sub: function () { return 'Évaluations, moyennes pondérées ECTS et crédits'; },
    render: function (c) {
      var mf = c.params.module || '', avgs = q.moduleAvgs(c.sid), all = q.grades(c.sid);
      var grades = all.filter(function (g) { return !mf || g.module === mf; }).sort(function (a, b) { return a.date < b.date ? 1 : -1; });
      var mods = Object.keys(KMK_MODULES).filter(function (k) { return avgs[k] != null; });
      var avg = q.studentAvg(c.sid);
      return '<div class="grid g4 mb">' +
        H.kpi({ icon: 'award', label: 'Moyenne générale', value: fmt.num(avg), delta: 'pondérée par les ECTS' }) +
        H.kpi({ icon: 'layers', label: 'Crédits validés', value: c.stu.credits + ' / 60', delta: Math.round(c.stu.credits / 60 * 100) + ' % de l’année' }) +
        H.kpi({ icon: 'trending-up', label: 'Classement', value: c.stu.rank + 'e / 68', delta: '+2 places ce mois' }) +
        H.kpi({ icon: 'clipboard-check', label: 'Notes publiées', value: all.length, delta: 'dernière : ' + (all.length ? fmt.rel(all.slice().sort(function (a, b) { return a.date < b.date ? 1 : -1; })[0].date + 'T18:00') : '—') }) + '</div>' +
        '<div class="toolbar"><div class="seg" style="flex-wrap:wrap"><button class="' + (!mf ? 'on' : '') + '" data-go="notes">Tous les modules</button>' + mods.map(function (k) { return '<button class="' + (mf === k ? 'on' : '') + '" data-go="notes?module=' + k + '">' + esc(KMK_MODULES[k].name) + '</button>'; }).join('') + '</div>' +
        '<button class="btn ghost sm sp" data-act="releve">' + icon('download', 14) + 'Relevé de notes</button></div>' +
        '<div class="grid g-lrail"><div class="card"><div class="ch"><h3>Moyennes par module</h3></div><div class="pad">' +
        mods.map(function (k) { var v = avgs[k]; return H.progress(esc(KMK_MODULES[k].name) + ' <span class="m">· ' + KMK_MODULES[k].ects + ' ECTS</span>', fmt.num(v), v / 20 * 100, v < 10 ? 'var(--red)' : v < 12 ? 'var(--amber)' : KMK_MODULES[k].color); }).join('') + '</div></div>' +
        '<div class="card"><div class="ch"><h3>' + (mf ? esc(KMK_MODULES[mf].name) : 'Toutes les évaluations') + '</h3><span class="m">' + grades.length + ' note(s)</span></div><div class="tbl-wrap"><table><thead><tr><th>Module</th><th>Évaluation</th><th>Date</th><th class="tar">Note</th><th class="tar">Promo</th><th></th></tr></thead><tbody>' +
        grades.map(function (g) { var diff = g.value - g.promo; return '<tr class="click" data-act="grade" data-id="' + g.id + '"><td class="nm">' + esc(KMK_MODULES[g.module].name) + (g.isNew ? ' ' + H.pill('Nouveau', 'solid') : '') + '</td><td>' + esc(g.label) + '</td><td class="mu">' + fmt.date(g.date) + '</td>' +
          '<td class="tar"><b style="font-size:14px">' + fmt.num(g.value) + '</b></td><td class="tar mu">' + fmt.num(g.promo) + ' <span style="color:' + (diff >= 0 ? 'var(--green)' : 'var(--red)') + ';font-weight:600">' + (diff >= 0 ? '+' : '') + fmt.num(diff) + '</span></td><td class="tar">' + icon('chevron-right', 15) + '</td></tr>'; }).join('') +
        '</tbody></table></div></div></div>';
    }
  });
  A.releve = function () { var c = ctx(); KMK.printDoc('releve', c.sid); KMK.log('document.download', 'Relevé de notes'); KMK.commit(); };
  A.grade = function (el) {
    var c = ctx(), g = db().grades.filter(function (x) { return x.id === el.dataset.id; })[0]; if (!g) return;
    var mod = KMK_MODULES[g.module];
    var dist = [2, 5, 9, 14, 17, 12, 6, 3], bands = ['0-5', '5-8', '8-10', '10-12', '12-14', '14-16', '16-18', '18-20'];
    var mine = g.value < 5 ? 0 : g.value < 8 ? 1 : g.value < 10 ? 2 : g.value < 12 ? 3 : g.value < 14 ? 4 : g.value < 16 ? 5 : g.value < 18 ? 6 : 7;
    ui.modal({
      title: esc(mod.name) + ' — ' + esc(g.label), sub: 'Publiée le ' + fmt.longY(g.date) + ' · ' + esc(mod.teacher),
      body: '<div class="grid g3" style="grid-template-columns:repeat(3,1fr)"><div class="dst"><b>' + fmt.num(g.value) + '</b><span>' + (c.role === 'parent' ? 'Note' : 'Votre note') + '</span></div><div class="dst"><b>' + fmt.num(g.promo) + '</b><span>Moyenne promo</span></div><div class="dst"><b>' + mod.ects + '</b><span>ECTS du module</span></div></div>' +
        '<div class="lbl">Répartition de la promotion</div>' + H.bars(dist.map(function (v, k) { return { l: bands[k], v: v, on: k === mine, tip: v + ' étudiants' }; }), 0, 110) +
        (g.comment ? '<div class="lbl">Commentaire du formateur</div><div class="hintx">' + esc(g.comment) + '</div>' : ''),
      foot: (c.role === 'etudiant' ? '<button class="btn ghost" id="gRec">' + icon('alert-triangle', 15) + 'Contester la note</button>' : '') +
        '<button class="btn ghost" id="gMsg">' + icon('send', 15) + 'Écrire au formateur</button><button class="btn" data-act="close-modal">Fermer</button>',
      onMount: function (m) {
        var r = $('#gRec', m); if (r) r.addEventListener('click', function () { ui.closeModal(true); KMK.newRequest('reclam'); setTimeout(function () { var t = $('#rDet'); if (t) t.value = 'Réclamation sur la note de ' + mod.name + ' — ' + g.label + ' (' + fmt.num(g.value) + '/20).'; }, 60); });
        $('#gMsg', m).addEventListener('click', function () { ui.closeModal(true); KMK.composeMessage('u-claire', mod.name + ' — ' + g.label, 'Bonjour, '); });
      }
    });
    if (g.isNew && c.role === 'etudiant') { delete g.isNew; KMK.store.save(); }
  };

  /* ---------------------------------------------------------
     Absences — étudiant / parent
     --------------------------------------------------------- */
  var ABS_REASONS = ['Maladie', 'Rendez-vous médical', 'Transport / grève', 'Convocation administrative', 'Raison familiale', 'Autre'];
  KMK.part('absences', SP, {
    label: 'Absences', icon: 'user-check',
    sub: function () { return 'Justificatifs en ligne, traités par la scolarité sous 48 h'; },
    badge: function (c) { return db().absences.filter(function (a) { return a.studentId === c.sid && a.status === 'a_justifier'; }).length; },
    render: function (c) {
      var abs = db().absences.filter(function (a) { return a.studentId === c.sid; }).sort(function (a, b) { return a.date < b.date ? 1 : -1; });
      var by = function (s) { return abs.filter(function (a) { return a.status === s; }).length; };
      return '<div class="grid g4 mb">' + H.kpi({ icon: 'user-check', label: 'Taux de présence', value: c.stu.att + ' %', delta: 'seuil réglementaire : 85 %' }) +
        H.kpi({ icon: 'alert-triangle', label: 'À justifier', value: by('a_justifier'), delta: by('a_justifier') ? 'avant le ' + fmt.date(abs.filter(function (a) { return a.status === 'a_justifier'; })[0].deadline) : 'rien en attente', tone: by('a_justifier') ? 'warn' : 'good' }) +
        H.kpi({ icon: 'clock', label: 'En validation', value: by('en_attente'), delta: 'par la scolarité' }) +
        H.kpi({ icon: 'check-circle-2', label: 'Justifiées', value: by('justifiee'), delta: 'cette année' }) + '</div>' +
        '<div class="grid g21"><div class="card"><div class="ch"><h3>Historique des absences</h3><span class="m">' + abs.length + ' absence(s)</span></div>' +
        (abs.length ? '<div class="tbl-wrap"><table><thead><tr><th>Module</th><th>Date</th><th>Statut</th><th>Justificatif</th><th></th></tr></thead><tbody>' + abs.map(function (a) {
          return '<tr><td class="nm">' + esc(KMK_MODULES[a.module].name) + '</td><td>' + fmt.long(a.date) + '<div class="sub">' + esc(a.slot) + '</div></td><td>' + H.absPill(a) + (a.status === 'a_justifier' ? '<div class="sub">avant le ' + fmt.date(a.deadline) + '</div>' : '') + (a.status === 'refusee' && a.refuseReason ? '<div class="sub" style="color:var(--red)">' + esc(a.refuseReason) + '</div>' : '') + '</td>' +
            '<td>' + (a.file ? '<span class="hstack" style="gap:6px">' + icon('paperclip', 13) + esc(a.file) + '</span><div class="sub">' + esc(a.reason || '') + '</div>' : '<span class="mu">—</span>') + '</td>' +
            '<td class="tar">' + (a.status === 'a_justifier' || a.status === 'refusee' ? '<button class="btn sm" data-act="justify" data-id="' + a.id + '">' + icon('upload', 13) + 'Justifier</button>' : '') + '</td></tr>'; }).join('') + '</tbody></table></div>' : H.empty('check-circle-2', 'Aucune absence', 'Bravo pour votre assiduité !')) + '</div>' +
        '<div class="grid" style="align-content:start">' + H.card('Comment ça marche ?', '', '<div class="list">' +
          H.li({ icon: 'bell', title: 'Alerte immédiate', sub: 'Dès que le formateur fait l’appel, l’étudiant et le parent sont notifiés.' }) +
          H.li({ icon: 'upload', title: 'Justificatif en ligne', sub: 'Photo ou PDF, sous 10 jours. Plus de passage au secrétariat.' }) +
          H.li({ icon: 'check-circle-2', tone: 'green', title: 'Validation sous 48 h', sub: 'La scolarité valide ou refuse ; vous êtes prévenu dans les deux cas.' }) + '</div>') +
        '<div class="hintx"><b>Règle :</b> au-delà de 3 absences non justifiées dans un module, le responsable pédagogique est alerté automatiquement.</div></div></div>';
    }
  });
  A.justify = function (el) {
    var c = ctx(), a = db().absences.filter(function (x) { return x.id === el.dataset.id; })[0]; if (!a) return;
    ui.modal({
      title: 'Justifier une absence', sub: esc(KMK_MODULES[a.module].name) + ' · ' + fmt.long(a.date) + ' · ' + esc(a.slot),
      body: '<div class="field"><label for="jR">Motif</label><select class="select" id="jR">' + ABS_REASONS.map(function (r) { return '<option>' + r + '</option>'; }).join('') + '</select></div>' +
        '<div class="field"><label for="jC">Commentaire <span class="m">(facultatif)</span></label><textarea class="textarea" id="jC" maxlength="300"></textarea></div>' +
        '<div class="field"><span class="flabel">Justificatif <span class="m">(obligatoire)</span></span><div id="jF"></div></div>',
      foot: '<button class="btn ghost" data-act="close-modal">Annuler</button><button class="btn" id="jOk">' + icon('send', 15) + 'Envoyer à la scolarité</button>',
      onMount: function (m) {
        var dz = KMK.dropzone($('#jF', m));
        $('#jOk', m).addEventListener('click', function () {
          var f = dz.get(); if (!f) { ui.toast('Ajoutez un justificatif (PDF, JPG ou PNG)', 'err'); return; }
          a.status = 'en_attente'; a.reason = $('#jR', m).value; a.comment = $('#jC', m).value.trim(); a.file = f.name; a.submittedAt = U.nowISO(); a.by = c.me.id;
          KMK.notify(['u-scol'], { title: 'Justificatif à valider', body: c.stu.name + ' · ' + KMK_MODULES[a.module].name + ' du ' + fmt.date(a.date), icon: 'paperclip', tone: 'amber', route: 'justificatifs' });
          KMK.log('absence.justify', 'Justificatif déposé — ' + KMK_MODULES[a.module].name + ' ' + fmt.date(a.date) + ' (' + f.name + ')');
          ui.closeModal(true);
          KMK.commit('Justificatif envoyé — réponse de la scolarité sous 48 h');
        });
      }
    });
  };

  /* ---------------------------------------------------------
     Demandes — étudiant
     --------------------------------------------------------- */
  KMK.part('demandes', ['etudiant'], {
    label: 'Demandes', icon: 'inbox',
    sub: function () { return 'Attestations, relevés, réclamations — suivi en temps réel'; },
    badge: function (c) { return db().requests.filter(function (r) { return r.studentId === c.sid && r.stage === 3 && !r.rejected; }).length; },
    render: function (c) {
      var f = c.params.f || 'cours';
      var all = db().requests.filter(function (r) { return r.studentId === c.sid; });
      var list = all.filter(function (r) { return f === 'all' || (f === 'cours' ? r.stage < 4 && !r.rejected : r.stage === 4 || r.rejected); });
      return '<div class="pagehead"><div><h2>Mes demandes</h2><p>' + all.filter(function (r) { return r.stage < 4 && !r.rejected; }).length + ' en cours · ' + all.length + ' au total</p></div><div class="acts"><button class="btn" data-act="new-request">' + icon('plus', 15) + 'Nouvelle demande</button></div></div>' +
        '<div class="toolbar"><div class="seg"><button class="' + (f === 'cours' ? 'on' : '') + '" data-go="demandes?f=cours">En cours</button><button class="' + (f === 'done' ? 'on' : '') + '" data-go="demandes?f=done">Terminées</button><button class="' + (f === 'all' ? 'on' : '') + '" data-go="demandes?f=all">Toutes</button></div></div>' +
        (list.length ? '<div class="grid">' + list.map(function (r) {
          var t = KMK_REQUEST_TYPES.filter(function (x) { return x.id === r.type; })[0];
          var docBtn = r.docId ? '<button class="btn sm" data-act="download-doc" data-id="' + r.docId + '">' + icon('download', 13) + 'Télécharger</button>' : '';
          return '<div class="card"><div class="ch"><span class="ico" style="width:34px;height:34px;border-radius:10px;background:var(--soft);color:var(--g700);display:flex;align-items:center;justify-content:center">' + icon(t.icon, 16) + '</span><div style="min-width:0"><h3>' + esc(t.label) + '</h3><div class="m">' + esc(r.ref) + ' · déposée ' + fmt.rel(r.createdAt) + ' · délai ' + esc(t.sla) + '</div></div><div class="sp hstack">' + H.stagePill(r) + '</div></div>' +
            '<div class="pad">' + requestSteps(r) + (r.details ? '<p class="m" style="margin-top:12px">« ' + esc(r.details) + ' »</p>' : '') + (r.note && !r.rejected ? '<div class="alert warn" style="margin:12px 0 0">' + icon('info', 16) + '<div>' + esc(r.note) + '</div></div>' : '') +
            '<details style="margin-top:12px"><summary class="m" style="cursor:pointer">Historique (' + r.history.length + ')</summary><div class="tline" style="margin-top:10px">' + r.history.map(function (h) { return '<div class="tl-i"><div class="t">' + esc(h.rejected ? 'Refusée' : KMK_STAGES[h.stage].label) + '</div><div class="d">' + fmt.rel(h.at) + ' · ' + esc(h.by) + '</div></div>'; }).join('') + '</div></details>' +
            '<div class="hstack wrap" style="margin-top:12px">' + docBtn + (r.stage < 3 && !r.rejected ? '<button class="btn ghost sm" data-act="remind-request" data-id="' + r.id + '">' + icon('bell', 13) + 'Relancer</button>' : '') + (r.stage === 0 && !r.rejected ? '<button class="act danger" data-act="cancel-request" data-id="' + r.id + '">Annuler</button>' : '') + '</div></div></div>';
        }).join('') + '</div>' : '<div class="card">' + H.empty('inbox', f === 'cours' ? 'Aucune demande en cours' : 'Aucune demande', 'Attestation, relevé, réclamation : tout se fait en ligne.', '<button class="btn" data-act="new-request">' + icon('plus', 15) + 'Nouvelle demande</button>') + '</div>');
    }
  });
  A['remind-request'] = function (el) {
    var r = db().requests.filter(function (x) { return x.id === el.dataset.id; })[0];
    if (r.remindedAt && r.remindedAt === TODAY) { ui.toast('Vous avez déjà relancé cette demande aujourd’hui', 'info'); return; }
    r.remindedAt = TODAY;
    KMK.notify(['u-scol'], { title: 'Relance — ' + r.ref, body: q.student(r.studentId).name + ' attend sa demande « ' + KMK.typeLabel(r.type) + ' »', icon: 'bell', tone: 'amber', route: 'demandes?r=' + r.id });
    KMK.log('request.remind', 'Relance de ' + r.ref);
    KMK.commit('Relance envoyée à la scolarité');
  };
  A['cancel-request'] = function (el) {
    ui.confirm({ title: 'Annuler la demande ?', body: 'La demande sera retirée du circuit de traitement.', ok: 'Annuler la demande', danger: true }).then(function (ok) {
      if (!ok) return;
      var d = db(), r = d.requests.filter(function (x) { return x.id === el.dataset.id; })[0];
      d.requests = d.requests.filter(function (x) { return x !== r; });
      KMK.log('request.cancel', 'Demande ' + r.ref + ' annulée par l’étudiant');
      KMK.commit('Demande ' + r.ref + ' annulée');
    });
  };

  /* ---------------------------------------------------------
     Documents — étudiant
     --------------------------------------------------------- */
  var DOC_IC = { releve: ['clipboard-check', 'blue'], certif: ['file-text', 'blue'], 'att-scol': ['file-text', 'blue'], 'cert-reu': ['award', 'green'], stage: ['building-2', 'grey'], convoc: ['calendar-clock', 'amber'], reglement: ['book-open', 'grey'] };
  KMK.route('documents', {
    label: 'Documents', icon: 'folder', roles: ['etudiant'],
    sub: function () { return 'Attestations, relevés et convocations signés électroniquement'; },
    render: function (c) {
      var docs = db().documents.filter(function (d) { return d.studentId === c.sid; }).sort(function (a, b) { return a.date < b.date ? 1 : -1; });
      return '<div class="pagehead"><div><h2>Mes documents</h2><p>' + docs.length + ' document(s) disponibles · vérifiables par QR code</p></div><div class="acts"><button class="btn" data-act="new-request" data-type="att-scol">' + icon('plus', 15) + 'Demander un document</button></div></div>' +
        '<div class="grid g3">' + docs.map(function (d) {
          var ic = DOC_IC[d.kind] || ['file-text', 'blue'];
          return '<div class="card pad" style="display:flex;flex-direction:column;gap:12px"><div class="hstack"><span class="ico" style="width:42px;height:42px;border-radius:12px;display:flex;align-items:center;justify-content:center;background:var(--soft);color:var(--g700)">' + icon(ic[0], 19) + '</span>' +
            (d.isNew ? H.pill('Nouveau', 'solid') : '') + '<span class="sp">' + (d.signed ? H.pill('Signé', 'green', 'shield-check') : H.pill('PDF', 'grey')) + '</span></div>' +
            '<div><div class="b" style="font-size:14px">' + esc(d.title) + '</div><div class="m">Émis le ' + fmt.longY(d.date) + '</div></div>' +
            '<div class="hstack" style="margin-top:auto"><button class="btn sm" data-act="download-doc" data-id="' + d.id + '">' + icon('download', 13) + 'Télécharger</button><button class="act" data-act="share-doc" data-id="' + d.id + '">' + icon('external-link', 13) + 'Partager</button></div></div>';
        }).join('') + '</div>';
    }
  });
  A['download-doc'] = function (el) {
    var c = ctx(), d = db().documents.filter(function (x) { return x.id === el.dataset.id; })[0]; if (!d) return;
    KMK.printDoc(d.kind, d.studentId);
    delete d.isNew;
    KMK.log('document.download', 'Téléchargement — ' + d.title);
    if (c.role === 'etudiant') KMK.flag('docDownloaded');
    var r = db().requests.filter(function (x) { return x.docId === d.id && x.stage === 3; })[0];
    if (r) { r.stage = 4; r.history.push({ stage: 4, at: U.nowISO(), by: 'Système (téléchargé)' }); }
    KMK.commit('Document ouvert dans un nouvel onglet — imprimable en PDF');
  };
  A['share-doc'] = function (el) {
    var link = 'https://kmk-campus.fr/verifier/' + el.dataset.id + '-' + Math.random().toString(36).slice(2, 8);
    try { navigator.clipboard.writeText(link); } catch (e) {}
    KMK.log('document.share', 'Lien de vérification généré'); KMK.store.save();
    ui.toast('Lien de vérification copié (valable 30 jours)');
  };

  /* ---------------------------------------------------------
     Finances — étudiant / parent
     --------------------------------------------------------- */
  KMK.part('finances', SP, {
    label: 'Finances', icon: 'wallet',
    sub: function () { return 'Échéancier 2026-2027, paiements en ligne et reçus'; },
    badge: function (c) { return db().invoices.filter(function (i) { return i.studentId === c.sid && (q.invoiceStatus(i) === 'retard' || q.invoiceStatus(i) === 'a_payer'); }).length; },
    render: function (c) {
      var inv = db().invoices.filter(function (i) { return i.studentId === c.sid; }).sort(function (a, b) { return a.due < b.due ? -1 : 1; });
      var paid = inv.filter(function (i) { return i.paidAt; }).reduce(function (t, i) { return t + i.amount; }, 0);
      var due = inv.filter(function (i) { return !i.paidAt; });
      var dueSum = due.reduce(function (t, i) { return t + i.amount; }, 0);
      var aids = db().aids.filter(function (a) { return a.studentId === c.sid; });
      var aidSum = aids.reduce(function (t, a) { return t + a.amount; }, 0);
      var next = due[0];
      return '<div class="grid g4 mb">' + H.kpi({ icon: 'wallet', label: 'Reste dû', value: fmt.money(dueSum), delta: due.length + ' échéance(s)', tone: dueSum ? 'warn' : 'good' }) +
        H.kpi({ icon: 'credit-card', label: 'Réglé cette année', value: fmt.money(paid), delta: Math.round(paid / (paid + dueSum) * 100) + ' % du total' }) +
        H.kpi({ icon: 'calendar-clock', label: 'Prochaine échéance', value: next ? fmt.date(next.due) : '—', delta: next ? fmt.money(next.amount) + ' · ' + esc(next.label) : 'aucune' }) +
        H.kpi({ icon: 'award', label: 'Aides et bourses', value: fmt.money(aidSum), delta: aids.length + ' aide(s) versée(s)', tone: 'good' }) + '</div>' +
        (next ? '<div class="card pad mb" style="display:flex;gap:16px;align-items:center;flex-wrap:wrap;border-color:#F3E4CA;background:#FFFBF4"><span class="ico" style="width:44px;height:44px;border-radius:12px;background:var(--ambersoft);color:#B4700F;display:flex;align-items:center;justify-content:center">' + icon('wallet', 20) + '</span><div style="flex:1;min-width:200px"><b>' + esc(next.label) + ' — ' + fmt.money(next.amount) + '</b><div class="m">À régler avant le ' + fmt.long(next.due) + ' · rappel automatique à J-3</div></div><button class="btn success" data-act="pay" data-id="' + next.id + '">' + icon('lock', 15) + 'Payer ' + fmt.money(next.amount) + '</button></div>' : '') +
        '<div class="grid g21"><div class="card"><div class="ch"><h3>Échéancier 2026-2027</h3><span class="m">' + inv.length + ' échéances</span></div><div class="tbl-wrap"><table><thead><tr><th>Objet</th><th>Échéance</th><th class="tar">Montant</th><th>Statut</th><th></th></tr></thead><tbody>' +
        inv.map(function (i) { return '<tr><td class="nm">' + esc(i.label) + (i.paidAt ? '<div class="sub">Réglé le ' + fmt.date(i.paidAt) + ' · ' + esc(i.method) + '</div>' : '') + '</td><td>' + fmt.date(i.due) + '</td><td class="tar"><b>' + fmt.money(i.amount) + '</b></td><td>' + H.invPill(i) + '</td>' +
          '<td class="tar">' + (i.paidAt ? '<button class="act" data-act="receipt" data-id="' + i.id + '">' + icon('download', 13) + 'Reçu</button>' : '<button class="btn sm" data-act="pay" data-id="' + i.id + '">Payer</button>') + '</td></tr>'; }).join('') +
        '</tbody></table></div></div>' +
        '<div class="grid" style="align-content:start"><div class="card"><div class="ch"><h3>Avancement</h3></div><div class="pad" style="display:flex;gap:18px;align-items:center">' + H.ring(paid / (paid + dueSum) * 100, 104, 11, 'var(--g500)', '<b style="font-size:19px">' + Math.round(paid / (paid + dueSum) * 100) + '%</b><small>réglé</small>') +
        '<div style="flex:1">' + H.progress('Réglé', fmt.money(paid), paid / (paid + dueSum) * 100) + H.progress('Restant', fmt.money(dueSum), dueSum / (paid + dueSum) * 100, 'var(--amber)') + '</div></div></div>' +
        H.card('Aides et bourses', '', aids.length ? '<div class="list">' + aids.map(function (a) { return H.li({ icon: 'award', tone: 'green', title: esc(a.label), sub: 'Versée le ' + fmt.date(a.date), right: '<b class="vv">' + fmt.money(a.amount) + '</b>' }); }).join('') + '</div>' : H.empty('award', 'Aucune aide', '')) +
        '<div class="hintx"><b>Paiement sécurisé :</b> carte bancaire (3-D Secure) ou prélèvement SEPA. Le reçu est émis immédiatement et le service financier est notifié.</div></div></div>';
    }
  });

  /* ---------------------------------------------------------
     Événements — étudiant
     --------------------------------------------------------- */
  KMK.route('evenements', {
    label: 'Événements', icon: 'calendar-check', roles: ['etudiant'],
    sub: function () { return 'Conférences, clubs, intégration — inscription en un clic'; },
    render: function (c) {
      var tag = c.params.tag || '', evs = db().events;
      var tags = evs.map(function (e) { return e.tag; }).filter(function (t, i, a) { return a.indexOf(t) === i; });
      return '<div class="toolbar"><div class="seg" style="flex-wrap:wrap"><button class="' + (!tag ? 'on' : '') + '" data-go="evenements">Tous</button>' + tags.map(function (t) { return '<button class="' + (tag === t ? 'on' : '') + '" data-go="evenements?tag=' + encodeURIComponent(t) + '">' + esc(t) + '</button>'; }).join('') + '</div>' +
        '<span class="sp m">' + evs.filter(function (e) { return e.attendees.indexOf(c.me.id) >= 0; }).length + ' inscription(s)</span></div>' +
        '<div class="grid g3">' + evs.filter(function (e) { return !tag || e.tag === tag; }).map(function (e) {
          var reg = e.attendees.indexOf(c.me.id) >= 0, wait = (e.waitlist || []).indexOf(c.me.id) >= 0, taken = e.base + e.attendees.length, left = e.capacity - taken, d = U.parse(e.date);
          var btn = reg ? '<button class="btn ghost sm" data-act="event-toggle" data-id="' + e.id + '">' + icon('check', 13) + 'Inscrit · se désinscrire</button>'
            : wait ? '<button class="btn ghost sm" data-act="event-toggle" data-id="' + e.id + '">' + icon('clock', 13) + 'En liste d’attente</button>'
            : left > 0 ? '<button class="btn sm" data-act="event-toggle" data-id="' + e.id + '">' + icon('calendar-check', 13) + 'S’inscrire</button>' : '<button class="btn ghost sm" data-act="event-toggle" data-id="' + e.id + '">Liste d’attente</button>';
          return '<div class="card evc"><div class="cov" style="background:linear-gradient(135deg,' + e.color + ',' + e.color + 'aa)"><div class="dt"><b>' + d.getDate() + '</b><span>' + U.MONTHS[d.getMonth()].slice(0, 4) + '.</span></div><span class="tg pill" style="background:rgba(255,255,255,.2);color:#fff">' + esc(e.tag) + '</span></div>' +
            '<div class="bd"><h4>' + esc(e.title) + '</h4><div class="meta"><span>' + icon('clock', 13) + fmt.long(e.date) + ' · ' + e.time + '</span><span>' + icon('map-pin', 13) + esc(e.place) + '</span></div><p class="m">' + esc(e.desc) + '</p>' +
            '<div><div class="obl"><span>' + taken + ' / ' + e.capacity + ' inscrits</span><b>' + (left > 0 ? left + ' place(s)' : 'Complet') + '</b></div><div class="bar"><i style="width:' + Math.min(100, taken / e.capacity * 100) + '%;' + (left <= 0 ? 'background:var(--amber)' : '') + '"></i></div></div>' +
            '<div class="ft">' + btn + '</div></div></div>';
        }).join('') + '</div>';
    }
  });
  A['event-toggle'] = function (el) {
    var c = ctx(), e = db().events.filter(function (x) { return x.id === el.dataset.id; })[0];
    e.waitlist = e.waitlist || [];
    var reg = e.attendees.indexOf(c.me.id) >= 0, wait = e.waitlist.indexOf(c.me.id) >= 0;
    if (reg) { e.attendees.splice(e.attendees.indexOf(c.me.id), 1); KMK.log('event.leave', 'Désinscription — ' + e.title); return KMK.commit('Désinscription confirmée — ' + esc(e.title)); }
    if (wait) { e.waitlist.splice(e.waitlist.indexOf(c.me.id), 1); KMK.log('event.wait_leave', 'Sortie de liste d’attente — ' + e.title); return KMK.commit('Retiré de la liste d’attente'); }
    if (e.capacity - e.base - e.attendees.length <= 0) { e.waitlist.push(c.me.id); KMK.log('event.wait', 'Liste d’attente — ' + e.title); return KMK.commit('Ajouté à la liste d’attente — vous serez prévenu si une place se libère'); }
    e.attendees.push(c.me.id);
    KMK.notify([c.me.id], { title: 'Inscription confirmée', body: e.title + ' · ' + fmt.long(e.date) + ' à ' + e.time + ' — rappel la veille', icon: 'calendar-check', tone: 'green', route: 'evenements' });
    KMK.log('event.join', 'Inscription — ' + e.title);
    KMK.commit('Inscription confirmée — ' + esc(e.title));
  };

  /* commandes rapides (palette) */
  KMK.commands.etudiant = [
    { ic: 'plus', t: 'Nouvelle demande', s: 'attestation, relevé…', run: function () { KMK.newRequest(); } },
    { ic: 'credit-card', t: 'Payer une échéance', run: function () { ui.navigate('finances'); } },
    { ic: 'paperclip', t: 'Justifier une absence', run: function () { ui.navigate('absences'); } },
    { ic: 'download', t: 'Télécharger mon relevé de notes', run: function () { A.releve(); } }
  ];
  KMK.commands.parent = [
    { ic: 'credit-card', t: 'Payer une échéance', run: function () { ui.navigate('finances'); } },
    { ic: 'message-square', t: 'Écrire à la scolarité', run: function () { KMK.composeMessage('u-scol', 'Question d’un parent', ''); } }
  ];
})();
