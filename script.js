let fullRoster = [];
let workList = [];

// Load JSON data and saved state from localStorage
async function loadRoster() {
  const res = await fetch('roster.json');
  const data = await res.json();

  fullRoster = [...data.roster, ...data.workList];
  const savedWorkNames = JSON.parse(localStorage.getItem('workList')) || [];

  workList = savedWorkNames
    .map(name => fullRoster.find(c => c.name === name))
    .filter(c => c); // Remove nulls in case of missing names

  const workNames = new Set(workList.map(c => c.name));
  const rest = fullRoster.filter(c => !workNames.has(c.name));

  renderCards(workList, document.getElementById('work-list'), true);
  renderCards(rest, document.getElementById('roster-list'), false);
}

// Render character cards and placeholder
function renderCards(list, container, isWorkList) {
  container.innerHTML = '';

  if (isWorkList && list.length === 0) {
    const placeholder = document.createElement('div');
    placeholder.id = 'work-placeholder';
    placeholder.className = 'placeholder';
    placeholder.textContent = 'Work Area. Drop Characters Here';
    container.appendChild(placeholder);
  }

  list.forEach(char => {
    const card = document.createElement('div');
    const isFiveStar = char.rarity === 5;
    const constellationClass = isFiveStar ? 'fivestarStat' : '';
    card.className = `charCard element-${char.element.toLowerCase()}`;
    card.dataset.name = char.name;
    card.innerHTML = `
      <div class="charInfo">
        <img class="portrait" src="${char.avatar}" alt="${char.name}">
      </div>
      <div class="charStats">
        <div class="${constellationClass}">C${char.constellation}</div>
        <div>${char.level}</div>
        <div>${char.talent1}</div>
        <div>${char.talent2}</div>
        <div>${char.talent3}</div>
        <div class="friendStat">${char.friendship}</div>
      </div>
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

document.addEventListener('DOMContentLoaded', () => {
  loadRoster().then(() => {
    enableDragAndDrop();
    addSearch();
  });
});
