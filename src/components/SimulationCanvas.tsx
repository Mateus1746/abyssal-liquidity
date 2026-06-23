import { Canvas } from '@react-three/fiber';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { Suspense } from 'react';
import { FluidEngine } from './FluidEngine';

interface SimulationCanvasProps {
  state: 'idle' | 'syncing' | 'analyzing' | 'error';
  themeLevels: {
    ALGO: number;
    THERMAL: number;
    ABYSSAL: number;
    FRICTION: number;
    QUANTUM: number;
  };
}

export function SimulationCanvas({ state, themeLevels }: SimulationCanvasProps) {
  return (
    <div className="absolute inset-0 z-0">
      <Canvas
        id="video-canvas"
        camera={{ position: [0, 0, 5], fov: 75 }}
        gl={{
          powerPreference: "high-performance",
          antialias: false,
          stencil: false,
          depth: true,
          preserveDrawingBuffer: true
        }}
        dpr={[1, 1.5]}
      >
        <color attach="background" args={['#020408']} />
        <ambientLight intensity={0.5} />

        <Suspense fallback={null}>
          <FluidEngine state={state} themeLevels={themeLevels} />

          <EffectComposer enableNormalPass={false}>
            <Bloom
              intensity={0.6}
              luminanceThreshold={0.8}
              luminanceSmoothing={0.3}
              mipmapBlur
            />
            <Vignette offset={0.15} darkness={1.3} />
          </EffectComposer>
        </Suspense>
      </Canvas>
    </div>
  );
}
