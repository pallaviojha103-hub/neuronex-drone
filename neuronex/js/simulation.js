/* ========================================
   NeuroNex - Drone Simulation Engine
   Pseudo-3D forward flight through obstacle field
   ======================================== */

import { ParticleSystem } from './particles.js';
import { ObstacleSystem } from './obstacles.js';
import { EventCamera } from './event-camera.js';
import { FrameCamera } from './frame-camera.js';
import { CollisionAvoidance } from './collision.js';

export class Simulation {
  constructor(eventCanvas, frameCanvas) {
    this.eventCanvas = eventCanvas;
    this.frameCanvas = frameCanvas;
    this.eventCtx = eventCanvas.getContext('2d');
    this.frameCtx = frameCanvas.getContext('2d');

    this.resize();

    // Systems
    this.particles = new ParticleSystem();
    this.obstacles = new ObstacleSystem();
    this.eventCamera = new EventCamera(this.w, this.h);
    this.frameCamera = new FrameCamera(this.w, this.h);
    this.collisionAvoidance = new CollisionAvoidance();

    // Drone state
    this.drone = {
      x: this.w / 2,
      y: this.h / 2,
      targetX: this.w / 2,
      targetY: this.h / 2,
      speed: 5,
      heading: 0,
      altitude: 120,
      threatLevel: 0
    };

    // Simulation state
    this.running = false;
    this.speed = 5;
    this.time = 0;
    this.frameCount = 0;

    // Metrics
    this.metrics = {
      eventProcessed: 0,
      pixelsProcessed: 0,
      eventLatency: 0.1,
      frameLatency: 33.3,
      eventCollisions: 0,
      frameCollisions: 0,
      eventAvoided: 0,
      frameAvoided: 0,
      eventEnergy: 0,
      frameEnergy: 0,
      eventsPerSecond: 0,
      fps: 60,
      totalEvents: 0,
      totalFramePixels: 0
    };

    this.lastFpsTime = performance.now();
    this.fpsFrames = 0;

    // Offscreen buffer for scene rendering (used by both cameras)
    this.sceneCanvas = document.createElement('canvas');
    this.sceneCanvas.width = this.w;
    this.sceneCanvas.height = this.h;
    this.sceneCtx = this.sceneCanvas.getContext('2d', { willReadFrequently: true });
  }

  resize() {
    const rect = this.eventCanvas.parentElement.getBoundingClientRect();
    this.w = Math.floor(rect.width);
    this.h = 380;

    this.eventCanvas.width = this.w;
    this.eventCanvas.height = this.h;
    this.frameCanvas.width = this.w;
    this.frameCanvas.height = this.h;

    if (this.sceneCanvas) {
      this.sceneCanvas.width = this.w;
      this.sceneCanvas.height = this.h;
    }

    if (this.eventCamera) this.eventCamera.resize(this.w, this.h);
    if (this.frameCamera) this.frameCamera.resize(this.w, this.h);
  }

  setSpeed(s) {
    this.speed = s;
    this.drone.speed = s;
  }

  setObstacleDensity(d) {
    this.obstacles.setDensity(d);
  }

  start() {
    this.running = true;
  }

  pause() {
    this.running = false;
  }

  reset() {
    this.obstacles.reset();
    this.eventCamera.reset();
    this.frameCamera.reset();
    this.collisionAvoidance.reset();
    this.drone.x = this.w / 2;
    this.drone.y = this.h / 2;
    this.drone.targetX = this.w / 2;
    this.drone.targetY = this.h / 2;
    this.drone.threatLevel = 0;
    this.time = 0;
    this.frameCount = 0;
    this.metrics = {
      eventProcessed: 0,
      pixelsProcessed: 0,
      eventLatency: 0.1,
      frameLatency: 33.3,
      eventCollisions: 0,
      frameCollisions: 0,
      eventAvoided: 0,
      frameAvoided: 0,
      eventEnergy: 0,
      frameEnergy: 0,
      eventsPerSecond: 0,
      fps: 60,
      totalEvents: 0,
      totalFramePixels: 0
    };
  }

