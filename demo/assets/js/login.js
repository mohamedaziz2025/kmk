/* =========================================================
   KMK Campus — page de connexion
   ========================================================= */
(function () {
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = KMK.util.esc;

  /* icônes déclaratives : <span data-ic="nom"></span> */
  function hydrate(root) {
    $$('[data-ic]', root).forEach(function (el) {
      var size = +(el.getAttribute('data-ic-size') || (el.classList.contains('mfa-ic') ? 26 : 18));
      var svg = icon(el.getAttribute('data-ic'), size);
      if (el.tagName === 'SPAN' && !el.childNodes.length && el.attributes.length === 1) el.outerHTML = svg;
      else { el.insertAdjacentHTML('afterbegin', svg); el.removeAttribute('data-ic'); }
    });
  }

  function toast(msg, kind) {
    var t = document.createElement('div');
    t.className = 'toast' + (kind === 'err' ? ' err' : '');
    t.innerHTML = icon(kind === 'err' ? 'alert-triangle' : 'check-circle-2', 17) + '<span>' + esc(msg) + '</span>';
    $('#toasts').appendChild(t);
    setTimeout(function () { t.classList.add('out'); setTimeout(function () { t.remove(); }, 260); }, 3200);
  }
  var ptTimer;
  function phone(app, title, body, onClick) {
    var p = $('#phoneToast');
    $('#ptApp').textContent = app; $('#ptTitle').textContent = title; $('#ptBody').innerHTML = body;
    p.classList.add('on'); p.style.cursor = onClick ? 'pointer' : 'default';
    p.onclick = function () { if (onClick) onClick(); p.classList.remove('on'); };
    clearTimeout(ptTimer); ptTimer = setTimeout(function () { p.classList.remove('on'); }, 12000);
  }
  function alertBox(id, kind, html) {
    var ic = { err: 'alert-triangle', ok: 'check-circle-2', info: 'info', warn: 'clock' }[kind];
    $(id).innerHTML = html ? '<div class="alert ' + kind + '" role="alert">' + icon(ic, 17) + '<div>' + html + '</div></div>' : '';
  }
  function busy(btn, on, label) {
    if (on) { btn.dataset.html = btn.innerHTML; btn.disabled = true; btn.innerHTML = '<span class="spin"></span><span>' + (label || 'Vérification…') + '</span>'; }
    else if (btn.dataset.html) { btn.disabled = false; btn.innerHTML = btn.dataset.html; }
  }
  function show(step) {
    $$('.inner > section').forEach(function (s) { s.hidden = s.id !== 'step-' + step; });
    var f = $('#step-' + step + ' input');
    if (f) setTimeout(function () { f.focus(); }, 60);
  }
  $$('[data-back]').forEach(function (b) { b.addEventListener('click', function () { show('login'); }); });

  var params = new URLSearchParams(location.search);
  var next = params.get('next') || '';
  function go() { location.href = 'app.html' + (next ? '#/' + next : ''); }

  /* déjà connecté ? */
  if (KMK.auth.user() && !params.has('switch')) { go(); return; }
  if (params.has('switch')) KMK.auth.logout();

  if (params.has('logout')) alertBox('#loginAlert', 'ok', 'Vous avez été déconnecté. À bientôt !');
  if (params.has('expired')) alertBox('#loginAlert', 'warn', 'Votre session a expiré. Reconnectez-vous pour continuer.');
  if (params.has('reset')) alertBox('#loginAlert', 'ok', 'Les données de démonstration ont été réinitialisées.');

  hydrate(document);
  $('#demoPwd').textContent = window.KMK_DEMO_PASSWORD;

  /* ---------- comptes de démonstration ---------- */
  var ORDER = ['etudiant', 'formateur', 'scolarite', 'direction', 'finance', 'parent'];
  function staffMfa(u) { return u.mfa || (KMK.db().settings.mfaStaff && ['formateur', 'direction', 'finance'].indexOf(u.role) >= 0); }
  function accountsHtml(sso) {
    return ORDER.map(function (r) {
      var u = KMK.db().users.filter(function (x) { return x.role === r; })[0];
      var R = KMK_ROLES[r];
      return '<button type="button" class="acct" data-email="' + esc(u.email) + '"' + (sso ? ' data-sso="' + u.id + '"' : '') + '>' +
        '<span class="av" style="background:' + R.color + '1f;color:' + R.color + '">' + icon(R.icon, 17) + '</span>' +
        '<span><span class="n">' + esc(R.label) + '</span><span class="s">' + esc(sso ? u.email : u.name) + '</span></span>' +
        (!sso && staffMfa(u) ? '<span class="mfa" title="Double authentification">' + icon('shield-check', 15) + '</span>' : '') +
        '</button>';
    }).join('');
  }
  $('#accts').innerHTML = accountsHtml(false);
  $('#accts').addEventListener('click', function (e) {
    var b = e.target.closest('.acct'); if (!b) return;
    $$('#accts .acct').forEach(function (x) { x.classList.toggle('on', x === b); });
    $('#email').value = b.dataset.email;
    $('#password').value = window.KMK_DEMO_PASSWORD;
    clearErrors();
    $('#loginBtn').focus();
  });
  var as = params.get('as');
  if (as) {
    var pre = KMK.db().users.filter(function (u) { return u.role === as; })[0];
    if (pre) { $('#email').value = pre.email; $('#password').value = window.KMK_DEMO_PASSWORD; $$('#accts .acct').forEach(function (x) { x.classList.toggle('on', x.dataset.email === pre.email); }); }
  }

  /* ---------- formulaire ---------- */
  $('#togglePwd').addEventListener('click', function () {
    var p = $('#password'), on = p.type === 'password';
    p.type = on ? 'text' : 'password';
    this.innerHTML = icon(on ? 'eye-off' : 'eye', 18);
    this.setAttribute('aria-label', on ? 'Masquer le mot de passe' : 'Afficher le mot de passe');
  });
  function fieldErr(input, errEl, msg) {
    input.classList.toggle('invalid', !!msg);
    input.setAttribute('aria-invalid', msg ? 'true' : 'false');
    errEl.hidden = !msg; errEl.innerHTML = msg ? icon('alert-triangle', 13) + esc(msg) : '';
  }
  function clearErrors() { fieldErr($('#email'), $('#emailErr'), ''); fieldErr($('#password'), $('#pwdErr'), ''); alertBox('#loginAlert'); }
  $('#email').addEventListener('input', function () { fieldErr(this, $('#emailErr'), ''); });
  $('#password').addEventListener('input', function () { fieldErr(this, $('#pwdErr'), ''); });

  var lockTimer;
  function showLock(sec) {
    clearInterval(lockTimer);
    var btn = $('#loginBtn'); btn.disabled = true;
    function tick() {
      if (sec <= 0) { clearInterval(lockTimer); btn.disabled = false; alertBox('#loginAlert', 'info', 'Vous pouvez réessayer.'); return; }
      alertBox('#loginAlert', 'err', '<b>Compte temporairement verrouillé</b> après 5 tentatives. Réessayez dans <b>' + sec + ' s</b>.');
      sec--;
    }
    tick(); lockTimer = setInterval(tick, 1000);
  }

  var remember = false;
  $('#loginForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var email = $('#email').value.trim(), pwd = $('#password').value;
    var ok = true;
    if (!email) { fieldErr($('#email'), $('#emailErr'), 'Saisissez votre adresse e-mail.'); ok = false; }
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { fieldErr($('#email'), $('#emailErr'), 'Adresse e-mail invalide.'); ok = false; }
    if (!pwd) { fieldErr($('#password'), $('#pwdErr'), 'Saisissez votre mot de passe.'); ok = false; }
    if (!ok) return;
    var btn = $('#loginBtn'); busy(btn, true);
    setTimeout(function () {
      var r = KMK.auth.login(email, pwd);
      busy(btn, false);
      if (!r.ok) {
        if (r.locked) return showLock(r.locked);
        if (r.error === 'unknown') { alertBox('#loginAlert', 'err', 'Aucun compte KMK ID ne correspond à <b>' + esc(email) + '</b>. Utilisez un compte de démonstration ci-dessous.'); fieldErr($('#email'), $('#emailErr'), ' '); }
        else { alertBox('#loginAlert', 'err', 'Mot de passe incorrect. ' + (r.left ? 'Il vous reste <b>' + r.left + ' tentative' + (r.left > 1 ? 's' : '') + '</b> avant verrouillage.' : '')); fieldErr($('#password'), $('#pwdErr'), ' '); $('#password').select(); }
        return;
      }
      remember = $('#remember').checked;
      if (r.mfa) return startMfa(r.user);
      KMK.auth.openSession(r.user, remember, false);
      success(r.user);
    }, 650);
  });

  function success(u) {
    alertBox('#loginAlert', 'ok', 'Connexion réussie. Bienvenue <b>' + esc(u.name) + '</b>…');
    toast('Connecté en tant que ' + KMK_ROLES[u.role].label);
    setTimeout(go, 500);
  }

  /* ---------- MFA ---------- */
  var mfaUser = null, resendTimer;
  function maskPhone(p) { var d = String(p || '').replace(/\D/g, ''); return d.slice(0, 2) + ' •• •• •• ' + d.slice(-2); }
  function sendCode() {
    var code = KMK.auth.startMfa(mfaUser, remember);
    setTimeout(function () {
      phone('Messages', 'KMK Campus', 'Votre code de connexion : <span class="code">' + code.slice(0, 3) + ' ' + code.slice(3) + '</span><br><small style="opacity:.7">Touchez pour le remplir automatiquement</small>', function () { fillOtp(code); });
    }, 700);
    var s = 30, b = $('#resendBtn');
    b.disabled = true; clearInterval(resendTimer);
    resendTimer = setInterval(function () { s--; b.textContent = s > 0 ? 'Renvoyer le code (' + s + ' s)' : 'Renvoyer le code'; if (s <= 0) { clearInterval(resendTimer); b.disabled = false; } }, 1000);
    b.textContent = 'Renvoyer le code (30 s)';
  }
  function startMfa(u) {
    mfaUser = u;
    $('#mfaLead').innerHTML = 'Bonjour ' + esc(u.name.split(' ')[0]) + ', saisissez le code à 6 chiffres envoyé par SMS au <b>' + maskPhone(u.phone) + '</b>.';
    alertBox('#mfaAlert');
    otps().forEach(function (i) { i.value = ''; });
    show('mfa');
    sendCode();
  }
  function otps() { return $$('#otp input'); }
  function fillOtp(code) { otps().forEach(function (i, k) { i.value = code[k] || ''; }); $('#mfaForm').requestSubmit ? $('#mfaForm').requestSubmit() : $('#mfaBtn').click(); }
  otps().forEach(function (inp, k, all) {
    inp.addEventListener('input', function () {
      inp.value = inp.value.replace(/\D/g, '').slice(-1);
      $('#otp').classList.remove('invalid');
      if (inp.value && all[k + 1]) all[k + 1].focus();
      if (all.every(function (x) { return x.value; })) $('#mfaBtn').click();
    });
    inp.addEventListener('keydown', function (e) {
      if (e.key === 'Backspace' && !inp.value && all[k - 1]) { all[k - 1].focus(); all[k - 1].value = ''; }
      if (e.key === 'ArrowLeft' && all[k - 1]) all[k - 1].focus();
      if (e.key === 'ArrowRight' && all[k + 1]) all[k + 1].focus();
    });
    inp.addEventListener('paste', function (e) {
      var t = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '').slice(0, 6);
      if (t.length) { e.preventDefault(); all.forEach(function (x, j) { x.value = t[j] || ''; }); (all[t.length] || all[5]).focus(); if (t.length === 6) $('#mfaBtn').click(); }
    });
  });
  $('#mfaForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var code = otps().map(function (i) { return i.value; }).join('');
    if (code.length < 6) { alertBox('#mfaAlert', 'err', 'Saisissez les 6 chiffres du code.'); return; }
    var btn = $('#mfaBtn'); busy(btn, true);
    setTimeout(function () {
      var r = KMK.auth.verifyMfa(code);
      busy(btn, false);
      if (r.ok) { $('#phoneToast').classList.remove('on'); return success(r.user); }
      $('#otp').classList.add('invalid');
      if (r.error === 'bad') { alertBox('#mfaAlert', 'err', 'Code incorrect. ' + r.left + ' essai' + (r.left > 1 ? 's' : '') + ' restant' + (r.left > 1 ? 's' : '') + '.'); otps().forEach(function (i) { i.value = ''; }); otps()[0].focus(); }
      else { alertBox('#mfaAlert', 'err', (r.error === 'toomany' ? 'Trop d’essais.' : 'Code expiré.') + ' Un nouveau code vient d’être envoyé.'); otps().forEach(function (i) { i.value = ''; }); sendCode(); }
    }, 500);
  });
  $('#resendBtn').addEventListener('click', function () { if (mfaUser) { sendCode(); toast('Nouveau code envoyé'); } });

  /* ---------- mot de passe oublié ---------- */
  var resetUser = null;
  $('#forgotLink').addEventListener('click', function () { $('#fEmail').value = $('#email').value; alertBox('#forgotAlert'); show('forgot'); });
  $('#forgotForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var email = $('#fEmail').value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { alertBox('#forgotAlert', 'err', 'Saisissez une adresse e-mail valide.'); return; }
    var u = KMK.q.userByEmail(email);
    /* même message dans tous les cas : on ne révèle pas si le compte existe */
    alertBox('#forgotAlert', 'ok', 'Si un compte existe pour <b>' + esc(email) + '</b>, un e-mail vient d’être envoyé.');
    if (u) {
      resetUser = u;
      KMK.log('auth.reset_request', 'Demande de réinitialisation du mot de passe', u.id); KMK.store.save();
      setTimeout(function () {
        phone('Mail', 'KMK Campus — Réinitialisation', 'Bonjour ' + esc(u.name.split(' ')[0]) + ', cliquez ici pour choisir un nouveau mot de passe.', function () {
          $('#resetLead').innerHTML = 'Compte : <b>' + esc(u.email) + '</b>';
          $('#np1').value = ''; $('#np2').value = ''; meter(''); alertBox('#resetAlert');
          show('reset');
        });
      }, 900);
    }
  });
  function meter(p) {
    var s = KMK.auth.score(p);
    var c = ['#D64545', '#D64545', '#E0912A', '#2E8BFF', '#1F9D6B'][s];
    var t = ['Trop court', 'Faible', 'Moyen', 'Bon', 'Excellent'][s];
    $('#strengthBar').style.width = (p ? (s + 1) * 20 : 0) + '%';
    $('#strengthBar').style.background = c;
    $('#strengthTxt').textContent = p ? 'Robustesse : ' + t : '8 caractères minimum, avec majuscule, chiffre et symbole.';
  }
  $('#np1').addEventListener('input', function () { meter(this.value); });
  $('#resetForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var a = $('#np1').value, b = $('#np2').value;
    if (a.length < 8 || KMK.auth.score(a) < 3) { alertBox('#resetAlert', 'err', 'Mot de passe trop faible : 8 caractères minimum, avec majuscules, chiffres ou symboles.'); return; }
    if (a !== b) { alertBox('#resetAlert', 'err', 'Les deux mots de passe ne correspondent pas.'); return; }
    resetUser.password = a;
    KMK.log('auth.reset', 'Mot de passe réinitialisé', resetUser.id);
    KMK.store.save();
    $('#email').value = resetUser.email; $('#password').value = '';
    show('login');
    alertBox('#loginAlert', 'ok', 'Mot de passe mis à jour. Connectez-vous avec votre nouveau mot de passe.');
  });

  /* ---------- SSO ---------- */
  $('#ssoAccts').innerHTML = accountsHtml(true);
  $('#ssoBtn').addEventListener('click', function () {
    var btn = this; busy(btn, true, 'Redirection vers le fournisseur d’identité…');
    setTimeout(function () { busy(btn, false); show('sso'); }, 800);
  });
  $('#ssoAccts').addEventListener('click', function (e) {
    var b = e.target.closest('.acct'); if (!b) return;
    var u = KMK.q.user(b.dataset.sso);
    b.innerHTML = '<span class="spin" style="border-color:rgba(46,139,255,.3);border-top-color:#2E8BFF"></span><span><span class="n">Authentification…</span></span>';
    setTimeout(function () { KMK.auth.openSession(u, false, true); KMK.log('auth.sso', 'Connexion via SSO établissement', u.id); KMK.store.save(); success(u); }, 700);
  });

  /* ---------- réinitialisation ---------- */
  $('#resetDemo').addEventListener('click', function () {
    if (!confirm('Réinitialiser toutes les données de la démo (demandes, notes, paiements, messages…) ?')) return;
    KMK.store.reset();
    location.href = 'index.html?reset=1';
  });
})();
