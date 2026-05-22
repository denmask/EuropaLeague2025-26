(function () {
  const data = window.EUROPA_DATA;
  const teamsMap = new Map(data.teams.map(t => [t.id, t]));

  /* ───────── STANDINGS ───────── */
  function renderStandings() {
    const tbody = document.getElementById('standings-body');
    if (!tbody) return;
    tbody.innerHTML = '';
    data.standings.forEach(entry => {
      const team = teamsMap.get(entry.teamId);
      if (!team) return;
      const formHtml = entry.form.map(res =>
        `<span class="form-dot form-${res === 'W' ? 'w' : res === 'D' ? 'd' : 'l'}">${res}</span>`
      ).join('');
      const dr = entry.gf - entry.gs;
      const drStr = dr > 0 ? `+${dr}` : `${dr}`;
      const row = `<tr>
        <td class="pos-cell">${entry.pos}</td>
        <td>
          <div class="team-cell">
            <img class="team-logo" src="${team.logo}" alt="${team.name}" loading="lazy"
              onerror="this.onerror=null;this.src='https://placehold.co/28x28/1e2a2a/white?text=FC'">
            <span>${team.name}</span>
          </div>
        </td>
        <td>${entry.g}</td><td>${entry.v}</td><td>${entry.n}</td><td>${entry.p}</td>
        <td>${entry.gf}</td><td>${entry.gs}</td><td>${drStr}</td>
        <td><strong>${entry.pts}</strong></td>
        <td><div class="form-badge">${formHtml}</div></td>
      </tr>`;
      tbody.insertAdjacentHTML('beforeend', row);
    });
  }

  /* ───────── BRACKET ───────── */
  function getTeam(id, fallbackName) {
    return teamsMap.get(id) || { name: fallbackName, logo: `https://placehold.co/28x28/1e2a2a/white?text=FC` };
  }

  function calcAggregate(legs) {
    let homeTotal = 0, awayTotal = 0;
    legs.forEach(l => {
      if (!l.score || l.score === '?') return;
      // handle "2-1 (3-0 dcr)" style — take the main score only
      const main = l.score.split('(')[0].trim();
      const parts = main.split('-');
      homeTotal += parseInt(parts[0]) || 0;
      awayTotal += parseInt(parts[1]) || 0;
    });
    return `${homeTotal}-${awayTotal}`;
  }

  function teamLine(team, legs, side) {
    const logoHtml = `<img class="bracket-logo" src="${team.logo}" alt="${team.name}"
      onerror="this.onerror=null;this.src='https://placehold.co/24x24/1e2a2a/white?text=FC'">`;
    const legScores = legs
      .filter(l => l.score && l.score.trim() !== '' && l.score !== '?')
      .map(l => {
        const score = l.score;
        const parts = score.split('-');
        let val = side === 'home' ? (parts[0] || '?') : (parts[1] || '?');
        if (side === 'away' && parts[1]) val = parts[1];
        return `<span class="leg-score" title="${l.label}">${val}</span>`;
      }).join('');

    return `<div class="team-line">
      ${logoHtml}
      <span class="team-name">${team.name}</span>
      <div class="legs-scores">${legScores}</div>
    </div>`;
  }

  function matchCard(m, showAggregate, extraClass = '') {
    const home = getTeam(m.homeLogoId, m.home);
    const away = getTeam(m.awayLogoId, m.away);
    const legs = m.legs || [];

    const homeWon = m.winner && (m.winner === home.name || m.winner === m.home);
    const awayWon = m.winner && (m.winner === away.name || m.winner === m.away);

    // Compute aggregate if not provided but we have 2 legs
    let agg = m.aggregate;
    if (!agg && legs.length >= 2) {
      agg = calcAggregate(legs);
    }

    let aggHtml = '';
    if (showAggregate && agg) {
      aggHtml = `<div class="agg-line">Aggregato: <strong>${agg}</strong>${m.winner ? ' · <span class="agg-winner">✓ ' + m.winner + '</span>' : ''}</div>`;
    } else if (m.winner && !agg) {
      aggHtml = `<div class="agg-line"><span class="agg-winner">🏆 ${m.winner}</span></div>`;
    } else if (!agg && legs.length) {
      aggHtml = `<div class="agg-line agg-pending">⏳ In attesa del ritorno</div>`;
    }

    const legLabels = legs
      .filter(l => l.label && l.label.trim() !== '' && l.score && l.score.trim() !== '')
      .map(l => `<span class="leg-label">${l.label}</span>`)
      .join('');

    return `<div class="match-card ${extraClass} ${homeWon ? 'home-won' : ''} ${awayWon ? 'away-won' : ''}">
      <div class="leg-header">${legLabels}</div>
      <div class="match-teams">
        ${teamLine(home, legs, 'home')}
        ${teamLine(away, legs, 'away')}
      </div>
      ${aggHtml}
    </div>`;
  }

  function renderBracket() {
    const bracketDiv = document.getElementById('bracket-root');
    if (!bracketDiv) return;

    const rounds = [
      { key: 'ottavi',     title: 'OTTAVI FINALE',  showAgg: true },
      { key: 'quarti',     title: 'QUARTI FINALE',  showAgg: true },
      { key: 'semifinali', title: 'SEMIFINALI',     showAgg: true }
    ];

    let html = '';
    rounds.forEach(r => {
      const matches = data.bracket[r.key] || [];
      html += `<div class="round">
        <div class="round-title">${r.title}</div>`;
      matches.forEach(m => {
        html += matchCard(m, r.showAgg);
      });
      html += `</div>`;
    });

    // Finale
    const f = data.bracket.finale;
    html += `<div class="round finale-round">
      <div class="round-title finale-title">🏆 FINALE · 20 Mag</div>
      ${matchCard(f, false, 'finale-card')}
      <div class="agg-line" style="margin-top:0.75rem;">📍 Stadio de la Luz, Lisbona</div>
    </div>`;

    bracketDiv.innerHTML = html;

    // Render champion banner
    renderChampion();
  }

  function renderChampion() {
    const f = data.bracket.finale;
    if (!f || !f.winner) return;
    const winnerTeam = teamsMap.get(f.awayLogoId) || teamsMap.get(f.homeLogoId);
    // Find winner team by name
    const winnerObj = data.teams.find(t => t.name === f.winner || t.short === f.winner);
    const logoSrc = winnerObj ? winnerObj.logo : 'https://placehold.co/80x80/1e2a2a/white?text=FC';

    const banner = document.getElementById('champion-banner');
    if (!banner) return;
    banner.innerHTML = `
      <div class="champion-inner">
        <div class="champion-stars">★ ★ ★</div>
        <div class="champion-trophy">🏆</div>
        <img class="champion-logo" src="${logoSrc}" alt="${f.winner}"
          onerror="this.onerror=null;this.src='https://placehold.co/80x80/1e2a2a/white?text=FC'">
        <div class="champion-label">CAMPIONE</div>
        <div class="champion-name">${f.winner}</div>
        <div class="champion-subtitle">UEFA Europa League 2025/26</div>
        <div class="champion-stars">★ ★ ★</div>
      </div>
    `;
    banner.style.display = 'block';
  }

  /* ───────── TABS ───────── */
  function initTabs() {
    const btns = document.querySelectorAll('.tab-btn');
    const panels = {
      classifica: document.getElementById('classifica'),
      tabellone: document.getElementById('tabellone')
    };
    btns.forEach(btn => {
      btn.addEventListener('click', () => {
        const tabId = btn.getAttribute('data-tab');
        if (!tabId) return;
        btns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        Object.values(panels).forEach(p => p && p.classList.remove('active-panel'));
        if (panels[tabId]) panels[tabId].classList.add('active-panel');
      });
    });
    renderStandings();
    renderBracket();
  }

  initTabs();
})();