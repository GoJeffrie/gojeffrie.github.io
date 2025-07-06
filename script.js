// script.js
let fullRoster = [];
let workList = [];

async function loadRoster() {
  const data = await fetchRosterFromSheet();

  fullRoster = [...data]; 
  const savedWorkNames = JSON.parse(localStorage.getItem('workList')) || [];

  workList = savedWorkNames
    .map(name => fullRoster.find(c => c.name === name))
    .filter(c => c); 

  const workNames = new Set(workList.map(c => c.name));
  const rest = fullRoster.filter(c => !workNames.has(c.name));

  renderCards(workList, document.getElementById('work-list'), true);
  renderCards(rest, document.getElementById('roster-list'), false);
}

// Grab my data (csv to json)
async function fetchRosterFromSheet() {
  const url = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTb7hj7ghBnYKbDle7Ky_JYiofxnhBnF4LKn9n0jhluoNJtfeC5iR_L3c-ZMId9FT1445sQh6uACKeS/pub?gid=1778894250&single=true&output=csv';
  const res = await fetch(url);
  const csv = await res.text();

  const rows = csv.split('\n').map(r => r.split(','));
  const headers = rows[0];
  const data = rows.slice(1).map(row =>
    Object.fromEntries(headers.map((h, i) => [h.trim(), row[i]?.trim()]))
  );

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

function renderCards(list, container, isWorkList, clearContainer = true) {
  if (clearContainer) {
    container.innerHTML = '';
  }

  if (isWorkList && list.length === 0) {
    const placeholder = document.createElement('div');
    placeholder.id = 'work-placeholder';
    placeholder.className = 'placeholder';
    placeholder.textContent = 'Work Box';
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
    <div>${char.talent1}</div>
    <div>${char.talent2}</div>
    <div>${char.talent3}</div>
    </div>
    </div>
    
  <div class="constellationBadge ${constellationClass}">C${char.constellation}</div>
  
  <div class="content"></div>
   
`;
    container.appendChild(card);

card.addEventListener('click', () => {
  const modal = document.getElementById('charModal');
  const modalBody = document.getElementById('modalBody');
  const modalContent = modal.querySelector('.modal-content');

  modalContent.classList.remove(
    'element-pyro',
    'element-hydro',
    'element-electro',
    'element-cryo',
    'element-anemo',
    'element-geo',
    'element-dendro'
  );

for (const cls of card.classList) {
  if (cls.startsWith('element-')) {
    modalContent.classList.add(cls);
  }
}
// Pop up (Modal) for details
modalBody.innerHTML = `
  <div class="modalBody">
    <div class="modalLeft">
      <div class="portraitWrapper">
        <img class="modalPortrait" src="${char.avatar}" alt="${char.name}">
        <div class="modalgradientOverlay"></div>
      </div>
    </div>
    <div class="modalRight">
<div class="modalRight">

  <div class="modcharRow">
    <span class="modcharConBox">${char.talent1}</span>
    <span class="modcharStatBox">${char.level}</span>
    <span class="modcharStatBox">C${char.constellation}</span>
    <span class="modcharName">${char.name}</span>
  </div>

  <div class="modcharRow">
  <span class="modcharConBox">${char.talent2}</span>
    <span class="modcharStatBox">${char.wlevel}</span>
    <span class="modcharStatBox">R${char.wrefine}</span>
    <span class="modcharWeapon">${char.weapon}</span>
  </div>

  <div class="modcharRow">
  <span class="modcharConBox">${char.talent3}</span>
    <span class="modcharStatBox">${char.friendship}</span>
    <span class="modcharMetaLabel">Friendship</span>
    <span class="modcharStatBox">${char.joined || "N/A"}</span>
    <span class="modcharMetaLabel">Joined</span>
  </div>

</div>

  </div>
`;


  modal.style.display = 'block';
});
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

// Add event listeners
function setupEventListeners() {
  document.querySelector('.close-btn').addEventListener('click', () => {
    document.getElementById('charModal').style.display = 'none';
  });

  window.addEventListener('click', (e) => {
    const modal = document.getElementById('charModal');
    if (e.target === modal) {
      modal.style.display = 'none';
    }
  });

  const hamburger = document.getElementById('hamburger');
  const menu = document.getElementById('hamburgerMenu');

  hamburger.addEventListener('click', () => {
    menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
  });

  window.addEventListener('click', (e) => {
    if (!hamburger.contains(e.target) && !menu.contains(e.target)) {
      menu.style.display = 'none';
    }
  });

  let sortByDateAsc = true; 
  document.getElementById('sortByDateBtn').addEventListener('click', () => {
    const rosterList = document.getElementById('roster-list');
    const sorted = [...fullRoster]
      .filter(char => !workList.find(w => w.name === char.name))
      .sort((a, b) => {
        const dateA = new Date(a.joined || '1900-01-01');
        const dateB = new Date(b.joined || '1900-01-01');
        return sortByDateAsc ? dateA - dateB : dateB - dateA;
      });
    renderCards(sorted, rosterList, false);
    sortByDateAsc = !sortByDateAsc;
  });

  const regionOrder = ['Mondstadt', 'Liyue', 'Inazuma', 'Sumeru', 'Fontaine', 'Natlan', 'Snezhnaya', 'Unknown'];
  document.getElementById('sortByRegion').addEventListener('click', () => {
    renderGroupedRoster(fullRoster, 'region', {}, region => regionOrder.indexOf(region));
  });

  const elementOrder = ['Pyro', 'Hydro', 'Electro', 'Cryo', 'Anemo', 'Geo', 'Dendro'];
  document.getElementById('sortByElement').addEventListener('click', () => {
    renderGroupedRoster(fullRoster, 'element', {}, el => elementOrder.indexOf(el));
  });

  const weaponOrder = ['Sword', 'Claymore', 'Polearm', 'Bow', 'Catalyst'];
  document.getElementById('sortByWeapon').addEventListener('click', () => {
    renderGroupedRoster(fullRoster, 'class', {}, weapon => weaponOrder.indexOf(weapon));
  });

  document.getElementById('sortByRarity').addEventListener('click', () => {
    renderGroupedRoster(fullRoster, 'rarity', { '5': '5⭐', '4': '4⭐' }, r => 5 - parseInt(r));
  });

  document.getElementById('sortReset').addEventListener('click', () => {
    const workNames = new Set(workList.map(c => c.name));
    const rest = fullRoster.filter(c => !workNames.has(c.name));
    renderCards(rest, document.getElementById('roster-list'), false);
  });
}
// I want the group headers to have names, images, & counts 
const iconImageMap = {
  Anemo: 'images/elements/anemo.png',
  Pyro: 'images/elements/pyro.png',
  Hydro: 'images/elements/hydro.png',
  Electro: 'images/elements/electro.png',
  Cryo: 'images/elements/cryo.png',
  Geo: 'images/elements/geo.png',
  Dendro: 'images/elements/dendro.png'
};

const displayNameMap = {
  '5': '5-Star',
  '4': '4-Star',
  'Pyro': 'Pyro',
  'Hydro': 'Hydro',
  'Electro': 'Electro',
  'Cryo': 'Cryo',
  'Geo': 'Geo',
  'Anemo': 'Anemo',
  'Dendro': 'Dendro',
};

function renderGroupedRoster(roster, key, iconMap, sortFn) {
  const rosterList = document.getElementById('roster-list');
  rosterList.innerHTML = '';

  const workNames = new Set(workList.map(c => c.name));
  const rest = roster.filter(c => !workNames.has(c.name));

  const groups = {};
  rest.forEach(char => {
    const groupKey = char[key] || 'Unknown';
    if (!groups[groupKey]) groups[groupKey] = [];
    groups[groupKey].push(char);
  });

  const sortedGroups = Object.keys(groups).sort((a, b) => sortFn(a) - sortFn(b));

  sortedGroups.forEach(groupKey => {
  const header = document.createElement('div');
  header.className = 'groupHeader';

  const imageDiv = document.createElement('div');
  imageDiv.className = 'headerImage';
  imageDiv.style.backgroundImage = `url(${iconImageMap[groupKey] || ''})`;

  const textContainer = document.createElement('div');
  textContainer.className = 'headerTextContainer';

  const textDiv = document.createElement('div');
  textDiv.className = 'headerText';
  const displayName = displayNameMap[groupKey] || groupKey;
  textDiv.textContent = displayName;

  const countDiv = document.createElement('div');
  countDiv.className = 'headerCount';
  countDiv.textContent = `${groups[groupKey].length}`;

  textContainer.appendChild(textDiv);
  textContainer.appendChild(countDiv);
  header.appendChild(imageDiv);
  header.appendChild(textContainer);
  rosterList.appendChild(header);

  renderCards(groups[groupKey], rosterList, false, false);
});

}

// Initialize page

document.addEventListener('DOMContentLoaded', () => {
  loadRoster().then(() => {
    enableDragAndDrop();
    addSearch();
    setupEventListeners();
  });
});
// a lot of trial and error to get this working. must review & clean up
