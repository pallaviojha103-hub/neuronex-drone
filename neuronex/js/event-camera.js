/* ========================================
   NeuroNex - Event-Based Camera (DVS Emulation)
   Only processes pixels that change brightness
   ======================================== */

export class EventCamera {
  constructor(width, height) {
    this.w = width;
    this.h = height;
    this.previousFrame = null;
    this.eventSurface = null; // temporal decay surface
    this.threshold = 15; // brightness change threshold
    this.decayRate = 0.92; // how fast events fade
    this.outputImageData = null;
  }

  resize(w, h) {
    this.w = w;
    this.h = h;
    this.previousFrame = null;
    this.eventSurface = null;
    this.outputImageData = null;
  }

  reset() {
    this.previousFrame = null;
    this.eventSurface = null;
  }

  process(sceneImageData) {
    const w = this.w;
    const h = this.h;
    const data = sceneImageData.data;
    const pixelCount = w * h;

    // Initialize previous frame if needed
    if (!this.previousFrame || this.previousFrame.length !== pixelCount) {
      this.previousFrame = new Float32Array(pixelCount);
      this.eventSurface = new Float32Array(pixelCount * 3); // R, G, B for each pixel
      this.outputImageData = new ImageData(w, h);

      // Fill previous frame with current brightness
      for (let i = 0; i < pixelCount; i++) {
        const idx = i * 4;
        this.previousFrame[i] = data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114;
      }
    }

    // Decay event surface
    for (let i = 0; i < this.eventSurface.length; i++) {
      this.eventSurface[i] *= this.decayRate;
    }

    let eventCount = 0;
    const output = this.outputImageData.data;

    // Compare each pixel's brightness to previous frame
    for (let i = 0; i < pixelCount; i++) {
      const idx = i * 4;
      const surfIdx = i * 3;

      // Current brightness (luminance)
      const brightness = data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114;
      const diff = brightness - this.previousFrame[i];

      if (Math.abs(diff) > this.threshold) {
        eventCount++;

        if (diff > 0) {
          // Positive event (ON event) — brighter → cyan
          this.eventSurface[surfIdx] = 0;       // R
          this.eventSurface[surfIdx + 1] = 240; // G
          this.eventSurface[surfIdx + 2] = 255; // B
        } else {
          // Negative event (OFF event) — darker → magenta
          this.eventSurface[surfIdx] = 255;     // R
          this.eventSurface[surfIdx + 1] = 0;   // G
          this.eventSurface[surfIdx + 2] = 255; // B
        }
      }

      // Render event surface to output
      const r = this.eventSurface[surfIdx];
      const g = this.eventSurface[surfIdx + 1];
      const b = this.eventSurface[surfIdx + 2];
      const intensity = Math.max(r, g, b);

      if (intensity > 2) {
        output[idx] = r;
        output[idx + 1] = g;
        output[idx + 2] = b;
        output[idx + 3] = Math.min(255, intensity * 1.5);
      } else {
        // Dark background with very subtle grid
        output[idx] = 3;
        output[idx + 1] = 4;
        output[idx + 2] = 8;
        output[idx + 3] = 255;
      }

      // Update previous frame
      this.previousFrame[i] = brightness;
    }

    return {
      outputImage: this.outputImageData,
      eventCount,
      totalPixels: pixelCount
    };
  }
}
