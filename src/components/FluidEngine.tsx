/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { createNoise2D } from 'simplex-noise';

import { AbyssalState, RealityTheme } from '../types';

interface FluidEngineProps {
  state: AbyssalState;
  themeLevels: Record<RealityTheme, number>;
}

// GLSL Noise and Optimized Fluid Dynamics Shader
const vertexShader = `
  precision highp float;
  uniform float uTime;
  uniform float uViscosity;
  uniform float uPressure;
  uniform float uTemperature;
  uniform float uStability;
  uniform float uPipingIntegrity;
  uniform float uReservoirDensity;
  
  uniform float uThermalLevel;
  uniform float uAbyssalLevel;
  uniform float uAlgoLevel;
  uniform float uFrictionLevel;
  uniform float uQuantumLevel;

  uniform float uThermalTime;
  uniform float uAbyssalTime;
  uniform float uAlgoTime;
  uniform float uFrictionTime;
  uniform float uQuantumTime;

  attribute float aSize;
  attribute float aThreshold;
  attribute vec3 aInitialPos;
  varying vec3 vColor;
  varying float vFade;
  varying float vAge;

  // Faster pseudo-random for GPU
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v) {
    const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
    const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i  = floor(v + dot(v, C.yyy) );
    vec3 x0 = v - i + dot(i, C.xxx) ;
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min( g.xyz, l.zxy );
    vec3 i2 = max( g.xyz, l.zxy );
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute( permute( permute(
               i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
             + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
             + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
    float n_ = 0.142857142857;
    vec3  ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_ );

    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);

    vec4 b0 = vec4( x.xy, y.xy );
    vec4 b1 = vec4( x.zw, y.zw );

    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));

    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

    vec3 p0 = vec3(a0.xy,h.x);
    vec3 p1 = vec3(a0.zw,h.y);
    vec3 p2 = vec3(a1.xy,h.z);
    vec3 p3 = vec3(a1.zw,h.w);

    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;

    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );
  }

  // Fractional Brownian Motion for layered turbulence
  float fbm(vec3 p) {
    float v = 0.0;
    float a = 0.5;
    vec3 shift = vec3(100.0);
    for (int i = 0; i < 4; ++i) {
      v += a * snoise(p);
      p = p * 2.0 + shift;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vColor = color;
    vec3 pos = aInitialPos;
    float r = length(pos.xy);
    float angle = atan(pos.y, pos.x);
    
    // Clustering influence on movement
    bool isRed = vColor.r > 0.8 && vColor.g < 0.4 && vColor.b < 0.4;
    bool isBlue = vColor.b > 0.8 && vColor.g < 0.7 && vColor.r < 0.5;
    bool isGreen = vColor.g > 0.8 && vColor.r < 0.5 && vColor.b < 0.6; // More forgiving for #00E676
    bool isAmber = vColor.r > 0.8 && vColor.g > 0.6 && vColor.b < 0.4;
    bool isPurple = vColor.r > 0.6 && vColor.b > 0.8 && vColor.g < 0.5;
    
    float invVisc = 1.0 / (uViscosity + 0.1);
    
    // 1. Hydraulics: Piping Integrity & Leaks
    // Low integrity causes "leaks" (radial expansion)
    float leakStrength = (1.0 - uPipingIntegrity) * 0.4;
    float radialSpeed = 0.04 * invVisc - leakStrength; 
    
    // 2. Yield Flow: Reservoir Density
    // Dividend capital (Blue/Purple) is denser, sinks toward center faster
    float densityFactor = (isBlue || isPurple) ? (1.0 + uReservoirDensity * 0.5) : 1.0;
    float flow = uTime * radialSpeed * densityFactor;
    
    // Advanced turbulence using fBm
    float noiseCoord = uTime * 0.03;
    float turbulence = fbm(vec3(pos.xy * 0.15, noiseCoord)) * (1.2 - uViscosity);
    float localEddy = snoise(vec3(pos.xy * 0.4, noiseCoord * 2.0)) * 0.5;
    
    // Calculate radius with inward flow and turbulence
    float currentR = mod(r - flow + (turbulence + localEddy) * 0.4, 8.0);
    
    // 4. Gravitational Collapse: High pressure compresses volume
    // As pressure increases, the "effective" radius is squashed towards the center
    float compression = 1.0 - clamp(uPressure / 1200.0, 0.0, 0.7);
    currentR *= compression;
    
    // Fade out at the very center and very edge
    vFade = smoothstep(0.0, 0.5, currentR) * smoothstep(8.0, 7.0, currentR);
    
    float normalizedTemp = (uTemperature - 2.0) / 10.0;
    // Red and Amber react more to thermal pressure
    float buoyancyFactor = normalizedTemp * 0.5 * (isRed || isAmber ? 1.6 : 1.0);
    float pressureResistance = 1.0 / (1.0 + uPressure * 0.002);
    
    float risePulse = sin(uTime * 0.15 + r * 0.8) * buoyancyFactor * pressureResistance;
    
    // Vertical displacement with multi-layered noise
    float zPos = pos.z + risePulse + (turbulence * 0.6) + (localEddy * 0.2);
    
    // Optimized pulse calculation
    float pulse = sin(uTime * 0.5 + r * 0.5) * 0.02;
    float colorBoost = 1.0 + clamp(normalizedTemp * 0.05 + (turbulence + pulse) * 0.05, 0.0, 0.3);
    vColor = vColor * colorBoost;
    
    // Consolidate conditional logic using floats
    vColor += (vec3(0.0, 0.02, 0.01) * float(isGreen) + vec3(0.02, 0.0, 0.02) * float(isPurple)) * abs(pulse);
    vColor += vec3(0.05, 0.0, 0.02) * clamp(normalizedTemp * 0.1, 0.0, 0.3);
    
    // 3. Strictly Monotonic Clockwise Vortex Mechanics
    float chaos = (100.0 - uStability) / 100.0;
    
    // Rotation base is strictly positive for clockwise movement
    float rotationBase = 0.025 * invVisc; 
    // Normalized momentum ensuring all themes contribute to the same direction
    float momentum = (float(isPurple) * 0.4) + (float(isBlue) * 0.2) + (float(isGreen) * 0.1) + 1.2;
    
    // Constant suction towards the singularity
    float baseSuction = (uPressure / 1200.0) * 0.2;
    float radialDistortion = currentR * (1.0 - baseSuction);
    
    // Angular increment - we use subtraction for clockwise rotation effectively
    float angularVelocity = (12.0 * momentum) / (radialDistortion + 0.3); 
    float clockwiseStep = (uTime * rotationBase) + angularVelocity;
    
    // We subtract the clockwiseStep to ensure it flows clockwise in GL coordinates
    // We reduce the angle turbulence to avoid "shaking" or alternating motion
    float newAngle = angle - clockwiseStep + (turbulence * 0.05);
    
    // Final position calculation with static camera perspective
    vec3 finalPos = vec3(cos(newAngle) * radialDistortion, sin(newAngle) * radialDistortion, zPos);
    vec4 mvPosition = modelViewMatrix * vec4(finalPos, 1.0);
    
    gl_PointSize = aSize * (450.0 / max(-mvPosition.z, 0.5)) * vFade;
    gl_PointSize = clamp(gl_PointSize, 0.5, 30.0); // Tighter clamp for performance
    
    // Optimized level activation
    float level = uThermalLevel * float(isRed) + 
                  uAbyssalLevel * float(isBlue) + 
                  uAlgoLevel * float(isGreen) + 
                  uFrictionLevel * float(isAmber) + 
                  uQuantumLevel * float(isPurple);
    
    float startTime = uThermalTime * float(isRed) + 
                     uAbyssalTime * float(isBlue) + 
                     uAlgoTime * float(isGreen) + 
                     uFrictionTime * float(isAmber) + 
                     uQuantumTime * float(isPurple);
    
    vAge = (startTime > 0.0) ? (uTime - startTime) : 0.0;
    level = max(level, 0.05); 

    float spawnProgress = smoothstep(aThreshold * 5.0, aThreshold * 5.0 + 3.0, vAge);
    float visibility = smoothstep(aThreshold, aThreshold + 0.2, level) * spawnProgress;
    
    gl_PointSize *= (0.5 + visibility * 0.5);
    vFade *= visibility;
    
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const fragmentShader = `
  precision mediump float;
  varying vec3 vColor;
  varying float vFade;
  void main() {
    float dist = distance(gl_PointCoord, vec2(0.5));
    if (dist > 0.5) discard; // Early exit for performance
    
    float weight = 1.0 - dist * 2.0;
    float alpha = weight * weight * vFade * 0.6;
    float core = pow(weight, 8.0);
    
    gl_FragColor = vec4(vColor + vec3(core * 0.1), alpha);
  }
