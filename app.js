/* Ses Puanlama — GitHub Pages uyumlu (statik, sunucusuz)
   Puanlar: localStorage (her tarayicida) + istege bagli ortak jsonbin.io deposu.
   Ses oynatma: uzak onizleme URL'leri (<audio src>) — URL'ler asla metin olarak gosterilmez. */
(() => {
  const V = window.VOICES || [];
  const CFG = (window.APP_CONFIG || {});
  const KEY_NAME = "sr_name";
  const ratingsOf = (name) => `sr_ratings_${name}`;
  const LOCAL_DB = "sr_shared_cache";

  const $ = (id) => document.getElementById(id);
  const els = Object.fromEntries(["gate","main","name-input","start-btn","gate-msg","avatar","user-name","switch-user",
    "progress-text","progress-fill","filters","f-pool","f-accent","f-gender","f-age","f-use","f-cat","apply-filters","filters-cancel",
    "card","empty","card-wrap","counter","v-id","skip-btn","v-name","v-badges","v-desc","player","player-note","scale-nums",
    "board","board-body","back-to-rate","to-leaderboard","restart","export-btn","settings-btn","board-btn","lb-refresh","lb-meta","sync-note-empty"].map(x => [x, $(x)]));

  let name = "";
  let ratings = {};
  let shared = {};          // ortak depo: { userName: { voice_id: score } }
  let queue = [], idx = 0, pool = "turkish";
  let syncMode = "local";

  const persistLocal = () => localStorage.setItem(ratingsOf(name), JSON.stringify(ratings));
  const loadLocal = () => ratings = JSON.parse(localStorage.getItem(ratingsOf(name)) || "{}");
  const fmt = (x) => (Math.round(x * 10) / 10).toFixed(1);

  // ---------- ortak depo (jsonbin) ----------
  const binReady = () => !!(CFG.jsonbinBinId && CFG.jsonbinKey);
  const binHeaders = () => ({
    "Content-Type": "application/json",
    "X-Master-Key": CFG.jsonbinKey,
    "X-Bin-Meta": "false"
  });
  async function pullShared() {
    if (!binReady()) { syncMode = "local"; return; }
    try {
      const r = await fetch(`https://api.jsonbin.io/v3/b/${CFG.jsonbinBinId}/latest`, { headers: binHeaders() });
      if (!r.ok) throw 0;
      const d = await r.json();
      shared = (d && d.record && typeof d.record === "object") ? d.record : {};
      syncMode = "online";
      // kullanicinin kendi kayitlarini surucusel verilerle birlestir (sunucu kazanir)
      if (shared[name]) { ratings = Object.assign(ratings, shared[name]); persistLocal(); }
    } catch { syncMode = "local"; shared = JSON.parse(localStorage.getItem(LOCAL_DB) || "{}"); }
  }
  async function pushShared() {
    if (!binReady()) return;
    try {
      const next = Object.assign({}, shared, { [name]: ratings });
      await fetch(`https://api.jsonbin.io/v3/b/${CFG.jsonbinBinId}`,
        { method: "PUT", headers: binHeaders(), body: JSON.stringify(next) });
    } catch {}
  }
  let pushTimer = null;
  function schedulePush() {
    clearTimeout(pushTimer);
    pushTimer = setTimeout(pushShared, 1200);
  }

  // ---------- yardimcilar ----------
  const uniq = (a) => [...new Set(a)];
  const ACCENT_TR = { "istanbul": "İstanbul", "standard": "Standart", "american": "Amerikan", "british": "İngiliz",
    "indian": "Hint", "latin american": "Latin Amerikan", "peninsular": "İspanyol", "brazilian": "Brezilya", "australian": "Avustralyalı" };
  const ageLabel = (x) => ({ young: "Genç", middle_aged: "Orta yaş", old: "Yaşlı", "middle-aged": "Orta yaş" }[x] || x || "—");
  const useLabel = (x) => ({ narrative_story: "Hikâye/Sesli kitap", conversational: "Konuşma", informative_educational: "Eğitici",
      social_media: "Sosyal medya", characters_animation: "Karakter", advertisement: "Reklam", entertainment_tv: "TV/Eğlence" }[x] || x || "—");

  function poolFilter() {
    let list = V;
    if (pool === "istanbul") list = list.filter(v => v.a === "istanbul");
    else if (pool === "standard") list = list.filter(v => v.a === "standard");
    if (els["f-accent"].value) list = list.filter(v => v.a === els["f-accent"].value);
    if (els["f-gender"].value) list = list.filter(v => v.g === els["f-gender"].value);
    if (els["f-age"].value) list = list.filter(v => v.age === els["f-age"].value);
    if (els["f-use"].value) list = list.filter(v => v.u2 === els["f-use"].value);
    if (els["f-cat"].value) list = list.filter(v => v.c === els["f-cat"].value);
    return list;
  }
  function resetQueue() {
    const ratedSet = new Set(Object.keys(ratings));
    queue = poolFilter().filter(v => !ratedSet.has(v.id));
    idx = 0;
  }
  const playVoice = (vid) => {
    const v = V.find(x => x.id === vid);
    if (!v || !v.u) return;
    const a = new Audio();
    a.src = v.u;
    a.play().catch(() => {});
  };

  // ---------- UI ----------
  function updateProgress() {
    const inPool = poolFilter().filter(v => ratings[v.id]).length;
    const total = poolFilter().length;
    els["progress-text"].textContent = `Puanlanan: ${inPool} / ${total}${queue.length ? ` · Sırada: ${queue.length}` : ""} · Depo: ${syncMode === "online" ? "ortak ☁" : "tarayıcı"}`;
    els["progress-fill"].style.width = total ? `${(inPool / total) * 100}%` : "0%";
  }
  function buildScale() {
    els["scale-nums"].innerHTML = "";
    for (let i = 1; i <= 10; i++) {
      const b = document.createElement("button");
      b.textContent = i;
      if (i <= 3) b.classList.add("warn");
      b.addEventListener("click", () => rate(i));
      els["scale-nums"].appendChild(b);
    }
  }
  function refreshFilters() {
    const cur = els["f-accent"].value;
    els["f-accent"].innerHTML = '<option value="">Hepsi</option>' +
      uniq(V.map(v => v.a).filter(Boolean)).sort().map(a => `<option value="${a}"${a === cur ? " selected" : ""}>${ACCENT_TR[a] || a}</option>`).join("");
    const cu = els["f-use"].value;
    els["f-use"].innerHTML = '<option value="">Hepsi</option>' +
      uniq(V.map(v => v.u2).filter(Boolean)).sort().map(u => `<option value="${u}"${u === cu ? " selected" : ""}>${useLabel(u)}</option>`).join("");
  }
  function renderCard(v) {
    els["v-name"].textContent = v.n;
    els["v-id"].textContent = "ID: " + v.id;
    els["v-badges"].innerHTML = [ACCENT_TR[v.a] || v.a, ageLabel(v.age),
      v.g === "male" ? "Erkek" : v.g === "female" ? "Kadın" : (v.g || "—"),
      useLabel(v.u2), v.c === "professional" ? "Profesyonel" : v.c].filter(Boolean)
      .map(x => `<span>${x}</span>`).join("");
    els["v-desc"].textContent = v.d;
    const p = els.player;
    p.pause(); p.removeAttribute("src");
    if (v.u) { p.src = v.u; }
    p.load();
    els["player-note"].textContent = "";
  }
  function next() {
    while (idx < queue.length && ratings[queue[idx].id]) idx++;
    if (idx >= queue.length) { finish(); return; }
    renderCard(queue[idx]);
    els.card.classList.remove("hidden");
    els.empty.classList.add("hidden");
    els["counter"].textContent = `${idx + 1} / ${queue.length}`;
    updateProgress();
  }
  function finish() {
    els.card.classList.add("hidden");
    els.empty.classList.remove("hidden");
    els["sync-note-empty"].textContent = syncMode === "online"
      ? "Puanların ortak depoya kaydedildi — liderlik herkes tarafından görünür."
      : "Not: ortak depo ayarlanmadı (config.js); puanlar yalnızca bu tarayıcıda.";
    updateProgress();
  }
  function rate(score) {
    const v = queue[idx];
    if (!v) return;
    ratings[v.id] = score;
    persistLocal();
    schedulePush();
    idx++;
    next();
  }

  // ---------- liderlik (ortak veriden, canli) ----------
  let pollTimer = null;
  function computeBoard() {
    const all = Object.assign({}, shared, { [name]: ratings });
    const agg = {};
    for (const [u, rmap] of Object.entries(all)) {
      for (const [vid, s] of Object.entries(rmap || {})) {
        const a = agg[vid] || (agg[vid] = [0, 0, new Set()]);
        a[0]++; a[1] += s; a[2].add(u);
      }
    }
    const rows = Object.entries(agg).map(([vid, [cnt, sum, us]]) => ({
      voice_id: vid, count: cnt, avg: sum / cnt, raters: us.size
    })).sort((a, b) => b.avg - a.avg || b.count - a.count);
    els["lb-meta"].textContent = `${rows.length} ses · ${Object.keys(all).length} kullanıcı · ${rows.reduce((s, r) => s + r.count, 0)} puan · ${syncMode === "online" ? "ortak ☁" : "tarayıcı"}`;
    els["board-body"].innerHTML = rows.slice(0, 50).map((r, i) => {
      const v = V.find(x => x.id === r.voice_id);
      return `<tr data-id="${r.voice_id}">
        <td>${i + 1}</td>
        <td class="name">${v ? v.n : r.voice_id} <span class="play-ind">▶</span></td>
        <td>${r.count}</td><td><b>${fmt(r.avg)}/10</b></td><td>${r.raters}</td></tr>`;
    }).join("") || `<tr><td colspan="5">Henüz puan yok — ilk sen puanla!</td></tr>`;
    els["board-body"].querySelectorAll("tr[data-id]").forEach(tr =>
      tr.addEventListener("click", () => playVoice(tr.dataset.id)));
  }
  function showBoard() {
    els.card.classList.add("hidden");
    els.empty.classList.add("hidden");
    els.board.classList.remove("hidden");
    computeBoard();
    clearInterval(pollTimer);
    pollTimer = setInterval(computeBoard, CFG.refreshMs || 10000);
  }
  function hideBoard() {
    els.board.classList.add("hidden");
    clearInterval(pollTimer);
    resetQueue();
    updateProgress();
    if (queue.length) next(); else finish();
  }

  // ---------- akis ----------
  async function startSession() {
    loadLocal();
    showView("main");
    els["avatar"].textContent = name.slice(0, 1).toUpperCase();
    els["user-name"].textContent = name;
    refreshFilters();
    buildScale();
    await pullShared();
    resetQueue();
    updateProgress();
    if (queue.length) next(); else finish();
  }
  function showView(w) {
    els.gate.classList.toggle("hidden", w !== "gate");
    els.main.classList.toggle("hidden", w !== "main");
  }

  els["start-btn"].addEventListener("click", () => {
    name = els["name-input"].value.trim();
    if (!name) { els["gate-msg"].textContent = "Lütfen bir isim gir."; return; }
    localStorage.setItem(KEY_NAME, name);
    startSession();
  });
  els["name-input"].addEventListener("keydown", e => { if (e.key === "Enter") els["start-btn"].click(); });
  els["switch-user"].addEventListener("click", () => {
    name = ""; ratings = {};
    els.gate.classList.remove("hidden"); els.main.classList.add("hidden");
    els["name-input"].value = ""; els["gate-msg"].textContent = "";
  });
  els["skip-btn"].addEventListener("click", () => { idx++; next(); });
  els["settings-btn"].addEventListener("click", () => els.filters.classList.toggle("hidden"));
  els["filters-cancel"].addEventListener("click", () => els.filters.classList.add("hidden"));
  els["apply-filters"].addEventListener("click", () => {
    pool = els["f-pool"].value;
    els.filters.classList.add("hidden");
    resetQueue(); updateProgress();
    if (queue.length) next(); else finish();
  });
  els["board-btn"].addEventListener("click", showBoard);
  els["to-leaderboard"].addEventListener("click", showBoard);
  els["back-to-rate"].addEventListener("click", hideBoard);
  els["lb-refresh"].addEventListener("click", computeBoard);
  els["restart"].addEventListener("click", () => { resetQueue(); if (queue.length) next(); else finish(); });
  els["export-btn"].addEventListener("click", () => {
    const blob = new Blob([JSON.stringify({ user: name, exported_at: new Date().toISOString(), ratings }, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${name}_puanlar.json`;
    a.click();
  });

  const saved = localStorage.getItem(KEY_NAME);
  if (saved) { name = saved; startSession(); }
})();
