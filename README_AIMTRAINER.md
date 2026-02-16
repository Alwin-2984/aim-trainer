# FPS Micro-Adjustment Trainer (Next.js + TypeScript)

A professional aim training application built with Next.js 16, React 19, and TypeScript. Features CS2-matched sensitivity, customizable crosshairs, and AI-powered coaching feedback.

## Features

- **Two Training Modes**:
  - **Micro-Flick**: Static target clicking for precision training
  - **Smooth Tracking**: Moving target tracking for consistency

- **CS2 Sensitivity Matching**: Matched to CS2's `m_yaw 0.022` for accurate muscle memory transfer

- **Customizable Crosshair**:
  - Color, length, thickness, gap
  - Optional center dot
  - Real-time visual feedback

- **AI Coaching** (Optional): Get performance analysis and personalized tips using Google Gemini AI

- **3D Room Illusion**: Immersive environment with perspective lines and grid walls

- **Settings Persistence**: Your preferences are saved to localStorage

## Tech Stack

- **Next.js 16.1.6** (App Router)
- **React 19.2.3**
- **TypeScript 5.x**
- **Tailwind CSS 4**
- **Bun** (Package Manager)

## Getting Started

### Installation

```bash
# Install dependencies
bun install

# Run development server
bun dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

```bash
# Build the application
bun run build

# Start production server
bun start
```

## Project Structure

```
my-app/
├── app/
│   ├── globals.css       # All game styles
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Home page (renders AimTrainer)
├── components/
│   ├── AimTrainer.tsx    # Main game component
│   ├── Crosshair.tsx     # Crosshair UI
│   ├── GameUI.tsx        # Score/timer UI
│   ├── Overlay.tsx       # Menu/settings overlay
│   └── Settings.tsx      # Settings panel
├── types/
│   └── game.ts           # TypeScript interfaces
└── public/               # Static assets
```

## AI Coaching Setup (Optional)

To enable AI coaching feedback:

1. Get a Google Gemini API key from [Google AI Studio](https://aistudio.google.com/)
2. Open `components/AimTrainer.tsx`
3. Find the `handleAIAnalysis` function
4. Add your API key to the `apiKey` variable:

```typescript
const apiKey = 'YOUR_API_KEY_HERE';
```

## Controls

- **Click "Lock Mouse & Play"** to start
- **Move mouse** to aim (matches CS2 sensitivity)
- **Left-click** to shoot (Flick mode) or hold to track (Tracking mode)
- **ESC** to pause/unlock mouse
- Configure crosshair and sensitivity in the overlay menu

## Game Modes

### Micro-Flick Mode
- 5 static targets spawn on the wall
- Click to hit targets
- Tracks accuracy and targets hit
- Best for practicing quick, precise adjustments

### Smooth Tracking Mode
- 1 moving target bounces around the wall
- Hold left-click while tracking to score points
- No accuracy tracking (continuous scoring)
- Best for practicing smooth, consistent tracking

## Performance Notes

- Runs at 60 FPS with optimized React state management
- Uses `requestAnimationFrame` for smooth tracking mode updates
- Pointer Lock API for true FPS mouse control
- Minimal re-renders with React hooks optimization

## Browser Compatibility

Requires a modern browser with support for:
- Pointer Lock API
- CSS Custom Properties
- ES2017+

Tested on Chrome, Firefox, and Safari.

## License

MIT

## Credits

Converted from vanilla HTML/JS to Next.js + TypeScript.
Original concept: FPS Micro-Adjustment Trainer with AI coaching.
