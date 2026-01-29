// MTG NFC Card Viewer - Application Logic

// Import camera module (inline since we can't use ES6 modules in script tags)
const searchInput = document.getElementById('search');
const cardName = document.getElementById('cardName');
const cardType = document.getElementById('cardType');
const cardText = document.getElementById('cardText');
const cardCost = document.getElementById('cardCost');
const cardStats = document.getElementById('cardStats');
const cardUrlHidden = document.getElementById('cardUrl');
const announcer = document.getElementById('announcer');
const idListDiv = document.getElementById('idList');

const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const copyBtn = document.getElementById('copyBtn');
const openBtn = document.getElementById('openBtn');
const listBtn = document.getElementById('listBtn');
const cameraBtn = document.getElementById('cameraBtn');

let cardDatabase = {};
let ids = [];
let currentIndex = -1;
let videoStream = null;
let capturedImage = null;

const fallback = {
  'PIR-001': {
    id: 'PIR-001',
    name: 'Subterranean Schooner',
    cost: 'one generic and one blue',
    type: 'Artifact – Vehicle',
    text: 'Whenever this Vehicle attacks, target creature that crewed it this turn explores. (Reveal the top card of your library. Put that card into your hand if it\'s a land. Otherwise, put a +1/+1 counter on that creature, then put the card back or put it into your graveyard.) Crew 1',
    power: '3',
    toughness: '4',
  },
  'PIR-004': {
    id: 'PIR-004',
    name: 'Inti, Seneschal of the Sun',
    cost: 'one generic and one red',
    type: 'Legendary Creature – Human Knight',
    text: 'Whenever you attack, you may discard a card. When you do, put a +1/+1 counter on target attacking creature. It gains trample until end of turn. Whenever you discard one or more cards, exile the top card of your library. You may play that card until your next end step.',
    power: '2',
    toughness: '2',
  },
  'PIR-007': {
    id: 'PIR-007',
    name: 'Gastal Thrillroller',
    cost: 'two generic and one red',
    type: 'Artifact – Vehicle',
    text: 'Trample, haste. When this Vehicle enters, it becomes an artifact creature until end of turn. Crew 2. Two generic and one red, Discard a card: Return this card from your graveyard to the battlefield with a finality counter on it. Activate only as a sorcery.',
    power: '4',
    toughness: '2',
  },
  'PIR-008': {
    id: 'PIR-008',
    name: 'Fearless Swashbuckler',
    cost: 'one generic, one blue, and one red',
    type: 'Creature – Fish Pirate',
    text: 'Haste. Vehicles you control have haste. Whenever you attack, if a Pirate and a Vehicle attacked this combat, draw three cards, then discard two cards.',
    power: '3',
    toughness: '3',
  },
  'PIR-011': {
    id: 'PIR-011',
    name: 'Captain Howler, Sea Scourge',
    cost: 'two generic, one blue, and one red',
    type: 'Legendary Creature – Shark Pirate',
    text: 'Ward—two generic, Pay 2 life. Whenever you discard one or more cards, target creature gets +2/+0 until end of turn for each card discarded this way. Whenever that creature deals combat damage to a player this turn, you draw a card.',
    power: '5',
    toughness: '4',
  },
  'PIR-013': {
    id: 'PIR-013',
    name: 'Spyglass Siren',
    cost: 'one blue',
    type: 'Creature – Siren Pirate',
    text: 'Flying. When this creature enters, create a Map token. (It\'s an artifact with "one generic, Tap, Sacrifice this token: Target creature you control explores. Activate only as a sorcery.")',
    power: '1',
    toughness: '1',
  },
  'PIR-017': {
    id: 'PIR-017',
    name: 'Marauding Mako',
    cost: 'one red',
    type: 'Creature – Shark Pirate',
    text: 'Whenever you discard one or more cards, put that many +1/+1 counters on this creature. Cycling two generic (two generic, Discard this card: Draw a card.)',
    power: '1',
    toughness: '1',
  },
  'PIR-021': {
    id: 'PIR-021',
    name: 'Scrounging Skyray',
    cost: 'one generic and one blue',
    type: 'Creature – Fish Pirate',
    text: 'Flying. Whenever you discard one or more cards, put that many +1/+1 counters on this creature. Cycling two generic (two generic, Discard this card: Draw a card.)',
    power: '1',
    toughness: '2',
  },
  'PIR-025': {
    id: 'PIR-025',
    name: 'Staunch Crewmate',
    cost: 'one generic and one blue',
    type: 'Creature – Human Pirate',
    text: 'When this creature enters, look at the top four cards of your library. You may reveal an artifact or Pirate card from among them and put it into your hand. Put the rest on the bottom of your library in a random order.',
    power: '2',
    toughness: '1',
  },
  'PIR-027': {
    id: 'PIR-027',
    name: 'Burst Lightning',
    cost: 'one red',
    type: 'Instant',
    text: 'Kicker four generic (You may pay an additional four generic as you cast this spell.) Burst Lightning deals 2 damage to any target. If this spell was kicked, it deals 4 damage instead.',
    power: null,
    toughness: null,
  },
  'PIR-031': {
    id: 'PIR-031',
    name: 'Broadside Barrage',
    cost: 'one generic, one blue, and one red',
    type: 'Instant',
    text: 'Broadside Barrage deals 5 damage to target creature or planeswalker. Draw a card, then discard a card.',
    power: null,
    toughness: null,
  },
  'PIR-033': {
    id: 'PIR-033',
    name: 'Spell Snare',
    cost: 'one blue',
    type: 'Instant',
    text: 'Counter target spell with mana value 2.',
    power: null,
    toughness: null,
  },
  'PIR-035': {
    id: 'PIR-035',
    name: 'Secluded Courtyard',
    cost: '',
    type: 'Land',
    text: 'As Secluded Courtyard enters the battlefield, choose a creature type. Tap: Add one colorless. Tap: Add one mana of any color. Spend this mana only to cast a creature spell of the chosen type or activate an ability of a creature or creature card of that type.',
  },
  'PIR-036': {
    id: 'PIR-036',
    name: 'Swiftwater Cliffs',
    cost: '',
    type: 'Land',
    text: 'Swiftwater Cliffs enters tapped. When it enters, you gain 1 life. Tap: Add one blue or one red.',
  },
  'PIR-037': {
    id: 'PIR-037',
    name: 'Island',
    cost: '',
    type: 'Basic Land – Island',
    text: '(Tap: Add one blue.)',
  },
  'PIR-038': {
    id: 'PIR-038',
    name: 'Mountain',
    cost: '',
    type: 'Basic Land – Mountain',
    text: '(Tap: Add one red.)',
  },
};

