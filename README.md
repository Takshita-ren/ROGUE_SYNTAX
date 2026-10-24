# RepRight

> **Don't Just Count Reps. Perfect Every Rep.**

[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](LICENSE)
[![Frontend](https://img.shields.io/badge/Frontend-React%2019%20%7C%20TypeScript%20%7C%20Vite%20%7C%20Tailwind-blue.svg)](frontend/)
[![Backend](https://img.shields.io/badge/Backend-FastAPI%20%7C%20SQLAlchemy%20%7C%20SQLite-green.svg)](backend/)
[![Computer Vision](https://img.shields.io/badge/AI%20Vision-MediaPipe%20Tasks%20Vision-neon.svg)](https://developers.google.com/mediapipe)

RepRight is an AI-powered fitness coach that uses real-time computer vision in your browser to analyze your exercise technique, count repetitions and time holds automatically using a generic biomechanical engine, and guide your training with explainable form cues.

---

## Table of Contents

1. [Key Features](#key-features)
2. [Supported Exercises](#supported-exercises)
3. [Architecture & How It Works](#architecture--how-it-works)
4. [Config-Driven Biomechanical Engine](#config-driven-biomechanical-engine)
5. [Threshold Tuning & Calibration](#threshold-tuning--calibration)
6. [Technology Stack](#technology-stack)
7. [Project Structure](#project-structure)
8. [Prerequisites](#prerequisites)
9. [Quick Start & Local Setup](#quick-start--local-setup)
   - [Backend Setup](#1-backend-setup-fastapi)
   - [Frontend Setup](#2-frontend-setup-react--vite)
10. [Automated Testing](#automated-testing)
11. [Production Build](#production-build)
12. [Manual Camera Testing Guide](#manual-camera-testing-guide)
13. [Privacy & Security](#privacy--security)
14. [Open Source & Model Attribution](#open-source--model-attribution)

---

## Key Features

- **Real-Time Client-Side Pose Tracking:** Detects 33 body landmarks locally in your browser using Google MediaPipe Pose Landmarker without sending camera video to external servers.
- **Config-Driven Exercise Engine:** Supports any movement via declarative configurations (`ExerciseConfig`), accommodating both repetition-based exercises and timed isometric holds.
- **Biomechanical Joint-Angle Math:** Computes true 2D joint angles with clamped vector dot products, Exponential Moving Average (EMA) jitter dampening, and automated landmark visibility checks (< 0.5 confidence pause).
- **Multi-Direction State Machine:** Supports both angle-decreasing movements (squats, push-ups, lunges, curls) and angle-increasing movements (overhead shoulder press, jumping jacks).
- **Timed Hold Mode:** Tracks bodyline alignment and accumulates good-form hold seconds (e.g. isometric plank), pausing timer accumulation and alerting during form breaks.
- **Real-Time Explainable Coaching Cues:** Displays contextual form guidance (*"Squeeze glutes — do not sag hips"*, *"Pin elbows to sides"*, *"Clap hands fully overhead"*).
- **Overlaid Neon Skeleton HUD with Exercise Highlighting:** Dynamic visual overlay with joint highlighting and bone glowing customized to each exercise's primary kinetic chain.
- **Exercise Picker & Routing:** Dedicated exercise selection catalog (`/workout/:exerciseId`) categorized into Legs, Push, Pull, Core, and Full-Body.
- **Target Goals & Set Completion:** Customizable target reps and hold durations in Settings, alerting when a workout set is completed.
- **Persistent Local Database & Multi-Exercise Filtering:** SQLite database with non-destructive auto-migration storing `exercise_id`, `reps`, and `hold_seconds`, with per-exercise filtering in Dashboard and History.

---

## Supported Exercises

RepRight supports 8 core exercises out of the box:

| Exercise | Category | Mode | Direction | Primary Angle | Real-Time Form Check |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Bodyweight Squat** | Legs | Reps | Decreasing | Knee Angle | Torso uprightness / excessive forward lean |
| **Push-Up** | Push | Reps | Decreasing | Elbow Angle | Bodyline integrity: sagged hips or piked hips |
| **Walking / Static Lunge** | Legs | Reps | Decreasing | Lead Knee Angle | Torso upright angle over hips |
| **Bicep Curl** | Pull | Reps | Decreasing | Elbow Angle | Torso sway & elbow drift forward |
| **Overhead Shoulder Press** | Push | Reps | Increasing | Elbow Angle | Lumbar back arching / hyper-extension |
| **Sit-Up / Crunch** | Core | Reps | Decreasing | Torso-Hip Flexion | Cervical spine stress / pulling on neck |
| **Jumping Jack** | Full-Body | Reps | Increasing | Arm Elevation | Overhead arm reach & cycle symmetry |
| **Forearm Plank** | Core | Hold | Neutral | Bodyline Angle | Sagging or piked hips; pauses hold timer |

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
│  [Vector Math: Joint Angles & Visibilities] [Skeleton Canvas]
│       │                                     (Highlighted Joints)
│       ▼                                                   │
│  [Config-Driven ExerciseEngine] ──> [Web Audio Chime]     │
│  (Config: Squat, Push-up, Press, Plank...)               │
│       │                                                   │
│       ▼                                                   │
│  [Workout Session Summary]                                │
└───────────────────────┬───────────────────────────────────┘
                        │ HTTP POST /api/workouts
                        │ (session_id, exercise_id, reps, hold_seconds)
                        ▼
┌───────────────────────────────────────────────────────────┐
│                    FastAPI Backend                        │
│                                                           │
│  [Routes: /api/workouts, /api/stats/summary, /api/health] │
│  (Filtered by exercise_id query param)                    │
│                            │                              │
│                            ▼                              │
│                  [SQLAlchemy ORM]                         │
│                            │                              │
│                            ▼                              │
│               [SQLite Database (Local)]                   │
│               (Safe dynamic auto-migration)               │
└───────────────────────────────────────────────────────────┘
```

---

## Config-Driven Biomechanical Engine

All exercise rules, phase thresholds, and form checks are completely decoupled from UI components and stored in `frontend/src/utils/exerciseConfigs.ts`.

Each exercise is defined as an `ExerciseConfig`:

```typescript
export interface ExerciseConfig {
  id: string;
  name: string;
  category: ExerciseCategory; // 'legs' | 'push' | 'pull' | 'core' | 'full-body'
  mode: ExerciseMode;         // 'reps' | 'hold'
  camera: {
    recommendedView: 'front' | 'side';
    setupTip: string;
  };
  trackedAngles: TrackedAngleConfig[];
  primaryAngle: string;
  direction: 'decreasing' | 'increasing';
  phases: PhaseThresholds;
  formChecks: FormCheckConfig[];
  partialRepMessage: string;
  requiredLandmarks?: number[];
  highlightJoints?: number[];
  highlightBones?: [number, number][];
  defaultTargetReps?: number;
  defaultTargetHoldSeconds?: number;
}
```

---

## Threshold Tuning & Calibration

All angle thresholds live in [`frontend/src/utils/exerciseConfigs.ts`](frontend/src/utils/exerciseConfigs.ts) with detailed comments for camera tuning:

- **Decreasing movements (e.g. Squat, Push-up):**
  - `startThreshold`: Angle when standing/extended (e.g. $158^\circ$ for squat, $155^\circ$ for push-up).
  - `bottomThreshold`: Target flexion depth required (e.g. $\le 102^\circ$ for squat, $\le 95^\circ$ for push-up).
  - `lockoutThreshold`: Angle returning to extension to complete the repetition (e.g. $\ge 158^\circ$).
- **Increasing movements (e.g. Shoulder Press, Jumping Jack):**
  - `startThreshold`: Angle at start/rack position (e.g. $\le 90^\circ$).
  - `bottomThreshold`: Lockout extension overhead (e.g. $\ge 155^\circ$).
  - `lockoutThreshold`: Return descent back to rack position (e.g. $\le 95^\circ$).
- **Timed Isometric Holds (e.g. Plank):**
  - `startThreshold`: Straight bodyline target ($\ge 155^\circ$).
  - If bodyline drops below $152^\circ$, form breaks and hold time accumulation freezes until posture is corrected.
- **Landmark Visibility Guard:**
  - If key landmarks drop below $0.5$ confidence, counting pauses with the cue: *"Move back so your full body is visible"*.

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

The backend test suite validates database models, API endpoints, schema validation, idempotent submission, multi-exercise creation, hold/rep metric storage, `exercise_id` filtering, and legacy old-row compatibility:

```bash
PYTHONPATH=backend backend/venv/bin/pytest backend/tests/ -v
```

**Results:** `16 passed in 0.70s`

### Running Frontend & CV Tests (Vitest)

The frontend test suite tests joint angle trigonometry, clamp boundary conditions, jitter smoothing, generic exercise engine state transitions, squat backward compatibility, angle-increasing shoulder press cycles, plank timed hold accumulation & form-break pauses, visibility-pause behavior, and synthetic landmark form checks for all 8 exercises:

```bash
cd frontend
npm run test
```

**Results:** `33 passed in 1.95s`

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
