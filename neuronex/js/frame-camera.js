/* ========================================
   NeuroNex - Traditional Frame Camera
   Full-frame processing (comparison baseline)
   ======================================== */

export class FrameCamera {
  constructor(width, height) {
    this.w = width;
    this.h = height;
    this.outputImageData = null;
    this.processingHeat = null; // shows which pixels are "being processed"
  }

  resize(w, h) {
    this.w = w;
    this.h = h;
    this.outputImageData = null;
    this.processingHeat = null;
  }

  reset() {
    this.outputImageData = null;
    this.processingHeat = null;
  }

  process(sceneImageData) {
    const w = this.w;
    const h = this.h;
    const data = sceneImageData.data;
    const pixelCount = w * h;

    if (!this.outputImageData) {
      this.outputImageData = new ImageData(w, h);
      this.processingHeat = new Float32Array(pixelCount);
    }

    const output = this.outputImageData.data;

    // Copy the full scene — because traditional cameras process EVERY pixel
    for (let i = 0; i < pixelCount; i++) {
      const idx = i * 4;

      // Copy scene with slight color grading (warm amber tint to differentiate)
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];

      output[idx] = Math.min(255, r + 5);
      output[idx + 1] = Math.min(255, g + 2);
      output[idx + 2] = Math.max(0, b - 3);
      output[idx + 3] = 255;
    }

    // Overlay processing visualization — shows computation "heat"
    // This represents the wasted energy processing static pixels
    for (let i = 0; i < pixelCount; i++) {
      const idx = i * 4;
      const x = i % w;
      const y = Math.floor(i / w);

      // Create scan-line processing effect
      const scanLine = (y + performance.now() * 0.1) % 60;
      if (scanLine < 2) {
        // Active scan line
        output[idx] = Math.min(255, output[idx] + 40);
        output[idx + 1] = Math.min(255, output[idx + 1] + 25);
        output[idx + 2] = Math.min(255, output[idx + 2] + 5);
      }

      // Show processing cost — amber overlay on all pixels being processed
      const brightness = (output[idx] + output[idx + 1] + output[idx + 2]) / 3;
      if (brightness < 20) {
        // Dark (static) areas still being processed — waste indicator
        // Subtle red tint to show wasted computation
        const wasteAlpha = 0.08 + Math.sin(performance.now() * 0.002 + x * 0.05) * 0.03;
        output[idx] = Math.min(255, output[idx] + 15 * wasteAlpha * 255);
        output[idx + 1] = output[idx + 1];
        output[idx + 2] = output[idx + 2];
      }
    }

    // Add border processing indicator (amber flashing border)
    const borderSize = 2;
    const borderAlpha = 0.3 + Math.sin(performance.now() * 0.005) * 0.15;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (x < borderSize || x >= w - borderSize || y < borderSize || y >= h - borderSize) {
          const idx = (y * w + x) * 4;
          output[idx] = Math.min(255, output[idx] + Math.floor(255 * borderAlpha * 0.3));
          output[idx + 1] = Math.min(255, output[idx + 1] + Math.floor(170 * borderAlpha * 0.3));
          output[idx + 2] = output[idx + 2];
        }
      }
    }

    return {
      outputImage: this.outputImageData,
      totalPixels: pixelCount
    };
  }
}
