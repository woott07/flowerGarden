/**
 * User Interface & HUD Control Handler
 */
import { FLOWER_TYPES } from './flowerPainter.js';

export class UIManager {
  constructor(callbacks) {
    this.callbacks = callbacks;

    // DOM Elements
    this.statusBadge = document.getElementById('status-badge');
    this.statusText = document.getElementById('status-text');
    this.statusDot = document.getElementById('status-dot');
    this.skeletonBtn = document.getElementById('btn-skeleton');
    this.clearBtn = document.getElementById('btn-clear');
    this.snapshotBtn = document.getElementById('btn-snapshot');
    this.cameraBtn = document.getElementById('btn-camera');
    this.flowerSelect = document.getElementById('flower-select');
    this.fallbackNotice = document.getElementById('fallback-notice');

    this.initEventListeners();
  }

  initEventListeners() {
    if (this.skeletonBtn) {
      this.skeletonBtn.addEventListener('click', () => {
        const isActive = this.skeletonBtn.classList.toggle('active');
        this.callbacks.onToggleSkeleton(isActive);
      });
    }

    if (this.clearBtn) {
      this.clearBtn.addEventListener('click', () => {
        this.callbacks.onClear();
      });
    }

    if (this.snapshotBtn) {
      this.snapshotBtn.addEventListener('click', () => {
        this.callbacks.onTakeSnapshot();
      });
    }

    if (this.cameraBtn) {
      this.cameraBtn.addEventListener('click', () => {
        const isOff = this.cameraBtn.classList.toggle('off');
        this.callbacks.onToggleCamera(!isOff);
      });
    }

    if (this.flowerSelect) {
      this.flowerSelect.addEventListener('change', (e) => {
        this.callbacks.onSelectFlowerType(e.target.value);
      });
    }
  }

  /**
   * Update Floating Status Badge
   */
  setStatus(message, state = 'active') {
    if (!this.statusText) return;
    this.statusText.textContent = message;

    if (this.statusDot) {
      this.statusDot.className = 'status-dot ' + state;
    }
  }

  /**
   * Show fallback notice when camera is disabled or unsupported
   */
  showFallbackNotice(show = true) {
    if (this.fallbackNotice) {
      this.fallbackNotice.style.display = show ? 'block' : 'none';
    }
  }
}