  renderScene(ctx) {
    // Clear
    ctx.fillStyle = '#050810';
    ctx.fillRect(0, 0, this.w, this.h);

    // Stars
    this.particles.updateAndDrawStars(ctx, this.w, this.h, this.speed);

    // Ground grid (perspective)
    this.drawGroundGrid(ctx);

    // Obstacles
    this.obstacles.draw(ctx, this.w, this.h);

    // Drone
    this.drawDrone(ctx);

    // Thrust particles
    this.particles.updateAndDrawThrust(ctx);
    this.particles.updateAndDrawSparks(ctx);
  }

  drawGroundGrid(ctx) {
    ctx.save();
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.06)';
    ctx.lineWidth = 1;

    const horizon = this.h * 0.35;
    const cx = this.w / 2;

    // Horizontal lines (receding)
    for (let i = 0; i < 12; i++) {
      const t = i / 12;
      const y = horizon + (this.h - horizon) * Math.pow(t, 1.5);
      const spread = 0.3 + t * 0.7;

      ctx.globalAlpha = t * 0.5;
      ctx.beginPath();
      ctx.moveTo(cx - cx * spread * 2, y);
      ctx.lineTo(cx + cx * spread * 2, y);
      ctx.stroke();
    }

    // Vertical lines (converging)
    for (let i = -6; i <= 6; i++) {
      const x = cx + i * 50;
      ctx.globalAlpha = 0.15;
      ctx.beginPath();
      ctx.moveTo(cx, horizon);
      ctx.lineTo(x, this.h);
      ctx.stroke();
    }

