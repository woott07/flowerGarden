/**
 * MediaPipe Hand Tracker & Gesture Classifier
 */
import { HandLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

export const GESTURES = {
  NONE: 'none',
  POINTING: 'pointing',
  OPEN_PALM: 'open_palm',
  PINCH: 'pinch',
  FIST: 'fist',
};

// Connections between hand landmarks for skeleton drawing
const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],       // Thumb
  [0, 5], [5, 6], [6, 7], [7, 8],       // Index
  [5, 9], [9, 10], [10, 11], [11, 12],   // Middle
  [9, 13], [13, 14], [14, 15], [15, 16], // Ring
  [13, 17], [17, 18], [18, 19], [19, 20], // Pinky
  [0, 17],                              // Palm base
];

export class HandTracker {
  constructor() {
    this.landmarker = null;
    this.isReady = false;
    this.showSkeleton = true;
    this.lastVideoTime = -1;

    // Smoothing & Gesture Debouncing State
    this.smoothedLandmarks = [];
    this.gestureHistory = [];
    this.maxHistory = 4;
    this.currentDebouncedGesture = GESTURES.NONE;
    this.lostFramesCount = 0;
    this.maxGraceFrames = 4; // Keep previous stroke active briefly during minor frame drops
  }

  /**
   * Initialize MediaPipe HandLandmarker model with tuned confidence thresholds
   */
  async initialize() {
    try {
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
      );

      this.landmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numHands: 1, // Focus on primary hand for maximum stability
        minHandDetectionConfidence: 0.65,
        minHandPresenceConfidence: 0.65,
        minTrackingConfidence: 0.65,
      });

      this.isReady = true;
      console.log('MediaPipe HandLandmarker initialized with high stability configuration.');
    } catch (err) {
      console.error('Failed to initialize MediaPipe HandLandmarker:', err);
      throw err;
    }
  }

  /**
   * Process a single video frame with Exponential Moving Average (EMA) landmark smoothing
   */
  detectHands(videoElement, timestamp) {
    if (!this.isReady || !videoElement || videoElement.currentTime === this.lastVideoTime) {
      return [];
    }
    this.lastVideoTime = videoElement.currentTime;

    const results = this.landmarker.detectForVideo(videoElement, timestamp);
    if (!results || !results.landmarks || results.landmarks.length === 0) {
      this.lostFramesCount++;
      // If within grace period, keep last known gesture state to avoid flickering stroke drops
      if (this.lostFramesCount <= this.maxGraceFrames && this.smoothedLandmarks.length > 0) {
        return [{
          landmarks: this.smoothedLandmarks,
          gesture: this.currentDebouncedGesture,
          indexTip: {
            x: this.smoothedLandmarks[8].x,
            y: this.smoothedLandmarks[8].y,
            z: this.smoothedLandmarks[8].z,
          },
          wrist: {
            x: this.smoothedLandmarks[0].x,
            y: this.smoothedLandmarks[0].y,
            z: this.smoothedLandmarks[0].z,
          },
        }];
      }
      this.currentDebouncedGesture = GESTURES.NONE;
      this.smoothedLandmarks = [];
      return [];
    }

    this.lostFramesCount = 0;
    const rawLandmarks = results.landmarks[0];

    // Apply EMA Smoothing to 21 hand landmarks (alpha = 0.35)
    const alpha = 0.35;
    if (this.smoothedLandmarks.length !== rawLandmarks.length) {
      this.smoothedLandmarks = rawLandmarks.map((lm) => ({ ...lm }));
    } else {
      this.smoothedLandmarks = rawLandmarks.map((lm, i) => {
        const prev = this.smoothedLandmarks[i];
        return {
          x: prev.x * (1 - alpha) + lm.x * alpha,
          y: prev.y * (1 - alpha) + lm.y * alpha,
          z: (prev.z || 0) * (1 - alpha) + (lm.z || 0) * alpha,
        };
      });
    }

    // Classify raw gesture & debounce across recent frames
    const rawGesture = this.classifyGesture(this.smoothedLandmarks);
    this.gestureHistory.push(rawGesture);
    if (this.gestureHistory.length > this.maxHistory) {
      this.gestureHistory.shift();
    }

    // Debounce: Gesture must be present in majority of recent frames
    const counts = {};
    this.gestureHistory.forEach((g) => {
      counts[g] = (counts[g] || 0) + 1;
    });

    let dominantGesture = GESTURES.NONE;
    let maxCount = 0;
    for (const [g, count] of Object.entries(counts)) {
      if (count > maxCount) {
        maxCount = count;
        dominantGesture = g;
      }
    }

    // Hysteresis: require at least 2 frame votes to switch gesture
    if (maxCount >= 2) {
      this.currentDebouncedGesture = dominantGesture;
    }

    const indexTip = this.smoothedLandmarks[8];
    const wrist = this.smoothedLandmarks[0];

    return [{
      landmarks: this.smoothedLandmarks,
      gesture: this.currentDebouncedGesture,
      indexTip: { x: indexTip.x, y: indexTip.y, z: indexTip.z },
      wrist: { x: wrist.x, y: wrist.y, z: wrist.z },
    }];
  }

  /**
   * Classify gesture based on robust joint geometry
   */
  classifyGesture(landmarks) {
    const wrist = landmarks[0];
    const dist = (p1, p2) => Math.hypot(p1.x - p2.x, p1.y - p2.y, (p1.z || 0) - (p2.z || 0));

    // Knuckle (MCP) points
    const indexMcp = landmarks[5];
    const middleMcp = landmarks[9];
    const ringMcp = landmarks[13];
    const pinkyMcp = landmarks[17];

    // Fingertips
    const indexTip = landmarks[8];
    const middleTip = landmarks[12];
    const ringTip = landmarks[16];
    const pinkyTip = landmarks[20];
    const thumbTip = landmarks[4];

    // Extensions relative to MCP knuckles
    const indexExt = dist(indexTip, wrist) > dist(indexMcp, wrist) * 1.25;
    const middleExt = dist(middleTip, wrist) > dist(middleMcp, wrist) * 1.25;
    const ringExt = dist(ringTip, wrist) > dist(ringMcp, wrist) * 1.25;
    const pinkyExt = dist(pinkyTip, wrist) > dist(pinkyMcp, wrist) * 1.25;

    // Pinch: Thumb tip & Index tip close
    const pinchDist = dist(thumbTip, indexTip);
    if (pinchDist < 0.055) {
      return GESTURES.PINCH;
    }

    // Open Palm: All 4 fingers clearly extended
    if (indexExt && middleExt && ringExt && pinkyExt) {
      return GESTURES.OPEN_PALM;
    }

    // Pointing: Index clearly extended, middle/ring/pinky curled
    if (indexExt && !middleExt && !ringExt && !pinkyExt) {
      return GESTURES.POINTING;
    }

    // Fist: None extended
    if (!indexExt && !middleExt && !ringExt && !pinkyExt) {
      return GESTURES.FIST;
    }

    return GESTURES.NONE;
  }

  /**
   * Draw skeletal hand connections & nodes on overlay canvas
   */
  drawSkeleton(ctx, landmarks, canvasWidth, canvasHeight, isMirrored = true) {
    if (!this.showSkeleton || !landmarks || landmarks.length === 0) return;

    ctx.save();
    
    const getPixel = (lm) => ({
      x: (isMirrored ? 1 - lm.x : lm.x) * canvasWidth,
      y: lm.y * canvasHeight,
    });

    // Draw connection lines with smooth glow
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';

    HAND_CONNECTIONS.forEach(([i, j]) => {
      const p1 = getPixel(landmarks[i]);
      const p2 = getPixel(landmarks[j]);
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    });

    // Draw landmark nodes
    landmarks.forEach((lm, index) => {
      const p = getPixel(lm);
      ctx.fillStyle = index === 8 ? '#facc15' : index === 4 ? '#ec4899' : 'rgba(255, 255, 255, 0.85)';
      ctx.beginPath();
      ctx.arc(p.x, p.y, index === 8 ? 6.5 : 3.5, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.restore();
  }
}

