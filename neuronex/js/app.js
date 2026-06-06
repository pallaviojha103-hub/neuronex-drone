/* ========================================
   NeuroNex - Main Application Controller
   ======================================== */

import { Simulation } from './simulation.js';
import { MetricsDashboard } from './metrics.js';
import { SpikeTrain } from './particles.js';

class App {
  constructor() {
    this.simulation = null;
    this.dashboard = new MetricsDashboard();
    this.spikeTrain = null;
    this.isRunning = false;
    this.animFrameId = null;
  }

  init() {
    // Get canvases
    const eventCanvas = document.getElementById('event-canvas');
    const frameCanvas = document.getElementById('frame-canvas');
    const spikeCanvas = document.getElementById('spike-canvas');

    if (!eventCanvas || !frameCanvas) {
      console.error('Canvas elements not found');
      return;
    }

    // Initialize simulation
    this.simulation = new Simulation(eventCanvas, frameCanvas);

    // Initialize spike train
    if (spikeCanvas) {
      spikeCanvas.width = spikeCanvas.parentElement.offsetWidth;
      spikeCanvas.height = 40;
      this.spikeTrain = new SpikeTrain(spikeCanvas);
    }

    // Initialize dashboard
    this.dashboard.init();

    // Bind controls
    this.bindControls();

    // Handle resize
    window.addEventListener('resize', () => this.handleResize());

    // Auto-start
    setTimeout(() => {
      this.toggleSimulation();
    }, 500);

    // Start animation loop
    this.loop();
  }

  bindControls() {
    // Start/Pause button
    const startBtn = document.getElementById('btn-start');
    if (startBtn) {
      startBtn.addEventListener('click', () => this.toggleSimulation());
    }

    // Reset button
    const resetBtn = document.getElementById('btn-reset');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => this.resetSimulation());
    }

    // Speed slider
    const speedSlider = document.getElementById('slider-speed');
    const speedVal = document.getElementById('speed-value');
    if (speedSlider) {
      speedSlider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value);
        this.simulation.setSpeed(val);
        if (speedVal) speedVal.textContent = val;
      });
    }

    // Obstacle density slider
    const densitySlider = document.getElementById('slider-density');
    const densityVal = document.getElementById('density-value');
    if (densitySlider) {
      densitySlider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value);
        this.simulation.setObstacleDensity(val);
        if (densityVal) densityVal.textContent = val;
      });
    }
  }

  toggleSimulation() {
    const btn = document.getElementById('btn-start');
    if (this.isRunning) {
      this.simulation.pause();
      this.isRunning = false;
      if (btn) {
        btn.textContent = '▶ Start';
        btn.classList.remove('active');
      }
      this.updateStatusIndicator('paused');
    } else {
      this.simulation.start();
      this.isRunning = true;
      if (btn) {
        btn.textContent = '⏸ Pause';
        btn.classList.add('active');
      }
      this.updateStatusIndicator('running');
    }
  }

  resetSimulation() {
    const wasRunning = this.isRunning;
    this.simulation.reset();
    this.isRunning = wasRunning;

    if (wasRunning) {
      this.updateStatusIndicator('running');
    } else {
      this.updateStatusIndicator('idle');
    }
  }

  updateStatusIndicator(state) {
    const dot = document.getElementById('status-dot');
    const text = document.getElementById('status-text');

    if (dot) {
      dot.className = 'status-dot';
      if (state === 'running') {
        dot.classList.add('running');
      } else if (state === 'paused') {
        dot.classList.add('paused');
      } else {
        dot.classList.add('idle');
      }
    }

    if (text) {
      text.textContent = state === 'running' ? 'SIMULATION ACTIVE'
        : state === 'paused' ? 'PAUSED'
        : 'IDLE';
    }
  }

  handleResize() {
    if (this.simulation) {
      this.simulation.resize();
    }
    if (this.spikeTrain) {
      const spikeCanvas = document.getElementById('spike-canvas');
      if (spikeCanvas) {
        spikeCanvas.width = spikeCanvas.parentElement.offsetWidth;
      }
    }
  }

  loop() {
    this.animFrameId = requestAnimationFrame(() => this.loop());

    if (this.isRunning && this.simulation) {
      // Update simulation
      this.simulation.update();

      // Render both camera views
      this.simulation.render();

      // Get metrics
      const metrics = this.simulation.getMetrics();
      const droneState = this.simulation.getDroneState();

      // Update dashboard
      this.dashboard.update(metrics, droneState);

      // Update spike train
      if (this.spikeTrain) {
        const normalizedEvents = Math.min(1, metrics.eventProcessed / (metrics.pixelsProcessed * 0.3 || 1));
        this.spikeTrain.addSpike(normalizedEvents);
        this.spikeTrain.draw();
      }
    }
  }
}

// Boot
document.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.init();
});
