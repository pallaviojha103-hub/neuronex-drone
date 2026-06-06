# neuronex-drone
Drones processing traditional video frames frame-by-frame drain batteries instantly and create latency that causes crashes.Build a simulated drone navigation system that uses an Event-Based Vision pipeline. Instead of processing full images, the system only processes pixels that change (motion).  
# AeroSpike: Event-Driven Drone Collision Avoidance 🛸

**AeroSpike** is an ultra-low-power, bio-inspired collision avoidance system designed for autonomous drones. 

##  The Problem
Traditional drone navigation relies on heavy computer vision models that process entire video frames sequentially. This introduces a dangerous processing delay (latency) and rapidly drains the drone's battery because the onboard GPU constantly wastes energy analyzing static, unchanging backgrounds like a clear sky or a blank wall.

## Our Neuromorphic Solution
Our project solves this bottleneck by mimicking the human retina through an event-driven approach. Instead of capturing full image frames, the system only registers and transmits data for pixels that change in light intensity (motion). 

These asynchronous data packets, or "spikes," are fed into a neuromorphic Spiking Neural Network (SNN) built with **Leaky Integrate-and-Fire (LIF)** neurons:
* **Zero Motion = Zero Power:** When the flight path is clear and nothing changes relative to the drone, the network remains completely dormant and consumes virtually zero energy.
* **Sub-Millisecond Reactivity:** The exact millisecond an obstacle appears, the sudden motion triggers instant neural firing, allowing the drone to execute immediate evasion maneuvers safely on the edge.

##  Tech Stack
* **SNN Architecture:** `SpikingJelly` (PyTorch-based framework)
* **Event Simulation:** `Tonic` (to convert standard video into asynchronous event streams)
* **User Interface:** `Streamlit` (live dashboard showcasing real-time neural spikes and collision alerts)
