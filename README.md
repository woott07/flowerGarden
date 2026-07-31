# 🌸 Flower Wand — Interactive Hand-Tracked Garden

An interactive, real-time web application that allows you to draw botanical flower gardens in mid-air using webcam hand tracking gestures and physics scattering.

---

## ✨ Features

- 👆 **Point to Plant**: Extend your index finger to plant dynamic trails of blooming flowers.
- 🖐️ **Open Palm to Scatter**: Open your hand to trigger a radial physics explosion that scatters planted flowers with gravity and drag.
- 🌼 **Procedural Flower Species**: Daisies, Sunflowers, Wild Roses, 4-Leaf Clovers, Lavenders, and Cherry Blossoms with organic stems and leaf sprouts.
- 📸 **High-Res Snapshot**: Save and download a PNG image of your custom flower garden composition.
- 💡 **Mouse & Touch Fallback**: Fully interactive with mouse dragging or touch gestures when a camera is unavailable.

---

## 🛠️ Tech Stack

- **Vision & AI**: Google MediaPipe Hand Landmarker (`@mediapipe/tasks-vision`)
- **Graphics**: HTML5 Canvas 2D API & Procedural Vector Art
- **Build Tool**: Vite
- **Styling**: Modern CSS Glassmorphic UI Design Tokens

---

## 🚀 Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start local development server:**
   ```bash
   npm run dev
   ```

3. Open `http://localhost:5173` in your browser and allow webcam access to start planting!

---

## 📄 License

MIT
