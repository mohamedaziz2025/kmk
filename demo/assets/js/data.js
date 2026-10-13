/* =========================================================
   KMK Campus — données de démonstration (fictives)
   Toutes les données vivent dans le navigateur (localStorage).
   ========================================================= */
window.KMK_DEMO_TODAY = '2026-09-07'; // lundi — même semaine que la maquette kmk.html
window.KMK_DEMO_PASSWORD = 'Demo2026!';

window.KMK_ROLES = {
  etudiant:  { label: 'Étudiant',   space: 'Espace étudiant',     icon: 'graduation-cap', color: '#2E8BFF' },
  formateur: { label: 'Formateur',  space: 'Espace formateur',    icon: 'user-check',     color: '#3C7EA8' },
  scolarite: { label: 'Scolarité',  space: 'Administration',      icon: 'clipboard-list', color: '#1257E0' },
  direction: { label: 'Direction',  space: 'Pilotage direction',  icon: 'bar-chart-3',    color: '#0A2A6E' },
  finance:   { label: 'Finance',    space: 'Service financier',   icon: 'wallet',         color: '#E0912A' },
  parent:    { label: 'Parent',     space: 'Espace parent',       icon: 'heart',          color: '#38BDF8' }
};

window.KMK_MODULES = {
  ALG: { name: 'Algorithmique',      teacher: 'Claire Fontaine', ects: 6, color: '#1257E0' },
  BD:  { name: 'Base de données',    teacher: 'Claire Fontaine', ects: 5, color: '#3C7EA8' },
  RES: { name: 'Réseaux',            teacher: 'Marc Besson',     ects: 5, color: '#5E8FE0' },
  ANG: { name: 'Anglais technique',  teacher: 'Nadia Bouchard',  ects: 3, color: '#38BDF8' },
  MAT: { name: 'Mathématiques',      teacher: 'Karim Slimani',   ects: 5, color: '#0A2A6E' },
  GES: { name: 'Gestion',            teacher: 'Inès Roche',      ects: 3, color: '#2E6488' },
  PRJ: { name: 'Projet tutoré',      teacher: 'Paul Vasseur',    ects: 4, color: '#E0912A' }
};

window.KMK_REQUEST_TYPES = [
  { id: 'att-scol',  label: 'Attestation de scolarité',       sla: '48 h', doc: true,  icon: 'file-text' },
  { id: 'releve',    label: 'Relevé de notes',                sla: '72 h', doc: true,  icon: 'clipboard-check' },
  { id: 'cert-reu',  label: 'Attestation de réussite',        sla: '72 h', doc: true,  icon: 'award' },
  { id: 'stage',     label: 'Convention de stage',            sla: '5 j',  doc: true,  icon: 'building-2' },
  { id: 'reclam',    label: 'Réclamation de note',            sla: '72 h', doc: false, icon: 'alert-triangle' },
  { id: 'adresse',   label: 'Changement d’adresse',           sla: '48 h', doc: false, icon: 'map-pin' },
  { id: 'carte',     label: 'Duplicata de carte étudiant',    sla: '5 j',  doc: false, icon: 'credit-card' }
];
window.KMK_STAGES = [
  { label: 'Déposée',         color: '#5E8FE0' },
  { label: 'En vérification', color: '#3C7EA8' },
  { label: 'En traitement',   color: '#E0912A' },
  { label: 'Prête',           color: '#38BDF8' },
  { label: 'Livrée',          color: '#1257E0' }
];

