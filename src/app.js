/**
 * Main Application Orchestrator
 */
import { CameraManager } from './camera.js';
import { HandTracker, GESTURES } from './tracker.js';
import { GardenEngine } from './gardenEngine.js';
import { UIManager } from './ui.js';

class App {
  constructor() {
    // DOM Elements
    this.videoElement = document.getElementById('webcam-video');
    this.gardenCanvas = document.getElementById('garden-canvas');
    this.skeletonCanvas = document.getElementById('skeleton-canvas');
    this.skeletonCtx = this.skeletonCanvas.getContext('2d');

    // Modules
    this.camera = new CameraManager(this.videoElement);
    this.tracker = new HandTracker();
    this.engine = new GardenEngine(this.gardenCanvas);
    this.ui = null;

    // Mouse / Touch Fallback & Smoothing state
    this.isMouseDown = false;
    this.isCameraActive = true;
    this.lastDetectedGesture = GESTURES.NONE;
    this.smoothPointer = { x: null, y: null };

    this.init();
  }

  async init() {
    this.handleResize();
    window.addEventListener('resize', () => this.handleResize());

    // Initialize UI Manager
    this.ui = new UIManager({
      onToggleSkeleton: (active) => {
        this.tracker.showSkeleton = active;
      },
      onClear: () => {
        this.engine.clear();
      },
      onTakeSnapshot: () => {
        this.takeSnapshot();
      },
      onToggleCamera: (active) => {
        this.toggleCamera(active);
      },
      onSelectFlowerType: (type) => {
        this.engine.selectedType = type;
      },
    });

    // Attach Mouse & Touch Fallback Event Listeners
    this.attachFallbackEvents();

    // Start Camera & MediaPipe Hand Tracking
    try {
      this.ui.setStatus('Initializing camera...', 'loading');
      await this.camera.start();

      this.ui.setStatus('Loading hand tracking model...', 'loading');
      await this.tracker.initialize();

      this.ui.setStatus('Point to plant · Open hand to scatter', 'active');
      this.ui.showFallbackNotice(false);
    } catch (err) {
      console.warn('Camera or MediaPipe initialization failed, enabling mouse fallback:', err);
      this.isCameraActive = false;
      this.videoElement.style.display = 'none';
      this.ui.setStatus('Mouse / Touch Mode Active', 'active');
      this.ui.showFallbackNotice(true);
    }

    // Start Main Render & Tracking Loop
    requestAnimationFrame((t) => this.loop(t));
  }

  handleResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;

