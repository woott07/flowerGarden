/**
 * Garden Engine & Physics Simulation
 * Manages flower placement, growth animations, stem connections, and physics scattering.
 */
import { FlowerPainter, FLOWER_TYPES } from './flowerPainter.js';

export class GardenEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    
    this.flowers = []; // Array of flower objects
    this.stems = [];   // Array of connected stroke paths
    this.currentStem = null;

    this.selectedType = FLOWER_TYPES.RANDOM;
    this.isScattering = false;
    this.lastPlantTime = 0;
    this.plantInterval = 40; // Ms between spawning new flowers along stroke

    this.width = canvas.width;
    this.height = canvas.height;
  }

  resize(w, h) {
    this.width = w;
    this.height = h;
    this.canvas.width = w;
    this.canvas.height = h;
  }

  /**
   * Plant a flower at canvas coordinate (x, y)
   */
  plantFlower(x, y) {
    const now = performance.now();
    if (now - this.lastPlantTime < this.plantInterval) return;

    // Minimum spatial distance check from last planted flower on current stem
    if (this.currentStem && this.currentStem.length > 0) {
      const last = this.currentStem[this.currentStem.length - 1];
      const dist = Math.hypot(x - last.x, y - last.y);
      if (dist < 14) return; // Prevent clumping when hand pauses
    }

    this.lastPlantTime = now;

    const flowerType =
      this.selectedType === FLOWER_TYPES.RANDOM
        ? FlowerPainter.getRandomType()
        : this.selectedType;

    const baseSize = 24 + Math.random() * 18;
    const rotation = (Math.random() - 0.5) * Math.PI;

    const flower = {
      x,
      y,
      type: flowerType,
      size: baseSize,
      targetSize: baseSize,
      currentScale: 0.1, // Bloom animation starts at 0.1
      rotation,
      wobbleOffset: Math.random() * Math.PI * 2,
      // Physics properties for scattering mode
      vx: 0,
      vy: 0,
      vRot: 0,
      opacity: 1.0,
      isStemConnected: true,
    };

    this.flowers.push(flower);

    // Track stem connection path
    if (!this.currentStem) {
      this.currentStem = [flower];
      this.stems.push(this.currentStem);
    } else {
      this.currentStem.push(flower);
    }
  }

  /**
   * Break stem line when stroke ends
   */
  endStroke() {
    this.currentStem = null;
  }

  /**
   * Trigger physics scatter explosion across all flowers on canvas
   */
  triggerScatter(originX, originY) {
    if (this.flowers.length === 0) return;

    this.isScattering = true;
    const center = {
      x: originX ?? this.width / 2,
      y: originY ?? this.height / 2,
    };

    this.flowers.forEach((flower) => {
      // Calculate radial explosion velocity away from center point
      const dx = flower.x - center.x;
      const dy = flower.y - center.y;
      const dist = Math.hypot(dx, dy) || 1;

      const force = 8 + Math.random() * 14;
      flower.vx = (dx / dist) * force + (Math.random() - 0.5) * 6;
      flower.vy = (dy / dist) * force - Math.random() * 8; // upward initial burst
      flower.vRot = (Math.random() - 0.5) * 0.35;
      flower.isStemConnected = false;
    });

    // Clear connected stems when scattered
    this.stems = [];
    this.currentStem = null;
  }

  /**
   * Reset / clear garden
   */
  clear() {
    this.flowers = [];
    this.stems = [];
    this.currentStem = null;
    this.isScattering = false;
  }

  /**
   * Main render and physics frame update
   */
  updateAndRender(time) {
    this.ctx.clearRect(0, 0, this.width, this.height);

    // 1. Draw Stems for attached flowers
    this.stems.forEach((stem) => {
      if (stem.length < 2) return;
      for (let i = 0; i < stem.length - 1; i++) {
        const p1 = stem[i];
        const p2 = stem[i + 1];
        if (p1.isStemConnected && p2.isStemConnected) {
          FlowerPainter.drawStemSegment(this.ctx, p1, p2);
        }
      }
    });

    // 2. Update and Render Flowers
    for (let i = this.flowers.length - 1; i >= 0; i--) {
      const f = this.flowers[i];

      // Bloom growth animation
      if (f.currentScale < 1.0) {
        f.currentScale = Math.min(1.0, f.currentScale + 0.08);
      }

      // Physics update during scatter mode
      if (!f.isStemConnected) {
        f.x += f.vx;
        f.y += f.vy;
        f.rotation += f.vRot;

        // Apply physics forces: Air drag & Gravity
        f.vx *= 0.97;
        f.vy = f.vy * 0.97 + 0.35; // Gravity pull down
        f.opacity -= 0.008; // Gradual fade out

        // Remove dead/faded flowers
        if (f.opacity <= 0 || f.y > this.height + 100) {
          this.flowers.splice(i, 1);
          continue;
        }
      } else {
        // Ambient gentle breeze sway when planted
        f.rotation += Math.sin(time * 0.002 + f.wobbleOffset) * 0.002;
      }

      // Render Flower
      this.ctx.save();
      this.ctx.translate(f.x, f.y);
      if (f.opacity < 1.0) {
        this.ctx.globalAlpha = Math.max(0, f.opacity);
      }

      FlowerPainter.drawFlower(
        this.ctx,
        f.type,
        f.size,
        f.rotation,
        f.currentScale
      );

      this.ctx.restore();
    }

    // Check if scatter finished
    if (this.isScattering && this.flowers.length === 0) {
      this.isScattering = false;
    }
  }
}
