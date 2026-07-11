const SYMBOLS = [
  'XAUUSD', 'BTCUSDT', 'NAS100', 'USDJPY', 'GBPJPY',
  'EURUSD', 'GBPUSD', 'AUDUSD', 'USDCAD', 'NZDUSD',
  'US30', 'XAGUSD'
];

// Active state of symbols in memory
const symbolStates = {};
SYMBOLS.forEach(sym => {
  symbolStates[sym] = {
    symbol: sym,
    timeframe: '-',
    direction: 'NEUTRAL',
    score: 0,
    rules: '-',
    smt: 'None',
    price: 0,
    timestamp: null
  };
});

// UI Elements
const pairsContainer = document.getElementById('pairs-container');
const logsBody = document.getElementById('logs-body');
const connectionStatus = document.getElementById('connection-status');
const filterStrongCheckbox = document.getElementById('filter-strong');
const btnSound = document.getElementById('btn-sound');
const btnSimulate = document.getElementById('btn-simulate');
const btnClearLogs = document.getElementById('btn-clear-logs');
const webhookUriDisplay = document.getElementById('webhook-uri-display');

// Alert state
let soundEnabled = true;
const alertSound = document.getElementById('alert-sound');
const strongAlertSound = document.getElementById('strong-alert-sound');

// Update Webhook URL display dynamically based on the current window location
webhookUriDisplay.textContent = `${window.location.origin}/webhook`;

// Initialize Symbol Cards
function initCards() {
  pairsContainer.innerHTML = '';
  SYMBOLS.forEach(sym => {
    const card = document.createElement('div');
    card.className = 'glass-panel pair-card';
    card.id = `card-${sym}`;
    card.innerHTML = `
      <div class="pair-card-header">
        <span class="pair-name">${sym}</span>
        <span class="signal-status neutral" id="status-${sym}">NEUTRAL</span>
      </div>
      <div class="pair-card-body">
        <div class="confluence-box">
          <span class="confluence-score" id="score-${sym}">0/10</span>
          <span class="confluence-label">CONFLUENCE</span>
        </div>
        <span class="tf-badge" id="tf-${sym}">-</span>
      </div>
      <div class="pair-card-footer">
        <div class="info-row">
          <span class="info-label">Price:</span>
          <span id="price-${sym}">$0.00</span>
        </div>
        <div class="info-row">
          <span class="info-label">Active Rules:</span>
          <span class="rules-list" id="rules-${sym}">-</span>
        </div>
        <div class="info-row">
          <span class="info-label">SMT Check:</span>
          <span class="smt-badge pending" id="smt-${sym}">None</span>
        </div>
      </div>
    `;
    pairsContainer.appendChild(card);
  });
}

// Request Browser Notifications Permission
if ('Notification' in window && Notification.permission === 'default') {
  Notification.requestPermission();
}

// Update Card visually
function updateCard(signal) {
  const { symbol, timeframe, direction, score, rules, smt, price } = signal;
  const isStrong = score >= 7;

  // If filter is checked and signal is not strong, do not update card to maintain active signals only
  if (filterStrongCheckbox.checked && !isStrong && direction !== 'NEUTRAL') {
    return;
  }

  const card = document.getElementById(`card-${symbol}`);
  const statusEl = document.getElementById(`status-${symbol}`);
  const scoreEl = document.getElementById(`score-${symbol}`);
  const tfEl = document.getElementById(`tf-${symbol}`);
  const priceEl = document.getElementById(`price-${symbol}`);
  const rulesEl = document.getElementById(`rules-${symbol}`);
  const smtEl = document.getElementById(`smt-${symbol}`);

  if (!card) return;

  // Update memory state
  symbolStates[symbol] = signal;

  // Apply colors and texts
  statusEl.textContent = direction;
  statusEl.className = `signal-status ${direction.toLowerCase()}`;

  scoreEl.textContent = `${score}/10`;
  if (isStrong) {
    scoreEl.classList.add('strong');
  } else {
    scoreEl.classList.remove('strong');
  }

  tfEl.textContent = timeframe;
  priceEl.textContent = symbol.includes('JPY') ? `¥${price.toFixed(2)}` : `$${price.toFixed(2)}`;
  rulesEl.textContent = rules;

  // SMT Check formatting
  smtEl.textContent = smt;
  if (smt.includes('Valid')) {
    smtEl.className = 'smt-badge valid';
  } else if (smt.includes('Pending')) {
    smtEl.className = 'smt-badge pending';
  } else {
    smtEl.className = 'smt-badge';
  }

  // Animation pulses
  card.classList.remove('card-new-buy', 'card-new-sell');
  // Trigger reflow to restart animation
  void card.offsetWidth;

  if (direction === 'BUY') {
    card.classList.add('card-new-buy');
  } else if (direction === 'SELL') {
    card.classList.add('card-new-sell');
  }
}

// Play notification sound
function playSound(signal) {
  if (!soundEnabled) return;

  const isGoldSMT = signal.symbol === 'XAUUSD' && signal.smt.includes('Valid');
  const isExtreme = signal.score >= 9;

  if (isGoldSMT || isExtreme) {
    strongAlertSound.currentTime = 0;
    strongAlertSound.play().catch(e => console.log('Audio playback error:', e));
  } else {
    alertSound.currentTime = 0;
    alertSound.play().catch(e => console.log('Audio playback error:', e));
  }
}

