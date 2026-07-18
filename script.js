/* =====================================================================
   CRACK THE CODE — game logic
   This file is organized into clearly labeled sections:
     1. DOM references
     2. Game state
     3. Local Storage helpers (best score + theme + sound preference)
     4. Game logic (start, guess, win, reset)
     5. UI rendering (feedback, stats, history, gauge)
     6. Sound effects (Web Audio API — no external audio files needed)
     7. Win celebration (confetti)
     8. Event listeners (wiring everything together)
   ===================================================================== */

/* ---------------------------------------------------------------------
   1. DOM REFERENCES
   Grabbing every element we need once, up front, so the rest of the
   code can simply refer to these variables.
   --------------------------------------------------------------------- */
const themeToggleBtn = document.getElementById("themeToggle");
const themeToggleIcon = document.getElementById("themeToggleIcon");

const difficultyButtons = document.querySelectorAll(".difficulty__btn");

const gaugeMinLabel = document.getElementById("gaugeMin");
const gaugeMaxLabel = document.getElementById("gaugeMax");
const gaugeFill = document.getElementById("gaugeFill");
const gaugeNeedle = document.getElementById("gaugeNeedle");

const guessForm = document.getElementById("guessForm");
const guessInput = document.getElementById("guessInput");
const guessLabel = document.getElementById("guessLabel");
const submitBtn = document.getElementById("submitBtn");

const feedbackEl = document.getElementById("feedback");
const attemptsEl = document.getElementById("attempts");
const bestScoreEl = document.getElementById("bestScore");

const historyList = document.getElementById("historyList");
const historyEmpty = document.getElementById("historyEmpty");

const playAgainBtn = document.getElementById("playAgainBtn");
const soundToggleBtn = document.getElementById("soundToggle");
const soundToggleIcon = document.getElementById("soundToggleIcon");
const soundToggleLabel = document.getElementById("soundToggleLabel");

const card = document.querySelector(".card");
const confettiLayer = document.getElementById("confetti");

/* ---------------------------------------------------------------------
   2. GAME STATE
   One object holds everything about the current round. Keeping state in
   a single place makes the game much easier to reason about and reset.
   --------------------------------------------------------------------- */
const state = {
  min: 1,
  max: 100,
  target: null, // the secret number the player is trying to guess
  attempts: 0,
  guesses: [], // { value, result } for each guess made this round
  isGameOver: false,
  soundEnabled: true,
};

/* ---------------------------------------------------------------------
   3. LOCAL STORAGE HELPERS
   Local Storage lets the browser remember data between visits, even
   after the page is closed. We use it for three things:
     - the player's best (lowest) attempt count, saved per difficulty
     - the chosen theme (dark/light)
     - whether sound effects are enabled
   All values are stored as simple strings/JSON under our own keys.
   --------------------------------------------------------------------- */

// Build a unique storage key per difficulty, e.g. "bestScore_1_50"
function getBestScoreKey(min, max) {
  return `bestScore_${min}_${max}`;
}

function loadBestScore(min, max) {
  const raw = localStorage.getItem(getBestScoreKey(min, max));
  return raw ? Number(raw) : null;
}

function saveBestScoreIfBetter(min, max, attempts) {
  const currentBest = loadBestScore(min, max);
  if (currentBest === null || attempts < currentBest) {
    localStorage.setItem(getBestScoreKey(min, max), String(attempts));
    return true; // a new record was set
  }
  return false;
}

function loadThemePreference() {
  return localStorage.getItem("theme"); // "dark" | "light" | null
}

function saveThemePreference(theme) {
  localStorage.setItem("theme", theme);
}

function loadSoundPreference() {
  const raw = localStorage.getItem("soundEnabled");
  return raw === null ? true : raw === "true";
}

function saveSoundPreference(enabled) {
  localStorage.setItem("soundEnabled", String(enabled));
}

/* ---------------------------------------------------------------------
   4. GAME LOGIC
   --------------------------------------------------------------------- */

// Returns a random whole number between min and max, inclusive.
// Math.random() gives a decimal between 0 (inclusive) and 1 (exclusive).
// Multiplying it by the range and flooring it spreads that decimal
// evenly across every whole number in [min, max].
function generateRandomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Starts a brand new round for the given difficulty range.
function startGame(min, max) {
  state.min = min;
  state.max = max;
  state.target = generateRandomNumber(min, max);
  state.attempts = 0;
  state.guesses = [];
  state.isGameOver = false;

  // Reset the input field
  guessInput.min = min;
  guessInput.max = max;
  guessInput.value = "";
  guessInput.disabled = false;
  guessInput.classList.remove("is-shaking");
  submitBtn.disabled = false;

  guessLabel.textContent = `Enter a number between ${min} and ${max}`;
  guessInput.placeholder = "?";

  playAgainBtn.hidden = true;
  card.classList.remove("is-winning");

  renderFeedback("", "");
  renderAttempts();
  renderBestScore();
  renderHistory();
  renderGauge();

  guessInput.focus();
}

