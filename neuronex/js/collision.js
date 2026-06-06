/* ========================================
   NeuroNex - Collision Avoidance
   Event-driven vs Frame-based avoidance
   ======================================== */

export class CollisionAvoidance {
  constructor() {
    this.eventReactionTime = 0; // microseconds (instant)
    this.frameReactionTime = 33; // milliseconds (one frame delay)
    this.avoidanceRadius = 80;
    this.dangerRadius = 40;
    this.eventAvoidedTotal = 0;
    this.frameAvoidedTotal = 0;
    this.frameDroneX = 0;
    this.frameDroneY = 0;
    this.initialized = false;
  }

  processEventBased(drone, obstacles, canvasW, canvasH) {
    let steerX = 0;
    let steerY = 0;
    let maxThreat = 0;

    for (const obs of obstacles) {
      if (obs.z <= 0.1 || obs.z > 8) continue;

      // Project obstacle
      const scale = 4 / obs.z;
      const cx = canvasW / 2;
      const cy = canvasH / 2;
      const projX = cx + (obs.x - cx) * scale;
      const projY = cy + (obs.y - cy) * scale;
      const projW = obs.width * scale;
      const projH = obs.height * scale;

      // Distance from drone to projected obstacle center
      const dx = drone.x - projX;
      const dy = drone.y - projY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const effectiveRadius = Math.max(projW, projH) / 2 + this.avoidanceRadius;

      if (dist < effectiveRadius) {
        // Threat detected!
        obs.detected = true;
        const threat = 1 - (dist / effectiveRadius);
        maxThreat = Math.max(maxThreat, threat);

        // Repulsion vector (stronger when closer)
        const repulsionStrength = Math.pow(threat, 2) * 6;
        if (dist > 1) {
          steerX += (dx / dist) * repulsionStrength;
          steerY += (dy / dist) * repulsionStrength;
        } else {
          // Very close — strong random dodge
          steerX += (Math.random() - 0.5) * 10;
          steerY += (Math.random() - 0.5) * 10;
        }
      } else {
        obs.detected = false;
      }
    }

    return {
      steerX,
      steerY,
      threatLevel: maxThreat
    };
  }

  checkCollisions(drone, obstacles, canvasW, canvasH) {
    let eventCollision = false;
    let frameCollision = false;

    // Initialize frame drone position
    if (!this.initialized) {
      this.frameDroneX = drone.x;
      this.frameDroneY = drone.y;
      this.initialized = true;
    }

    // Frame-based drone follows the event drone but with delay
    // This simulates the slower reaction of frame-based processing
    this.frameDroneX += (drone.x - this.frameDroneX) * 0.02; // Much slower following
    this.frameDroneY += (drone.y - this.frameDroneY) * 0.02;

    for (const obs of obstacles) {
      if (obs.z > 3 || obs.z <= 0.1) continue;

      const scale = 4 / obs.z;
      const cx = canvasW / 2;
      const cy = canvasH / 2;
      const projX = cx + (obs.x - cx) * scale;
      const projY = cy + (obs.y - cy) * scale;
      const projW = obs.width * scale;
      const projH = obs.height * scale;

      // Check event-drone collision (tight box)
      const eventDist = Math.sqrt(
        Math.pow(drone.x - projX, 2) + Math.pow(drone.y - projY, 2)
      );
      const collisionRadius = Math.max(projW, projH) / 2 + 15;

      if (eventDist < collisionRadius) {
        // Near miss for event (usually avoids)
        if (eventDist < collisionRadius * 0.3) {
          eventCollision = true;
        } else {
          this.eventAvoidedTotal++;
        }
      }

      // Check frame-drone collision (uses delayed position)
      const frameDist = Math.sqrt(
        Math.pow(this.frameDroneX - projX, 2) + Math.pow(this.frameDroneY - projY, 2)
      );

      if (frameDist < collisionRadius) {
        if (frameDist < collisionRadius * 0.6) {
          frameCollision = true;
        } else {
          this.frameAvoidedTotal++;
        }
      }
    }

    return {
      eventCollision,
      frameCollision,
      eventAvoided: this.eventAvoidedTotal,
      frameAvoided: this.frameAvoidedTotal
    };
  }

  reset() {
    this.eventAvoidedTotal = 0;
    this.frameAvoidedTotal = 0;
    this.initialized = false;
  }
}
