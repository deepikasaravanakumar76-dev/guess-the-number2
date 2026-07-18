# 🔐 Crack the Code — Guess the Number

A polished, fully responsive **Guess the Number** game built with nothing but **HTML, CSS, and vanilla JavaScript** — no frameworks, no libraries. It has a light "vault-cracking" theme: the game generates a secret number, and you narrow it down guess by guess while a brass-toned "bounds gauge" visually shows how close you are.

> Built as a beginner-friendly portfolio project — the code is deliberately modular and heavily commented so it's easy to follow and extend.

---

## ✨ Features

### Core gameplay
- Random secret number generated for the selected difficulty
- Instant feedback: **Too High**, **Too Low**, or **Correct**
- Live attempt counter
- Full history of previous guesses, color-coded by result
- Input validation (rejects empty input, non-numbers, and out-of-range guesses)
- Input is disabled once the number is guessed correctly
- **Play Again** button to reset and start a fresh round

### Difficulty levels
- **Easy** — 1 to 50
- **Medium** — 1 to 100
- **Hard** — 1 to 500

### Extra features
- 🌗 **Dark / light mode** toggle (choice remembered between visits)
- 🔊 **Sound effects** generated on the fly with the Web Audio API (no audio files!) with an on/off toggle
- 🎉 **Confetti celebration** animation when you win
- 🏆 **Best score**, saved per difficulty using `localStorage`
- 📊 A custom **bounds gauge**: a visual dial that narrows in real time to show the shrinking range of possible numbers

### Accessibility
- Semantic HTML (`<header>`, `<main>`, `<footer>`, `<form>`, proper headings)
- All form controls have real `<label>` elements
- Feedback messages use `aria-live="polite"` so screen readers announce results automatically
- Full keyboard support — pressing **Enter** submits a guess
- Visible focus outlines on every interactive element
- Color choices meet accessible contrast ratios in both themes
- `prefers-reduced-motion` is respected — animations are minimized for users who request it

---

## 🗂 Project structure

```
guess-the-number/
│
├── index.html      # Page structure & content
├── style.css        # Design tokens, layout, theming, animations
├── script.js        # Game logic, rendering, storage, sound
├── README.md         # You are here
└── assets/           # Reserved for any future images/icons
```

---

## 🛠 Technologies used

- **HTML5** — semantic markup
- **CSS3** — custom properties (design tokens), Flexbox, Grid, keyframe animations, responsive media queries
- **JavaScript (ES6+)** — DOM manipulation, event handling, `localStorage`, Web Audio API
- **Google Fonts** — Space Grotesk (display), Inter (body text), JetBrains Mono (numbers)

No build tools, bundlers, or dependencies of any kind — just open the file in a browser.

---

## 🚀 Installation & usage

No installation required — this is a static site.

1. **Clone the repository**
   ```bash
   git clone https://github.com/<your-username>/guess-the-number.git
   cd guess-the-number
   ```
2. **Open it**
   - Easiest: double-click `index.html`, or
   - Recommended for development: use a local server (e.g. the VS Code "Live Server" extension) so `localStorage` and fonts behave exactly as they would in production.
3. **Play!** Pick a difficulty, type a guess, and press **Enter** or click **Guess**.

---

## 🧠 How the game logic works

1. **Starting a round** (`startGame`) picks a difficulty range (e.g. 1–100) and generates a secret number, then resets the attempt counter, guess history, and UI.
2. **Submitting a guess** (`handleGuess`) first validates the input, then compares it to the secret number and shows **Too High**, **Too Low**, or **Correct** accordingly. Every guess is logged for the history list, and the bounds gauge is updated.
3. **Winning** (`winGame`) locks the input, checks whether the attempt count beats the saved best score, shows the win message, and triggers the confetti animation and win sound.

### 🎲 How the random number is generated

```js
function generateRandomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
```

`Math.random()` returns a decimal between `0` (inclusive) and `1` (exclusive). Multiplying it by the size of the range (`max - min + 1`) spreads that decimal across every whole number in the range, and `Math.floor()` rounds it down to a whole number. Adding `min` shifts the range so it starts at the right number instead of at `0`.

### 💾 How the best score uses Local Storage

`localStorage` is a simple key/value store built into the browser that persists even after the tab or browser is closed — perfect for remembering a "best score" between visits.

- Each difficulty gets its own storage key, e.g. `bestScore_1_100` for Medium, so Easy/Medium/Hard best scores never overwrite each other.
- After a win, `saveBestScoreIfBetter()` compares the current attempt count to the stored value (if any) and only overwrites it if the new count is lower.
- On page load — and after every win — `loadBestScore()` reads the value back out and displays it.

The same technique is used to remember the player's **theme** (`"theme"` key) and **sound** (`"soundEnabled"` key) preferences.

---

## 📸 Screenshots

> _Add screenshots or a short GIF of the game here once you've deployed or run it locally._

| Dark mode | Light mode |
|---|---|
| _screenshot placeholder_ | _screenshot placeholder_ |

---

## 🔮 Future improvements

- Add a countdown timer / "speedrun" mode with its own leaderboard
- Add a hint system ("warmer" / "colder" relative to the previous guess)
- Animate the gauge needle continuously instead of only on each guess
- Add a global leaderboard using a small backend or a service like Firebase
- Add unit tests for the validation and scoring logic
- Add localization (multi-language support)
- Progressive Web App (PWA) support for offline play

---

## 📄 License

This project is released under the [MIT License](https://opensource.org/licenses/MIT) — free to use, modify, and distribute for personal or commercial projects.
