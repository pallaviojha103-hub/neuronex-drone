/* ========================================
   NeuroNex - Metrics Dashboard
   Energy, latency, and performance tracking
   ======================================== */

export class MetricsDashboard {
  constructor() {
    this.elements = {};
    this.smoothedMetrics = {
      eventEnergy: 0,
      frameEnergy: 0,
      eventLatency: 0.1,
      frameLatency: 33.3,
      energySaving: 90,
      speedup: 300
    };
    this.history = {
      eventEnergy: [],
      frameEnergy: [],
      energySavings: []
    };
    this.maxHistory = 60;
  }

  init() {
    // Cache DOM elements
    const ids = [
      'hud-speed', 'hud-altitude', 'hud-heading', 'hud-threat',
      'threat-fill',
      'stat-event-count', 'stat-event-latency',
      'stat-frame-pixels', 'stat-frame-latency',
      'metric-energy-value', 'metric-energy-event-bar', 'metric-energy-frame-bar',
      'metric-energy-event-val', 'metric-energy-frame-val',
      'metric-latency-value', 'metric-latency-event-bar', 'metric-latency-frame-bar',
      'metric-latency-event-val', 'metric-latency-frame-val',
      'metric-reactions-value', 'metric-reactions-event-bar', 'metric-reactions-frame-bar',
      'metric-reactions-event-val', 'metric-reactions-frame-val',
      'metric-efficiency-value', 'metric-efficiency-bar',
      'table-data-event', 'table-data-frame',
      'table-latency-event', 'table-latency-frame',
      'table-energy-event', 'table-energy-frame',
      'table-collisions-event', 'table-collisions-frame',
      'table-avoided-event', 'table-avoided-frame',
      'table-reaction-event', 'table-reaction-frame'
    ];

    for (const id of ids) {
      this.elements[id] = document.getElementById(id);
    }
  }