/**
 * Load cards from cards.json or use fallback database
 */
async function loadCards() {
  try {
    const res = await fetch('cards.json', { cache: 'no-store' });
    if (!res.ok) throw new Error('no cards.json');
    const data = await res.json();
    cardDatabase = data;
  } catch (e) {
    cardDatabase = fallback;
  }

  // Load custom cards from Firebase
  const database = window.firebaseDatabase;
  try {
    const customCardsRef = database.ref('cards');
    const snapshot = await customCardsRef.get();
    if (snapshot.exists()) {
      const firebaseCards = snapshot.val();
      // Merge Firebase cards with fallback
      cardDatabase = { ...cardDatabase, ...firebaseCards };
    }
  } catch (err) {
    console.log('Firebase cards not available:', err);
  }

  ids = Object.keys(cardDatabase).sort();
  idListDiv.textContent = ids.join(' ');
}

/**
 * Announce to screen readers
 */
function announce(msg) {
  announcer.textContent = msg;
}

/**
 * Get card ID from URL query parameter
 */
function getCardIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get('card');
}

/**
 * Update browser URL with card ID
 */
function updateUrl(cardId) {
  const newUrl = `${window.location.pathname}?card=${encodeURIComponent(cardId)}`;
  window.history.pushState({ cardId }, '', newUrl);
}

/**
 * Show card at specified index, with wrapping
 */
function showCardByIndex(i) {
  if (ids.length === 0) {
    announce('No cards available.');
    return;
  }
  if (i < 0) i = ids.length - 1;
  if (i >= ids.length) i = 0;
  currentIndex = i;
  const id = ids[currentIndex];
  const card = cardDatabase[id];
  displayCard(card);
  updateUrl(id);
}

/**
 * Display card information on page
 */
