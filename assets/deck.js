/* Motorul prezentării + activitățile interactive.
   Taste: → / Spațiu – înainte; ← – înapoi; N – notele formatorului; F – ecran complet; H – ajutor. */
(function(){
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const esc = s => String(s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
  const json = el => { const s = $('script[type="application/json"]', el); return s ? JSON.parse(s.textContent) : {}; };

  /* ---------- scalarea scenei ---------- */
  const stage = $("#stage"), wrap = $("#stage-wrap");
  function fit(){
    if(!stage) return;
    const notesW = $("#notes") && $("#notes").classList.contains("show") ? 420 : 0;
    const w = wrap.clientWidth - notesW, h = wrap.clientHeight;
    const k = Math.min(w / 1280, h / 720) * 0.98;
    stage.style.transform = `scale(${k})`;
    stage.style.marginRight = notesW + "px";
  }
  window.addEventListener("resize", fit);

  /* ---------- navigare ---------- */
  const slides = $$(".slide");
  let cur = 0;
  const startStr = document.body.dataset.start || "09:00";
  const [sh, sm] = startStr.split(":").map(Number);
  let acc = 0;
  slides.forEach(s => { s.dataset.planStart = acc; acc += Number(s.dataset.min || 0); });
  const total = acc;
  const hm = m => { const t = sh * 60 + sm + m; return String(Math.floor(t / 60)).padStart(2, "0") + ":" + String(t % 60).padStart(2, "0"); };

  function show(i){
    i = Math.max(0, Math.min(slides.length - 1, i));
    slides[cur] && slides[cur].classList.remove("active");
    cur = i; const s = slides[cur]; s.classList.add("active");
    history.replaceState(null, "", "#" + (cur + 1));
    $("#bar .prog i").style.width = ((cur + 1) / slides.length * 100) + "%";
    $("#bar .cnt").textContent = (cur + 1) + " / " + slides.length;
    const ps = Number(s.dataset.planStart), mn = Number(s.dataset.min || 0);
    $("#bar .plan").textContent = "Plan: " + hm(ps) + "–" + hm(ps + mn) + " (" + mn + " min)";
    const n = window.__NOTES ? window.__NOTES[cur] : "";
    $("#notes .plan").textContent = "Slide " + (cur + 1) + " · plan " + hm(ps) + "–" + hm(ps + mn) + " · " + mn + " min";
    $("#notes .body").innerHTML = n || "<p class='muted'>Fără note.</p>";
    document.dispatchEvent(new CustomEvent("slide", {detail: s}));
    tick();
  }
  function tick(){
    const now = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes();
    const s = slides[cur]; if(!s) return;
    const planMin = sh * 60 + sm + Number(s.dataset.planStart);
    const diff = nowMin - planMin;
    const c = $("#bar .clock");
    c.textContent = "Ora: " + String(now.getHours()).padStart(2,"0") + ":" + String(now.getMinutes()).padStart(2,"0");
    // abatere doar în intervalul sesiunii
    const inSession = nowMin >= sh * 60 + sm - 30 && nowMin <= sh * 60 + sm + total + 30;
    c.className = "clock" + (inSession ? (diff > 3 ? " late" : " ok") : "");
    c.title = inSession ? (diff > 0 ? "Întârziere față de plan: " + diff + " min" : "În avans: " + (-diff) + " min") : "";
  }
  setInterval(tick, 20000);

  document.addEventListener("keydown", e => {
    if(e.target.matches("input, textarea, select")) return;
    if(["ArrowRight","PageDown"," "].includes(e.key)){ e.preventDefault(); show(cur + 1); }
    else if(["ArrowLeft","PageUp"].includes(e.key)){ e.preventDefault(); show(cur - 1); }
    else if(e.key === "Home") show(0);
    else if(e.key === "End") show(slides.length - 1);
    else if(e.key.toLowerCase() === "n" && window.__NOTES) toggleNotes();
    else if(e.key.toLowerCase() === "f") fullscreen();
    else if(e.key.toLowerCase() === "h" || e.key === "?") $("#help").classList.toggle("show");
    else if(e.key === "Escape") $("#help").classList.remove("show");
  });
  function toggleNotes(){ $("#notes").classList.toggle("show"); fit(); }
  function fullscreen(){ if(!document.fullscreenElement) document.documentElement.requestFullscreen().catch(()=>{}); else document.exitFullscreen(); }
  window.Deck = {show, next: () => show(cur + 1), prev: () => show(cur - 1), toggleNotes, fullscreen};

  $("#bar .b-prev").onclick = () => show(cur - 1);
  $("#bar .b-next").onclick = () => show(cur + 1);
  $("#bar .b-notes").onclick = toggleNotes;
  $("#bar .b-full").onclick = fullscreen;
  $("#bar .b-set").onclick = settings;

  /* ---------- regimul de formator (parolă) ---------- */
  const encEl = $("#enc-notes"), blob = encEl ? JSON.parse(encEl.textContent) : null;
  function formatorOn(on){
    $$("#bar .fo").forEach(b => b.style.display = on ? "" : "none");
    $("#bar .b-lock").textContent = on ? "🔓 Ieșire formator" : "🔒 Formator";
    if(!on){ window.__NOTES = null; $("#notes").classList.remove("show"); fit(); }
    show(cur);
  }
  async function unlock(pw, silent){
    try{ window.__NOTES = JSON.parse(await Formator.decrypt(blob, pw)); Formator.remember(pw); formatorOn(true); return true; }
    catch(e){ if(!silent) alert("Parolă greșită."); return false; }
  }
  $("#bar .b-lock").onclick = () => {
    if(window.__NOTES){ Formator.forget(); formatorOn(false); return; }
    const pw = prompt("Parola pentru regimul de formator:"); if(pw) unlock(pw);
  };
  $$("#bar .fo").forEach(b => b.style.display = "none");

  /* ---------- setări vot ---------- */
  function settings(){
    if(!window.__NOTES) return;
    const cur = Live.getUrl();
    const u = prompt("Adresa aplicației web Google Apps Script (se termină cu /exec).\nLăsați gol pentru modul manual.", cur);
    if(u === null) return;
    Live.setUrl(u);
    if(u && confirm("Adresa a fost salvată. Doriți să ștergeți voturile de test? (cere PIN-ul)")){
      const pin = prompt("PIN-ul setat în Proprietățile scriptului:");
      if(pin){
        Live.reset("ALL", pin)
          .then(r => alert(r.ok ? "Voturi șterse: " + r.deleted : "Eroare: " + r.error))
          .catch(() => alert("Scriptul nu răspunde."))
          .finally(() => location.reload());
        return;
      }
    }
    location.reload();
  }

  /* ================= WIDGETURI ================= */

  /* --- Decizii ale autorilor (sondaj + dezvăluire) --- */
  $$("[data-decisions]").forEach(el => {
    const D = json(el), list = D.items; let k = 0;
    const unit = D.unit || "Propunerea", btn = D.btn || "Arată decizia autorilor";
    el.classList.add("w");
    el.innerHTML = `<div class="w-head"><div class="w-title">${esc(unit)} <span class="k"></span> din ${list.length}</div>
      <div style="display:flex;gap:10px;align-items:center"><button class="btn small b-p">←</button><div class="dots">${list.map((_, i) => `<i data-i="${i}"></i>`).join("")}</div><button class="btn small b-n">Următoarea →</button></div></div><div class="cards"></div>`;
    const cards = $(".cards", el);
    list.forEach((it, i) => {
      const c = document.createElement("div"); c.className = "card-dec"; c.style.display = i ? "none" : "block";
      const cls = it.statut === "Acceptat parțial" ? "Partial" : (["Acceptat", "Respins"].includes(it.statut) ? it.statut : "Info");
      const quoted = /^[„"]/.test(it.prop) ? esc(it.prop) : (D.unit ? esc(it.prop) : "„" + esc(it.prop) + "”");
      c.innerHTML = `<div class="dec"><div><div class="lab">${esc(it.clasa)}${it.cine ? " · " + esc(it.cine) : ""}</div><div class="prop">${quoted}</div>
        <div class="ans ${cls}"><b>${esc(it.statut)}.</b> ${esc(it.why)}<div class="src">${it.src}</div></div>
        <button class="btn small primary b-rev" style="margin-top:10px">${esc(btn)}</button></div>
        <div data-poll="${it.q}"></div></div>`;
      cards.appendChild(c);
      $(".b-rev", c).onclick = () => $(".ans", c).classList.add("show");
    });
    function go(i){
      k = (i + list.length) % list.length;
      $$(".card-dec", cards).forEach((c, j) => c.style.display = j === k ? "block" : "none");
      $$(".dots i", el).forEach((d, j) => d.classList.toggle("on", j === k));
      $(".k", el).textContent = k + 1;
      // pornește actualizarea sondajului vizibil
      document.dispatchEvent(new CustomEvent("slide", {detail: $$(".card-dec", cards)[k]}));
    }
    $(".b-p", el).onclick = () => go(k - 1); $(".b-n", el).onclick = () => go(k + 1);
    $$(".dots i", el).forEach(d => d.onclick = () => go(Number(d.dataset.i)));
    el._go = go; go(0);
  });

  /* --- Sondaj (telefon + total comun, sau manual) --- */
  function qrSvg(text){
    try{ const q = qrcode(0, "M"); q.addData(text); q.make(); return q.createSvgTag({cellSize: 4, margin: 1, scalable: true}); }
    catch(e){ return "<div class='small'>" + esc(text) + "</div>"; }
  }
  /* codul QR pe tot ecranul (clic pe codul de pe slide) */
  const qrBig = document.createElement("div"); qrBig.id = "qr-zoom";
  qrBig.innerHTML = `<div class="qz-q"></div><div class="qz-code"></div><div class="qz-u"></div><div class="src">Clic oriunde sau Esc pentru a închide</div>`;
  document.body.appendChild(qrBig);
  qrBig.onclick = () => qrBig.classList.remove("show");
  document.addEventListener("keydown", e => { if(e.key === "Escape") qrBig.classList.remove("show"); });
  function zoomQR(url, text){
    $(".qz-q", qrBig).textContent = text || "Scanați pentru vot";
    $(".qz-code", qrBig).innerHTML = qrSvg(url);
    $(".qz-u", qrBig).textContent = url.split("&u=")[0].replace(/^https?:\/\//, "");
    qrBig.classList.add("show");
  }
  $$("[data-poll]").forEach(el => {
    const id = el.dataset.poll, Q = (window.QUESTIONS || {})[id];
    if(!Q){ el.textContent = "Întrebare lipsă: " + id; return; }
    const correct = el.dataset.correct || "";
    const local = {}; let counts = {}, hidden = el.dataset.hide === "1", timer = null;
    const url = new URL("vot.html?q=" + encodeURIComponent(id) + (Live.getUrl() && !(window.LIVE_CONFIG && window.LIVE_CONFIG.url) ? "&u=" + encodeURIComponent(Live.getUrl()) : ""), location.href).href;
    el.classList.add("w", "poll");
    el.innerHTML = `
      <div><div class="q">${esc(Q.text)}</div>
        <div class="res"></div>
        <div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap">
          <button class="btn small b-toggle">${hidden ? "Arată rezultatele" : "Ascunde rezultatele"}</button>
          ${correct ? '<button class="btn small b-correct">Arată răspunsul autorilor</button>' : ""}
          ${Q.type === "word" ? '<input class="w-add" placeholder="adaugă manual un cuvânt" style="font:inherit;font-size:15px;padding:3px 8px;border-radius:8px;border:1px solid #ccd">' : ""}
        </div>
        <div class="status"></div></div>
      <div class="qr" title="Clic pentru a mări codul"><div class="code">${qrSvg(url)}</div><div>Scanați pentru vot · <b>clic = mărește</b></div><div class="qr-url">${esc(url.split("&u=")[0].replace(/^https?:\/\//,""))}</div></div>`;
    $(".qr", el).onclick = () => zoomQR(url, Q.text);
    if(hidden) el.classList.add("hidden-res");
    const res = $(".res", el), status = $(".status", el);
    function render(){
      const c = Live.enabled() ? counts : local;
      const tot = Object.values(c).reduce((a, b) => a + b, 0);
      if(Q.type === "word"){
        const ws = Object.entries(c).sort((a, b) => b[1] - a[1]).slice(0, 40);
        const mx = ws.length ? ws[0][1] : 1;
        res.innerHTML = `<div class="cloud">${ws.length ? ws.map(([w, n]) => `<span style="font-size:${18 + 34 * n / mx}px">${esc(w)}</span>`).join("") : "<span class='muted' style='font-size:16px'>Așteptăm răspunsurile…</span>"}</div>`;
      } else {
        res.innerHTML = `<div class="bars">${Q.opts.map(o => {
          const n = c[o] || 0, p = tot ? Math.round(100 * n / tot) : 0;
          return `<div class="row ${el.classList.contains("show-correct") && o === correct ? "correct" : ""}"><div><div class="lbl">${esc(o)}</div>
            <div class="track"><div class="fill" style="width:${p}%"></div></div></div>
            <div class="n">${n}${Live.enabled() ? "" : `<span class="manual"><button data-o="${esc(o)}" data-d="1">+</button><button data-o="${esc(o)}" data-d="-1">−</button></span>`}</div></div>`;
        }).join("")}</div>`;
        $$(".manual button", res).forEach(b => b.onclick = () => { const o = b.dataset.o; local[o] = Math.max(0, (local[o] || 0) + Number(b.dataset.d)); render(); });
      }
      status.textContent = (Live.enabled() ? "Total comun (telefoane): " : "Mod manual (formatorul introduce voturile): ") + tot + " răspunsuri";
    }
    async function pull(){
      if(!Live.enabled()) { render(); return; }
      try{ const r = await Live.results(id); if(r && r.ok){ counts = r.counts || {}; } render(); }
      catch(e){ status.textContent = "Scriptul de vot nu răspunde – verificați internetul sau treceți în modul manual (⚙)."; }
    }
    $(".b-toggle", el).onclick = e => { hidden = !hidden; el.classList.toggle("hidden-res", hidden); e.target.textContent = hidden ? "Arată rezultatele" : "Ascunde rezultatele"; };
    const bc = $(".b-correct", el); if(bc) bc.onclick = () => { el.classList.add("show-correct"); hidden = false; el.classList.remove("hidden-res"); render(); document.dispatchEvent(new CustomEvent("poll-correct", {detail: id})); };
    const add = $(".w-add", el); if(add) add.onkeydown = e => { if(e.key === "Enter" && add.value.trim()){ const w = add.value.trim().toLowerCase(); local[w] = (local[w] || 0) + 1; add.value = ""; if(Live.enabled()) Live.vote(id, w).then(pull); else render(); } };
    document.addEventListener("slide", e => {
      clearInterval(timer);
      if(e.detail.contains(el)){ pull(); timer = setInterval(pull, 3000); }
    });
    document.addEventListener("live-changed", render);
    render();
  });

  /* --- Clasificare cu verificare automată ---
     2 categorii: listă cu butoane (pe două coloane dacă sunt multe enunțuri);
     3+ categorii: tabel-matrice (enunțuri pe rânduri, categorii pe coloane). */
  $$("[data-classify]").forEach(el => {
    const d = json(el); const ans = {};
    const mx = d.cats.length >= 3;
    el.classList.add("w");
    const head = `<div class="w-head"><div class="w-title">${esc(d.title || "")}</div><div><span class="score"></span>
      <button class="btn small primary b-check">Verifică</button> <button class="btn small b-reset">Din nou</button></div></div>`;
    const body = mx
      ? `<table class="cls-mx"><thead><tr><th class="mk"></th><th class="tx"></th>${d.cats.map(c => `<th class="ct">${esc(c)}</th>`).join("")}</tr></thead><tbody>
         ${d.items.map((it, i) => `<tr class="cls-row" data-i="${i}"><td class="mark"></td><td class="txt">${it.t}<div class="why">${it.why || ""}</div></td>
         ${d.cats.map(c => `<td class="opts"><button data-c="${esc(c)}" title="${esc(c)}" aria-label="${esc(c)}"></button></td>`).join("")}</tr>`).join("")}</tbody></table>`
      : `<div class="list${d.items.length >= 8 ? " grid2" : ""}">${d.items.map((it, i) => `<div class="cls-item cls-row" data-i="${i}"><span class="mark"></span><div class="txt">${it.t}<div class="why">${it.why || ""}</div></div>
         <div class="opts">${d.cats.map(c => `<button data-c="${esc(c)}">${esc(c)}</button>`).join("")}</div></div>`).join("")}</div>`;
    el.innerHTML = head + body + (d.src ? `<div class="src" style="margin-top:6px">${d.src}</div>` : "");
    const rows = () => $$(".cls-row", el);
    rows().forEach(row => $$(".opts button", row).forEach(b => b.onclick = () => {
      $$(".opts button", row).forEach(x => x.classList.remove("sel")); b.classList.add("sel"); ans[row.dataset.i] = b.dataset.c;
    }));
    $(".b-check", el).onclick = () => {
      let ok = 0;
      d.items.forEach((it, i) => {
        const row = $(`.cls-row[data-i="${i}"]`, el), good = ans[i] === it.c;
        if(good) ok++;
        row.classList.add("checked"); row.classList.toggle("ok", good); row.classList.toggle("bad", !good);
        $(".mark", row).textContent = good ? "✓" : "✗";
        if(!good) $$(".opts button", row).forEach(b => { if(b.dataset.c === it.c) b.classList.add("right"); });
      });
      const sc = $(".score", el), p = ok / d.items.length;
      sc.textContent = ok + " / " + d.items.length; sc.className = "score " + (p >= .8 ? "ok" : p >= .5 ? "mid" : "bad");
    };
    $(".b-reset", el).onclick = () => {
      Object.keys(ans).forEach(k => delete ans[k]);
      rows().forEach(r => { r.classList.remove("checked", "ok", "bad"); $(".mark", r).textContent = ""; $$(".opts button", r).forEach(b => b.classList.remove("sel", "right")); });
      $(".score", el).textContent = "";
    };
  });

  /* --- Carduri cu răspuns ascuns --- */
  $$(".reveal-card").forEach(c => c.addEventListener("click", () => c.classList.toggle("open")));

  /* --- Harta interactivă a unității de învățare --- */
  $$("[data-umap]").forEach(el => {
    const d = json(el);
    el.classList.add("w");
    el.innerHTML = `<div class="w-head"><div class="w-title">${esc(d.title)}</div><div class="src">Clic pe un RÎ: se evidențiază UC (după cod) și conținutul asociat.</div></div>
      <div class="umap"><div class="col"><h4>Unități de competență</h4>${d.uc.map(u => `<div class="it" data-uc="${u[0]}"><b>${u[0]}</b> ${esc(u[1])}</div>`).join("")}</div>
      <div class="col"><h4>Unități de conținut</h4>${d.c.map(u => `<div class="it" data-c="${u[0]}"><b>${u[0]}</b> ${esc(u[1])}</div>`).join("")}</div>
      <div class="col"><h4>Rezultate ale învățării</h4>${d.ri.map(u => `<div class="it" data-ri="${u[0]}" data-cc="${u[2] || ""}"><b>RÎ ${u[0]}</b> ${esc(u[1])}</div>`).join("")}</div></div>
      <div class="src" style="margin-top:6px">${d.src}</div>`;
    $$("[data-ri]", el).forEach(r => r.onclick = () => {
      const code = r.dataset.ri, uc = code.split(".").slice(0, 2).join(".");
      const cs = (r.dataset.cc || "").split(",").filter(Boolean);
      $$(".it", el).forEach(x => x.classList.remove("hl", "sel", "dim"));
      r.classList.add("sel");
      $$("[data-ri]", el).forEach(x => { if(x !== r) x.classList.add("dim"); });
      $$("[data-uc]", el).forEach(x => x.classList.add(x.dataset.uc === "UC " + uc ? "hl" : "dim"));
      $$("[data-c]", el).forEach(x => x.classList.add(cs.includes(x.dataset.c) ? "hl" : "dim"));
    });
  });

  /* --- Generator: schelet de lecție de manual pornind de la RÎ --- */
  $$("[data-gen]").forEach(el => {
    const d = json(el);
    el.classList.add("w", "gen");
    el.innerHTML = `<div class="w-head"><div class="w-title">Schelet de lecție de manual, derivat din RÎ</div>
      <select class="g-sel">${d.items.map((it, i) => `<option value="${i}">${esc(it.clasa)} · RÎ ${esc(it.cod)}</option>`).join("")}</select></div>
      <div class="out"></div><div class="src">${d.src}</div>`;
    const out = $(".out", el);
    function render(){
      const it = d.items[$(".g-sel", el).value];
      out.innerHTML = `<div class="small"><b>RÎ ${esc(it.cod)}</b> (${esc(it.clasa)}, ${it.pag}): <i>${esc(it.ri)}</i></div>` +
        d.secs.map(([k, lab]) => `<div class="sec"><b>${esc(lab)}:</b> ${it[k]}</div>`).join("");
    }
    $(".g-sel", el).onchange = render; render();
  });

  /* --- Calculator: orele unității și lecțiile din manual --- */
  $$("[data-calc]").forEach(el => {
    const d = json(el);
    el.classList.add("w", "calc");
    el.innerHTML = `<div class="w-head"><div class="w-title">Orele din curriculum → lecțiile din manual</div>
      <select class="c-sel">${d.sets.map((s, i) => `<option value="${i}">${esc(s.name)}</option>`).join("")}</select></div><div class="tb"></div><div class="msg"></div>
      <div class="src" style="margin-top:6px">${d.src}</div>`;
    function render(){
      const s = d.sets[$(".c-sel", el).value];
      $(".tb", el).innerHTML = `<table><tr><th>Unitatea de învățare</th><th>Total ore</th><th>Predare–învățare</th><th>Lucrări de laborator</th><th>Evaluare sumativă</th><th>Lecții în manual</th></tr>
        ${s.rows.map((r, i) => `<tr data-i="${i}"><td>${esc(r[0])}</td><td>${r[1]}</td><td>${r[2]}</td><td>${r[3]}</td><td>${r[4]}</td><td>${r[5] === false ? "–" : `<input type="number" min="0" value="${r[1]}">`}</td></tr>`).join("")}
        <tr><th>Total an</th><th>${s.total}</th><th colspan="3"></th><th class="sum"></th></tr></table>`;
      $$("input", el).forEach(inp => inp.oninput = check); check();
      function check(){
        let sum = 0, err = [];
        $$("tr[data-i]", el).forEach(tr => {
          const r = s.rows[tr.dataset.i], inp = $("input", tr);
          if(!inp){ sum += r[1]; return; }
          const v = Number(inp.value); sum += v;
          const bad = v !== r[1]; tr.classList.toggle("err", bad);
          if(bad) err.push(`„${r[0]}”: ${v} lecții în loc de ${r[1]} ore`);
        });
        $(".sum", el).textContent = sum;
        $(".msg", el).innerHTML = err.length
          ? `<div class="verdict bad">Nealiniat: ${esc(err.join("; "))}. Numărul de ore este <b>obligatoriu pentru autorii de manuale</b>.</div>`
          : `<div class="verdict ok">Aliniat: manualul acoperă exact orele prevăzute (${sum} = ${s.total}).</div>`;
      }
    }
    $(".c-sel", el).onchange = render; render();
  });

  /* --- Fișă de verificare a coerenței (scor automat) --- */
  $$("[data-check]").forEach(el => {
    const d = json(el);
    el.classList.add("w");
    el.innerHTML = `<div class="w-head"><div class="w-title">${esc(d.title)}</div><div class="score"></div></div>
      <div class="meter"><i></i></div><div class="verd small"></div>
      <div class="chk">${d.items.map((t, i) => `<label><input type="checkbox" data-i="${i}"> <span>${i + 1}. ${esc(t)}</span></label>`).join("")}</div>
      <div class="src">${d.src}</div>`;
    function upd(){
      const n = $$("input:checked", el).length, N = d.items.length;
      const col = n >= d.ok ? "var(--ok)" : n >= d.mid ? "var(--warn)" : "var(--bad)";
      $(".score", el).textContent = n + " / " + N + " DA"; $(".score", el).style.color = col;
      $(".meter i", el).style.width = (100 * n / N) + "%"; $(".meter i", el).style.background = col;
      $(".verd", el).innerHTML = n >= d.ok ? "<b>Lecție coerentă</b> (≥ " + d.ok + " DA)." : n >= d.mid ? "<b>Necesită revizuire</b> (" + d.mid + "–" + (d.ok - 1) + " DA): revizuiți veriga marcată NU." : "<b>Revizuire urgentă</b> (≤ " + (d.mid - 1) + " DA).";
    }
    $$("input", el).forEach(i => i.onchange = upd); upd();
  });

  /* --- Simulator: o investigație pe două niveluri (clasa a VI-a / clasa a X-a, profil real) --- */
  $$("[data-invest]").forEach(el => {
    const D = json(el);
    el.classList.add("w", "invest");
    el.innerHTML = `<div class="w-head"><div class="tabs"><button class="tab on" data-t="vi">Clasa a VI-a · cărămida ușoară</button><button class="tab" data-t="x">Clasa a X-a, profil real · jetul de apă</button></div></div>
    <div class="pane" data-p="vi"><div class="cols" style="grid-template-columns:1.15fr 1fr;gap:18px"><div>
      <div class="qline"><b>Întrebarea:</b> este corectă densitatea de 600 kg/m³ scrisă pe eticheta cărămizii?</div>
      <div class="slider-row"><span>Lungimea L</span><input type="range" class="L" min="200" max="300" value="250"><b class="vL"></b></div>
      <div class="slider-row"><span>Lățimea l</span><input type="range" class="l" min="100" max="150" value="120"><b class="vl"></b></div>
      <div class="slider-row"><span>Înălțimea h</span><input type="range" class="hh" min="50" max="80" value="65"><b class="vh"></b></div>
      <div class="slider-row"><span>Masa m (cântar)</span><input type="range" class="m" min="800" max="1600" step="10" value="1170"><b class="vm"></b></div>
      <div class="small muted">Instrumente: rigla (valoarea diviziunii 1 mm) și cântarul electronic.</div>
      <div class="brick-ill">${D.brick || ""}</div>
    </div><div>
      <div class="calc-steps small"></div><div class="result-big"><span class="rho"></span> kg/m³</div><div class="verdict"></div>
      <div class="small muted" style="margin-top:6px">Clasa a VI-a: V = L·l·h, ρ = m/V, compararea cu eticheta (RÎ 1.4.1, 1.4.3, 1.4.4). Fără forța lui Arhimede și fără eroare relativă.</div>
    </div></div></div>
    <div class="pane" data-p="x" style="display:none"><div class="cols" style="grid-template-columns:1.15fr 1fr;gap:18px"><div>
      <div class="qline"><b>Întrebarea:</b> cu ce viteză iese apa din orificiul vasului?</div>
      <svg viewBox="0 0 420 170" class="jet"><rect x="8" y="14" width="44" height="140" fill="#d7e6f7" stroke="#1f5fa8" stroke-width="2"/><rect x="9" y="26" width="42" height="127" fill="#9cc8f2"/>
        <path class="jp" fill="none" stroke="#1f5fa8" stroke-width="4" stroke-dasharray="2 7" stroke-linecap="round"/><line x1="52" y1="154" x2="415" y2="154" stroke="#16325c" stroke-width="2"/>
        <line class="jh" stroke="#c8711d" stroke-width="2" stroke-dasharray="4 3"/><line class="jl" stroke="#c8711d" stroke-width="2"/>
        <text class="th" font-size="13" fill="#c8711d">H</text><text class="tl" font-size="13" fill="#c8711d">L</text></svg>
      <div class="slider-row"><span>Înălțimea orificiului H</span><input type="range" class="H" min="20" max="120" value="80"><b class="vH"></b></div>
      <div class="slider-row"><span>Bătaia măsurată L</span><input type="range" class="Lx" min="20" max="200" value="100"><b class="vLx"></b></div>
      <div class="slider-row"><span>Precizia măsurării Δ</span><input type="range" class="d" min="1" max="10" value="5"><b class="vd"></b></div>
    </div><div>
      <div class="calc-steps small xsteps"></div><div class="result-big"><span class="v0"></span> m/s</div><div class="small">eroarea relativă estimată: <b class="eps"></b> · υ₀ = <span class="v0b"></span></div>
      <div class="small muted" style="margin-top:6px">Clasa a X-a, profil real: descompunerea mișcării (RÎ 1.3.4, 1.4.4), eroarea relativă (conținutul C5). Problemă potrivită pentru blocul „Investigații experimentale”.</div>
    </div></div></div>`;
    $$(".tab", el).forEach(t => t.onclick = () => { $$(".tab", el).forEach(x => x.classList.toggle("on", x === t)); $$(".pane", el).forEach(p => p.style.display = p.dataset.p === t.dataset.t ? "" : "none"); });
    const g = 9.8, f2 = x => x.toFixed(2).replace(".", ","), f0 = x => Math.round(x).toLocaleString("ro-RO"), cm = mm => String(mm / 10).replace(".", ",");
    function vi(){
      const L = +$(".L", el).value, l = +$(".l", el).value, h = +$(".hh", el).value, m = +$(".m", el).value;
      $(".vL", el).textContent = L + " mm"; $(".vl", el).textContent = l + " mm"; $(".vh", el).textContent = h + " mm"; $(".vm", el).textContent = m + " g";
      const V = L * l * h / 1000; // cm³
      const rho = m / V * 1000;   // kg/m³
      $(".calc-steps", el).innerHTML = `V = L·l·h = ${cm(L)}·${cm(l)}·${cm(h)} cm³ = <b>${f0(V)} cm³</b><br>ρ = m/V = ${m} g : ${f0(V)} cm³ = <b>${(m / V).toFixed(3).replace(".", ",")} g/cm³</b>`;
      $(".rho", el).textContent = f0(rho);
      const d = rho - 600, v = $(".verdict", el), ok = Math.abs(d) <= 30;
      v.className = "verdict " + (ok ? "ok" : "bad");
      v.textContent = ok ? `Diferența față de etichetă este mică (${d >= 0 ? "+" : "−"}${f0(Math.abs(d))} kg/m³): rezultatul confirmă valoarea declarată.`
                         : `Diferența este mare (${d >= 0 ? "+" : "−"}${f0(Math.abs(d))} kg/m³): verificăm măsurările sau eticheta.`;
    }
    function vx(){
      const H = +$(".H", el).value, L = +$(".Lx", el).value, d = +$(".d", el).value / 10;
      $(".vH", el).textContent = H + " cm"; $(".vLx", el).textContent = L + " cm"; $(".vd", el).textContent = "± " + d.toFixed(1).replace(".", ",") + " cm";
      const t = Math.sqrt(2 * H / 100 / g), v0 = L / 100 / t, eps = d / L + d / (2 * H);
      $(".xsteps", el).innerHTML = `pe verticală: H = g·t²/2 ⇒ t = √(2H/g) = <b>${f2(t)} s</b><br>pe orizontală: L = υ₀·t ⇒ υ₀ = L/t`;
      $(".v0", el).textContent = f2(v0); $(".eps", el).textContent = (100 * eps).toFixed(1).replace(".", ",") + " %";
      $(".v0b", el).textContent = f2(v0) + " ± " + f2(v0 * eps) + " m/s";
      // desen: 1 cm = 1,1 px pe verticală (H max 120 → 132 px), 1 cm = 1,7 px pe orizontală
      const y0 = 154 - H * 1.1, x0 = 52, x1 = x0 + L * 1.75;
      let dpath = `M${x0} ${y0}`; for(let i = 1; i <= 24; i++){ const k = i / 24; dpath += ` L${x0 + (x1 - x0) * k} ${y0 + (154 - y0) * k * k}`; }
      $(".jp", el).setAttribute("d", dpath);
      const jh = $(".jh", el); jh.setAttribute("x1", x0 + 6); jh.setAttribute("x2", x0 + 6); jh.setAttribute("y1", y0); jh.setAttribute("y2", 154);
      const jl = $(".jl", el); jl.setAttribute("x1", x0); jl.setAttribute("x2", x1); jl.setAttribute("y1", 164); jl.setAttribute("y2", 164);
      $(".th", el).setAttribute("x", x0 + 10); $(".th", el).setAttribute("y", (y0 + 154) / 2);
      $(".tl", el).setAttribute("x", (x0 + x1) / 2); $(".tl", el).setAttribute("y", 150);
    }
    $$(".pane[data-p=vi] input", el).forEach(i => i.oninput = vi); $$(".pane[data-p=x] input", el).forEach(i => i.oninput = vx);
    vi(); vx();
  });

  /* --- Cronometru pentru lucrul în grupe --- */
  $$("[data-timer]").forEach(el => {
    const sec0 = Number(el.dataset.timer); let left = sec0, t = null;
    el.classList.add("w"); el.style.textAlign = "center";
    el.innerHTML = `<div class="timer"></div><div><button class="btn small primary b-go">Pornește</button> <button class="btn small b-rs">Resetează</button></div>`;
    const tm = $(".timer", el);
    const draw = () => { tm.textContent = String(Math.floor(left / 60)).padStart(2, "0") + ":" + String(left % 60).padStart(2, "0"); tm.classList.toggle("end", left <= 0); };
    $(".b-go", el).onclick = e => {
      if(t){ clearInterval(t); t = null; e.target.textContent = "Continuă"; return; }
      e.target.textContent = "Pauză"; t = setInterval(() => { left = Math.max(0, left - 1); draw(); if(!left){ clearInterval(t); t = null; } }, 1000);
    };
    $(".b-rs", el).onclick = () => { clearInterval(t); t = null; left = sec0; $(".b-go", el).textContent = "Pornește"; draw(); };
    draw();
  });

  /* --- Diagramă cu bare (date statice) --- */
  $$("[data-chart]").forEach(el => {
    const d = json(el);
    el.classList.add("w", "bar-chart");
    const mx = Math.max(...d.rows.map(r => r[1]));
    el.innerHTML = `<div class="w-head"><div class="w-title">${esc(d.title)}</div></div>` +
      d.rows.map(r => `<div class="r"><span>${esc(r[0])}</span><div class="tr"><i style="width:${100 * r[1] / mx}%;background:${r[2] || "var(--blue)"}"></i></div><b>${r[1]}${d.unit || ""}</b></div>`).join("") +
      (d.src ? `<div class="src" style="margin-top:6px">${d.src}</div>` : "");
  });

  window.addEventListener("hashchange", () => { const h = parseInt(location.hash.slice(1), 10); if(!isNaN(h) && h - 1 !== cur) show(h - 1); });
  /* pornire */
  fit();
  const h0 = parseInt(location.hash.slice(1), 10);
  show(isNaN(h0) ? 0 : h0 - 1);
  const sv = Formator.saved(); if(sv && blob) unlock(sv, true);
})();
