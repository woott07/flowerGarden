/**
 * Procedural Botanical & Flower Renderer
 * Renders distinct flower species, stems, and leaves onto canvas contexts.
 */

export const FLOWER_TYPES = {
  RANDOM: 'random',
  DAISY: 'daisy',
  SUNFLOWER: 'sunflower',
  ROSE: 'rose',
  CLOVER: 'clover',
  LAVENDER: 'lavender',
  CHERRY_BLOSSOM: 'cherry_blossom',
};

const PALETTES = [
  FLOWER_TYPES.DAISY,
  FLOWER_TYPES.SUNFLOWER,
  FLOWER_TYPES.ROSE,
  FLOWER_TYPES.CLOVER,
  FLOWER_TYPES.LAVENDER,
  FLOWER_TYPES.CHERRY_BLOSSOM,
];

export class FlowerPainter {
  /**
   * Draw a procedural flower on a given canvas context
   */
  static drawFlower(ctx, type, size, rotation = 0, bloomProgress = 1.0) {
    ctx.save();
    ctx.rotate(rotation);
    const scaledSize = size * bloomProgress;

    switch (type) {
      case FLOWER_TYPES.DAISY:
        this.drawDaisy(ctx, scaledSize);
        break;
      case FLOWER_TYPES.SUNFLOWER:
        this.drawSunflower(ctx, scaledSize);
        break;
      case FLOWER_TYPES.ROSE:
        this.drawRose(ctx, scaledSize);
        break;
      case FLOWER_TYPES.CLOVER:
        this.drawClover(ctx, scaledSize);
        break;
      case FLOWER_TYPES.LAVENDER:
        this.drawLavender(ctx, scaledSize);
        break;
      case FLOWER_TYPES.CHERRY_BLOSSOM:
        this.drawCherryBlossom(ctx, scaledSize);
        break;
      default:
        this.drawDaisy(ctx, scaledSize);
    }

    ctx.restore();
  }

  /**
   * Daisy: Radiant white petals around a warm yellow disc
   */
  static drawDaisy(ctx, size) {
    const numPetals = 14;
    const petalLength = size * 0.9;
    const petalWidth = size * 0.22;

    // Petals
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 0.8;

    for (let i = 0; i < numPetals; i++) {
      const angle = (i * Math.PI * 2) / numPetals;
      ctx.save();
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.ellipse(petalLength * 0.55, 0, petalLength * 0.45, petalWidth * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // Center disc
    const discRadius = size * 0.3;
    const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, discRadius);
    grad.addColorStop(0, '#fde047');
    grad.addColorStop(0.7, '#eab308');
    grad.addColorStop(1, '#ca8a04');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, discRadius, 0, Math.PI * 2);
    ctx.fill();
  }