function displayCard(card) {
  cardName.textContent = `${card.id} – ${card.name}`;
  cardType.textContent = card.type || '';
  cardCost.textContent = card.cost ? `Cost: ${card.cost}` : '';
  cardText.textContent = card.text || '';
  if (card.power !== undefined && card.power !== null) {
    cardStats.textContent = `Power/Toughness: ${card.power}/${card.toughness}`;
  } else {
    cardStats.textContent = '';
  }

  const origin = window.location.protocol === 'file:' ? '' : window.location.origin;
  const base = origin + window.location.pathname;
  const url = `${base}?card=${encodeURIComponent(card.id)}`;
  cardUrlHidden.textContent = url;
  document.title = `${card.name} – MTG NFC`;
  announce(`${card.name} selected. Press C to copy the URL.`);
  document.getElementById('card').focus();
}

/**
 * Search and select card by query (ID or name)
 */
function selectByQuery(q) {
  if (!q) return;
  const trimmed = q.trim();
  if (!trimmed) return;
  const upper = trimmed.toUpperCase();

  // Try exact ID match first
  const direct = ids.find((id) => id.toUpperCase() === upper);
  if (direct) {
    currentIndex = ids.indexOf(direct);
    showCardByIndex(currentIndex);
    return;
  }

  // Try name match
  const found = ids.find((id) => {
    const c = cardDatabase[id];
    return c.name && c.name.toLowerCase().includes(trimmed.toLowerCase());
  });

  if (found) {
    currentIndex = ids.indexOf(found);
    showCardByIndex(currentIndex);
    return;
  }

  announce('No matching card found for ' + trimmed);
}

/**
 * Copy card URL to clipboard
 */
async function copyUrl() {
  const url = cardUrlHidden.textContent || '';
  if (!url) {
    announce('No URL to copy');
    return;
  }

  try {
    await navigator.clipboard.writeText(url);
    announce('URL copied to clipboard');
    copyBtn.textContent = 'Copied';
    setTimeout(() => {
      copyBtn.textContent = 'Copy URL';
    }, 1200);
  } catch (e) {
    // Fallback for older browsers
    const ta = document.createElement('textarea');
    ta.value = url;
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      announce('URL copied to clipboard (fallback)');
    } catch (_) {
      announce('Unable to copy automatically. Please copy manually: ' + url);
    }
    ta.remove();
  }
}

/**
 * Open card URL in new tab
 */
function openUrl() {
  const url = cardUrlHidden.textContent || '';
  if (!url) {
    announce('No URL to open');
    return;
  }
  window.open(url, '_blank', 'noopener');
  announce('Opened card URL in a new tab');
}

// Button click handlers
prevBtn.addEventListener('click', () => {
  showCardByIndex(currentIndex - 1);
});

nextBtn.addEventListener('click', () => {
  showCardByIndex(currentIndex + 1);
});

copyBtn.addEventListener('click', copyUrl);
openBtn.addEventListener('click', openUrl);

listBtn.addEventListener('click', () => {
  announce('Available IDs: ' + ids.join(', '));
});

// Search input handlers
searchInput.addEventListener('keydown', (ev) => {
  if (ev.key === 'Enter') {
    ev.preventDefault();
    selectByQuery(searchInput.value);
  } else if (ev.key === 'Escape') {
    searchInput.value = '';
  }
});

// Global keyboard shortcuts
document.addEventListener('keydown', (ev) => {
  const active = document.activeElement;
  const isInput = active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA');

  if (ev.key === '/') {
    ev.preventDefault();
    searchInput.focus();
    searchInput.select();
    return;
  }

  if (isInput) return;

  if (ev.key === 'ArrowLeft' || ev.key.toLowerCase() === 'p') {
    ev.preventDefault();
    showCardByIndex(currentIndex - 1);
  } else if (ev.key === 'ArrowRight' || ev.key.toLowerCase() === 'n') {
    ev.preventDefault();
    showCardByIndex(currentIndex + 1);
  } else if (ev.key.toLowerCase() === 'c') {
    ev.preventDefault();
    copyUrl();
  } else if (ev.key.toLowerCase() === 'o') {
    ev.preventDefault();
    openUrl();
  } else if (ev.key.toLowerCase() === 'l') {
    ev.preventDefault();
    announce('Available IDs: ' + ids.join(', '));
  }
});

