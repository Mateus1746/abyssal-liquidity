/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum PressureStatus {
  STABLE = 'STABLE',
  CRITICAL = 'CRITICAL',
  DECOMPRESSION = 'DECOMPRESSION',
  COLLAPSE = 'COLLAPSE',
}

export interface LiquidityVector {
  source: string;
  value: number;
  delta: number;
  viscosity: number; // Mapping volatility to fluid resistance
  temperature: number; // Mapping interest rate to molecular excitement
  pressure: number; // Mapping volume/leverage to hydrostatic pressure
}

export type RealityTheme = 'THERMAL' | 'ABYSSAL' | 'ALGO' | 'FRICTION' | 'QUANTUM';

export interface TimelineEvent {
  id?: string;
  title: string;
  theme: RealityTheme;
  intensity: string;
  impact: string;
  description: string;
  analysis?: string;
  consequences?: string;
}

export interface RealityEvent extends TimelineEvent {}

export interface RealitySyncData {
  globalPressure: number;
  viscosity: number;
  turbulence: number;
  temperature: number;
  stability: number;
  pipingIntegrity: number; // 0-1 measure of infrastructure stress
  reservoirDensity: number; // Measure of capital concentration
  reasoning: string;
  events?: RealityEvent[];
}

export interface AbyssalState {
  globalPressure: number;
  systemStatus: PressureStatus;
  vectors: LiquidityVector[];
  timestamp: string;
  reality?: RealitySyncData;
}
