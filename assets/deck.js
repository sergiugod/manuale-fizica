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
      if(pin) Live.reset("ALL", pin).then(r => alert(r.ok ? "Voturi șterse: " + r.deleted : "Eroare: " + r.error)).catch(()=>alert("Scriptul nu răspunde."));
    }
    location.reload();
  }

  /* ================= WIDGETURI ================= */

  /* --- Decizii ale autorilor (sondaj + dezvăluire) --- */
  $$("[data-decisions]").forEach(el => {
    const list = json(el).items; let k = 0;
    el.classList.add("w");
    el.innerHTML = `<div class="w-head"><div class="w-title">Propunerea <span class="k"></span> din ${list.length}</div>
      <div style="display:flex;gap:10px;align-items:center"><button class="btn small b-p">←</button><div class="dots">${list.map((_, i) => `<i data-i="${i}"></i>`).join("")}</div><button class="btn small b-n">Următoarea →</button></div></div><div class="cards"></div>`;
    const cards = $(".cards", el);
    list.forEach((it, i) => {
      const c = document.createElement("div"); c.className = "card-dec"; c.style.display = i ? "none" : "block";
      c.innerHTML = `<div class="dec"><div><div class="lab">${esc(it.clasa)} · ${esc(it.cine)}</div><div class="prop">„${esc(it.prop)}”</div>
        <div class="ans ${it.statut === "Acceptat parțial" ? "Partial" : it.statut}"><b>${esc(it.statut)}.</b> ${esc(it.why)}<div class="src">${it.src}</div></div>
        <button class="btn small primary b-rev" style="margin-top:10px">Arată decizia autorilor</button></div>
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
      <div class="qr"><div class="code">${qrSvg(url)}</div><div>Scanați pentru vot</div><div style="word-break:break-all;font-size:11px;margin-top:4px">${esc(url.split("&u=")[0].replace(/^https?:\/\//,""))}</div></div>`;
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

  /* --- Clasificare cu verificare automată --- */
  $$("[data-classify]").forEach(el => {
    const d = json(el); const ans = {};
    el.classList.add("w");
    el.innerHTML = `<div class="w-head"><div class="w-title">${esc(d.title || "")}</div><div><span class="score"></span>
      <button class="btn small primary b-check">Verifică</button> <button class="btn small b-reset">Din nou</button></div></div>
      <div class="list">${d.items.map((it, i) => `<div class="cls-item${d.cats.length > 4 ? " wide" : ""}" data-i="${i}"><span class="mark"></span><div class="txt">${it.t}<div class="why">${it.why || ""}</div></div>
      <div class="opts">${d.cats.map(c => `<button data-c="${esc(c)}">${esc(c)}</button>`).join("")}</div></div>`).join("")}</div>
      ${d.src ? `<div class="src" style="margin-top:6px">${d.src}</div>` : ""}`;
    $$(".cls-item", el).forEach(row => $$(".opts button", row).forEach(b => b.onclick = () => {
      $$(".opts button", row).forEach(x => x.classList.remove("sel")); b.classList.add("sel"); ans[row.dataset.i] = b.dataset.c;
    }));
    $(".b-check", el).onclick = () => {
      let ok = 0;
      d.items.forEach((it, i) => {
        const row = $(`.cls-item[data-i="${i}"]`, el), good = ans[i] === it.c;
        if(good) ok++;
        row.classList.add("checked"); row.classList.toggle("ok", good); row.classList.toggle("bad", !good);
        $(".mark", row).textContent = good ? "✓" : "✗";
        if(!good) $$(".opts button", row).forEach(b => { if(b.dataset.c === it.c) b.style.outline = "3px solid #1f7a4d"; });
      });
      const sc = $(".score", el), p = ok / d.items.length;
      sc.textContent = ok + " / " + d.items.length; sc.className = "score " + (p >= .8 ? "ok" : p >= .5 ? "mid" : "bad");
    };
    $(".b-reset", el).onclick = () => {
      Object.keys(ans).forEach(k => delete ans[k]);
      $$(".cls-item", el).forEach(r => { r.className = "cls-item" + (d.cats.length > 4 ? " wide" : ""); $(".mark", r).textContent = ""; $$(".opts button", r).forEach(b => { b.classList.remove("sel"); b.style.outline = ""; }); });
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
      $(".tb", el).innerHTML = `<table><tr><th>Unitatea de învățare</th><th>Total</th><th>P–Î</th><th>LL</th><th>ES</th><th>Lecții în manual</th></tr>
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

  /* --- Simulator: investigația „cărămida ușoară” --- */
  $$("[data-density]").forEach(el => {
    el.classList.add("w");
    el.innerHTML = `<div class="w-head"><div class="w-title">Verificăm densitatea declarată: 600 kg/m³ (vas cu apă + riglă gradată în mm)</div></div>
      <div class="cols c2"><div>
        <div class="slider-row"><span>Înălțimea cărămizii H</span><input type="range" class="H" min="50" max="250" value="120"><b class="vH"></b></div>
        <div class="slider-row"><span>Partea scufundată h</span><input type="range" class="h" min="5" max="250" value="72"><b class="vh"></b></div>
        <div class="slider-row"><span>Precizia riglei Δ</span><input type="range" class="d" min="1" max="5" value="1"><b class="vd"></b></div>
        <svg viewBox="0 0 300 190" style="width:100%;max-height:210px"><rect x="20" y="40" width="260" height="140" fill="#eaf3ff" stroke="#8aa"/>
          <rect class="water" x="21" y="80" width="258" height="99" fill="#9cc8f2"/><rect class="brick" x="115" y="40" width="70" height="80" fill="#c9b08d" stroke="#6b5"/>
          <line x1="20" y1="80" x2="280" y2="80" stroke="#1f5fa8" stroke-dasharray="4 3"/><text x="24" y="76" font-size="11" fill="#1f5fa8">nivelul apei</text></svg>
      </div><div>
        <div class="small muted">Corpul plutește vertical: forța lui Arhimede = greutatea, deci ρ = ρ<sub>apă</sub> · h / H</div>
        <div class="result-big"><span class="rho"></span> kg/m³</div><div class="small">incertitudine estimată: ± <span class="drho"></span> kg/m³</div>
        <div class="verdict"></div>
        <div class="small" style="margin-top:8px">În manual: întrebarea autentică vine prima, formula vine când elevul are nevoie de ea. La clasa a VI-a – plutirea și compararea densităților (RÎ 1.4.4); la liceu – forța lui Arhimede și estimarea erorii.</div>
      </div></div>`;
    const H = $(".H", el), h = $(".h", el), dd = $(".d", el);
    function upd(){
      let Hv = Number(H.value), hv = Math.min(Number(h.value), Hv); h.value = hv; const dv = Number(dd.value);
      const rho = 1000 * hv / Hv, drho = rho * (dv / hv + dv / Hv);
      $(".vH", el).textContent = Hv + " mm"; $(".vh", el).textContent = hv + " mm"; $(".vd", el).textContent = dv + " mm";
      $(".rho", el).textContent = Math.round(rho); $(".drho", el).textContent = Math.round(drho);
      const ok = Math.abs(rho - 600) <= drho, v = $(".verdict", el);
      v.className = "verdict " + (ok ? "ok" : "bad");
      v.textContent = ok ? "Valoarea declarată (600 kg/m³) se încadrează în incertitudinea măsurării." : (rho > 600 ? "Măsurarea arată o densitate mai mare decât cea declarată." : "Măsurarea arată o densitate mai mică decât cea declarată.");
      const k = 80 / Hv * 1; // scară desen
      const bh = Hv * 0.55, top = 80 - (Hv - hv) * 0.55;
      const b = $(".brick", el); b.setAttribute("height", bh); b.setAttribute("y", top);
    }
    [H, h, dd].forEach(x => x.oninput = upd); upd();
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