`;

export const FluidEngine: React.FC<FluidEngineProps> = ({ state, themeLevels }) => {
  const meshRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const timeRef = useRef(0);

  const particleCount = 10000;

  const [positions, initialPos, colors, sizes, thresholds] = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const init = new Float32Array(particleCount * 3);
    const col = new Float32Array(particleCount * 3);
    const siz = new Float32Array(particleCount);
    const thresh = new Float32Array(particleCount);
    
    const noise2D = createNoise2D();
    const red = new THREE.Color('#FF1744');
    const blue = new THREE.Color('#2979FF');
    const green = new THREE.Color('#00E676');
    const amber = new THREE.Color('#FFD600');
    const purple = new THREE.Color('#D500F9');

    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 8;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      const z = (Math.random() - 0.5) * 3.0; // Increased Z-depth spread

      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;
      
      init[i * 3] = x;
      init[i * 3 + 1] = y;
      init[i * 3 + 2] = z;

      // Realistic clustering using Multi-layered Noise
      const n1 = noise2D(x * 0.3, y * 0.3);
      const n2 = noise2D(x * 0.15 + 100, y * 0.15 + 100);
      const n3 = noise2D(x * 0.2 - 100, y * 0.2 - 100);
      
      let color = blue; // Default to stability if no high-intensity noise
      if (n1 > 0.4) {
        color = red;
      } else if (n2 > 0.45) {
        color = blue;
      } else if (n3 > 0.5) {
        color = green;
      } else if (n1 < -0.4) {
        color = amber;
      } else if (n2 < -0.5) {
        color = purple;
      } else {
        // Fallback randomization among meaningful vectors
        const rand = Math.random();
        if (rand < 0.2) color = red;
        else if (rand < 0.4) color = blue;
        else if (rand < 0.6) color = green;
        else if (rand < 0.8) color = amber;
        else color = purple;
      }

      col[i * 3] = color.r;
      col[i * 3 + 1] = color.g;
      col[i * 3 + 2] = color.b;

      siz[i] = Math.random() * 0.05 + 0.02;
      thresh[i] = Math.random(); // Random threshold for theme activation
    }
    return [pos, init, col, siz, thresh];
  }, []);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uViscosity: { value: 1.0 },
    uPressure: { value: 600 },
    uTemperature: { value: 3.5 },
    uStability: { value: 100.0 },
    uPipingIntegrity: { value: 1.0 },
    uReservoirDensity: { value: 0.5 },
    uThermalLevel: { value: 0.0 },
    uAbyssalLevel: { value: 0.0 },
    uAlgoLevel: { value: 0.0 },
    uFrictionLevel: { value: 0.0 },
    uQuantumLevel: { value: 0.0 },
    uThermalTime: { value: 0.0 },
    uAbyssalTime: { value: 0.0 },
    uAlgoTime: { value: 0.0 },
    uFrictionTime: { value: 0.0 },
    uQuantumTime: { value: 0.0 }
  }), []);

  const activationTimes = useRef<Record<RealityTheme, number>>({
    THERMAL: 0, ABYSSAL: 0, ALGO: 0, FRICTION: 0, QUANTUM: 0
  });

  useFrame((_state, delta) => {
    timeRef.current += delta;
    const material = materialRef.current;
    if (material) {
      const u = material.uniforms;
      u.uTime.value = timeRef.current;
      
      // Cache activation mapping
      const themes = Object.keys(themeLevels) as RealityTheme[];
      for (let i = 0; i < themes.length; i++) {
        const theme = themes[i];
        if (themeLevels[theme] > 0 && activationTimes.current[theme] === 0) {
          activationTimes.current[theme] = timeRef.current;
        }
      }

      u.uThermalTime.value = activationTimes.current.THERMAL;
      u.uAbyssalTime.value = activationTimes.current.ABYSSAL;
      u.uAlgoTime.value = activationTimes.current.ALGO;
      u.uFrictionTime.value = activationTimes.current.FRICTION;
      u.uQuantumTime.value = activationTimes.current.QUANTUM;
      
      // Inline lerp for speed, grouped by source
      const lerp = THREE.MathUtils.lerp;
      u.uViscosity.value = lerp(u.uViscosity.value, state.vectors[0]?.viscosity || 1.0, 0.02);
      u.uPressure.value = lerp(u.uPressure.value, state.globalPressure, 0.015);
      u.uTemperature.value = lerp(u.uTemperature.value, state.vectors[0]?.temperature || 3.5, 0.015);
      u.uStability.value = lerp(u.uStability.value, state.reality?.stability ?? 100.0, 0.02);
      u.uPipingIntegrity.value = lerp(u.uPipingIntegrity.value, state.reality?.pipingIntegrity ?? 1.0, 0.02);
      u.uReservoirDensity.value = lerp(u.uReservoirDensity.value, state.reality?.reservoirDensity ?? 0.5, 0.02);

      u.uThermalLevel.value = lerp(u.uThermalLevel.value, themeLevels.THERMAL, 0.01);
      u.uAbyssalLevel.value = lerp(u.uAbyssalLevel.value, themeLevels.ABYSSAL, 0.01);
      u.uAlgoLevel.value = lerp(u.uAlgoLevel.value, themeLevels.ALGO, 0.01);
      u.uFrictionLevel.value = lerp(u.uFrictionLevel.value, themeLevels.FRICTION, 0.01);
      u.uQuantumLevel.value = lerp(u.uQuantumLevel.value, themeLevels.QUANTUM, 0.01);
    }
    if (meshRef.current) {
      // Mesh rotation disabled for static camera vortex feel
      meshRef.current.rotation.z = 0;
    }
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aInitialPos"
          count={particleCount}
          array={initialPos}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={particleCount}
          array={colors}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aSize"
          count={particleCount}
          array={sizes}
          itemSize={1}
        />
        <bufferAttribute
          attach="attributes-aThreshold"
          count={particleCount}
          array={thresholds}
          itemSize={1}
        />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        vertexColors
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};

