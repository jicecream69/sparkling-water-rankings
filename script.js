(function () {
  const config = window.SPARKLING_CONFIG || {};
  const rankingEl = document.getElementById("ranking");
  const updatedEl = document.getElementById("updated");

  if (!config.SHEET_CSV_URL) {
    renderSetup();
    return;
  }

  loadRanking();

  async function loadRanking() {
    try {
      const url = config.SHEET_CSV_URL + (config.SHEET_CSV_URL.includes("?") ? "&" : "?") + "t=" + Date.now();
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error("Sheet responded with " + res.status);
      const text = await res.text();
      const rows = parseCSV(text);
      if (rows.length < 2) throw new Error("Sheet looks empty.");
      const items = rows
        .slice(1)
        .map((r) => (r[0] || "").trim())
        .filter((name) => name.length > 0);
      renderRanking(items);
      updatedEl.textContent = "Last checked " + formatTime(new Date());
    } catch (err) {
      console.error(err);
      renderError(err.message);
    }
  }

  function renderRanking(items) {
    if (!items.length) {
      rankingEl.innerHTML = '<div class="loading"><p>No rankings yet. Add some rows to the sheet!</p></div>';
      return;
    }
    const list = document.createElement("div");
    list.className = "ranking-list";
    items.forEach((name, i) => {
      const rank = i + 1;
      const card = document.createElement("div");
      card.className = "rank-card" + (rank === 1 ? " gold" : rank === 2 ? " silver" : rank === 3 ? " bronze" : "");
      const starPrefix = rank <= 3 ? '<span class="rank-star" aria-hidden="true">' + (rank === 1 ? '★' : '☆') + '</span>' : '';
      const starburst = rank === 1
        ? '<div class="starburst" aria-hidden="true"><div><div class="line1">top</div><div class="line2">PICK!</div></div></div>'
        : '';
      card.innerHTML =
        '<div class="rank-number">' + rank + '</div>' +
        '<div class="rank-body"><h2 class="rank-name">' + starPrefix + escapeHtml(name) + '</h2></div>' +
        starburst;
      list.appendChild(card);
    });
    rankingEl.innerHTML = "";
    rankingEl.appendChild(list);
  }

  function renderSetup() {
    rankingEl.innerHTML =
      '<div class="setup">' +
      '<h2>One step to go ✨</h2>' +
      '<p>The site is live, but it needs your Google Sheet link.</p>' +
      '<ol>' +
        '<li>Create a Google Sheet with one column listing each water (e.g. "La Croix Tangerine"). Row order = ranking.</li>' +
        '<li>File → Share → <strong>Publish to web</strong></li>' +
        '<li>Pick <strong>Comma-separated values (.csv)</strong> and click Publish</li>' +
        '<li>Paste the URL into <code>config.js</code></li>' +
      '</ol>' +
      '</div>';
  }

  function renderError(msg) {
    rankingEl.innerHTML =
      '<div class="error">' +
      "<strong>Couldn't load the rankings.</strong><br>" +
      escapeHtml(msg) +
      "<br><br>Double-check that your Google Sheet is published to the web as CSV." +
      "</div>";
  }

  // Minimal RFC4180-ish CSV parser
  function parseCSV(text) {
    const rows = [];
    let row = [];
    let field = "";
    let i = 0;
    let inQuotes = false;
    while (i < text.length) {
      const ch = text[i];
      if (inQuotes) {
        if (ch === '"') {
          if (text[i + 1] === '"') { field += '"'; i += 2; continue; }
          inQuotes = false; i++; continue;
        }
        field += ch; i++; continue;
      }
      if (ch === '"') { inQuotes = true; i++; continue; }
      if (ch === ",") { row.push(field); field = ""; i++; continue; }
      if (ch === "\r") { i++; continue; }
      if (ch === "\n") { row.push(field); rows.push(row); row = []; field = ""; i++; continue; }
      field += ch; i++;
    }
    if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
    return rows;
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function formatTime(d) {
    return d.toLocaleString(undefined, { hour: "numeric", minute: "2-digit", month: "short", day: "numeric" });
  }
})();
