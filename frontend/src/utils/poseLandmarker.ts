import { FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision';

let poseLandmarkerInstance: PoseLandmarker | null = null;
let isInitializing = false;
let initPromise: Promise<PoseLandmarker> | null = null;

const LOCAL_MODEL_PATH = '/models/pose_landmarker_lite.task';
const CDN_MODEL_PATH = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task';

/**
 * Initializes and returns the singleton PoseLandmarker instance.
 * Automatically tries local public assets first, with CDN fallback.
 */
export async function getPoseLandmarker(): Promise<PoseLandmarker> {
  if (poseLandmarkerInstance) {
    return poseLandmarkerInstance;
  }

  if (isInitializing && initPromise) {
    return initPromise;
  }

  isInitializing = true;

  initPromise = (async () => {
    try {
      // 1. Resolve WASM assets (try local first, fallback to CDN)
      let vision;
      try {
        vision = await FilesetResolver.forVisionTasks('/wasm');
      } catch (wasmErr) {
        console.warn('Local WASM loading failed, falling back to CDN:', wasmErr);
        vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        );
      }

      // 2. Initialize Pose Landmarker (try local model first, fallback to CDN)
      let landmarker: PoseLandmarker;
      try {
        landmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: LOCAL_MODEL_PATH,
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numPoses: 1,
          minPoseDetectionConfidence: 0.5,
          minPosePresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });
      } catch (localModelErr) {
        console.warn('Local model loading failed, falling back to CDN model:', localModelErr);
        landmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: CDN_MODEL_PATH,
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numPoses: 1,
          minPoseDetectionConfidence: 0.5,
          minPosePresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });
      }

      poseLandmarkerInstance = landmarker;
      return landmarker;
    } finally {
      isInitializing = false;
    }
  })();

  return initPromise;
}

/**
 * Safely disposes the PoseLandmarker instance to release GPU/WASM memory.
 */
export function disposePoseLandmarker(): void {
  if (poseLandmarkerInstance) {
    try {
      poseLandmarkerInstance.close();
    } catch (e) {
      console.error('Error closing pose landmarker:', e);
    }
    poseLandmarkerInstance = null;
    initPromise = null;
    isInitializing = false;
  }
}