  update(metrics, droneState) {
    // Smooth metrics
    const alpha = 0.1;
    this.smoothedMetrics.eventEnergy = this.lerp(this.smoothedMetrics.eventEnergy, metrics.eventProcessed, alpha);
    this.smoothedMetrics.frameEnergy = this.lerp(this.smoothedMetrics.frameEnergy, metrics.pixelsProcessed, alpha);
    this.smoothedMetrics.eventLatency = this.lerp(this.smoothedMetrics.eventLatency, metrics.eventLatency, alpha);
    this.smoothedMetrics.frameLatency = this.lerp(this.smoothedMetrics.frameLatency, metrics.frameLatency, alpha);

    // Calculate savings
    const energySaving = metrics.pixelsProcessed > 0
      ? ((1 - metrics.eventProcessed / metrics.pixelsProcessed) * 100)
      : 90;
    this.smoothedMetrics.energySaving = this.lerp(this.smoothedMetrics.energySaving, energySaving, alpha);

    const speedup = this.smoothedMetrics.eventLatency > 0
      ? this.smoothedMetrics.frameLatency / this.smoothedMetrics.eventLatency
      : 300;
    this.smoothedMetrics.speedup = this.lerp(this.smoothedMetrics.speedup, speedup, alpha);

    // Update HUD
    this.setText('hud-speed', droneState.speed.toFixed(0));
    this.setText('hud-altitude', droneState.altitude.toFixed(0));
    this.setText('hud-heading', droneState.heading.toFixed(0) + '°');

    const threatPct = (droneState.threatLevel * 100).toFixed(0);
    this.setText('hud-threat', threatPct + '%');
    this.setStyle('threat-fill', 'width', threatPct + '%');

    // Threat color
    if (droneState.threatLevel > 0.6) {
      this.setStyle('threat-fill', 'background', '#ff3366');
      const hudThreat = this.elements['hud-threat'];
      if (hudThreat) hudThreat.style.color = '#ff3366';
    } else if (droneState.threatLevel > 0.3) {
      this.setStyle('threat-fill', 'background', '#ffaa00');
      const hudThreat = this.elements['hud-threat'];
      if (hudThreat) hudThreat.style.color = '#ffaa00';
    } else {
      this.setStyle('threat-fill', 'background', '#39ff14');
      const hudThreat = this.elements['hud-threat'];
      if (hudThreat) hudThreat.style.color = '#39ff14';
    }

    // Viewport stats
    this.setText('stat-event-count', this.formatNumber(metrics.eventProcessed) + ' events');
    this.setText('stat-event-latency', this.smoothedMetrics.eventLatency.toFixed(2) + 'ms');
    this.setText('stat-frame-pixels', this.formatNumber(metrics.pixelsProcessed) + ' px');
    this.setText('stat-frame-latency', this.smoothedMetrics.frameLatency.toFixed(1) + 'ms');

    // Energy card
    const savingPct = this.smoothedMetrics.energySaving.toFixed(1);
    this.setText('metric-energy-value', savingPct + '%');
    this.setStyle('metric-energy-event-bar', 'width', Math.min(100, 100 - parseFloat(savingPct)) + '%');
    this.setStyle('metric-energy-frame-bar', 'width', '100%');
    this.setText('metric-energy-event-val', this.formatNumber(Math.round(this.smoothedMetrics.eventEnergy)));
    this.setText('metric-energy-frame-val', this.formatNumber(Math.round(this.smoothedMetrics.frameEnergy)));

    // Latency card
    this.setText('metric-latency-value', this.smoothedMetrics.speedup.toFixed(0) + 'x');
    const latencyEventPct = Math.min(100, (this.smoothedMetrics.eventLatency / 40) * 100);
    const latencyFramePct = Math.min(100, (this.smoothedMetrics.frameLatency / 40) * 100);
    this.setStyle('metric-latency-event-bar', 'width', latencyEventPct + '%');
    this.setStyle('metric-latency-frame-bar', 'width', latencyFramePct + '%');
    this.setText('metric-latency-event-val', this.smoothedMetrics.eventLatency.toFixed(2) + 'ms');
    this.setText('metric-latency-frame-val', this.smoothedMetrics.frameLatency.toFixed(1) + 'ms');

    // Reactions card
    const totalReactions = metrics.eventAvoided + metrics.frameAvoided;
    const reactionRate = totalReactions > 0
      ? ((metrics.eventAvoided / Math.max(1, totalReactions)) * 100).toFixed(0)
      : '100';
    this.setText('metric-reactions-value', reactionRate + '%');
    const eventAvPct = Math.min(100, (metrics.eventAvoided / Math.max(1, metrics.eventAvoided + 1)) * 100);
    const frameAvPct = Math.min(100, (metrics.frameAvoided / Math.max(1, metrics.eventAvoided + 1)) * 100);
    this.setStyle('metric-reactions-event-bar', 'width', Math.min(100, eventAvPct) + '%');
    this.setStyle('metric-reactions-frame-bar', 'width', Math.min(100, frameAvPct) + '%');
    this.setText('metric-reactions-event-val', metrics.eventAvoided);
    this.setText('metric-reactions-frame-val', metrics.frameAvoided);

    // Efficiency card
    const efficiency = Math.min(99.5, this.smoothedMetrics.energySaving * 0.95 + Math.min(5, this.smoothedMetrics.speedup * 0.02));
    this.setText('metric-efficiency-value', efficiency.toFixed(1) + '%');
    this.setStyle('metric-efficiency-bar', 'width', efficiency + '%');

    // Comparison table
    this.setText('table-data-event', this.formatNumber(Math.round(this.smoothedMetrics.eventEnergy)) + ' events/f');
    this.setText('table-data-frame', this.formatNumber(Math.round(this.smoothedMetrics.frameEnergy)) + ' px/f');
    this.setText('table-latency-event', this.smoothedMetrics.eventLatency.toFixed(2) + ' ms');
    this.setText('table-latency-frame', this.smoothedMetrics.frameLatency.toFixed(1) + ' ms');

    const eventEnergyMw = (this.smoothedMetrics.eventEnergy * 0.001).toFixed(2);
    const frameEnergyMw = (this.smoothedMetrics.frameEnergy * 0.005).toFixed(1);
    this.setText('table-energy-event', eventEnergyMw + ' mW');
    this.setText('table-energy-frame', frameEnergyMw + ' mW');

    this.setText('table-collisions-event', metrics.eventCollisions);
    this.setText('table-collisions-frame', metrics.frameCollisions);
    this.setText('table-avoided-event', metrics.eventAvoided);
    this.setText('table-avoided-frame', metrics.frameAvoided);
    this.setText('table-reaction-event', '~0.1 ms');
    this.setText('table-reaction-frame', '~' + this.smoothedMetrics.frameLatency.toFixed(0) + ' ms');
  }

  lerp(a, b, t) {
    return a + (b - a) * t;
  }

  setText(id, value) {
    const el = this.elements[id];
    if (el) el.textContent = value;
  }

  setStyle(id, prop, value) {
    const el = this.elements[id];
    if (el) el.style[prop] = value;
  }

  formatNumber(n) {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return Math.round(n).toString();
  }
}