// Validates raw text from the input. Returns an object describing
// whether it's valid, and either the parsed number or an error message.
function validateGuess(rawValue) {
  const trimmed = rawValue.trim();

  if (trimmed === "") {
    return { valid: false, error: "Please enter a number." };
  }

  const value = Number(trimmed);

  if (!Number.isInteger(value)) {
    return { valid: false, error: "Whole numbers only, please." };
  }

  if (value < state.min || value > state.max) {
    return {
      valid: false,
      error: `Enter a number between ${state.min} and ${state.max}.`,
    };
  }

  return { valid: true, value };
}

// Handles a single guess submission from start to finish.
function handleGuess(rawValue) {
  const validation = validateGuess(rawValue);

  if (!validation.valid) {
    renderFeedback(validation.error, "error");
    shakeInput();
    playSound("error");
    return;
  }

  const guess = validation.value;
  state.attempts += 1;

  let result; // "high" | "low" | "correct"
  if (guess > state.target) {
    result = "high";
    renderFeedback("Too high — try a smaller number.", "high");
    playSound("wrong");
  } else if (guess < state.target) {
    result = "low";
    renderFeedback("Too low — try a bigger number.", "low");
    playSound("wrong");
  } else {
    result = "correct";
  }

  state.guesses.push({ value: guess, result });
  renderAttempts();
  renderHistory();
  renderGauge(guess);

  if (result === "correct") {
    winGame();
  } else {
    // Narrow the input's own min/max hint as bounds tighten (nice touch,
    // purely a UX hint — validation still uses state.min / state.max).
    guessInput.value = "";
  }
}

// Called the moment the player guesses correctly.
function winGame() {
  state.isGameOver = true;
  guessInput.disabled = true;
  submitBtn.disabled = true;
  playAgainBtn.hidden = false;

  const isNewBest = saveBestScoreIfBetter(state.min, state.max, state.attempts);
  renderBestScore();

  const message = isNewBest
    ? `Correct! Cracked it in ${state.attempts} ${state.attempts === 1 ? "try" : "tries"} — new best!`
    : `Correct! Cracked it in ${state.attempts} ${state.attempts === 1 ? "try" : "tries"}.`;
  renderFeedback(message, "correct");

  card.classList.add("is-winning");
  playSound("win");
  launchConfetti();
}

/* ---------------------------------------------------------------------
   5. UI RENDERING
   Small, focused functions that each update one part of the page.
   Keeping rendering separate from game logic makes both easier to read.
   --------------------------------------------------------------------- */

function renderFeedback(message, type) {
  feedbackEl.textContent = message;
  feedbackEl.className = "feedback"; // reset classes
  if (type) {
    feedbackEl.classList.add(`is-${type}`);
  }
}

function renderAttempts() {
  attemptsEl.textContent = state.attempts;
}

function renderBestScore() {
  const best = loadBestScore(state.min, state.max);
  bestScoreEl.textContent = best === null ? "—" : best;
}

function renderHistory() {
  // Clear existing chips (but keep the "empty state" message in the DOM
  // to re-use / re-hide, rather than re-creating it every time).
  historyList.innerHTML = "";

  if (state.guesses.length === 0) {
    historyList.appendChild(historyEmpty);
    return;
  }

  state.guesses.forEach((guess) => {
    const chip = document.createElement("li");
    chip.className = `history__chip is-${guess.result}`;
    chip.textContent = guess.value;
    historyList.appendChild(chip);
  });
}

// Updates the "bounds gauge": the horizontal bar that visually narrows
// as guesses rule out portions of the possible range.
function renderGauge(lastGuess) {
  // Work out the tightest possible bounds given all guesses so far.
  let low = state.min;
  let high = state.max;

  state.guesses.forEach((guess) => {
    if (guess.result === "high") {
      high = Math.min(high, guess.value - 1);
    } else if (guess.result === "low") {
      low = Math.max(low, guess.value + 1);
    }
  });

  gaugeMinLabel.textContent = low;
  gaugeMaxLabel.textContent = high;

  const totalRange = state.max - state.min || 1; // avoid divide-by-zero
  const fillStartPercent = ((low - state.min) / totalRange) * 100;
  const fillEndPercent = ((high - state.min) / totalRange) * 100;

  gaugeFill.style.left = `${fillStartPercent}%`;
  gaugeFill.style.width = `${Math.max(fillEndPercent - fillStartPercent, 2)}%`;

  if (typeof lastGuess === "number") {
    const needlePercent = ((lastGuess - state.min) / totalRange) * 100;
    gaugeNeedle.style.left = `${needlePercent}%`;
    gaugeNeedle.classList.add("is-visible");
  } else {
    gaugeNeedle.classList.remove("is-visible");
  }
}

function shakeInput() {
  guessInput.classList.remove("is-shaking");
  // Force a reflow so the animation can be re-triggered on repeated errors
  void guessInput.offsetWidth;
  guessInput.classList.add("is-shaking");
}

/* ---------------------------------------------------------------------
   6. SOUND EFFECTS
   Generated on the fly with the Web Audio API, so no external sound
   files are needed. Each call plays a short, simple tone.
   --------------------------------------------------------------------- */
let audioContext = null;

