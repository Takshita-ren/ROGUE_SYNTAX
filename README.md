# RepRight

> **Don't Just Count Reps. Perfect Every Rep.**

[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](LICENSE)
[![Frontend](https://img.shields.io/badge/Frontend-React%2019%20%7C%20TypeScript%20%7C%20Vite%20%7C%20Tailwind-blue.svg)](frontend/)
[![Backend](https://img.shields.io/badge/Backend-FastAPI%20%7C%20SQLAlchemy%20%7C%20SQLite-green.svg)](backend/)
[![Computer Vision](https://img.shields.io/badge/AI%20Vision-MediaPipe%20Tasks%20Vision-neon.svg)](https://developers.google.com/mediapipe)

RepRight is an AI-powered fitness coach that uses real-time computer vision in your browser to analyze your bodyweight squat technique, count repetitions automatically using a finite state machine, and guide your training with explainable biomechanical cues.

---

## Table of Contents

1. [Key Features](#key-features)
2. [Architecture & How It Works](#architecture--how-it-works)
3. [Computer Vision & Squat Analysis Pipeline](#computer-vision--squat-analysis-pipeline)
4. [Technology Stack](#technology-stack)
5. [Project Structure](#project-structure)
6. [Prerequisites](#prerequisites)
7. [Quick Start & Local Setup](#quick-start--local-setup)
   - [Backend Setup](#1-backend-setup-fastapi)
   - [Frontend Setup](#2-frontend-setup-react--vite)
8. [Automated Testing](#automated-testing)
9. [Production Build](#production-build)
10. [Manual Camera Testing Guide](#manual-camera-testing-guide)
11. [Privacy & Security](#privacy--security)
12. [Open Source & Model Attribution](#open-source--model-attribution)

---

## Key Features

- **Real-Time Client-Side Pose Tracking:** Detects 33 body landmarks locally in your browser using Google MediaPipe Pose Landmarker without sending camera video to external servers.
- **Biomechanical Joint-Angle Calculation:** Computes true 2D knee angles (hip-knee-ankle) using clamped vector dot products with Exponential Moving Average (EMA) jitter dampening.
- **Finite State Machine Squat Counter:** Prevents false repetitions through a 4-state cycle: `READY` $\to$ `DESCENDING` $\to$ `BOTTOM` $\to$ `ASCENDING` $\to$ `READY`.
- **Shallow Squat & Incomplete Attempt Detection:** Distinguishes between full squats (knee angle $\le 102^\circ$) and shallow attempts, alerting the user to descend deeper.
- **Real-Time Explainable Coaching Cues:** Displays contextual form guidance (*"Controlled descent"*, *"Great depth! Drive back up"*, *"Keep your chest upright"*).
- **Overlaid Neon Skeleton HUD:** Dynamic visual overlay with color-coded joints and live knee-angle numerical badges that change color based on movement phase.
- **Synthesized Audio Chime:** Low-latency Web Audio API chime triggered when a repetition completes, with an instant mute toggle.
- **Persistent Local Database:** Stores completed workout summaries, repetition speeds, and depth breakdowns in an SQLite database via a FastAPI REST backend.
- **Dashboard & History Analytics:** Interactive weekly squat activity charts (Recharts) and detailed session logs with sorting and deletion controls.

---

## Architecture & How It Works

```
┌───────────────────────────────────────────────────────────┐
│                      Client Browser                       │
│                                                           │
│  [Webcam Stream] ──> [HTML5 Video Element]                │
│                            │                              │
│                            ▼                              │
│             [MediaPipe PoseLandmarker (WASM/GPU)]         │
│                            │                              │
│                            ▼                              │
│                [33 Normalized Landmarks]                  │
│                            │                              │
│       ┌────────────────────┴────────────────────┐         │
│       ▼                                         ▼         │
│  [Vector Math: Knee & Torso Angles]      [Skeleton Canvas]│
│       │                                                   │
│       ▼                                                   │
│  [Squat Finite State Machine] ──> [Web Audio Chime]       │
│  (READY -> DESCENDING -> BOTTOM -> ASCENDING)             │
│       │                                                   │
│       ▼                                                   │
│  [Workout Session Summary]                                │
└───────────────────────┬───────────────────────────────────┘
                        │ HTTP POST /api/workouts
                        ▼
┌───────────────────────────────────────────────────────────┐
│                    FastAPI Backend                        │
│                                                           │
│  [Routes: /api/workouts, /api/stats/summary, /api/health] │
│                            │                              │
│                            ▼                              │
│                  [SQLAlchemy ORM]                         │
│                            │                              │
│                            ▼                              │
│               [SQLite Database (Local)]                   │
└───────────────────────────────────────────────────────────┘
```

---

## Computer Vision & Squat Analysis Pipeline

RepRight does **not** rely on opaque black-box machine learning for rep counting. Instead, it pairs state-of-the-art landmark detection with deterministic biomechanics:

### 1. Vector Joint-Angle Calculation
Given points $A$ (Hip), $B$ (Knee/Vertex), and $C$ (Ankle):
$$\vec{v}_{BA} = A - B, \quad \vec{v}_{BC} = C - B$$
$$\cos(\theta) = \text{clamp}\left(\frac{\vec{v}_{BA} \cdot \vec{v}_{BC}}{\|\vec{v}_{BA}\| \|\vec{v}_{BC}\|}, -1.0, 1.0\right)$$
$$\theta = \arccos(\cos(\theta)) \times \frac{180^\circ}{\pi}$$

### 2. Jitter Reduction (EMA Filter)
$$\theta_{\text{smoothed}} = \alpha \theta_{\text{raw}} + (1 - \alpha) \theta_{\text{previous}}, \quad (\alpha = 0.4)$$

### 3. Squat State Machine Thresholds
- **Standing / Upright:** Knee angle $\ge 158^\circ$
- **Descent Initiation:** Knee angle drops below $148^\circ$
- **Bottom Depth Target:** Knee angle drops to $\le 102^\circ$ (parallel femur)
- **Ascent:** Knee angle rises above bottom $+ 10^\circ$
- **Lockout:** Returns to $\ge 158^\circ$ with minimum rep duration $\ge 700\text{ ms}$
- **Shallow Attempt:** If user reverses before reaching $\le 102^\circ$, an incomplete attempt is logged and feedback alerts: *"Squat not deep enough. Go deeper!"*

---

## Technology Stack

### Frontend
- **Framework:** React 19 + TypeScript
- **Build Tool:** Vite 8
- **Styling:** Tailwind CSS (Dark-first fitness tech theme with electric green accents)
- **Routing:** React Router v7
- **Icons:** Lucide React
- **Analytics Charts:** Recharts
- **Audio:** Web Audio API synthesizer

### Computer Vision
- **Detection Engine:** Google MediaPipe Tasks Vision (`@mediapipe/tasks-vision`)
- **Model:** `pose_landmarker_lite.task` (Pre-bundled locally in `frontend/public/models/`)
- **WASM Binaries:** Pre-bundled locally in `frontend/public/wasm/` for offline capability

### Backend
- **Framework:** FastAPI (Python 3.10+)
- **Validation:** Pydantic v2
- **ORM:** SQLAlchemy 2.0
- **Database:** SQLite (file-based, zero configuration)
- **Server:** Uvicorn

---

## Project Structure

```
RepRight/
├── frontend/                     # React + Vite frontend application
│   ├── public/
│   │   ├── models/              # MediaPipe Pose Landmarker model asset (.task)
│   │   └── wasm/                # MediaPipe WebAssembly engine binaries
│   ├── src/
│   │   ├── components/          # Navbar, Footer, StatCard, ConfirmModal
│   │   ├── hooks/               # useWebcam hook for camera permissions and tracks
│   │   ├── pages/               # Landing, Dashboard, Workout, Summary, History, Settings
│   │   ├── services/            # Centralized API client (fetch)
│   │   ├── types/               # TypeScript definitions for pose, states, workouts
│   │   ├── utils/               # Math, Squat State Machine, Skeleton Drawer, Audio
│   │   ├── test/                # Vitest unit tests (CV math, state machine, pages)
│   │   ├── App.tsx              # Application routes
│   │   ├── index.css            # Tailwind layers & neon aesthetics
│   │   └── main.tsx             # Entrypoint
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
├── backend/                      # Python FastAPI REST API
│   ├── app/
│   │   ├── api/routes/          # Workouts, stats, and health endpoints
│   │   ├── core/                # Database configuration & settings
│   │   ├── models/              # SQLAlchemy Workout model
│   │   ├── schemas/             # Pydantic request/response schemas
│   │   ├── services/            # Workout CRUD & analytics calculations
│   │   └── main.py              # FastAPI app with CORS middleware
│   ├── tests/                   # Pytest test suite (all endpoints & DB)
│   ├── requirements.txt
│   └── .env.example
├── README.md                     # Comprehensive documentation
├── LICENSE                       # MIT License
└── .gitignore
```

---

## Prerequisites

- **Node.js:** v18.0.0 or later (v24.x tested)
- **npm:** v9.0.0 or later
- **Python:** v3.10 or later (v3.14 tested)
- A working webcam (built-in laptop camera or USB webcam)
- Modern browser (Chrome, Edge, Safari, or Firefox) with WebGL support

---

## Quick Start & Local Setup

### 1. Backend Setup (FastAPI)

From the project root:

```bash
# 1. Create a Python virtual environment
python3 -m venv backend/venv

# 2. Activate the virtual environment
source backend/venv/bin/activate

# 3. Install backend dependencies
pip install -r backend/requirements.txt

# 4. Start the FastAPI development server
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload --app-dir backend
```

The backend API will be available at:
- **API URL:** `http://127.0.0.1:8000`
- **Swagger Documentation:** `http://127.0.0.1:8000/docs`
- **Health Check:** `http://127.0.0.1:8000/api/health`

### 2. Frontend Setup (React + Vite)

Open a new terminal window at the project root:

```bash
# 1. Navigate to the frontend directory
cd frontend

# 2. Install dependencies
npm install

# 3. Launch the Vite development server
npm run dev
```

Open your browser at **`http://localhost:5173`**.

---

## Automated Testing

### Running Backend Tests (Pytest)

The backend test suite validates database models, API endpoints, schema validation, idempotent submission, and statistical calculations:

```bash
PYTHONPATH=backend backend/venv/bin/pytest backend/tests/ -v
```

**Results:** `10 passed in 0.47s`

### Running Frontend & CV Tests (Vitest)

The frontend test suite tests joint angle trigonometry, clamp boundary conditions, jitter smoothing, 4-phase squat state transitions, shallow rep detection, and component rendering:

```bash
cd frontend
npm run test
```

**Results:** `19 passed in 1.12s`

---

## Production Build

To verify that the frontend compiles cleanly with TypeScript type-checking and bundling:

```bash
cd frontend
npm run build
```

This generates an optimized static bundle in `frontend/dist/`.

---

## Manual Camera Testing Guide

If you are running RepRight on a machine with a webcam:

1. Open **`http://localhost:5173/workout`**.
2. Click **"Enable Camera & Begin"**.
3. Allow the browser camera permission prompt.
4. **Position yourself:** Step back approximately 6 to 8 feet so your head, shoulders, hips, knees, and ankles are clearly visible in the video feed.
5. Notice the **live neon skeleton** and the real-time **knee angle badge** updating as you move.
6. **Perform a squat:**
   - Stand tall ($\ge 160^\circ$) $\to$ Phase reads **READY**.
   - Descend smoothly $\to$ Phase turns amber (**DESCENDING**).
   - Reach parallel depth ($\le 100^\circ$) $\to$ Phase turns cyan (**BOTTOM**).
   - Drive back up $\to$ Phase reads **ASCENDING**.
   - Stand back up straight $\to$ A pleasant chime rings, the repetition counter increments, and feedback affirms your rep!
7. Click **"End Workout & Review Summary"** to inspect your repetition duration breakdown and confirm database persistence.

> [!NOTE]
> Web browsers restrict camera access to `localhost`, `127.0.0.1`, or secure `HTTPS` contexts. If testing across local networks, ensure an HTTPS tunnel or SSL certificate is configured.

---

## Privacy & Security

- **Edge Computer Vision:** 100% of video inference is performed directly on the client GPU/CPU via WebAssembly.
- **Zero Video Transmission:** Raw camera frames are processed inside browser memory and never uploaded or stored.
- **Minimal Metric Persistence:** Only quantified workout metrics (timestamps, duration, validated rep counts, and aggregated form cues) are stored in the local SQLite database.

---

## Open Source & Model Attribution

- **RepRight Source Code:** Licensed under the [MIT License](LICENSE).
- **MediaPipe Pose Landmarker:** Developed by Google, licensed under the [Apache License 2.0](http://www.apache.org/licenses/LICENSE-2.0).
- Model Asset: [pose_landmarker_lite.task](https://developers.google.com/mediapipe/solutions/vision/pose_landmarker).
