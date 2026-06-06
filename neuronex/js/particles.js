/* ========================================
   NeuroNex - Particle Effects
   Star field, thrust, sparks, spikes
   ======================================== */

export class ParticleSystem {
  constructor() {
    this.stars = [];
    this.thrustParticles = [];
    this.sparks = [];
    this.initStars(200);
  }

  initStars(count) {
    for (let i = 0; i < count; i++) {
      this.stars.push({
        x: Math.random(),
        y: Math.random(),
        z: Math.random() * 3 + 0.5,
        brightness: Math.random() * 0.5 + 0.3
      });
    }
  }

  updateAndDrawStars(ctx, w, h, speed) {
    ctx.save();
    for (const star of this.stars) {
      star.y += (speed * 0.0002) / star.z;
      if (star.y > 1) {
        star.y = 0;
        star.x = Math.random();
        star.z = Math.random() * 3 + 0.5;
      }

      const sx = star.x * w;
      const sy = star.y * h;
      const size = (1 / star.z) * 1.5;
      const alpha = star.brightness / star.z;

      ctx.beginPath();
      ctx.arc(sx, sy, size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0, 240, 255, ${alpha * 0.4})`;
      ctx.fill();
    }
    ctx.restore();
  }

  addThrust(x, y, angle) {
    for (let i = 0; i < 3; i++) {
      this.thrustParticles.push({
        x: x,
        y: y,
        vx: Math.cos(angle + Math.PI) * (Math.random() * 2 + 1) + (Math.random() - 0.5) * 0.5,
        vy: Math.sin(angle + Math.PI) * (Math.random() * 2 + 1) + (Math.random() - 0.5) * 0.5,
        life: 1,
        decay: Math.random() * 0.03 + 0.03,
        size: Math.random() * 3 + 1
      });
    }
  }

  addSparks(x, y, count = 15) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 4 + 2;
      this.sparks.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        decay: Math.random() * 0.04 + 0.03,
        size: Math.random() * 2 + 0.5,
        color: Math.random() > 0.5 ? 'cyan' : 'danger'
      });
    }
  }

  updateAndDrawThrust(ctx) {
    for (let i = this.thrustParticles.length - 1; i >= 0; i--) {
      const p = this.thrustParticles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= p.decay;

      if (p.life <= 0) {
        this.thrustParticles.splice(i, 1);
        continue;
      }

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * p.life);
      g.addColorStop(0, `rgba(0, 240, 255, ${p.life * 0.8})`);
      g.addColorStop(0.5, `rgba(57, 255, 20, ${p.life * 0.4})`);
      g.addColorStop(1, `rgba(0, 240, 255, 0)`);
      ctx.fillStyle = g;
      ctx.fill();
    }
  }

  updateAndDrawSparks(ctx) {
    for (let i = this.sparks.length - 1; i >= 0; i--) {
      const s = this.sparks[i];
      s.x += s.vx;
      s.y += s.vy;
      s.vx *= 0.96;
      s.vy *= 0.96;
      s.life -= s.decay;

      if (s.life <= 0) {
        this.sparks.splice(i, 1);
        continue;
      }

      const color = s.color === 'cyan'
        ? `rgba(0, 240, 255, ${s.life})`
        : `rgba(255, 51, 102, ${s.life})`;

      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size * s.life, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    }
  }

  draw(ctx, w, h, speed) {
    this.updateAndDrawStars(ctx, w, h, speed);
    this.updateAndDrawThrust(ctx);
    this.updateAndDrawSparks(ctx);
  }
}

/* Spike Train Visualizer */
export class SpikeTrain {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.spikes = [];
    this.maxSpikes = 200;
  }

  addSpike(intensity) {
    this.spikes.push(intensity);
    if (this.spikes.length > this.maxSpikes) {
      this.spikes.shift();
    }
  }

  draw() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#050810';
    ctx.fillRect(0, 0, w, h);

    if (this.spikes.length < 2) return;

    const barWidth = w / this.maxSpikes;

    for (let i = 0; i < this.spikes.length; i++) {
      const val = this.spikes[i];
      const barHeight = val * h * 0.8;
      const x = i * barWidth;
      const y = h - barHeight;

      const alpha = 0.3 + val * 0.7;
      ctx.fillStyle = `rgba(0, 240, 255, ${alpha})`;
      ctx.fillRect(x, y, Math.max(barWidth - 1, 1), barHeight);
    }

    // Baseline
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(0, h * 0.5);
    ctx.lineTo(w, h * 0.5);
    ctx.stroke();
    ctx.setLineDash([]);
  }
}