function playSound(kind) {
  if (!state.soundEnabled) return;

  // Reuse a single AudioContext, created lazily on first use (some
  // browsers block audio until the user has interacted with the page).
  if (!audioContext) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return; // Web Audio not supported, fail silently
    audioContext = new AudioContextClass();
  }

  const settings = {
    wrong: { frequency: 220, duration: 0.12, type: "sine" },
    error: { frequency: 160, duration: 0.1, type: "square" },
    win: { frequency: 660, duration: 0.35, type: "triangle" },
  }[kind];

  if (!settings) return;

  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.type = settings.type;
  oscillator.frequency.value = settings.frequency;

  // A quick fade-out avoids an unpleasant "click" at the end of the tone.
  gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(
    0.001,
    audioContext.currentTime + settings.duration
  );

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.start();
  oscillator.stop(audioContext.currentTime + settings.duration);

  // A little upward "arpeggio" on win, for extra celebration.
  if (kind === "win") {
    [880, 1108].forEach((freq, index) => {
      const osc2 = audioContext.createOscillator();
      const gain2 = audioContext.createGain();
      osc2.type = "triangle";
      osc2.frequency.value = freq;
      const startTime = audioContext.currentTime + 0.12 * (index + 1);
      gain2.gain.setValueAtTime(0.12, startTime);
      gain2.gain.exponentialRampToValueAtTime(0.001, startTime + 0.2);
      osc2.connect(gain2);
      gain2.connect(audioContext.destination);
      osc2.start(startTime);
      osc2.stop(startTime + 0.2);
    });
  }
}

/* ---------------------------------------------------------------------
   7. WIN CELEBRATION (confetti)
   Simple CSS-driven confetti: we create a handful of colored divs and
   let a CSS animation (see style.css) carry them down the screen.
   --------------------------------------------------------------------- */
function launchConfetti() {
  const colors = ["#d4a73d", "#4fae7e", "#e2664b", "#9aa1c0"];
  const pieceCount = 40;

  for (let i = 0; i < pieceCount; i++) {
    const piece = document.createElement("div");
    piece.className = "confetti__piece";
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.backgroundColor = colors[i % colors.length];
    piece.style.animationDuration = `${1.2 + Math.random() * 1.2}s`;
    piece.style.animationDelay = `${Math.random() * 0.3}s`;
    confettiLayer.appendChild(piece);

    // Clean up each piece once its fall animation finishes, so the DOM
    // doesn't quietly accumulate hundreds of leftover elements.
    piece.addEventListener("animationend", () => piece.remove());
  }
}

/* ---------------------------------------------------------------------
   8. EVENT LISTENERS
   --------------------------------------------------------------------- */

// --- Difficulty selection ---
difficultyButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    difficultyButtons.forEach((b) => {
      b.classList.remove("is-active");
      b.setAttribute("aria-pressed", "false");
    });
    btn.classList.add("is-active");
    btn.setAttribute("aria-pressed", "true");

    const min = Number(btn.dataset.min);
    const max = Number(btn.dataset.max);
    startGame(min, max);
  });
});

// --- Guess form submission (the Enter key naturally triggers "submit") ---
guessForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (state.isGameOver) return;
  handleGuess(guessInput.value);
});

// --- Play again ---
playAgainBtn.addEventListener("click", () => {
  startGame(state.min, state.max);
});

// --- Theme toggle ---
function applyTheme(theme) {
  if (theme === "light") {
    document.documentElement.setAttribute("data-theme", "light");
    themeToggleIcon.textContent = "☀️";
    themeToggleBtn.setAttribute("aria-pressed", "true");
    themeToggleBtn.setAttribute("aria-label", "Switch to dark mode");
  } else {
    document.documentElement.removeAttribute("data-theme");
    themeToggleIcon.textContent = "🌙";
    themeToggleBtn.setAttribute("aria-pressed", "false");
    themeToggleBtn.setAttribute("aria-label", "Switch to light mode");
  }
}

themeToggleBtn.addEventListener("click", () => {
  const isLight = document.documentElement.getAttribute("data-theme") === "light";
  const nextTheme = isLight ? "dark" : "light";
  applyTheme(nextTheme);
  saveThemePreference(nextTheme);
});

// --- Sound toggle ---
function applySoundPreference(enabled) {
  state.soundEnabled = enabled;
  soundToggleIcon.textContent = enabled ? "🔊" : "🔇";
  soundToggleLabel.textContent = enabled ? "Sound on" : "Sound off";
  soundToggleBtn.setAttribute("aria-pressed", String(enabled));
}

soundToggleBtn.addEventListener("click", () => {
  const next = !state.soundEnabled;
  applySoundPreference(next);
  saveSoundPreference(next);
});

/* ---------------------------------------------------------------------
   INITIALIZATION
   Runs once when the page loads: restore saved preferences, then start
   the first round on the default (Medium) difficulty.
   --------------------------------------------------------------------- */
(function init() {
  const savedTheme = loadThemePreference();
  if (savedTheme) applyTheme(savedTheme);

  applySoundPreference(loadSoundPreference());

  startGame(state.min, state.max); // Medium (1–100) by default
})();
