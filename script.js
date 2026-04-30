(function() {
  const data = window.EUROPA_DATA;
  const teamsMap = new Map(data.teams.map(t => [t.id, t]));

  // Render classifica
  function renderStandings() {
    const tbody = document.getElementById('standings-body');
    if (!tbody) return;
    tbody.innerHTML = '';
    data.standings.forEach(entry => {
      const team = teamsMap.get(entry.teamId);
      if (!team) return;
      const formHtml = entry.form.map(res => `<span class="form-dot form-${res === 'W' ? 'w' : (res === 'D' ? 'd' : 'l')}">${res === 'W' ? 'W' : (res === 'D' ? 'D' : 'L')}</span>`).join('');
      const row = `<tr>
        <td class="pos-highlight">${entry.pos}</td>
        <td><div class="team-cell"><img class="team-logo" src="${team.logo}" alt="${team.name}" loading="lazy" onerror="this.src='https://placehold.co/30x30/1e2a2a/white?text=FC'"> ${team.name}</div></td>
        <td>${entry.g}</td><td>${entry.v}</td><td>${entry.n}</td><td>${entry.p}</td>
        <td>${entry.gf}</td><td>${entry.gs}</td><td>${entry.gf - entry.gs}</td>
        <td><strong>${entry.pts}</strong></td>
        <td><div class="form-badge">${formHtml}</div></td>
      </tr>`;
      tbody.insertAdjacentHTML('beforeend', row);
    });
  }

  function getTeamLogoByName(name) {
    const found = data.teams.find(t => t.name === name || t.short === name);
    if(found) return found.logo;
    return "https://placehold.co/30x30/1e2a2a/white?text=FC";
  }

  function renderBracket() {
    const bracketDiv = document.getElementById('bracket-root');
    if (!bracketDiv) return;
    const rounds = [
      { title: "OTTAVI FINALE", matches: data.bracket.ottavi },
      { title: "QUARTI FINALE", matches: data.bracket.quarti },
      { title: "SEMIFINALI", matches: data.bracket.semifinali }
    ];
    let html = `<div class="bracket">`;
    rounds.forEach(round => {
      html += `<div class="round"><div class="round-title">${round.title}</div>`;
      round.matches.forEach(m => {
        const homeTeam = data.teams.find(t => t.id === m.homeLogoId) || { name: m.home, logo: getTeamLogoByName(m.home) };
        const awayTeam = data.teams.find(t => t.id === m.awayLogoId) || { name: m.away, logo: getTeamLogoByName(m.away) };
        html += `
          <div class="match-card">
            <div class="match-teams">
              <div class="team-line"><img src="${homeTeam.logo}" onerror="this.src='https://placehold.co/24x24/1e2a2a/white?text=?'"> ${homeTeam.name} <span class="match-score">${m.score.split(' ')[0]}</span></div>
              <div class="team-line"><img src="${awayTeam.logo}" onerror="this.src='https://placehold.co/24x24/1e2a2a/white?text=?'"> ${awayTeam.name} <span class="match-score">${m.score.includes('dcr') ? m.score.split(' ')[0] : m.score.split(' ')[0]}</span></div>
            </div>
          </div>`;
      });
      html += `</div>`;
    });
    // finale extra
    const finale = data.bracket.finale;
    const finalHome = data.teams.find(t => t.id === finale.homeLogoId) || { name: finale.home, logo: getTeamLogoByName(finale.home) };
    const finalAway = data.teams.find(t => t.id === finale.awayLogoId) || { name: finale.away, logo: getTeamLogoByName(finale.away) };
    html += `<div class="round"><div class="round-title">🏆 FINALE (20 Mag)</div>
      <div class="match-card">
        <div class="match-teams">
          <div class="team-line"><img src="${finalHome.logo}" onerror="this.src='https://placehold.co/24x24/1e2a2a/white?text=?'"> ${finalHome.name} <span class="match-score">vs</span></div>
          <div class="team-line"><img src="${finalAway.logo}" onerror="this.src='https://placehold.co/24x24/1e2a2a/white?text=?'"> ${finalAway.name} <span class="match-score">•</span></div>
        </div>
      </div>
    </div></div>`;
    bracketDiv.innerHTML = html;
  }

  // tabs
  function initTabs() {
    const btns = document.querySelectorAll('.tab-btn');
    const panels = { classifica: document.getElementById('classifica'), tabellone: document.getElementById('tabellone') };
    btns.forEach(btn => {
      btn.addEventListener('click', () => {
        const tabId = btn.getAttribute('data-tab');
        if (!tabId) return;
        btns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        Object.values(panels).forEach(p => p.classList.remove('active-panel'));
        if (tabId === 'classifica') panels.classifica.classList.add('active-panel');
        if (tabId === 'tabellone') panels.tabellone.classList.add('active-panel');
        if (tabId === 'tabellone' && document.getElementById('bracket-root').innerHTML === '') renderBracket();
      });
    });
    renderStandings();
    renderBracket();
  }
  initTabs();
})();