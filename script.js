let fullRoster = [];
let workList = [];

// Load CSV data from Google Sheets and saved state from localStorage
async function loadRoster() {
  const data = await fetchRosterFromSheet();

  fullRoster = [...data]; // everything from sheet
  const savedWorkNames = JSON.parse(localStorage.getItem('workList')) || [];

  workList = savedWorkNames
    .map(name => fullRoster.find(c => c.name === name))
    .filter(c => c); // Remove nulls in case of missing names

  const workNames = new Set(workList.map(c => c.name));
  const rest = fullRoster.filter(c => !workNames.has(c.name));

  renderCards(workList, document.getElementById('work-list'), true);
  renderCards(rest, document.getElementById('roster-list'), false);
}

// Fetch Google Sheets CSV and convert to JSON
async function fetchRosterFromSheet() {
  const url = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTb7hj7ghBnYKbDle7Ky_JYiofxnhBnF4LKn9n0jhluoNJtfeC5iR_L3c-ZMId9FT1445sQh6uACKeS/pub?gid=1778894250&single=true&output=csv';
  const res = await fetch(url);
  const csv = await res.text();

  const rows = csv.split('\n').map(r => r.split(','));
  const headers = rows[0];
  const data = rows.slice(1).map(row =>
    Object.fromEntries(headers.map((h, i) => [h.trim(), row[i]?.trim()]))
  );

  // convert strings to numbers where needed
  const roster = data.map(char => ({
    ...char,
    level: +char.level,
    constellation: +char.constellation,
    talent1: +char.talent1,
    talent2: +char.talent2,
    talent3: +char.talent3,
    friendship: +char.friendship,
    rarity: +char.rarity
  }));

  return roster;
}

// Render character cards and placeholder
function renderCards(list, container, isWorkList) {
  container.innerHTML = '';

  if (isWorkList && list.length === 0) {
    const placeholder = document.createElement('div');
    placeholder.id = 'work-placeholder';
    placeholder.className = 'placeholder';
    placeholder.textContent = 'Concept Designs. Thanks for Stopping By.';
    container.appendChild(placeholder);
  }

  list.forEach(char => {
    const card = document.createElement('div');
    let constellationClass = '';
     if (char.rarity === 5) {
        constellationClass = 'fivestarStat';
     } else if (char.rarity === 4) {
        constellationClass = 'fourstarStat';
    }

    card.className = `charCard element-${char.element.toLowerCase()}`;
    card.dataset.name = char.name;
    card.innerHTML = `
    <div class="charInfo">
    <img class="portrait" src="${char.avatar}" alt="${char.name}">
    </div>
    <div class="gradientOverlay"></div>

    <div class="charStats">
    <!--<div class="levelStat">${char.level}</div>-->
    <div>${char.talent1}</div>
    <div>${char.talent2}</div>
    <div>${char.talent3}</div>
    <!--<div class="friendStat">${char.friendship}</div>-->
    </div>
    </div>
    <div class="constellationBadge ${constellationClass}">C${char.constellation}</div>

    
   <div class="content"></div>
`;
    container.appendChild(card);
  });
}

// Enable drag-and-drop and track changes
function enableDragAndDrop() {
  const workListEl = document.getElementById('work-list');
  const rosterListEl = document.getElementById('roster-list');

  new Sortable(workListEl, {
    group: 'shared',
    animation: 150,
    onAdd: updateStoredWorkList,
    onRemove: updateStoredWorkList,
    onSort: updateStoredWorkList
  });

  new Sortable(rosterListEl, {
    group: 'shared',
    animation: 150,
    onAdd: updateStoredWorkList,
    onRemove: updateStoredWorkList,
    onSort: updateStoredWorkList
  });
}

// Update localStorage and UI when cards move
function updateStoredWorkList() {
  const workCards = document.querySelectorAll('#work-list .charCard');
  const names = Array.from(workCards).map(card => card.dataset.name);
  localStorage.setItem('workList', JSON.stringify(names));

  const placeholder = document.getElementById('work-placeholder');
  if (placeholder) {
    placeholder.style.display = workCards.length === 0 ? 'block' : 'none';
  }
}

// Basic search bar
function addSearch() {
  const input = document.getElementById('search');
  input.addEventListener('input', () => {
    const term = input.value.toLowerCase();
    const cards = document.querySelectorAll('#roster-list .charCard');
    cards.forEach(card => {
      const name = card.querySelector('img').alt.toLowerCase();
      card.style.display = name.includes(term) ? '' : 'none';
    });
  });
}

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
  loadRoster().then(() => {
    enableDragAndDrop();
    addSearch();
  });
});