window.KMK_SEED = function () {
  var P = window.KMK_DEMO_PASSWORD;
  return {
    version: 1,
    users: [
      { id: 'u-lea',    email: 'lea.bernard@kmk-campus.fr',     password: P, role: 'etudiant',  name: 'Léa Bernard',     initials: 'LB', title: 'L2 Informatique · Groupe A',       mfa: false, phone: '06 12 34 56 42', studentId: 's-lea', address: '14 rue des Lilas, 69007 Lyon' },
      { id: 'u-claire', email: 'claire.fontaine@kmk-campus.fr', password: P, role: 'formateur', name: 'Claire Fontaine', initials: 'CF', title: 'Formatrice · Algorithmique et BD', mfa: true,  phone: '06 71 22 90 18', address: '' },
      { id: 'u-scol',   email: 'scolarite@kmk-campus.fr',       password: P, role: 'scolarite', name: 'Nora Haddad',     initials: 'NH', title: 'Service scolarité et examens',     mfa: false, phone: '04 72 00 11 20', address: '' },
      { id: 'u-dir',    email: 'direction@kmk-campus.fr',       password: P, role: 'direction', name: 'Hélène Garnier',  initials: 'HG', title: 'Directrice générale',              mfa: true,  phone: '06 45 10 88 07', address: '' },
      { id: 'u-fin',    email: 'finance@kmk-campus.fr',         password: P, role: 'finance',   name: 'Julien Petit',    initials: 'JP', title: 'Responsable financier',            mfa: true,  phone: '06 30 64 52 91', address: '' },
      { id: 'u-parent', email: 'parent.bernard@kmk-campus.fr',  password: P, role: 'parent',    name: 'Isabelle Bernard',initials: 'IB', title: 'Parent de Léa Bernard',            mfa: false, phone: '06 98 76 54 33', childId: 's-lea', address: '14 rue des Lilas, 69007 Lyon' }
    ],

    students: [
      { id: 's-lea',     name: 'Léa Bernard',      initials: 'LB', formation: 'Licence Informatique', level: 'L2', group: 'A', avg: 14.2, att: 94, risk: 28, signal: '2 absences à justifier',          credits: 42, rank: 7,  email: 'lea.bernard@kmk-campus.fr' },
      { id: 's-sarah',   name: 'Sarah Benali',     initials: 'SB', formation: 'Licence Informatique', level: 'L2', group: 'A', avg: 10.2, att: 71, risk: 78, signal: '4 absences · 2 devoirs non remis',  credits: 30, rank: 61 },
      { id: 's-adam',    name: 'Adam Khelifi',     initials: 'AK', formation: 'Licence Informatique', level: 'L2', group: 'A', avg: 11.4, att: 78, risk: 64, signal: '−1,8 point · notes en baisse',      credits: 34, rank: 48 },
      { id: 's-yanis',   name: 'Yanis Ferhat',     initials: 'YF', formation: 'Licence Informatique', level: 'L2', group: 'A', avg: 9.8,  att: 82, risk: 61, signal: 'moyenne < 10 · 3 retards',          credits: 28, rank: 64 },
      { id: 's-hugo',    name: 'Hugo Martin',      initials: 'HM', formation: 'Licence Informatique', level: 'L2', group: 'A', avg: 11.9, att: 86, risk: 45, signal: 'activité plateforme en baisse',     credits: 36, rank: 40 },
      { id: 's-ines',    name: 'Inès Roux',        initials: 'IR', formation: 'Licence Informatique', level: 'L2', group: 'A', avg: 12.6, att: 90, risk: 42, signal: 'réclamation UE Réseaux',            credits: 38, rank: 29 },
      { id: 's-victor',  name: 'Victor Da Silva',  initials: 'VD', formation: 'Licence Informatique', level: 'L2', group: 'A', avg: 12.0, att: 88, risk: 37, signal: 'impayé transport 110 €',            credits: 37, rank: 35 },
      { id: 's-emma',    name: 'Emma Lefèvre',     initials: 'EL', formation: 'Licence Informatique', level: 'L2', group: 'A', avg: 13.4, att: 92, risk: 19, signal: 'RAS',                               credits: 41, rank: 14 },
      { id: 's-lina',    name: 'Lina Moreau',      initials: 'LM', formation: 'Licence Informatique', level: 'L2', group: 'A', avg: 13.8, att: 94, risk: 21, signal: 'assiduité 94 % · moyenne 13,8',     credits: 42, rank: 11 },
      { id: 's-thomas',  name: 'Thomas Mercier',   initials: 'TM', formation: 'Licence Informatique', level: 'L2', group: 'A', avg: 13.1, att: 96, risk: 18, signal: 'RAS',                               credits: 40, rank: 17 },
      { id: 's-chloe',   name: 'Chloé Diaz',       initials: 'CD', formation: 'Licence Informatique', level: 'L2', group: 'A', avg: 14.9, att: 98, risk: 9,  signal: 'RAS',                               credits: 46, rank: 4 },
      { id: 's-fanny',   name: 'Fanny Besson',     initials: 'FB', formation: 'Licence Informatique', level: 'L2', group: 'A', avg: 15.3, att: 97, risk: 8,  signal: 'RAS',                               credits: 48, rank: 2 },
      { id: 's-marc',    name: 'Marc Dubois',      initials: 'MD', formation: 'Licence Informatique', level: 'L2', group: 'B', avg: 11.2, att: 87, risk: 48, signal: 'reste dû 1 100 €',                  credits: 35, rank: 44 },
      { id: 's-samir',   name: 'Samir Bouazizi',   initials: 'SB', formation: 'Licence Informatique', level: 'L2', group: 'B', avg: 10.9, att: 76, risk: 55, signal: 'assiduité à risque',                credits: 31, rank: 52 },
      { id: 's-lucie',   name: 'Lucie Marchand',   initials: 'LM', formation: 'Licence Informatique', level: 'L2', group: 'B', avg: 12.4, att: 91, risk: 30, signal: 'réclamation frais d’inscription',   credits: 38, rank: 31 },
      { id: 's-nina',    name: 'Nina Garcia',      initials: 'NG', formation: 'Licence Informatique', level: 'L2', group: 'B', avg: 13.0, att: 93, risk: 16, signal: 'RAS',                               credits: 40, rank: 20 },
      { id: 's-omar',    name: 'Omar Haddou',      initials: 'OH', formation: 'Licence Informatique', level: 'L2', group: 'B', avg: 11.7, att: 84, risk: 39, signal: '2 absences non justifiées',         credits: 36, rank: 38 },
      { id: 's-mohamed', name: 'Mohamed Doucet',   initials: 'MD', formation: 'Licence Gestion',      level: 'L1', group: 'B', avg: 10.6, att: 80, risk: 59, signal: 'impayé 250 € · faible activité',    credits: 22, rank: 41 },
      { id: 's-anis',    name: 'Anis Khelifi',     initials: 'AK', formation: 'BUT Informatique',     level: 'B2', group: 'A', avg: 12.8, att: 93, risk: 22, signal: 'RAS',                               credits: 39, rank: 18 }
    ],

    grades: [
      { id: 'g1',  studentId: 's-lea', module: 'ALG', label: 'DS n°2',            value: 15.5, promo: 12.1, date: '2026-09-04', comment: 'Très bonne maîtrise de la récursivité. Attention aux cas limites.' },
      { id: 'g2',  studentId: 's-lea', module: 'ALG', label: 'Contrôle continu',  value: 13.0, promo: 11.8, date: '2026-09-02', comment: '' },
      { id: 'g3',  studentId: 's-lea', module: 'ALG', label: 'TP noté',           value: 14.0, promo: 12.6, date: '2026-09-01', comment: '' },
      { id: 'g4',  studentId: 's-lea', module: 'BD',  label: 'TP noté',           value: 13.0, promo: 12.8, date: '2026-09-03', comment: 'Requêtes correctes, normalisation à revoir.' },
      { id: 'g5',  studentId: 's-lea', module: 'BD',  label: 'QCM SQL',           value: 15.0, promo: 13.2, date: '2026-08-31', comment: '' },
      { id: 'g6',  studentId: 's-lea', module: 'RES', label: 'Projet fil rouge',  value: 12.2, promo: 13.4, date: '2026-09-02', comment: 'Rattrapage possible le 22/09.' },
      { id: 'g7',  studentId: 's-lea', module: 'ANG', label: 'Oral',              value: 16.0, promo: 14.1, date: '2026-09-01', comment: 'Excellente aisance à l’oral.' },
      { id: 'g8',  studentId: 's-lea', module: 'MAT', label: 'DS n°1',            value: 11.5, promo: 10.2, date: '2026-09-02', comment: '' },
      { id: 'g9',  studentId: 's-lea', module: 'MAT', label: 'Devoir maison',     value: 15.5, promo: 13.0, date: '2026-08-28', comment: '' },
      { id: 'g10', studentId: 's-lea', module: 'GES', label: 'Partiel',           value: 14.0, promo: 12.6, date: '2026-09-03', comment: '' },
      { id: 'g11', studentId: 's-lea', module: 'PRJ', label: 'Jalon 1',           value: 17.0, promo: 14.4, date: '2026-09-04', comment: 'Cahier des charges très clair.' }
    ],

    evaluations: [
      { id: 'ev-alg-ds2', module: 'ALG', label: 'DS n°2', group: 'A', date: '2026-09-04', status: 'published', publishedAt: '2026-09-04T18:10',
        grades: { 's-lea': 15.5, 's-sarah': 8.5, 's-adam': 10, 's-yanis': 7.5, 's-hugo': 11, 's-ines': 12.5, 's-victor': 11.5, 's-emma': 13, 's-lina': 14, 's-thomas': 12.5, 's-chloe': 16.5, 's-fanny': 17.5 } },
      { id: 'ev-alg-ds3', module: 'ALG', label: 'DS n°3', group: 'A', date: '2026-09-07', status: 'draft',
        grades: { 's-lea': null, 's-sarah': 9.5, 's-adam': 11, 's-yanis': 8.5, 's-hugo': null, 's-ines': 12, 's-victor': null, 's-emma': 14, 's-lina': 15.5, 's-thomas': 13.5, 's-chloe': 16, 's-fanny': 17 } },
      { id: 'ev-bd-tp2', module: 'BD', label: 'TP n°2', group: 'A', date: '2026-09-07', status: 'draft', grades: {} }
    ],

    /* séances (emploi du temps) — heures entre 08:00 et 18:00 */
    sessions: [
      { id: 'se1',  date: '2026-09-07', start: '08:00', end: '09:00', title: 'Anglais technique', module: 'ANG', room: 'Salle B12', groups: ['A'], teacher: 'Nadia Bouchard', type: 'cours' },
      { id: 'se2',  date: '2026-09-07', start: '10:00', end: '12:00', title: 'Algorithmique',     module: 'ALG', room: 'Amphi B',   groups: ['B'], teacher: 'Claire Fontaine', teacherId: 'u-claire', type: 'cours' },
      { id: 'se3',  date: '2026-09-07', start: '14:00', end: '15:30', title: 'TP Base de données',module: 'BD',  room: 'Labo 2',    groups: ['A'], teacher: 'Claire Fontaine', teacherId: 'u-claire', type: 'tp', changed: 'Salle A204 → Labo 2' },
      { id: 'se4',  date: '2026-09-08', start: '10:00', end: '11:45', title: 'Algorithmique',     module: 'ALG', room: 'Amphi A',   groups: ['A'], teacher: 'Claire Fontaine', teacherId: 'u-claire', type: 'cours' },
      { id: 'se5',  date: '2026-09-08', start: '15:30', end: '16:30', title: 'Réunion de groupe', module: 'PRJ', room: 'Salle B08', groups: ['A'], teacher: 'Paul Vasseur', type: 'reunion' },
      { id: 'se6',  date: '2026-09-09', start: '08:00', end: '09:00', title: 'Mathématiques',     module: 'MAT', room: 'Salle C04', groups: ['A'], teacher: 'Karim Slimani', type: 'cours' },
      { id: 'se7',  date: '2026-09-09', start: '10:00', end: '11:30', title: 'Base de données',   module: 'BD',  room: 'Labo 2',    groups: ['B'], teacher: 'Claire Fontaine', teacherId: 'u-claire', type: 'tp' },
      { id: 'se8',  date: '2026-09-09', start: '13:00', end: '14:45', title: 'Projet tutoré',     module: 'PRJ', room: 'Salle B08', groups: ['A'], teacher: 'Paul Vasseur', type: 'cours' },
      { id: 'se9',  date: '2026-09-10', start: '10:00', end: '11:30', title: 'Réseaux',           module: 'RES', room: 'Salle A101',groups: ['A'], teacher: 'Marc Besson', type: 'cours' },
      { id: 'se10', date: '2026-09-10', start: '14:00', end: '16:00', title: 'Algorithmique (TD)',module: 'ALG', room: 'Salle A204',groups: ['B'], teacher: 'Claire Fontaine', teacherId: 'u-claire', type: 'cours' },
      { id: 'se11', date: '2026-09-10', start: '16:00', end: '17:00', title: 'Anglais technique', module: 'ANG', room: 'Salle B12', groups: ['A'], teacher: 'Nadia Bouchard', type: 'cours' },
      { id: 'se12', date: '2026-09-11', start: '10:00', end: '11:00', title: 'PPE',               module: 'PRJ', room: 'Bureau pédagogique', groups: ['A'], teacher: 'Paul Vasseur', type: 'reunion' },
      { id: 'se13', date: '2026-09-11', start: '13:00', end: '14:45', title: 'Examen — Algorithmique', module: 'ALG', room: 'Amphi A', groups: ['A'], teacher: 'Claire Fontaine', teacherId: 'u-claire', type: 'examen' },
      { id: 'se14', date: '2026-09-11', start: '15:30', end: '17:00', title: 'Implémentation ERP', module: 'GES', room: 'Salle C02', groups: ['A'], teacher: 'Inès Roche', type: 'cours', cancelled: true },
      { id: 'se15', date: '2026-09-12', start: '10:00', end: '11:45', title: 'Atelier portfolio', module: 'PRJ', room: 'Labo 1',    groups: ['A'], teacher: 'Paul Vasseur', type: 'tp' },
      { id: 'se16', date: '2026-09-14', start: '08:00', end: '10:00', title: 'Mathématiques',     module: 'MAT', room: 'Amphi A',   groups: ['A'], teacher: 'Karim Slimani', type: 'cours' },
      { id: 'se17', date: '2026-09-14', start: '10:15', end: '12:00', title: 'Algorithmique (TD)',module: 'ALG', room: 'Salle A204',groups: ['A'], teacher: 'Claire Fontaine', teacherId: 'u-claire', type: 'cours' },
      { id: 'se18', date: '2026-09-15', start: '14:00', end: '16:00', title: 'TP Réseaux',        module: 'RES', room: 'Labo 3',    groups: ['A'], teacher: 'Marc Besson', type: 'tp' },
      { id: 'se19', date: '2026-09-15', start: '09:00', end: '11:00', title: 'Base de données',   module: 'BD',  room: 'Amphi B',   groups: ['B'], teacher: 'Claire Fontaine', teacherId: 'u-claire', type: 'cours' },
      { id: 'se20', date: '2026-09-16', start: '09:00', end: '10:30', title: 'Base de données',   module: 'BD',  room: 'Amphi B',   groups: ['A'], teacher: 'Claire Fontaine', teacherId: 'u-claire', type: 'cours' },
      { id: 'se21', date: '2026-09-16', start: '13:00', end: '14:30', title: 'Gestion',           module: 'GES', room: 'Salle C02', groups: ['A'], teacher: 'Inès Roche', type: 'cours' },
      { id: 'se22', date: '2026-09-17', start: '10:00', end: '11:00', title: 'Anglais technique', module: 'ANG', room: 'Salle B12', groups: ['A'], teacher: 'Nadia Bouchard', type: 'cours' },
      { id: 'se23', date: '2026-09-17', start: '16:30', end: '17:30', title: 'Tutorat Algorithmique', module: 'ALG', room: 'Salle A204', groups: ['A', 'B'], teacher: 'Claire Fontaine', teacherId: 'u-claire', type: 'reunion' },
      { id: 'se24', date: '2026-09-18', start: '09:00', end: '12:00', title: 'Projet tutoré',     module: 'PRJ', room: 'Salle B08', groups: ['A'], teacher: 'Paul Vasseur', type: 'tp' },
      { id: 'se25', date: '2026-09-18', start: '14:00', end: '15:00', title: 'Communication pro', module: 'ANG', room: 'Salle C01', groups: ['A'], teacher: 'Nadia Bouchard', type: 'cours' }
    ],

    attendance: [
      { sessionId: 'se2', takenAt: '2026-09-07T10:06', by: 'u-claire', marks: { 's-marc': 'P', 's-samir': 'A', 's-lucie': 'P', 's-nina': 'P', 's-omar': 'R' } }
    ],

    absences: [
      { id: 'ab1', studentId: 's-lea', module: 'MAT', date: '2026-09-01', slot: '08:00 – 09:00', status: 'a_justifier', deadline: '2026-09-12' },
      { id: 'ab2', studentId: 's-lea', module: 'ANG', date: '2026-09-02', slot: '16:00 – 17:00', status: 'a_justifier', deadline: '2026-09-12' },
      { id: 'ab3', studentId: 's-lea', module: 'GES', date: '2026-08-28', slot: '13:00 – 14:30', status: 'justifiee', reason: 'Rendez-vous médical', file: 'certificat-medical.pdf', deadline: '2026-09-04' },
      { id: 'ab4', studentId: 's-samir', module: 'MAT', date: '2026-09-03', slot: '08:00 – 09:00', status: 'en_attente', reason: 'Panne de transport (grève TCL)', file: 'attestation-tcl.pdf', deadline: '2026-09-14', submittedAt: '2026-09-06T19:42' },
      { id: 'ab5', studentId: 's-sarah', module: 'ALG', date: '2026-09-02', slot: '10:00 – 11:45', status: 'en_attente', reason: 'Maladie', file: 'arret-maladie.jpg', deadline: '2026-09-13', submittedAt: '2026-09-07T07:15' },
      { id: 'ab6', studentId: 's-omar', module: 'RES', date: '2026-09-03', slot: '10:00 – 11:30', status: 'en_attente', reason: 'Convocation administrative', file: 'convocation-prefecture.pdf', deadline: '2026-09-14', submittedAt: '2026-09-05T12:03' }
    ],

    requests: [
      { id: 'r1',  ref: 'DEM-2026-114', studentId: 's-lea',    type: 'att-scol', details: 'Pour ma demande de logement CROUS.', stage: 2, createdAt: '2026-09-06T09:12', history: [{ stage: 0, at: '2026-09-06T09:12', by: 'Léa Bernard' }, { stage: 1, at: '2026-09-06T11:30', by: 'Nora Haddad' }, { stage: 2, at: '2026-09-07T08:45', by: 'Nora Haddad' }] },
      { id: 'r2',  ref: 'DEM-2026-101', studentId: 's-lea',    type: 'releve',   details: 'Relevé de notes 2025-2026 signé.', stage: 4, createdAt: '2026-09-01T10:00', history: [{ stage: 0, at: '2026-09-01T10:00', by: 'Léa Bernard' }, { stage: 3, at: '2026-09-02T09:20', by: 'Nora Haddad' }, { stage: 4, at: '2026-09-02T09:21', by: 'Système' }], docId: 'd1' },
      { id: 'r3',  ref: 'DEM-2026-117', studentId: 's-marc',   type: 'cert-reu', details: 'Certificat bilingue.', stage: 0, createdAt: '2026-09-07T06:40', history: [{ stage: 0, at: '2026-09-07T06:40', by: 'Marc Dubois' }] },
      { id: 'r4',  ref: 'DEM-2026-116', studentId: 's-ines',   type: 'reclam',   details: 'Réclamation note UE Réseaux — projet fil rouge.', stage: 0, createdAt: '2026-09-06T21:05', history: [{ stage: 0, at: '2026-09-06T21:05', by: 'Inès Roux' }] },
      { id: 'r5',  ref: 'DEM-2026-112', studentId: 's-samir',  type: 'att-scol', details: 'Pour la CAF.', stage: 1, createdAt: '2026-09-05T15:30', history: [{ stage: 0, at: '2026-09-05T15:30', by: 'Samir Bouazizi' }, { stage: 1, at: '2026-09-06T09:00', by: 'Nora Haddad' }], note: 'Dossier incomplet : pièce d’identité expirée.' },
      { id: 'r6',  ref: 'DEM-2026-110', studentId: 's-chloe',  type: 'cert-reu', details: 'Attestation de réussite L1.', stage: 1, createdAt: '2026-09-05T10:10', history: [{ stage: 0, at: '2026-09-05T10:10', by: 'Chloé Diaz' }, { stage: 1, at: '2026-09-05T14:00', by: 'Nora Haddad' }] },
      { id: 'r7',  ref: 'DEM-2026-108', studentId: 's-anis',   type: 'releve',   details: 'Ratification UE Projet.', stage: 2, createdAt: '2026-09-04T16:20', history: [{ stage: 0, at: '2026-09-04T16:20', by: 'Anis Khelifi' }, { stage: 2, at: '2026-09-06T10:00', by: 'Nora Haddad' }] },
      { id: 'r8',  ref: 'DEM-2026-107', studentId: 's-lucie',  type: 'reclam',   details: 'Réclamation frais d’inscription (double prélèvement).', stage: 2, createdAt: '2026-09-04T09:00', history: [{ stage: 0, at: '2026-09-04T09:00', by: 'Lucie Marchand' }, { stage: 2, at: '2026-09-05T11:00', by: 'Julien Petit' }] },
      { id: 'r9',  ref: 'DEM-2026-105', studentId: 's-fanny',  type: 'att-scol', details: 'Attestation d’inscription.', stage: 3, createdAt: '2026-09-03T08:30', history: [{ stage: 0, at: '2026-09-03T08:30', by: 'Fanny Besson' }, { stage: 3, at: '2026-09-07T08:10', by: 'Nora Haddad' }] },
      { id: 'r10', ref: 'DEM-2026-104', studentId: 's-thomas', type: 'releve',   details: 'Relevé de notes signé.', stage: 3, createdAt: '2026-09-02T13:00', history: [{ stage: 0, at: '2026-09-02T13:00', by: 'Thomas Mercier' }, { stage: 3, at: '2026-09-06T16:40', by: 'Nora Haddad' }] },
      { id: 'r11', ref: 'DEM-2026-099', studentId: 's-victor', type: 'att-scol', details: 'Certificat de scolarité 2026-2027.', stage: 4, createdAt: '2026-08-31T09:00', history: [{ stage: 0, at: '2026-08-31T09:00', by: 'Victor Da Silva' }, { stage: 4, at: '2026-09-02T10:00', by: 'Nora Haddad' }] }
    ],
    requestSeq: 118,

    documents: [
      { id: 'd1', studentId: 's-lea', kind: 'releve',   title: 'Relevé de notes 2025-2026',            date: '2026-09-02', signed: true },
      { id: 'd2', studentId: 's-lea', kind: 'certif',   title: 'Certificat de scolarité 2026-2027',    date: '2026-08-29', signed: true },
      { id: 'd3', studentId: 's-lea', kind: 'convoc',   title: 'Convocation — Examen d’Algorithmique', date: '2026-09-05', signed: false },
      { id: 'd4', studentId: 's-lea', kind: 'reglement',title: 'Règlement des études 2026-2027',       date: '2026-08-25', signed: false }
    ],

    invoices: [
      { id: 'i1',  studentId: 's-lea', label: 'Frais d’inscription 2026-2027', amount: 1600, due: '2026-07-02', paidAt: '2026-07-02', method: 'Carte bancaire' },
      { id: 'i2',  studentId: 's-lea', label: 'Mensualité juillet',            amount: 850,  due: '2026-07-05', paidAt: '2026-07-05', method: 'Prélèvement' },
      { id: 'i3',  studentId: 's-lea', label: 'Mensualité août',               amount: 850,  due: '2026-08-05', paidAt: '2026-08-05', method: 'Prélèvement' },
      { id: 'i4',  studentId: 's-lea', label: 'Mensualité septembre',          amount: 850,  due: '2026-09-05', paidAt: '2026-09-05', method: 'Prélèvement' },
      { id: 'i5',  studentId: 's-lea', label: 'Solde frais de scolarité',      amount: 250,  due: '2026-09-15' },
      { id: 'i6',  studentId: 's-lea', label: 'Transport universitaire',       amount: 110,  due: '2026-09-30' },
      { id: 'i7',  studentId: 's-lea', label: 'Mensualité octobre',            amount: 850,  due: '2026-10-05' },
      { id: 'i8',  studentId: 's-marc',    label: 'Mensualités juillet–août',  amount: 1100, due: '2026-08-31', reminders: 2 },
      { id: 'i9',  studentId: 's-mohamed', label: 'Mensualité septembre',      amount: 250,  due: '2026-09-01', reminders: 1 },
      { id: 'i10', studentId: 's-lucie',   label: 'Frais d’inscription',       amount: 320,  due: '2026-09-05', reminders: 0 },
      { id: 'i11', studentId: 's-sarah',   label: 'Mensualité septembre',      amount: 850,  due: '2026-09-05', reminders: 1 },
      { id: 'i12', studentId: 's-victor',  label: 'Transport universitaire',   amount: 110,  due: '2026-08-28', reminders: 1 },
      { id: 'i13', studentId: 's-samir',   label: 'Mensualité septembre',      amount: 850,  due: '2026-09-15' },
      { id: 'i14', studentId: 's-yanis',   label: 'Mensualité septembre',      amount: 850,  due: '2026-09-15' },
      { id: 'i15', studentId: 's-anis',    label: 'Frais d’inscription',       amount: 1600, due: '2026-09-10' },
      { id: 'i16', studentId: 's-adam',    label: 'Mensualité septembre',      amount: 850,  due: '2026-09-05', paidAt: '2026-09-04', method: 'Carte bancaire' },
      { id: 'i17', studentId: 's-lina',    label: 'Mensualité septembre',      amount: 850,  due: '2026-09-05', paidAt: '2026-09-05', method: 'Prélèvement' },
      { id: 'i18', studentId: 's-chloe',   label: 'Mensualité septembre',      amount: 850,  due: '2026-09-05', paidAt: '2026-09-05', method: 'Prélèvement' },
      { id: 'i19', studentId: 's-hugo',    label: 'Mensualité septembre',      amount: 850,  due: '2026-09-05', paidAt: '2026-09-03', method: 'Virement' },
      { id: 'i20', studentId: 's-emma',    label: 'Mensualité septembre',      amount: 850,  due: '2026-09-05', paidAt: '2026-09-05', method: 'Prélèvement' },
      { id: 'i21', studentId: 's-omar',    label: 'Mensualité septembre',      amount: 850,  due: '2026-09-05', reminders: 0 },
      { id: 'i22', studentId: 's-nina',    label: 'Mensualité septembre',      amount: 850,  due: '2026-09-05', paidAt: '2026-09-05', method: 'Prélèvement' }
    ],
    aids: [ { studentId: 's-lea', label: 'Bourse au mérite', amount: 800, date: '2026-08-12' } ],
    /* encaissements mensuels du campus (k€) */
    cashflow: [ { m: 'Avr', v: 182 }, { m: 'Mai', v: 214 }, { m: 'Juin', v: 203 }, { m: 'Juil', v: 246 }, { m: 'Août', v: 231 }, { m: 'Sept', v: 244 } ],

    events: [
      { id: 'e1', title: 'Journée d’intégration',      date: '2026-09-12', time: '09:00', place: 'Parvis du campus',      capacity: 300, base: 251, tag: 'Vie étudiante', color: '#1257E0', desc: 'Accueil des promotions, rallye campus, déjeuner et soirée des associations.', attendees: ['u-lea'] },
      { id: 'e2', title: 'Club Robotique — séance de rentrée', date: '2026-09-10', time: '17:30', place: 'Labo 3', capacity: 30, base: 18, tag: 'Club', color: '#3C7EA8', desc: 'Présentation des projets de l’année et constitution des équipes.', attendees: [] },
      { id: 'e3', title: 'Atelier CV & LinkedIn',      date: '2026-09-16', time: '12:30', place: 'Salle C01',             capacity: 25,  base: 25,  tag: 'Carrière', color: '#E0912A', desc: 'Un atelier pratique animé par le service relations entreprises.', attendees: [] },
      { id: 'e4', title: 'Conférence Alumni',          date: '2026-09-21', time: '18:00', place: 'Amphi A',               capacity: 120, base: 108, tag: 'Conférence', color: '#0A2A6E', desc: 'Cinq anciens racontent leur parcours, de la licence au premier poste.', attendees: [] },
      { id: 'e5', title: 'Hackathon KMK',              date: '2026-09-26', time: '09:00', place: 'Labos 1 à 3',           capacity: 60,  base: 41,  tag: 'Compétition', color: '#2E8BFF', desc: '24 heures pour prototyper un service utile au campus. Équipes de 3 à 5.', attendees: [] },
      { id: 'e6', title: 'Forum entreprises',          date: '2026-10-08', time: '10:00', place: 'Hall principal',        capacity: 400, base: 212, tag: 'Carrière', color: '#38BDF8', desc: '40 entreprises partenaires, stages et alternances.', attendees: [] }
    ],

    threads: [
      { id: 't1', subject: 'Question sur le DS n°2', participants: ['u-lea', 'u-claire'], messages: [
        { from: 'u-lea', text: 'Bonjour Madame, pourriez-vous m’indiquer où je perds des points sur l’exercice 3 du DS n°2 ?', at: '2026-09-05T17:20' },
        { from: 'u-claire', text: 'Bonjour Léa, sur l’exercice 3 le cas de la liste vide n’est pas traité. La correction détaillée est dans l’onglet Ressources.', at: '2026-09-05T18:02' },
        { from: 'u-lea', text: 'Merci beaucoup, je regarde ça !', at: '2026-09-05T18:10' } ], readBy: { 'u-lea': 3, 'u-claire': 3 } },
      { id: 't2', subject: 'Attestation de scolarité — logement', participants: ['u-lea', 'u-scol'], messages: [
        { from: 'u-scol', text: 'Bonjour Léa, votre demande DEM-2026-114 est en traitement. Vous recevrez une notification dès que le document sera prêt.', at: '2026-09-07T08:46' } ], readBy: { 'u-scol': 1 } },
      { id: 't3', subject: 'Absences de Léa', participants: ['u-parent', 'u-scol'], messages: [
        { from: 'u-parent', text: 'Bonjour, j’ai reçu une alerte pour deux absences de ma fille. Pouvez-vous me préciser les cours concernés ?', at: '2026-09-06T20:15' } ], readBy: { 'u-parent': 1 } },
      { id: 't4', subject: 'Saisie des notes — DS n°3', participants: ['u-claire', 'u-scol'], messages: [
        { from: 'u-scol', text: 'Bonjour Claire, pensez à publier les notes du DS n°3 avant mercredi pour le jury intermédiaire.', at: '2026-09-07T09:05' } ], readBy: { 'u-scol': 1 } },
      { id: 't5', subject: 'Point impayés BTS Tourisme', participants: ['u-dir', 'u-fin'], messages: [
        { from: 'u-dir', text: 'Julien, peux-tu me préparer un point sur les impayés de plus de 30 jours pour le comité de jeudi ?', at: '2026-09-07T08:30' },
        { from: 'u-fin', text: 'Oui, 6 échéances dépassées en BTS Tourisme. Je t’envoie l’export avant midi.', at: '2026-09-07T08:52' } ], readBy: { 'u-dir': 2, 'u-fin': 2 } }
    ],

    notifications: [
      { id: 'n1',  to: ['u-lea'], title: 'KMK AI — signal détecté', body: 'Risque estimé 34 % en Algorithmique · ouvrir l’analyse', icon: 'zap', tone: 'blue', route: 'ia', at: '2026-09-07T07:00' },
      { id: 'n2',  to: ['u-lea', 'u-parent'], title: 'Nouvelle note — Algorithmique', body: 'DS n°2 · 15,5/20 (promo 12,1)', icon: 'award', tone: 'blue', route: 'notes', at: '2026-09-04T18:10' },
      { id: 'n3',  to: ['u-lea', 'u-parent'], title: '2 absences à justifier', body: 'Mathématiques et Anglais — avant le 12/09', icon: 'alert-triangle', tone: 'amber', route: 'absences', at: '2026-09-03T08:00' },
      { id: 'n4',  to: ['u-lea'], title: 'Salle modifiée', body: 'TP Base de données — lundi 14:00 — Labo 2', icon: 'refresh-cw', tone: 'blue', route: 'emploi-du-temps', at: '2026-09-06T17:30' },
      { id: 'n5',  to: ['u-lea', 'u-parent'], title: 'Échéance de paiement', body: '250 € avant le 15 septembre — payer en ligne', icon: 'wallet', tone: 'amber', route: 'finances', at: '2026-09-06T09:00' },
      { id: 'n6',  to: ['u-lea'], title: 'Conférence Alumni', body: 'Plus que 12 places — inscrivez-vous', icon: 'calendar-check', tone: 'blue', route: 'evenements', at: '2026-09-05T12:00' },
      { id: 'n7',  to: ['u-claire'], title: 'Notes à publier', body: 'Algorithmique DS n°3 — 3 notes manquantes', icon: 'clipboard-check', tone: 'amber', route: 'saisie-notes', at: '2026-09-07T07:30' },
      { id: 'n8',  to: ['u-claire'], title: 'Appel à faire', body: 'TP Base de données — Groupe A — 14:00', icon: 'user-check', tone: 'blue', route: 'appel', at: '2026-09-07T07:30' },
      { id: 'n9',  to: ['u-scol'], title: '3 justificatifs à valider', body: 'Samir Bouazizi, Sarah Benali, Omar Haddou', icon: 'paperclip', tone: 'amber', route: 'justificatifs', at: '2026-09-07T07:20' },
      { id: 'n10', to: ['u-scol'], title: '2 nouvelles demandes', body: 'Certificat bilingue, réclamation UE Réseaux', icon: 'inbox', tone: 'blue', route: 'demandes', at: '2026-09-07T06:41' },
      { id: 'n11', to: ['u-dir'], title: 'Campus Health — rapport du matin', body: 'Score 82/100 · 37 étudiants à risque', icon: 'activity', tone: 'blue', route: 'tableau-de-bord', at: '2026-09-07T06:00' },
      { id: 'n12', to: ['u-dir'], title: 'Early Warning — 2 nouveaux dossiers', body: 'Sarah Benali (78), Adam Khelifi (64)', icon: 'alert-triangle', tone: 'amber', route: 'early-warning', at: '2026-09-07T05:30' },
      { id: 'n13', to: ['u-fin'], title: '7 échéances en retard', body: 'Relance J+3 programmée pour 4 dossiers', icon: 'wallet', tone: 'amber', route: 'echeances', at: '2026-09-07T06:30' },
      { id: 'n14', to: ['u-fin'], title: 'Réclamation — double prélèvement', body: 'Lucie Marchand · DEM-2026-107', icon: 'inbox', tone: 'blue', route: 'echeances', at: '2026-09-05T11:00' },
      { id: 'n15', to: ['u-parent'], title: 'Bienvenue sur KMK Campus', body: 'Suivez l’assiduité, les résultats et les échéances de Léa', icon: 'heart', tone: 'blue', route: 'tableau-de-bord', at: '2026-09-01T09:00' }
    ],

    announcements: [
      { id: 'an1', title: 'Rentrée 2026 — informations pratiques', body: 'Retrouvez le plan du campus, les horaires de la bibliothèque et le calendrier des examens.', audience: 'Tous les étudiants', channels: ['Push', 'E-mail'], recipients: 253, at: '2026-09-01T08:00', by: 'Nora Haddad', opens: 81 }
    ],

    automations: [
      { id: 'note',    name: 'Nouvelle note publiée',    channel: 'Push',   runs: 412, on: true,  when: 'Une note est validée par le formateur', cond: 'L’étudiant est inscrit dans le groupe évalué', then: 'Notification push qui ouvre l’évaluation, moyenne recalculée' },
      { id: 'absence', name: 'Absence à justifier',      channel: 'Push',   runs: 96,  on: true,  when: 'Une absence est saisie à l’appel', cond: 'Absence non justifiée · plus de 2 en 3 semaines → escalade', then: 'Push + e-mail à l’étudiant et au parent, relance à 48 h' },
      { id: 'edt',     name: 'Changement d’emploi du temps', channel: 'E-mail', runs: 34, on: true, when: 'La scolarité modifie une séance', cond: 'Seuls les étudiants du groupe concerné', then: 'Notification ciblée + mise à jour du planning' },
      { id: 'convoc',  name: 'Convocation à un examen',  channel: 'SMS',    runs: 148, on: true,  when: '72 h avant un examen', cond: 'Étudiant inscrit à l’épreuve', then: 'SMS + convocation PDF dans les documents' },
      { id: 'echeance',name: 'Rappel d’échéance',        channel: 'SMS',    runs: 231, on: true,  when: 'J-7, J-3, J, J+3, J+7, J+15', cond: 'Échéance non réglée', then: 'Relance graduée puis escalade au responsable financier' },
      { id: 'jury',    name: 'Résultats et relevés',     channel: 'E-mail', runs: 12,  on: false, when: 'Décision du jury publiée', cond: 'Étudiant concerné par la session', then: 'Relevé signé généré et envoyé' }
    ],

    audit: [
      { at: '2026-09-06T18:02', userId: 'u-claire', action: 'auth.login',   detail: 'Connexion réussie (MFA)', ip: '10.12.4.21' },
      { at: '2026-09-06T21:05', userId: 'u-lea',    action: 'auth.login',   detail: 'Connexion réussie', ip: '86.214.2.17' },
      { at: '2026-09-07T06:58', userId: 'u-scol',   action: 'auth.login',   detail: 'Connexion réussie', ip: '10.12.4.8' },
      { at: '2026-09-07T08:45', userId: 'u-scol',   action: 'request.stage',detail: 'DEM-2026-114 → En traitement', ip: '10.12.4.8' }
    ],

    settings: { mfaStaff: true, auditLog: true, backups: true, encryption: true, multiCampus: true, sessionTimeout: true },
    flags: {}
  };
};
