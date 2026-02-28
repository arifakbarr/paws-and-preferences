# Paws & Preferences — Find Your Favourite Kitty

A single-page web app that lets you discover what kind of cats you prefer by swiping through a stack of cat images (like popular dating apps). Swipe right to like, left to dislike; at the end you get a summary of how many you liked and a gallery of your favourites.

## Features

- **Swipe gestures**: Swipe right (like) or left (dislike) on each cat card; works with touch on mobile and mouse drag on desktop.
- **Buttons**: Like / dislike buttons at the bottom for accessibility and desktop use.
- **Progress**: Progress bar and counter (e.g. “5 / 15”) as you go through the deck.
- **Summary**: After the last card, see how many cats you liked and a gallery of liked cats, with an option to start over.
- **Cat images**: Sourced from [Cataas](https://cataas.com/) (Cat as a Service) API.
- **Mobile-first**: Layout and touch targets tuned for phones; works on tablets and desktops too.

## Tech

- Vanilla HTML, CSS, and JavaScript (no framework or build step).
- Cataas API: `GET /api/cats?limit=15` for cat list, image URL `https://cataas.com/cat/{id}?width=320`.
- Three.js (CDN) for the animated silk background (WebGL shader).

---

## Implementation overview

Beyond the core requirements, the app is implemented as follows.

### Tech choices

- **No framework** – Plain HTML, CSS, and JS so the app runs anywhere, deploys as static files, and is easy to host (e.g. GitHub Pages).
- **Single state object** – `state.cats`, `state.liked`, `state.currentIndex`, `state.isSwiping` drive the UI; the visible card is always `state.cats[currentIndex]` so likes stay in sync with what the user sees.
- **Cataas only** – Cat list from `GET /api/cats?limit=15`; each image from `https://cataas.com/cat/{id}?width=320`. No other image source.
- **Animated background** – Optional WebGL “silk” effect via Three.js and a custom GLSL shader (`silk-bg.js`), fullscreen behind the app for a bit of polish.

### UI/UX design

- **Mobile-first** – Layout, tap targets (e.g. 72px action buttons), and typography are tuned for phones; `dvh`, `env(safe-area-inset-*)`, and a single main column scale up for larger screens.
- **Clear hierarchy** – Title and subtitle at top; pill-shaped progress bar and “X / 15” counter; card stack in the middle; like/dislike buttons fixed at the bottom with a gradient fade so content stays readable.
- **Swipe + buttons** – Touch swipe on the card and/or tap Like/Dislike so it works on touch and desktop; left/right hints and “Like”/“Dislike” labels appear while dragging.
- **Welcome popup** – First-time “How to play” modal (swipe right = like, swipe left = dislike) with “Got it” and backdrop click to dismiss.
- **Summary screen** – After the last card: “Your favourite kitties”, count, grid of liked cats, and “Start over” to run again. Duplicate cats (same id or same image URL) are filtered out so each liked cat appears once.

### Animations

- **Card stack** – Top card at full scale; cards behind scaled down (e.g. 0.96, 0.92…) with smooth `transform` transition when the top card is removed.
- **Swipe exit** – Card gets `exit-left` or `exit-right` and animates off-screen (translate + rotate) over ~0.4s before removal.
- **Image loading** – Placeholder shows a shimmer (moving gradient) and a small spinner until the image loads; placeholder fades out and image fades in (opacity transition).
- **Welcome popup** – Backdrop fades in; modal slides up and scales in slightly.
- **Buttons** – Slight scale-down on active for tap feedback; progress bar width transitions when advancing.

### Added functionality

- **Preloading** – All 15 cat image URLs are preloaded as soon as the list is fetched so the next cards often appear from cache; after each swipe, the next few are preloaded again.
- **Duplicate prevention** – `isSwiping` blocks double-firing (e.g. double-tap Like). When liking, we only push if that cat id isn’t already in `state.liked`. In the summary, we dedupe by both id and image URL so the same cat or same picture never appears twice.
- **Error handling** – If the Cataas request fails, an error message and “Try again” button are shown instead of the stack.
- **Accessibility** – Semantic HTML, `aria-label` on buttons, `role="dialog"` and `aria-modal` on the welcome popup; counter and progress bar keep users informed.
- **Silk background** – Animated fullscreen WebGL background (optional visual layer only; app works without it if JS fails).

## Run locally

1. Clone the repo and open the project folder.
2. Serve the folder with any static server, for example:
   - **Node**: `npx serve .` then open the URL shown (e.g. `http://localhost:3000`).
   - **Python 3**: `python -m http.server 8000` then open `http://localhost:8000`.
3. Open the app in a browser (and optionally use DevTools device mode for mobile testing).

## Test on your iPhone

**Option A — Same Wi‑Fi (no deploy)**  
1. On your computer, in this project folder run: `npx serve .` (or `python -m http.server 8000`).
2. Find your computer’s IP:
   - **Windows**: Open Command Prompt, run `ipconfig`, use the **IPv4 Address** under your Wi‑Fi adapter (e.g. `192.168.1.5`).
   - **Mac**: System Settings → Wi‑Fi → your network → Details, or run `ipconfig getifaddr en0`.
3. On your iPhone, connect to the **same Wi‑Fi**, open Safari and go to `http://<that-IP>:3000` (or `:8000` if you used Python). Example: `http://192.168.1.5:3000`.
4. Swipe the cat cards with your finger (right = like, left = dislike).

**Option B — From the internet**  
1. Push the project to GitHub and turn on GitHub Pages (see **Deploy on GitHub Pages** above).
2. On your iPhone, open Safari and go to your Pages URL (e.g. `https://your-username.github.io/paws-and-preferences/`).

## Deploy on GitHub Pages

1. Push the project to a **public** GitHub repository.
2. In the repo go to **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to **GitHub Actions**.
4. The workflow in `.github/workflows/deploy.yml` runs on push to `main` or `master` and deploys the repo root. After it runs, the site is at `https://<username>.github.io/<repo-name>/`.

   **Alternative (no workflow):** Set Source to **Deploy from a branch**, choose your default branch and folder **/ (root)**. No build step is required.

## Repository and live site

- **Hosted website:** `https://arifakbarr.github.io/paws-and-preferences/`
- **Source code:** `https://github.com/arifakbarr/paws-and-preferences`

## License

MIT.
