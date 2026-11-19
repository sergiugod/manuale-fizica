/**
 * Formarea autorilor de manuale – Fizică. Astronomie
 * Script Google Apps Script pentru totalul comun al voturilor (telefon → foaie Google → ecran).
 *
 * Instalare (o singură dată, circa 10 minute): vezi apps-script/INSTALARE.md.
 * Datele rămân în foaia Google a formatorului. Nu se colectează nume sau e-mailuri:
 * fiecare telefon primește un cod aleatoriu, folosit doar pentru ca un participant să voteze o singură dată pe întrebare.
 */

const SHEET_NAME = 'Voturi';
const MAX_LEN = 60; // lungimea maximă a unui răspuns de tip „cuvânt”

function doGet(e) {
  const p = (e && e.parameter) || {};
  const cb = (p.callback || '').replace(/[^\w$.]/g, '');
  let out;
  try {
    if (p.action === 'vote') out = vote_(p.q, p.a, p.d);
    else if (p.action === 'results') out = results_(p.q);
    else if (p.action === 'reset') out = reset_(p.q, p.pin);
    else out = { ok: true, info: 'Scriptul pentru vot funcționează.' };
  } catch (err) {
    out = { ok: false, error: String(err) };
  }
  const body = cb ? cb + '(' + JSON.stringify(out) + ')' : JSON.stringify(out);
  return ContentService.createTextOutput(body)
    .setMimeType(cb ? ContentService.MimeType.JAVASCRIPT : ContentService.MimeType.JSON);
}

function sheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.appendRow(['Ora', 'Întrebare', 'Dispozitiv', 'Răspuns']);
    sh.setFrozenRows(1);
  }
  return sh;
}

function clean_(s) {
  return String(s || '').replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, MAX_LEN);
}

function vote_(q, a, d) {
  q = clean_(q); a = clean_(a); d = clean_(d);
  if (!q || !a) return { ok: false, error: 'lipsește întrebarea sau răspunsul' };
  const lock = LockService.getScriptLock();
  lock.waitLock(5000);
  try {
    const sh = sheet_();
    const last = sh.getLastRow();
    if (last > 1 && d) {
      const rows = sh.getRange(2, 1, last - 1, 4).getValues();
      for (let i = 0; i < rows.length; i++) {
        if (rows[i][1] === q && rows[i][2] === d) {
          sh.getRange(i + 2, 1, 1, 4).setValues([[new Date(), q, d, a]]);
          return { ok: true, updated: true };
        }
      }
    }
    sh.appendRow([new Date(), q, d, a]);
    return { ok: true };
  } finally {
    lock.releaseLock();
  }
}

function results_(q) {
  q = clean_(q);
  const sh = sheet_();
  const last = sh.getLastRow();
  const counts = {};
  let total = 0;
  if (last > 1) {
    const rows = sh.getRange(2, 1, last - 1, 4).getValues();
    rows.forEach(function (r) {
      if (r[1] === q) {
        const key = String(r[3]);
        counts[key] = (counts[key] || 0) + 1;
        total++;
      }
    });
  }
  return { ok: true, q: q, total: total, counts: counts };
}

/** Șterge voturile unei întrebări (q) sau toate (q=ALL). Cere PIN-ul din Proprietățile scriptului. */
function reset_(q, pin) {
  const saved = PropertiesService.getScriptProperties().getProperty('PIN');
  if (!saved || String(pin) !== saved) return { ok: false, error: 'PIN greșit' };
  const sh = sheet_();
  const last = sh.getLastRow();
  if (last < 2) return { ok: true, deleted: 0 };
  const rows = sh.getRange(2, 1, last - 1, 4).getValues();
  let deleted = 0;
  for (let i = rows.length - 1; i >= 0; i--) {
    if (q === 'ALL' || rows[i][1] === q) { sh.deleteRow(i + 2); deleted++; }
  }
  return { ok: true, deleted: deleted };
}
