/* ========================================
   NeuroNex - Obstacle System
   Procedural obstacle generation & management
   ======================================== */

export class ObstacleSystem {
  constructor() {
    this.obstacles = [];
    this.spawnTimer = 0;
    this.spawnInterval = 60; // frames between spawns
    this.difficulty = 1;
    this.totalSpawned = 0;
  }

  setDensity(density) {
    // density 1-10, maps to spawn interval 90-15
    this.spawnInterval = Math.max(15, 90 - density * 8);
  }

  setDifficulty(d) {
    this.difficulty = d;
  }

  update(speed, canvasWidth, canvasHeight) {
    this.spawnTimer++;

    if (this.spawnTimer >= this.spawnInterval) {
      this.spawnTimer = 0;
      this.spawnObstacle(canvasWidth, canvasHeight);
    }

    // Update obstacle positions
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];

      // Move towards camera (increase z-position to simulate approach)
      obs.z -= speed * 0.01;

      // Move laterally if obstacle is moving
      if (obs.moving) {
        obs.x += obs.vx;
        if (obs.x < obs.boundLeft || obs.x > obs.boundRight) {
          obs.vx *= -1;
        }
      }

      // Remove obstacles that passed the camera
      if (obs.z <= 0) {
        this.obstacles.splice(i, 1);
      }
    }
  }

  spawnObstacle(canvasWidth, canvasHeight) {
    const types = ['building', 'drone', 'bird', 'pillar', 'beam'];
    const type = types[Math.floor(Math.random() * types.length)];

    const margin = 80;
    const x = margin + Math.random() * (canvasWidth - margin * 2);
    const y = margin + Math.random() * (canvasHeight - margin * 2);

    let obs = {
      id: this.totalSpawned++,
      type,
      x, y,
      z: 15 + Math.random() * 5, // spawn far away
      width: 0,
      height: 0,
      color: '',
      moving: false,
      vx: 0,
      boundLeft: margin,
      boundRight: canvasWidth - margin,
      detected: false
    };

    switch (type) {
      case 'building':
        obs.width = 40 + Math.random() * 40;
        obs.height = 60 + Math.random() * 80;
        obs.color = '#1a2a3a';
        obs.borderColor = '#2a4a6a';
        break;
      case 'drone':
        obs.width = 25 + Math.random() * 15;
        obs.height = 25 + Math.random() * 15;
        obs.color = '#2a1a1a';
        obs.borderColor = '#ff3366';
        obs.moving = Math.random() > 0.3;
        obs.vx = (Math.random() - 0.5) * 1.5 * this.difficulty;
        break;
      case 'bird':
        obs.width = 15 + Math.random() * 10;
        obs.height = 8 + Math.random() * 6;
        obs.color = '#1a1a2a';
        obs.borderColor = '#ffaa00';
        obs.moving = true;
        obs.vx = (Math.random() - 0.5) * 2;
        break;
      case 'pillar':
        obs.width = 20 + Math.random() * 15;
        obs.height = 120 + Math.random() * 80;
        obs.y = canvasHeight / 2;
        obs.color = '#1a2a2a';
        obs.borderColor = '#00cc88';
        break;
      case 'beam':
        obs.width = 100 + Math.random() * 80;
        obs.height = 12 + Math.random() * 8;
        obs.color = '#2a2a1a';
        obs.borderColor = '#ffaa00';
        break;
    }

    this.obstacles.push(obs);
  }

  getProjected(obs, canvasWidth, canvasHeight) {
    // Perspective projection
    if (obs.z <= 0.1) return null;
    const scale = 4 / obs.z;
    const cx = canvasWidth / 2;
    const cy = canvasHeight / 2;

    return {
      x: cx + (obs.x - cx) * scale,
      y: cy + (obs.y - cy) * scale,
      width: obs.width * scale,
      height: obs.height * scale,
      scale,
      depth: obs.z
    };
  }

  draw(ctx, canvasWidth, canvasHeight) {
    // Sort by depth (far first)
    const sorted = [...this.obstacles].sort((a, b) => b.z - a.z);

    for (const obs of sorted) {
      const proj = this.getProjected(obs, canvasWidth, canvasHeight);
      if (!proj || proj.scale < 0.05) continue;

      const alpha = Math.min(1, proj.scale * 0.8);

      ctx.save();

      // Draw obstacle body
      ctx.globalAlpha = alpha;

      if (obs.type === 'building') {
        this.drawBuilding(ctx, proj, obs, alpha);
      } else if (obs.type === 'drone') {
        this.drawDrone(ctx, proj, obs, alpha);
      } else if (obs.type === 'bird') {
        this.drawBird(ctx, proj, obs, alpha);
      } else if (obs.type === 'pillar') {
        this.drawPillar(ctx, proj, obs, alpha);
      } else {
        this.drawBeam(ctx, proj, obs, alpha);
      }

      // Detection glow
      if (obs.detected && obs.z < 8) {
        ctx.globalAlpha = alpha * 0.3;
        ctx.strokeStyle = '#ff3366';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(
          proj.x - proj.width / 2 - 8,
          proj.y - proj.height / 2 - 8,
          proj.width + 16,
          proj.height + 16
        );
        ctx.setLineDash([]);
      }

      ctx.restore();
    }
  }

  drawBuilding(ctx, proj, obs, alpha) {
    const x = proj.x - proj.width / 2;
    const y = proj.y - proj.height / 2;

    // Body
    ctx.fillStyle = obs.color;
    ctx.fillRect(x, y, proj.width, proj.height);

    // Border
    ctx.strokeStyle = obs.borderColor;
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, proj.width, proj.height);

    // Windows
    ctx.fillStyle = `rgba(0, 240, 255, ${alpha * 0.15})`;
    const winSize = Math.max(3, proj.width * 0.15);
    const gap = winSize * 1.8;
    for (let wy = y + gap; wy < y + proj.height - gap; wy += gap) {
      for (let wx = x + gap; wx < x + proj.width - gap; wx += gap) {
        ctx.fillRect(wx, wy, winSize * 0.8, winSize * 0.6);
      }
    }
  }

  drawDrone(ctx, proj, obs, alpha) {
    const cx = proj.x;
    const cy = proj.y;
    const r = proj.width / 2;

    // Body
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = obs.color;
    ctx.fill();
    ctx.strokeStyle = obs.borderColor;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Propeller lines
    ctx.strokeStyle = `rgba(255, 51, 102, ${alpha * 0.5})`;
    ctx.lineWidth = 1;
    for (let a = 0; a < 4; a++) {
      const angle = (a * Math.PI) / 2 + performance.now() * 0.005;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(angle) * r * 1.3, cy + Math.sin(angle) * r * 1.3);
      ctx.stroke();
    }

    // Center dot
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.2, 0, Math.PI * 2);
    ctx.fillStyle = obs.borderColor;
    ctx.fill();
  }

  drawBird(ctx, proj, obs, alpha) {
    const cx = proj.x;
    const cy = proj.y;
    const wingSpan = proj.width;
    const t = performance.now() * 0.008;
    const wingFlap = Math.sin(t) * wingSpan * 0.3;

    ctx.strokeStyle = obs.borderColor;
    ctx.lineWidth = Math.max(1, proj.scale);
    ctx.lineCap = 'round';

    // Wings
    ctx.beginPath();
    ctx.moveTo(cx - wingSpan / 2, cy + wingFlap);
    ctx.quadraticCurveTo(cx, cy - wingFlap * 0.5, cx + wingSpan / 2, cy + wingFlap);
    ctx.stroke();
  }

  drawPillar(ctx, proj, obs, alpha) {
    const x = proj.x - proj.width / 2;
    const y = proj.y - proj.height / 2;

    ctx.fillStyle = obs.color;
    ctx.fillRect(x, y, proj.width, proj.height);

    // Stripes
    ctx.fillStyle = `rgba(0, 204, 136, ${alpha * 0.2})`;
    const stripeH = Math.max(4, proj.height * 0.05);
    for (let sy = y; sy < y + proj.height; sy += stripeH * 3) {
      ctx.fillRect(x, sy, proj.width, stripeH);
    }

    ctx.strokeStyle = obs.borderColor;
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, proj.width, proj.height);
  }

  drawBeam(ctx, proj, obs, alpha) {
    const x = proj.x - proj.width / 2;
    const y = proj.y - proj.height / 2;

    ctx.fillStyle = obs.color;
    ctx.fillRect(x, y, proj.width, proj.height);

    ctx.strokeStyle = obs.borderColor;
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, proj.width, proj.height);

    // Hazard stripes
    ctx.fillStyle = `rgba(255, 170, 0, ${alpha * 0.15})`;
    const stripeW = Math.max(4, proj.width * 0.05);
    for (let sx = x; sx < x + proj.width; sx += stripeW * 2) {
      ctx.fillRect(sx, y, stripeW, proj.height);
    }
  }

  getActiveObstacles() {
    return this.obstacles;
  }

  reset() {
    this.obstacles = [];
    this.spawnTimer = 0;
    this.totalSpawned = 0;
  }
}