  /**
   * Sunflower: Golden pointed petals with dark seed center
   */
  static drawSunflower(ctx, size) {
    const numPetals = 18;
    const petalLength = size * 1.0;

    // Outer Petals
    for (let i = 0; i < numPetals; i++) {
      const angle = (i * Math.PI * 2) / numPetals;
      ctx.save();
      ctx.rotate(angle);
      
      const grad = ctx.createLinearGradient(0, 0, petalLength, 0);
      grad.addColorStop(0, '#facc15');
      grad.addColorStop(0.6, '#eab308');
      grad.addColorStop(1, '#d97706');
      
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(size * 0.3, 0);
      ctx.quadraticCurveTo(petalLength * 0.6, -size * 0.2, petalLength, 0);
      ctx.quadraticCurveTo(petalLength * 0.6, size * 0.2, size * 0.3, 0);
      ctx.fill();
      ctx.restore();
    }

    // Center Core
    const discRadius = size * 0.42;
    ctx.fillStyle = '#451a03';
    ctx.beginPath();
    ctx.arc(0, 0, discRadius, 0, Math.PI * 2);
    ctx.fill();

    // Center texture dots
    ctx.fillStyle = '#78350f';
    for (let r = discRadius * 0.3; r < discRadius * 0.95; r += 4) {
      const count = Math.floor(r * 2);
      for (let j = 0; j < count; j++) {
        const a = (j * Math.PI * 2) / count + r;
        const dx = Math.cos(a) * r;
        const dy = Math.sin(a) * r;
        ctx.beginPath();
        ctx.arc(dx, dy, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  /**
   * Rose: Overlapping crimson/pink petals with spiral center
   */
  static drawRose(ctx, size) {
    const layers = [
      { r: size * 0.9, petals: 6, color: '#f43f5e' },
      { r: size * 0.7, petals: 5, color: '#e11d48' },
      { r: size * 0.5, petals: 4, color: '#be123c' },
      { r: size * 0.35, petals: 3, color: '#9f1239' },
    ];

    layers.forEach((layer, index) => {
      for (let i = 0; i < layer.petals; i++) {
        const angle = (i * Math.PI * 2) / layer.petals + (index * 0.4);
        ctx.save();
        ctx.rotate(angle);
        
        ctx.fillStyle = layer.color;
        ctx.beginPath();
        ctx.arc(layer.r * 0.4, 0, layer.r * 0.55, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    });

    // Inner Spiral Core
    ctx.strokeStyle = '#ffe4e6';
    ctx.lineWidth = size * 0.08;
    ctx.beginPath();
    let r = size * 0.22;
    for (let a = 0; a < Math.PI * 4; a += 0.2) {
      const x = Math.cos(a) * r;
      const y = Math.sin(a) * r;
      if (a === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
      r *= 0.94;
    }
    ctx.stroke();
  }

  /**
   * Clover: 4 Heart-shaped emerald leaves
   */
  static drawClover(ctx, size) {
    const leafRadius = size * 0.5;
    ctx.fillStyle = '#10b981';
    ctx.strokeStyle = '#047857';
    ctx.lineWidth = 1;

    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI) / 2;
      ctx.save();
      ctx.rotate(angle);

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(-leafRadius * 0.6, -leafRadius, -leafRadius, -leafRadius * 0.2, 0, -leafRadius * 1.1);
      ctx.bezierCurveTo(leafRadius, -leafRadius * 0.2, leafRadius * 0.6, -leafRadius, 0, 0);
      ctx.fill();
      ctx.stroke();

      // Leaf vein
      ctx.strokeStyle = '#6ee7b7';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -leafRadius * 0.7);
      ctx.stroke();

      ctx.restore();
    }
  }

  /**
   * Lavender: Stacked violet floret clusters
   */
  static drawLavender(ctx, size) {
    const count = 7;
    const colors = ['#8b5cf6', '#7c3aed', '#a78bfa', '#c084fc'];
    
    for (let i = 0; i < count; i++) {
      const yOffset = -size * (0.8 - (i / count) * 1.2);
      const floretSize = size * (0.35 - Math.abs(i - count / 2) * 0.03);

      for (let j = 0; j < 4; j++) {
        const angle = (j * Math.PI) / 2 + i * 0.3;
        const dx = Math.cos(angle) * floretSize * 0.8;
        const dy = yOffset + Math.sin(angle) * floretSize * 0.4;
        
        ctx.fillStyle = colors[(i + j) % colors.length];
        ctx.beginPath();
        ctx.ellipse(dx, dy, floretSize * 0.6, floretSize * 0.4, angle, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  /**
   * Cherry Blossom: 5 soft pink petals with red stamens
   */
  static drawCherryBlossom(ctx, size) {
    const numPetals = 5;
    const petalLen = size * 0.95;

    // Petals
    for (let i = 0; i < numPetals; i++) {
      const angle = (i * Math.PI * 2) / numPetals;
      ctx.save();
      ctx.rotate(angle);

      const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, petalLen);
      grad.addColorStop(0, '#fbcfe8');
      grad.addColorStop(0.7, '#f472b6');
      grad.addColorStop(1, '#ec4899');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(-size * 0.3, -petalLen * 0.5, 0, -petalLen);
      ctx.quadraticCurveTo(size * 0.3, -petalLen * 0.5, 0, 0);
      ctx.fill();
      ctx.restore();
    }

    // Stamens
    ctx.strokeStyle = '#be123c';
    ctx.lineWidth = 1;
    ctx.fillStyle = '#fde047';

    for (let i = 0; i < 10; i++) {
      const angle = (i * Math.PI * 2) / 10;
      const len = size * 0.35;
      const ex = Math.cos(angle) * len;
      const ey = Math.sin(angle) * len;

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(ex, ey);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(ex, ey, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /**
   * Draw connecting organic vine/stem between path nodes
   */
  static drawStemSegment(ctx, p1, p2) {
    ctx.save();
    ctx.strokeStyle = '#15803d';
    ctx.lineWidth = Math.max(2, (p1.size + p2.size) * 0.15);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);

    const midX = (p1.x + p2.x) / 2 + (Math.random() - 0.5) * 8;
    const midY = (p1.y + p2.y) / 2 + (Math.random() - 0.5) * 8;
    ctx.quadraticCurveTo(midX, midY, p2.x, p2.y);
    ctx.stroke();

    // Draw small leaves along segment
    if (Math.random() < 0.6) {
      const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x) + (Math.random() > 0.5 ? 1 : -1) * 1.2;
      this.drawLeaf(ctx, midX, midY, 14, angle);
    }

    ctx.restore();
  }

  /**
   * Draw leaf on stem
   */
  static drawLeaf(ctx, x, y, size, angle) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    ctx.fillStyle = '#22c55e';
    ctx.strokeStyle = '#15803d';
    ctx.lineWidth = 1;

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(size * 0.5, -size * 0.3, size, 0);
    ctx.quadraticCurveTo(size * 0.5, size * 0.3, 0, 0);
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }

  /**
   * Get random flower type
   */
  static getRandomType() {
    return PALETTES[Math.floor(Math.random() * PALETTES.length)];
  }
}
