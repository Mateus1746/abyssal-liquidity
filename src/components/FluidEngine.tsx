import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { createNoise2D } from 'simplex-noise';

// Add type matching the other components
type RealityTheme = 'ALGO' | 'THERMAL' | 'ABYSSAL' | 'FRICTION' | 'QUANTUM';

interface FluidEngineProps {
  state: 'idle' | 'syncing' | 'analyzing' | 'error';
  themeLevels: Record<RealityTheme, number>;
}

// Ensure the vertex and fragment shader are correctly maintained but adapted for simpler state
const vertexShader = `
  uniform float uTime;
  uniform float uViscosity;
  uniform float uPressure;
  uniform float uTemperature;
  uniform float uStability;
  uniform float uThermalLevel;
  uniform float uAbyssalLevel;
  uniform float uAlgoLevel;
  uniform float uFrictionLevel;
  uniform float uQuantumLevel;

  attribute float aSize;
  attribute float aThreshold;
  attribute vec3 aInitialPos;

  varying vec3 vColor;
  varying float vFade;

  // Simple noise function
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }
  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187,  // (3.0-sqrt(3.0))/6.0
                        0.366025403784439,  // 0.5*(sqrt(3.0)-1.0)
                       -0.577350269189626,  // -1.0 + 2.0 * C.x
                        0.024390243902439); // 1.0 / 41.0
    vec2 i  = floor(v + dot(v, C.yy) );
    vec2 x0 = v -   i + dot(i, C.xx);
    vec2 i1;
    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i); // Avoid truncation effects in permutation
    vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
      + i.x + vec3(0.0, i1.x, 1.0 ));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
    m = m*m ;
    m = m*m ;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  void main() {
    vec3 baseColor = color;
    vFade = 1.0;

    vec3 pos = aInitialPos;
    float r = length(pos.xy);
    float angle = atan(pos.y, pos.x);
    
    // Add movement based on time
    float radiusNoise = sin(uTime * 0.5 + aThreshold * 10.0) * 0.2;
    float currentR = max(r + radiusNoise, 0.1);
    
    float newAngle = angle - (uTime * 0.2) + (sin(currentR * 2.0 + uTime) * 0.1);

    // Abyssal Liquidity specific logic
    if (uAbyssalLevel > 0.01) {
      float abyssalNoise = snoise(vec2(pos.x * 0.5 + uTime * 0.1, pos.y * 0.5));
      float flow = snoise(vec2(r * 0.2, uTime * 0.05));

      currentR += abyssalNoise * uAbyssalLevel * 2.0;
      newAngle += flow * uAbyssalLevel * 1.5;

      vec3 deepBlue = vec3(0.0, 0.1, 0.5);
      vec3 cyan = vec3(0.0, 0.8, 1.0);
      float colorMix = (abyssalNoise + 1.0) * 0.5;
      baseColor = mix(baseColor, mix(deepBlue, cyan, colorMix), uAbyssalLevel);
    }

    vColor = baseColor;
    vec3 finalPos = vec3(cos(newAngle) * currentR, sin(newAngle) * currentR, pos.z);
    vec4 mvPosition = modelViewMatrix * vec4(finalPos, 1.0);
    
    gl_PointSize = aSize * (300.0 / max(-mvPosition.z, 0.5)) * vFade;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const fragmentShader = `
  precision mediump float;
  varying vec3 vColor;
  varying float vFade;
  void main() {
    float dist = distance(gl_PointCoord, vec2(0.5));
    if (dist > 0.5) discard;
    
    float weight = 1.0 - dist * 2.0;
    float alpha = weight * weight * vFade * 0.8;
    
    gl_FragColor = vec4(vColor, alpha);
  }
`;

export const FluidEngine: React.FC<FluidEngineProps> = ({ state, themeLevels }) => {
  const meshRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const timeRef = useRef(0);
  const particleCount = 8000;

  const [positions, initialPos, colors, sizes, thresholds] = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const init = new Float32Array(particleCount * 3);
    const col = new Float32Array(particleCount * 3);
    const siz = new Float32Array(particleCount);
    const thresh = new Float32Array(particleCount);
    
    const noise2D = createNoise2D();
    const palettes = [
      new THREE.Color('#00E676'), // ALGO
      new THREE.Color('#FF1744'), // THERMAL
      new THREE.Color('#2979FF'), // ABYSSAL
      new THREE.Color('#FFD600'), // FRICTION
      new THREE.Color('#D500F9')  // QUANTUM
    ];

    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 6 + 1;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      const z = (Math.random() - 0.5) * 4.0;

      pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z;
      init[i * 3] = x; init[i * 3 + 1] = y; init[i * 3 + 2] = z;

      const color = palettes[Math.floor(Math.random() * palettes.length)];
      col[i * 3] = color.r; col[i * 3 + 1] = color.g; col[i * 3 + 2] = color.b;

      siz[i] = Math.random() * 0.08 + 0.02;
      thresh[i] = Math.random();
    }
    return [pos, init, col, siz, thresh];
  }, []);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uViscosity: { value: 1.0 },
    uPressure: { value: 600 },
    uTemperature: { value: 3.5 },
    uStability: { value: 100.0 },
    uThermalLevel: { value: 0.0 },
    uAbyssalLevel: { value: 0.0 },
    uAlgoLevel: { value: 0.0 },
    uFrictionLevel: { value: 0.0 },
    uQuantumLevel: { value: 0.0 }
  }), []);

  useFrame((_state, delta) => {
    timeRef.current += delta;
    if (materialRef.current) {
      const u = materialRef.current.uniforms;
      u.uTime.value = timeRef.current;
      
      const lerp = THREE.MathUtils.lerp;
      u.uThermalLevel.value = lerp(u.uThermalLevel.value, themeLevels.THERMAL, 0.05);
      u.uAbyssalLevel.value = lerp(u.uAbyssalLevel.value, themeLevels.ABYSSAL, 0.05);
      u.uAlgoLevel.value = lerp(u.uAlgoLevel.value, themeLevels.ALGO, 0.05);
      u.uFrictionLevel.value = lerp(u.uFrictionLevel.value, themeLevels.FRICTION, 0.05);
      u.uQuantumLevel.value = lerp(u.uQuantumLevel.value, themeLevels.QUANTUM, 0.05);
    }
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={particleCount} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-aInitialPos" count={particleCount} array={initialPos} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={particleCount} array={colors} itemSize={3} />
        <bufferAttribute attach="attributes-aSize" count={particleCount} array={sizes} itemSize={1} />
        <bufferAttribute attach="attributes-aThreshold" count={particleCount} array={thresholds} itemSize={1} />
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
