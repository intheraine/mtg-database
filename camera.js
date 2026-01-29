// MTG NFC Card Viewer - Camera & AI Card Parsing Module

let videoStream = null;
let capturedImage = null;

/**
 * Initialize camera modal and event listeners
 */
export function initCamera() {
  const cameraBtn = document.getElementById('cameraBtn');
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
    resetCamera();
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
  const cameraPreview = document.getElementById('cameraPreview');
  
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
  const parseResult = document.getElementById('parseResult');

  cameraPreview.style.display = 'none';
  document.getElementById('cameraControls')?.style.display = 'none';
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
function resetCamera() {
  const cameraPreview = document.getElementById('cameraPreview');
  const parseResult = document.getElementById('parseResult');

  cameraPreview.style.display = 'block';
  document.getElementById('cameraControls')?.style.display = 'flex';
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
    const database = window.firebaseDatabase;
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
    if (window.loadCards) {
      await window.loadCards();
      if (window.selectByQuery) {
        window.selectByQuery(cardData.name);
      }
    }
  } catch (err) {
    announce(`Failed to add card: ${err.message}`);
  }
}

/**
 * Generate card ID from name
 */
function generateCardId(name) {
  // Simple ID generation: Use first 3 letters + timestamp
  const prefix = name.substring(0, 3).toUpperCase();
  const timestamp = Date.now().toString().slice(-4);
  return `${prefix}-${timestamp}`;
}

/**
 * Announce to screen readers
 */
function announce(msg) {
  const announcer = document.getElementById('announcer');
  if (announcer) {
    announcer.textContent = msg;
  }
}

// Export for use in app.js
export { announce };
