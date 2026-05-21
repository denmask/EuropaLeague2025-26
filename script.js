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

  function teamLine(team, legs, side) {
    /* side: 'home' or 'away' */
    const logoHtml = `<img class="bracket-logo" src="${team.logo}" alt="${team.name}"
      onerror="this.onerror=null;this.src='https://placehold.co/24x24/1e2a2a/white?text=FC'">`;
    const legScores = legs.map(l => {
      const score = l.score || '?';
      const parts = score.split('-');
      let val = side === 'home' ? (parts[0] || '?') : (parts[1] || '?');
      // handle extras like "1-1 (3-2 dcr)"
      if (side === 'away' && parts[1]) val = parts[1];
      const pending = score === '?';
      return `<span class="leg-score ${pending ? 'leg-pending' : ''}" title="${l.label}">${val}</span>`;
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

    let aggHtml = '';
    if (showAggregate && m.aggregate) {
      aggHtml = `<div class="agg-line">Aggregato: <strong>${m.aggregate}</strong>${m.winner ? ' · <span class="agg-winner">✓ ' + m.winner + '</span>' : ''}</div>`;
    } else if (m.winner && !m.aggregate) {
      aggHtml = `<div class="agg-line"><span class="agg-winner">🏆 ${m.winner}</span></div>`;
    } else if (!m.aggregate && legs.length) {
      // in progress
      aggHtml = `<div class="agg-line agg-pending">⏳ In attesa del ritorno</div>`;
    }

    const legLabels = legs.map(l =>
      `<span class="leg-label">${l.label}</span>`
    ).join('');

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
      { key: 'ottavi',    title: 'OTTAVI FINALE',   showAgg: true },
      { key: 'quarti',    title: 'QUARTI FINALE',    showAgg: true },
      { key: 'semifinali',title: 'SEMIFINALI',       showAgg: false }
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