// Add row to Log Table
function addLogToTable(signal) {
  const isStrong = signal.score >= 7;

  // Filter check
  if (filterStrongCheckbox.checked && !isStrong) {
    return;
  }

  // Remove placeholder
  const placeholder = logsBody.querySelector('.placeholder-row');
  if (placeholder) {
    placeholder.remove();
  }

  const timeStr = new Date(signal.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const row = document.createElement('tr');
  const scoreClass = isStrong ? 'strong' : '';
  const dirClass = signal.direction === 'BUY' ? 'td-buy' : (signal.direction === 'SELL' ? 'td-sell' : 'td-neutral');

  const priceText = signal.symbol.includes('JPY') ? `¥${signal.price.toFixed(2)}` : `$${signal.price.toFixed(2)}`;

  row.innerHTML = `
    <td>${timeStr}</td>
    <td><strong>${signal.symbol}</strong></td>
    <td><span class="tf-badge">${signal.timeframe}</span></td>
    <td>${priceText}</td>
    <td class="${scoreClass}"><strong>${signal.score}/10</strong></td>
    <td class="${dirClass}">${signal.direction}</td>
    <td><code class="rules-list">${signal.rules}</code></td>
    <td><span class="smt-badge ${signal.smt.includes('Valid') ? 'valid' : 'pending'}">${signal.smt}</span></td>
  `;

  logsBody.insertBefore(row, logsBody.firstChild);

  // Cap table rows to 50
  if (logsBody.children.length > 50) {
    logsBody.lastChild.remove();
  }
}

// Push system notification to user
function pushDesktopNotification(signal) {
  if (Notification.permission === 'granted') {
    const title = `${signal.direction === 'BUY' ? '🔥' : '🚨'} Confluence Signal: ${signal.symbol} (${signal.timeframe})`;
    const options = {
      body: `Price: ${signal.price} | Score: ${signal.score}/10\nRules: ${signal.rules}\nSMT: ${signal.smt}`,
      icon: '/favicon.ico'
    };
    new Notification(title, options);
  }
}

// Connect to Server SSE Stream
function connectSSE() {
  const eventSource = new EventSource('/events');

  eventSource.onopen = () => {
    connectionStatus.className = 'status-indicator connected';
    console.log('Real-time feed connected.');
  };

  eventSource.onerror = (err) => {
    connectionStatus.className = 'status-indicator disconnected';
    console.error('Real-time feed disconnected. Reconnecting...', err);
  };

  eventSource.onmessage = (event) => {
    const message = JSON.parse(event.data);

    if (message.type === 'history') {
      // Clear logs first
      logsBody.innerHTML = '';
      if (message.data.length === 0) {
        logsBody.innerHTML = `<tr class="placeholder-row"><td colspan="8">No history yet. Waiting for signals...</td></tr>`;
      } else {
        // Render in chronological order (oldest first so prepending aligns latest on top)
        const sorted = [...message.data].reverse();
        sorted.forEach(signal => {
          updateCard(signal);
          addLogToTable(signal);
        });
      }
    } else if (message.type === 'signal') {
      const signal = message.data;
      updateCard(signal);
      addLogToTable(signal);
      
      // Notify only on signals matching threshold filter
      if (signal.score >= (filterStrongCheckbox.checked ? 7 : 1)) {
        playSound(signal);
        pushDesktopNotification(signal);
      }
    }
  };
}

// Sound button toggle
btnSound.addEventListener('click', () => {
  soundEnabled = !soundEnabled;
  if (soundEnabled) {
    btnSound.innerHTML = '<span class="icon">🔊</span> Sound On';
    btnSound.className = 'btn-secondary';
  } else {
    btnSound.innerHTML = '<span class="icon">🔇</span> Mute';
    btnSound.className = 'btn-secondary muted';
  }
});

// Simulate webhook helper
btnSimulate.addEventListener('click', async () => {
  const randomSymbol = SYMBOLS[Math.floor(Math.random() * (SYMBOLS.length - 1))]; // Exclude Silver
  const timeframes = ['5m', '15m', '30m', '1h', '4h', '1D'];
  const directions = ['BUY', 'SELL'];
  const rulesList = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8', 'S9', 'S10'];

  const score = Math.floor(Math.random() * 5) + 6; // Confluence between 6 and 10
  const count = score;
  
  // Pick random subset of rules
  const shuffled = rulesList.sort(() => 0.5 - Math.random());
  const selectedRules = shuffled.slice(0, count).join(',');

  const direction = directions[Math.floor(Math.random() * directions.length)];
  const timeframe = randomSymbol === 'XAUUSD' ? '5m' : timeframes[Math.floor(Math.random() * (timeframes.length - 1) + 1)]; // Gold on 5m, others 15m+

  let smt = 'None';
  if (randomSymbol === 'XAUUSD') {
    smt = Math.random() > 0.4 ? '⚡ Valid SMT' : '⚠️ Pending SMT';
  }

  let price = 0;
  if (randomSymbol === 'XAUUSD') price = 2300 + Math.random() * 80;
  else if (randomSymbol === 'BTCUSDT') price = 57000 + Math.random() * 3000;
  else if (randomSymbol === 'NAS100') price = 18000 + Math.random() * 400;
  else if (randomSymbol.includes('JPY')) price = 150 + Math.random() * 10;
  else price = 1 + Math.random() * 0.5;

  const mockPayload = {
    symbol: randomSymbol,
    timeframe: timeframe,
    direction: direction,
    score: score,
    rules: selectedRules,
    smt: smt,
    price: price
  };

  try {
    await fetch('/webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mockPayload)
    });
  } catch (err) {
    console.error('Failed to send simulated signal:', err);
  }
});

// Clear Logs click
btnClearLogs.addEventListener('click', () => {
  logsBody.innerHTML = `<tr class="placeholder-row"><td colspan="8">Logs cleared. Waiting for new signals...</td></tr>`;
});

// Run Init
initCards();
connectSSE();
