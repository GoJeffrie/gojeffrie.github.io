// script.js
let fullRoster = [];
let workList = [];
let sortByDateAsc = true;


function loadProfilePicture() {
  const profileUrl = "https://cdn.enka.network/avatars/e22e3c42b64fe4e17b83a12a1cf41e3e/21420945625107344821bf84d717c9a3.png?686bf63f3f";
  const img = document.getElementById('profilePic');
  if (img) {
    img.src = profileUrl;
  }
}

const sortState = {
  region: false,
  element: false,
  weapon: false,
  rarity: false
};

const regionOrder = ['Mondstadt', 'Liyue', 'Inazuma', 'Sumeru', 'Fontaine', 'Natlan', 'Snezhnaya', 'Unknown'];
const elementOrder = ['Pyro', 'Hydro', 'Electro', 'Cryo', 'Anemo', 'Geo', 'Dendro'];
const weaponOrder = ['Sword', 'Claymore', 'Polearm', 'Bow', 'Catalyst'];

// Need to make a better visual divider
//  const iconImageMap = {
//  Anemo: 'images/elements/anemo.png',
//  Pyro: 'images/elements/pyro.png',
//  Hydro: 'images/elements/hydro.png',
//  Electro: 'images/elements/electro.png',
//  Cryo: 'images/elements/cryo.png',
//  Geo: 'images/elements/geo.png',
//  Dendro: 'images/elements/dendro.png'
//  };

const displayNameMap = {
  '5': '5-Star',
  '4': '4-Star',
  Pyro: 'Pyro',
  Hydro: 'Hydro',
  Electro: 'Electro',
  Cryo: 'Cryo',
  Geo: 'Geo',
  Anemo: 'Anemo',
  Dendro: 'Dendro'
};

function handleSortToggle({ key, overlayId, icons, groupKey, iconMap, sortFn }) {
  sortState[key] = !sortState[key];

  const overlay = document.getElementById(overlayId);
  if (overlay && icons) {
    overlay.textContent = sortState[key] ? icons.on : icons.off;
  }

  renderGroupedRoster(
    fullRoster,
    groupKey,
    iconMap,
    sortFn,
    sortState[key] ? 'joined' : 'name'
  );
}

async function loadRoster() {
  try {
    const data = await fetchRosterFromSheet();
    fullRoster = [...data];
    const savedWorkNames = JSON.parse(localStorage.getItem('workList')) || [];

    workList = savedWorkNames
      .map(name => fullRoster.find(c => c.name === name))
      .filter(Boolean);

    const workNames = new Set(workList.map(c => c.name));
    const rest = fullRoster.filter(c => !workNames.has(c.name));

    renderCards(workList, document.getElementById('work-list'), true);
    renderCards(rest, document.getElementById('roster-list'), false);
  } catch (err) {
    console.error('Failed to load roster:', err);
    alert('Unable to load roster. Please try again later.');
  }
}

async function fetchRosterFromSheet() {
  const url = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTb7hj7ghBnYKbDle7Ky_JYiofxnhBnF4LKn9n0jhluoNJtfeC5iR_L3c-ZMId9FT1445sQh6uACKeS/pub?gid=1778894250&single=true&output=csv';
  const res = await fetch(url);
  const csv = await res.text();
  const rows = csv.split('\n').map(r => r.split(','));

  // Only use headers for columns B-Y (skip column A and anything after Y)
  const headers = rows[0].slice(1, 26); // column indexes 1 to 26 (B to Z)

  return rows.slice(1) // skip header row
    .filter(row => row[0]?.toLowerCase() === 'true') // column A (index 0) must be "true"
    .map(row => {
      const charData = Object.fromEntries(
        headers.map((h, i) => [
          h.trim(),
          row[i + 1]?.trim().replace(/\|/g, '<br>') || '' // offset by +1 since we're skipping column A
        ])
      );

      return {
        ...charData,
        level: +charData.level,
        constellation: +charData.constellation,
        talent1: +charData.talent1,
        talent2: +charData.talent2,
        talent3: +charData.talent3,
        friendship: +charData.friendship,
        rarity: +charData.rarity
      };
    })
    .filter(char => char.name); // only include entries with a name
}