    ctx.restore();
  }

  drawDrone(ctx) {
    const dx = this.drone.x;
    const dy = this.drone.y;

    ctx.save();
    ctx.translate(dx, dy);

    // Drone glow
    const glowGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, 30);
    glowGrad.addColorStop(0, 'rgba(0, 240, 255, 0.15)');
    glowGrad.addColorStop(1, 'rgba(0, 240, 255, 0)');
    ctx.fillStyle = glowGrad;
    ctx.fillRect(-30, -30, 60, 60);

    // Body
    ctx.fillStyle = '#0c1520';
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 1.5;

    // Main body hexagon-ish
    ctx.beginPath();
    ctx.moveTo(0, -12);
    ctx.lineTo(10, -6);
    ctx.lineTo(10, 6);
    ctx.lineTo(0, 12);
    ctx.lineTo(-10, 6);
    ctx.lineTo(-10, -6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Arms
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.6)';
    ctx.lineWidth = 2;
    const armLen = 18;
    const arms = [
      [-armLen, -armLen], [armLen, -armLen],
      [-armLen, armLen], [armLen, armLen]
    ];

    for (const [ax, ay] of arms) {
      ctx.beginPath();
      ctx.moveTo(ax * 0.3, ay * 0.3);
      ctx.lineTo(ax, ay);
      ctx.stroke();

      // Propeller circle
      ctx.beginPath();
      ctx.arc(ax, ay, 6, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(0, 240, 255, ${0.3 + Math.sin(this.time * 0.5) * 0.2})`;
      ctx.stroke();

      // Spinning prop
      const propAngle = this.time * 0.3;
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(ax, ay, 6, propAngle, propAngle + Math.PI * 0.5);
      ctx.stroke();
    }

    // Center LED
    ctx.beginPath();
    ctx.arc(0, 0, 3, 0, Math.PI * 2);
    ctx.fillStyle = this.drone.threatLevel > 0.6 ? '#ff3366' : '#39ff14';
    ctx.fill();
    ctx.shadowBlur = 8;
    ctx.shadowColor = ctx.fillStyle;
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.restore();

    // Add thrust
    if (this.running) {
      this.particles.addThrust(dx, dy + 14, Math.PI / 2);
    }
  }

  update() {
    if (!this.running) return;

    this.time++;
    this.frameCount++;

    // Update obstacles
    this.obstacles.update(this.speed, this.w, this.h);

    // Collision avoidance - Event-based (fast)
    const eventAvoidance = this.collisionAvoidance.processEventBased(
      this.drone, this.obstacles.getActiveObstacles(), this.w, this.h
    );

    // Apply avoidance steering
    this.drone.targetX += eventAvoidance.steerX * 2;
    this.drone.targetY += eventAvoidance.steerY * 2;

    // Boundary clamp
    const margin = 50;
    this.drone.targetX = Math.max(margin, Math.min(this.w - margin, this.drone.targetX));
    this.drone.targetY = Math.max(margin, Math.min(this.h - margin, this.drone.targetY));

    // Smooth follow
    this.drone.x += (this.drone.targetX - this.drone.x) * 0.08;
    this.drone.y += (this.drone.targetY - this.drone.y) * 0.08;

    // Gentle auto-movement (meandering)
    this.drone.targetX += Math.sin(this.time * 0.015) * 0.5;
    this.drone.targetY += Math.cos(this.time * 0.012) * 0.3;

    // Threat level
    this.drone.threatLevel = eventAvoidance.threatLevel;

    // Check collisions
    const collisionResult = this.collisionAvoidance.checkCollisions(
      this.drone, this.obstacles.getActiveObstacles(), this.w, this.h
    );

    if (collisionResult.eventCollision) {
      this.metrics.eventCollisions++;
      this.particles.addSparks(this.drone.x, this.drone.y);
    }
    if (collisionResult.frameCollision) {
      this.metrics.frameCollisions++;
    }

    this.metrics.eventAvoided = collisionResult.eventAvoided;
    this.metrics.frameAvoided = collisionResult.frameAvoided;

    // Update altitude display (simulated)
    this.drone.altitude = 120 + Math.sin(this.time * 0.01) * 10;
    this.drone.heading = (this.drone.heading + this.speed * 0.5) % 360;

    // Update FPS metric
    this.fpsFrames++;
    const now = performance.now();
    if (now - this.lastFpsTime >= 1000) {
      this.metrics.fps = this.fpsFrames;
      this.fpsFrames = 0;
      this.lastFpsTime = now;
    }
  }

  render() {
    // Render the 3D scene to offscreen buffer
    this.renderScene(this.sceneCtx);

    // Get scene image data for camera processing
    const sceneData = this.sceneCtx.getImageData(0, 0, this.w, this.h);

    // EVENT-BASED CAMERA
    const eventResult = this.eventCamera.process(sceneData);
    this.eventCtx.putImageData(eventResult.outputImage, 0, 0);

    // Draw drone overlay on event view
    this.drawDroneOverlay(this.eventCtx, 'cyan');

    // Update event metrics
    this.metrics.eventProcessed = eventResult.eventCount;
    this.metrics.totalEvents += eventResult.eventCount;
    this.metrics.eventsPerSecond = eventResult.eventCount * 60;
    this.metrics.eventLatency = Math.max(0.05, 0.1 + Math.random() * 0.05);
    this.metrics.eventEnergy = eventResult.eventCount;

    // FRAME-BASED CAMERA
    const frameResult = this.frameCamera.process(sceneData);
    this.frameCtx.putImageData(frameResult.outputImage, 0, 0);

    // Draw drone overlay on frame view
    this.drawDroneOverlay(this.frameCtx, 'amber');

    // Update frame metrics
    this.metrics.pixelsProcessed = frameResult.totalPixels;
    this.metrics.totalFramePixels += frameResult.totalPixels;
    this.metrics.frameLatency = 16.67 + Math.random() * 8;
    this.metrics.frameEnergy = frameResult.totalPixels;
  }

  drawDroneOverlay(ctx, mode) {
    const dx = this.drone.x;
    const dy = this.drone.y;
    const color = mode === 'cyan' ? '#00f0ff' : '#ffaa00';

    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.6;

    // Crosshair
    const size = 20;
    ctx.beginPath();
    ctx.moveTo(dx - size, dy);
    ctx.lineTo(dx - size / 3, dy);
    ctx.moveTo(dx + size / 3, dy);
    ctx.lineTo(dx + size, dy);
    ctx.moveTo(dx, dy - size);
    ctx.lineTo(dx, dy - size / 3);
    ctx.moveTo(dx, dy + size / 3);
    ctx.lineTo(dx, dy + size);
    ctx.stroke();

    // Circle
    ctx.beginPath();
    ctx.arc(dx, dy, size * 0.7, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }

  getMetrics() {
    return { ...this.metrics };
  }

  getDroneState() {
    return { ...this.drone };
  }
}