    this.engine.resize(w, h);
    this.skeletonCanvas.width = w;
    this.skeletonCanvas.height = h;
  }

  /**
   * Main RAF Loop
   */
  loop(timestamp) {
    // 1. Process Hand Tracking if camera is active
    if (this.isCameraActive && this.camera.isReady && this.tracker.isReady) {
      const hands = this.tracker.detectHands(this.videoElement, timestamp);

      // Clear Skeleton Overlay Canvas
      this.skeletonCtx.clearRect(0, 0, this.skeletonCanvas.width, this.skeletonCanvas.height);

      if (hands.length === 0) {
        if (this.lastDetectedGesture !== GESTURES.NONE) {
          this.engine.endStroke();
          this.smoothPointer = { x: null, y: null };
          this.lastDetectedGesture = GESTURES.NONE;
          this.ui.setStatus('Point to plant · Open hand to scatter', 'active');
        }
      } else {
        hands.forEach((hand) => {
          // Draw Skeleton Joints
          this.tracker.drawSkeleton(
            this.skeletonCtx,
            hand.landmarks,
            this.skeletonCanvas.width,
            this.skeletonCanvas.height,
            true // video is mirrored
          );

          // Convert mirrored normalized coords to canvas pixels
          const targetX = (1 - hand.indexTip.x) * this.gardenCanvas.width;
          const targetY = hand.indexTip.y * this.gardenCanvas.height;

          const wristX = (1 - hand.wrist.x) * this.gardenCanvas.width;
          const wristY = hand.wrist.y * this.gardenCanvas.height;

          // Gesture Logic
          if (hand.gesture === GESTURES.POINTING) {
            if (this.smoothPointer.x === null) {
              this.smoothPointer.x = targetX;
              this.smoothPointer.y = targetY;
            } else {
              // Smooth lerp (0.45 factor)
              this.smoothPointer.x += (targetX - this.smoothPointer.x) * 0.45;
              this.smoothPointer.y += (targetY - this.smoothPointer.y) * 0.45;
            }

            this.engine.plantFlower(this.smoothPointer.x, this.smoothPointer.y);
            this.ui.setStatus('✨ Planting Flowers', 'active');
          } else if (hand.gesture === GESTURES.OPEN_PALM) {
            this.engine.endStroke();
            this.smoothPointer = { x: null, y: null };
            this.engine.triggerScatter(wristX, wristY);
            this.ui.setStatus('🌸 Scattering Garden!', 'scatter');
          } else {
            this.engine.endStroke();
            this.smoothPointer = { x: null, y: null };
            this.ui.setStatus('Point to plant · Open hand to scatter', 'active');
          }

          this.lastDetectedGesture = hand.gesture;
        });
      }
    }

    // 2. Update Garden Physics & Render Canvas
    this.engine.updateAndRender(timestamp);

    requestAnimationFrame((t) => this.loop(t));
  }

  /**
   * Mouse & Touch Dragging Fallbacks
   */
  attachFallbackEvents() {
    // Mouse Events
    window.addEventListener('mousedown', (e) => {
      if (e.target.closest('.hud-header')) return;
      this.isMouseDown = true;
      this.engine.plantFlower(e.clientX, e.clientY);
    });

    window.addEventListener('mousemove', (e) => {
      if (this.isMouseDown) {
        this.engine.plantFlower(e.clientX, e.clientY);
      }
    });

    window.addEventListener('mouseup', () => {
      this.isMouseDown = false;
      this.engine.endStroke();
    });

    window.addEventListener('dblclick', (e) => {
      if (e.target.closest('.hud-header')) return;
      this.engine.triggerScatter(e.clientX, e.clientY);
      this.ui.setStatus('🌸 Scattering Garden!', 'scatter');
    });

    // Touch Events
    window.addEventListener('touchstart', (e) => {
      if (e.target.closest('.hud-header')) return;
      const touch = e.touches[0];
      if (touch) {
        this.isMouseDown = true;
        this.engine.plantFlower(touch.clientX, touch.clientY);
      }
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      if (this.isMouseDown && e.touches[0]) {
        this.engine.plantFlower(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });

    window.addEventListener('touchend', () => {
      this.isMouseDown = false;
      this.engine.endStroke();
    });

    // Spacebar to Scatter
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space') {
        this.engine.triggerScatter();
        this.ui.setStatus('🌸 Scattering Garden!', 'scatter');
      }
    });
  }

  /**
   * Toggle camera stream on/off
   */
  toggleCamera(enable) {
    this.isCameraActive = enable;
    if (enable) {
      this.videoElement.style.display = 'block';
      this.camera.start().catch(() => {});
    } else {
      this.videoElement.style.display = 'none';
      this.camera.stop();
      this.ui.setStatus('Camera Turned Off (Mouse/Touch Active)', 'active');
    }
  }

  /**
   * High-Resolution Snapshot Generator
   */
  takeSnapshot() {
    const offscreen = document.createElement('canvas');
    offscreen.width = this.gardenCanvas.width;
    offscreen.height = this.gardenCanvas.height;
    const ctx = offscreen.getContext('2d');

    // 1. Draw camera video background if enabled
    if (this.isCameraActive && this.videoElement.readyState >= 2) {
      ctx.save();
      ctx.translate(offscreen.width, 0);
      ctx.scale(-1, 1); // Mirror video
      ctx.drawImage(this.videoElement, 0, 0, offscreen.width, offscreen.height);
      ctx.restore();
    } else {
      // Dark background fallback
      ctx.fillStyle = '#0b0f0c';
      ctx.fillRect(0, 0, offscreen.width, offscreen.height);
    }

    // 2. Composite garden canvas on top
    ctx.drawImage(this.gardenCanvas, 0, 0);

    // 3. Download link
    const link = document.createElement('a');
    link.download = `flower-wand-${Date.now()}.png`;
    link.href = offscreen.toDataURL('image/png');
    link.click();

    this.ui.setStatus('📸 Snapshot Saved!', 'active');
  }
}

// Instantiate application on DOM Content Loaded
window.addEventListener('DOMContentLoaded', () => {
  new App();
});