// Browser history support
window.addEventListener('popstate', (event) => {
  if (event.state && event.state.cardId) {
    const idx = ids.indexOf(event.state.cardId);
    if (idx !== -1) {
      currentIndex = idx;
      displayCard(cardDatabase[event.state.cardId]);
    }
  }
});

// ==========================================
// CAMERA & AI PARSING FUNCTIONS
// ==========================================

/**
 * Initialize camera modal and event listeners
 */
function initCamera() {
  const cameraModal = document.getElementById('cameraModal');
  const cameraModalClose = document.getElementById('cameraModalClose');
  const captureBtn = document.getElementById('captureBtn');
  const uploadBtn = document.getElementById('uploadBtn');
  const fileInput = document.getElementById('fileInput');
  const retakeBtn = document.getElementById('retakeBtn');
  const confirmBtn = document.getElementById('confirmBtn');
  const videoElement = document.getElementById('videoElement');

  // Open camera modal
  cameraBtn.addEventListener('click', () => {
    openCameraModal(videoElement);
  });

  // Close modal
  cameraModalClose.addEventListener('click', () => {
    closeCameraModal();
  });

  // Allow ESC to close
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && cameraModal.classList.contains('open')) {
      closeCameraModal();
    }
  });

  // Capture photo from video
  captureBtn.addEventListener('click', () => {
    capturePhoto(videoElement);
  });

  // Upload from file
  uploadBtn.addEventListener('click', () => {
    fileInput.click();
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files[0]) {
      loadImageFile(e.target.files[0]);
    }
  });

  // Retake photo
  retakeBtn.addEventListener('click', () => {
    resetCamera(videoElement);
  });

  // Confirm and add card
  confirmBtn.addEventListener('click', () => {
    addParsedCard();
  });
}

/**
 * Open camera modal and start video stream
 */
async function openCameraModal(videoElement) {
  const cameraModal = document.getElementById('cameraModal');

  cameraModal.classList.add('open');
  cameraModal.setAttribute('aria-hidden', 'false');
  announce('Camera modal opened. Take or upload a photo of a Magic card.');

  try {
    videoStream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'environment',
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
    });
    videoElement.srcObject = videoStream;
    videoElement.play();
  } catch (err) {
    announce('Camera access denied. You can upload a photo instead.');
  }
}

/**
 * Close camera modal and stop video
 */
function closeCameraModal() {
  const cameraModal = document.getElementById('cameraModal');
  const videoElement = document.getElementById('videoElement');

  if (videoStream) {
    videoStream.getTracks().forEach((track) => track.stop());
    videoStream = null;
  }

  videoElement.srcObject = null;
  cameraModal.classList.remove('open');
  cameraModal.setAttribute('aria-hidden', 'true');
  announce('Camera closed.');
}

/**
 * Capture photo from video stream
 */
function capturePhoto(videoElement) {
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');

  canvas.width = videoElement.videoWidth;
  canvas.height = videoElement.videoHeight;
  ctx.drawImage(videoElement, 0, 0);

  capturedImage = canvas.toDataURL('image/jpeg', 0.8);
  showParseResult();
  parseCardImage(capturedImage);
}

/**
 * Load image from file input
 */
function loadImageFile(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    capturedImage = e.target.result;
    showParseResult();
    parseCardImage(capturedImage);
  };
  reader.readAsDataURL(file);
}

/**
 * Show parse result section
 */
function showParseResult() {
  const cameraPreview = document.getElementById('cameraPreview');
  const cameraControls = document.querySelector('.camera-controls');
  const parseResult = document.getElementById('parseResult');

  cameraPreview.style.display = 'none';
  if (cameraControls) cameraControls.style.display = 'none';
  parseResult.style.display = 'block';

  announce('Analyzing card image...');
}

/**
 * Send image to Gemini API for parsing
 */