function renderCards(list, container, isWorkList, clearContainer = true) {
  if (clearContainer) container.innerHTML = '';

  if (isWorkList && list.length === 0) {
    const placeholder = document.createElement('div');
    placeholder.id = 'work-placeholder';
    placeholder.className = 'placeholder';
    placeholder.textContent = 'Work Area';
    container.appendChild(placeholder);
  }

  list.forEach(char => {
    const card = document.createElement('div');
    const constellationClass = char.rarity === 5 ? 'fivestarStat' : 'fourstarStat';
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
      <div class="constellationBadge ${constellationClass}">C${char.constellation}</div>
    `;

    card.addEventListener('click', () => showModal(char, card));
    container.appendChild(card);
  });
}

function showModal(char, card) {
  const modal = document.getElementById('charModal');
  const modalBody = document.getElementById('modalBody');
  const modalContent = modal.querySelector('.modal-content');

  modalContent.className = 'modal-content';
  for (const cls of card.classList) {
    if (cls.startsWith('element-')) modalContent.classList.add(cls);
  }

modalBody.innerHTML = `
  <div class="modalBody">
    <div class="modalLeft">
      <div class="portraitWrapper">
        <img class="modalPortrait" src="${char.avatar}" alt="${char.name}">
        <div class="modalgradientUnderlay"></div>
        <div class="modalgradientOverlay"></div>
      </div>
    </div>
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
        <span class="modcharStatBox">${char.joined || "--"}</span>
        <span class="modcharMetaLabel">Joined</span>
      </div>
      <span class="modcharBuildLabel">Building Notes</span>
      <div class="modcharRow scaleRow">
        <span class="modcharStatBox">${char.clock || "--"}</span>        
        <span class="modcharMetaLabel">Clock</span>
        <span class="modcharStatBox">${char.scale || "--"}</span>
        <span class="modcharMetaLabel">Scaling</span>
        <span class="modcharStatBox">${char.cup || "--"}</span>
        <span class="modcharMetaLabel">Cup</span>
        <span class="modcharStatBox">${char.er || "--"}</span>
        <span class="modcharMetaLabel">ER</span>
        <span class="modcharStatBox">${char.crown || "--"}</span>
        <span class="modcharMetaLabel">Crown</span>
        <span class="modcharStatBox">${char.em || "--"}</span>
        <span class="modcharMetaLabel">EM</span>
      </div>
      <div class="modcharRow notesRow">
        <div class="modcharNotes">
          <div class="modcharNote">${char.note1 || "No notes at this time."}</div>
        </div>
      </div>
    </div>
  </div>
`;
;
  modal.style.display = 'block';
}

function enableDragAndDrop() {
  const workListEl = document.getElementById('work-list');
  const rosterListEl = document.getElementById('roster-list');

  // Worklist (limit to 4)
  new Sortable(workListEl, {
    group: 'shared',
    animation: 150,
    onAdd: function (evt) {
      if (workListEl.children.length > 4) {
        // Revert if more than 4 cards are added
        evt.from.insertBefore(evt.item, evt.from.children[evt.oldIndex]);
        return;
      }
      updateStoredWorkList();
    },
    onRemove: updateStoredWorkList,
    onSort: updateStoredWorkList
  });

  // Roster list (no limit)
  new Sortable(rosterListEl, {
    group: 'shared',
    animation: 150,
    onAdd: updateStoredWorkList,
    onRemove: updateStoredWorkList,
    onSort: updateStoredWorkList
  });
}


function updateStoredWorkList() {
  const workCards = document.querySelectorAll('#work-list .charCard');
  const names = Array.from(workCards).map(card => card.dataset.name);
  localStorage.setItem('workList', JSON.stringify(names));

  const placeholder = document.getElementById('work-placeholder');
  if (placeholder) placeholder.style.display = workCards.length === 0 ? 'block' : 'none';
}

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

function setupEventListeners() {
  document.querySelector('.close-btn').addEventListener('click', () => {
    document.getElementById('charModal').style.display = 'none';
  });

  window.addEventListener('click', (e) => {
    if (e.target.id === 'charModal') {
      document.getElementById('charModal').style.display = 'none';
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
  const icon = document.getElementById('sortByDateIcon');
  if (icon) icon.textContent = sortByDateAsc ? '◀️' : '▶️';
});

  document.getElementById('sortByRegion').addEventListener('click', () => {
    handleSortToggle({
      key: 'region',
      overlayId: 'regionOverlay',
      icons: { on: '📅', off: '🅰️' },
      groupKey: 'region',
      iconMap: {},
      sortFn: region => regionOrder.indexOf(region)
    });
  });

  document.getElementById('sortByElement').addEventListener('click', () => {
    handleSortToggle({
      key: 'element',
      overlayId: 'elementOverlay',
      icons: { on: '📅', off: '🅰️' },
      groupKey: 'element',
      iconMap: {},
      sortFn: el => elementOrder.indexOf(el)
    });
  });

  document.getElementById('sortByWeapon').addEventListener('click', () => {
    handleSortToggle({
      key: 'weapon',
      overlayId: 'weaponOverlay',
      icons: { on: '📅', off: '🅰️' },
      groupKey: 'class',
      iconMap: {},
      sortFn: w => weaponOrder.indexOf(w)
    });
  });

  document.getElementById('sortByRarity').addEventListener('click', () => {
    handleSortToggle({
      key: 'rarity',
      overlayId: 'rarityOverlay',
      icons: { on: '📅', off: '🅰️' },
      groupKey: 'rarity',
      iconMap: {},
      sortFn: r => 5 - parseInt(r)
    });
  });

  document.getElementById('sortReset').addEventListener('click', () => {
    const workNames = new Set(workList.map(c => c.name));
    const rest = fullRoster.filter(c => !workNames.has(c.name));
    renderCards(rest, document.getElementById('roster-list'), false);
  });
}

document.getElementById('profileBox').addEventListener('click', async () => {
  const modal = document.getElementById('charModal');
  const modalBody = document.getElementById('modalBody');
  const modalContent = modal.querySelector('.modal-content');

  modalContent.className = 'modal-content profile-mode';


  // Fetch your text file from GitHub
  let aboutText = 'Loading...';
  try {
    const res = await fetch('https://raw.githubusercontent.com/GoJeffrie/gojeffrie/main/about.txt');
    if (!res.ok) throw new Error('Failed to fetch about text');
    aboutText = await res.text();
  } catch (err) {
    aboutText = 'Unable to load about text.';
    console.error(err);
  }

  modalBody.innerHTML = `
    <div class="modalBody profileModalBody">
      <div class="profileModalLeft">
        <img class="modalPortrait" src="${document.getElementById('profilePic').src}" alt="Profile Picture">
      </div>
      <div class="profileModalRight">
        <h2>Hey There!</h2>
        <pre style="white-space: pre-wrap; font-family: inherit;">${aboutText}</pre>
      </div>
    </div>
  `;

  modal.style.display = 'block';
});



function renderGroupedRoster(roster, key, iconMap, sortFn, secondarySortKey = 'name') {
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
    imageDiv.style.backgroundImage = `url(${iconMap[groupKey] || ''})`;

    const textContainer = document.createElement('div');
    textContainer.className = 'headerTextContainer';

    const textDiv = document.createElement('div');
    textDiv.className = 'headerText';
    textDiv.textContent = displayNameMap[groupKey] || groupKey;

    const countDiv = document.createElement('div');
    countDiv.className = 'headerCount';
    countDiv.textContent = `${groups[groupKey].length}`;

    textContainer.appendChild(textDiv);
    textContainer.appendChild(countDiv);
    header.appendChild(imageDiv);
    header.appendChild(textContainer);
    rosterList.appendChild(header);

    const sortedGroup = groups[groupKey].sort((a, b) => {
      if (secondarySortKey === 'joined') {
        return new Date(a.joined || '1900-01-01') - new Date(b.joined || '1900-01-01');
      }
      return a[secondarySortKey].localeCompare(b[secondarySortKey]);
    });

    renderCards(sortedGroup, rosterList, false, false);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  loadRoster().then(() => {
    enableDragAndDrop();
    addSearch();
    setupEventListeners();
    loadProfilePicture(); // ⬅️ Add this here
  });
});