async function parseCardImage(imageData) {
  const parseStatus = document.getElementById('parseStatus');
  const parsedCardInfo = document.getElementById('parsedCardInfo');

  try {
    parseStatus.textContent = 'Analyzing card...';

    // Convert base64 to bytes for API
    const base64Data = imageData.split(',')[1];

    const response = await fetch(window.GEMINI_API_URL + '?key=' + window.GEMINI_API_KEY, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `Analyze this Magic: The Gathering card image and extract the following information in JSON format:
{
  "name": "Card name",
  "cost": "Mana cost in words (e.g., 'one generic and one blue')",
  "type": "Card type line",
  "text": "Card abilities and text",
  "power": "Power (null if not a creature)",
  "toughness": "Toughness (null if not a creature)"
}

Only return valid JSON, nothing else.`,
              },
              {
                inline_data: {
                  mime_type: 'image/jpeg',
                  data: base64Data,
                },
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const generatedText = data.candidates[0].content.parts[0].text;

    // Parse JSON from response
    const cardData = JSON.parse(generatedText);

    // Display parsed card
    displayParsedCard(cardData);
    parseStatus.textContent = 'Card analyzed successfully!';
    announce('Card analyzed. Review the information and click Add Card to save it.');
  } catch (err) {
    parseStatus.textContent = `Error: ${err.message}`;
    announce(`Failed to parse card: ${err.message}`);
  }
}

/**
 * Display parsed card data
 */
function displayParsedCard(cardData) {
  const parsedCardInfo = document.getElementById('parsedCardInfo');

  parsedCardInfo.innerHTML = `
    <div class="parse-result-line"><strong>Name:</strong> ${cardData.name || 'Unknown'}</div>
    <div class="parse-result-line"><strong>Cost:</strong> ${cardData.cost || 'None'}</div>
    <div class="parse-result-line"><strong>Type:</strong> ${cardData.type || 'Unknown'}</div>
    <div class="parse-result-line"><strong>Text:</strong> ${cardData.text || 'No text'}</div>
    ${
      cardData.power && cardData.toughness
        ? `<div class="parse-result-line"><strong>Power/Toughness:</strong> ${cardData.power}/${cardData.toughness}</div>`
        : ''
    }
  `;

  // Store for confirmation
  window.pendingCardData = cardData;
}

/**
 * Reset camera and show video again
 */
function resetCamera(videoElement) {
  const cameraPreview = document.getElementById('cameraPreview');
  const cameraControls = document.querySelector('.camera-controls');
  const parseResult = document.getElementById('parseResult');

  cameraPreview.style.display = 'block';
  if (cameraControls) cameraControls.style.display = 'flex';
  parseResult.style.display = 'none';
  capturedImage = null;

  announce('Camera reset. Ready to capture another photo.');
}

/**
 * Add parsed card to database
 */
async function addParsedCard() {
  const cardData = window.pendingCardData;
  if (!cardData) return;

  try {
    announce('Adding card to database...');

    // Generate card ID
    const cardId = generateCardId(cardData.name);

    // Add to Realtime Database
    const dbRef = window.firebaseDatabase.ref(`cards/${cardId}`);

    await dbRef.set({
      id: cardId,
      name: cardData.name || '',
      cost: cardData.cost || '',
      type: cardData.type || '',
      text: cardData.text || '',
      power: cardData.power || null,
      toughness: cardData.toughness || null,
      addedDate: new Date().toISOString(),
    });

    announce(`Card "${cardData.name}" added successfully!`);
    closeCameraModal();

    // Reload cards and display the new one
    await loadCards();
    selectByQuery(cardData.name);
  } catch (err) {
    announce(`Failed to add card: ${err.message}`);
  }
}

/**
 * Generate card ID from name
 */
function generateCardId(name) {
  // Simple ID generation: Use first 3 letters + random number
  const prefix = name.substring(0, 3).toUpperCase();
  const randomNum = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0');
  return `${prefix}-${randomNum}`;
}

// Initialize application
(async function init() {
  await loadCards();

  // Initialize camera
  initCamera();

  const urlCardId = getCardIdFromUrl();

  if (urlCardId) {
    const upperCardId = urlCardId.toUpperCase();
    const idx = ids.indexOf(upperCardId);
    if (idx !== -1) {
      currentIndex = idx;
      showCardByIndex(currentIndex);
    } else {
      announce(`Card ${urlCardId} not found. Showing first card.`);
      currentIndex = 0;
      showCardByIndex(0);
    }
  } else if (ids.length) {
    currentIndex = 0;
    showCardByIndex(0);
  } else {
    announce('No cards loaded.');
  }
})();
