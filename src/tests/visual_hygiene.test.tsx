import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, act } from '@testing-library/react';
import { useCollisionManager } from '../hooks/useCollisionManager';

interface ElementMockData {
  left: number;
  top: number;
  width: number;
  height: number;
  text?: string;
  color?: string;
  backgroundColor?: string;
}

interface CollisionHandle {
  containerRef: React.RefObject<HTMLDivElement | null>;
  forceRecalculate: () => void;
}

interface TestComponentProps {
  elementsData: ElementMockData[];
  padding?: number;
  onRefAvailable?: (handle: CollisionHandle) => void;
}

// 🩺 Componente wrapper de teste para instanciar o hook
function CollisionTestComponent({ elementsData, padding = 10, onRefAvailable }: TestComponentProps) {
  const { containerRef, forceRecalculate } = useCollisionManager('.collidable-element', padding);
  
  React.useEffect(() => {
    if (containerRef.current && onRefAvailable) {
      onRefAvailable({ containerRef, forceRecalculate });
    }
  }, [containerRef, onRefAvailable, forceRecalculate]);

  return (
    <div ref={containerRef} style={{ width: '1920px', height: '1080px', position: 'relative' }}>
      {elementsData.map((data, idx) => (
        <div
          key={idx}
          className="collidable-element"
          style={{
            position: 'absolute',
            left: `${data.left}px`,
            top: `${data.top}px`,
            width: `${data.width}px`,
            height: `${data.height}px`,
            color: data.color || '#ffffff',
            backgroundColor: data.backgroundColor || 'transparent'
          }}
        >
          {data.text || `Item ${idx}`}
        </div>
      ))}
    </div>
  );
}

// 🩺 APCA (Advanced Perceptual Contrast Algorithm) em Javascript puro para testes
function parseColor(colorStr: string) {
  if (!colorStr) return { r: 0, g: 0, b: 0 };
  if (colorStr.startsWith('rgb')) {
    const match = colorStr.match(/\d+/g);
    if (match) return { r: parseInt(match[0]), g: parseInt(match[1]), b: parseInt(match[2]) };
  }
  if (colorStr.startsWith('#')) {
    let hex = colorStr.slice(1);
    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
    return {
      r: parseInt(hex.substring(0, 2), 16),
      g: parseInt(hex.substring(2, 4), 16),
      b: parseInt(hex.substring(4, 6), 16)
    };
  }
  return { r: 0, g: 0, b: 0 };
}

function getLuminance(r: number, g: number, b: number) {
  const linear = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126729 * linear(r) + 0.7151522 * linear(g) + 0.0721750 * linear(b);
}

function calculateAPCA(textColorStr: string, bgColorStr: string) {
  const textRGB = parseColor(textColorStr);
  const bgRGB = parseColor(bgColorStr);
  const Yt = getLuminance(textRGB.r, textRGB.g, textRGB.b);
  const Yb = getLuminance(bgRGB.r, bgRGB.g, bgRGB.b);
  
  let Lc = 0;
  if (Yb > Yt) {
    Lc = (Math.pow(Yb, 0.56) - Math.pow(Yt, 0.57)) * 161.8;
  } else {
    Lc = (Math.pow(Yt, 0.62) - Math.pow(Yb, 0.65)) * 161.8;
  }
  return Math.abs(Lc) < 7.5 ? 0 : Math.round(Lc);
}

function validateSafeZone(rect: { left: number; right: number; top: number; bottom: number }, viewport = { w: 1920, h: 1080 }) {
  const titleSafe = {
    minX: viewport.w * 0.05,
    maxX: viewport.w * 0.95,
    minY: viewport.h * 0.05,
    maxY: viewport.h * 0.95
  };
  
  const actionSafe = {
    minX: viewport.w * 0.035,
    maxX: viewport.w * 0.965,
    minY: viewport.h * 0.035,
    maxY: viewport.h * 0.965
  };

  return {
    inTitleSafe: rect.left >= titleSafe.minX && rect.right <= titleSafe.maxX && rect.top >= titleSafe.minY && rect.bottom <= titleSafe.maxY,
    inActionSafe: rect.left >= actionSafe.minX && rect.right <= actionSafe.maxX && rect.top >= actionSafe.minY && rect.bottom <= actionSafe.maxY
  };
}

describe('VISUAL HYGIENE & ANTI-JANK SUITE (ABYSSAL TS)', () => {

  describe('1. useCollisionManager AABB Resolution', () => {
    
    it('deve marcar elementos como colidindo e aplicar deslocamento vertical Y quando houver sobreposição', async () => {
      const mockData = [
        { left: 100, top: 100, width: 200, height: 50, text: 'Legenda Superior' },
        { left: 100, top: 120, width: 200, height: 50, text: 'Legenda Inferior' }
      ];

      let handle: CollisionHandle | null = null;
      const { container } = render(
        <CollisionTestComponent 
          elementsData={mockData} 
          padding={10} 
          onRefAvailable={(h) => { handle = h; }} 
        />
      );

      const elements = container.querySelectorAll('.collidable-element') as NodeListOf<HTMLElement>;
      expect(elements.length).toBe(2);

      elements[0].getBoundingClientRect = () => ({
        left: 100, right: 300, top: 100, bottom: 150, width: 200, height: 50, x: 100, y: 100, toJSON: () => {}
      });

      elements[1].getBoundingClientRect = () => ({
        left: 100, right: 300, top: 120, bottom: 170, width: 200, height: 50, x: 100, y: 120, toJSON: () => {}
      });

      act(() => {
        if (handle) handle.forceRecalculate();
      });

      expect(elements[0].getAttribute('data-colliding')).toBe('true');
      expect(elements[1].style.transform).toBe('translateY(40px)');
      expect(elements[1].getAttribute('data-colliding')).toBe('true');
    });

    it('deve resolver colisão em cascata cumulativa para múltiplos elementos (3+ sobrepostos)', () => {
      const mockData = [
        { left: 100, top: 100, width: 200, height: 50 },
        { left: 100, top: 120, width: 200, height: 50 },
        { left: 100, top: 140, width: 200, height: 50 }
      ];

      let handle: CollisionHandle | null = null;
      const { container } = render(
        <CollisionTestComponent 
          elementsData={mockData} 
          padding={10} 
          onRefAvailable={(h) => { handle = h; }} 
        />
      );

      const elements = container.querySelectorAll('.collidable-element') as NodeListOf<HTMLElement>;

      elements[0].getBoundingClientRect = () => ({
        left: 100, right: 300, top: 100, bottom: 150, width: 200, height: 50, x: 100, y: 100, toJSON: () => {}
      });

      elements[1].getBoundingClientRect = () => ({
        left: 100, right: 300, top: 120, bottom: 170, width: 200, height: 50, x: 100, y: 120, toJSON: () => {}
      });

      elements[2].getBoundingClientRect = () => ({
        left: 100, right: 300, top: 140, bottom: 190, width: 200, height: 50, x: 100, y: 140, toJSON: () => {}
      });

      act(() => {
        if (handle) handle.forceRecalculate();
      });

      expect(elements[1].style.transform).toBe('translateY(40px)');
      expect(elements[2].style.transform).toBe('translateY(80px)');
      
      expect(elements[0].getAttribute('data-colliding')).toBe('true');
      expect(elements[1].getAttribute('data-colliding')).toBe('true');
      expect(elements[2].getAttribute('data-colliding')).toBe('true');
    });

    it('deve marcar elementos como colidindo quando houver sobreposição no eixo horizontal X (mesmo Y)', () => {
      const mockData = [
        { left: 100, top: 100, width: 150, height: 50 },
        { left: 200, top: 100, width: 150, height: 50 }
      ];

      let handle: CollisionHandle | null = null;
      const { container } = render(
        <CollisionTestComponent 
          elementsData={mockData} 
          padding={10} 
          onRefAvailable={(h) => { handle = h; }} 
        />
      );

      const elements = container.querySelectorAll('.collidable-element') as NodeListOf<HTMLElement>;

      elements[0].getBoundingClientRect = () => ({
        left: 100, right: 250, top: 100, bottom: 150, width: 150, height: 50, x: 100, y: 100, toJSON: () => {}
      });

      elements[1].getBoundingClientRect = () => ({
        left: 200, right: 350, top: 100, bottom: 150, width: 150, height: 50, x: 200, y: 100, toJSON: () => {}
      });

      act(() => {
        if (handle) handle.forceRecalculate();
      });

      expect(elements[0].getAttribute('data-colliding')).toBe('true');
      expect(elements[1].getAttribute('data-colliding')).toBe('true');
    });
  });

  describe('2. Safe Zone Guard Rules', () => {
    
    it('deve passar elementos que se situam dentro da Title-Safe Zone (90%)', () => {
      const rect = { left: 960, right: 1160, top: 540, bottom: 590, width: 200, height: 50 };
      const validation = validateSafeZone(rect);
      
      expect(validation.inTitleSafe).toBe(true);
      expect(validation.inActionSafe).toBe(true);
    });

    it('deve apontar falha em Title-Safe se o elemento exceder a margem horizontal esquerda (96px) ou direita (1824px)', () => {
      const rectLeftViolated = { left: 50, right: 250, top: 500, bottom: 550, width: 200, height: 50 };
      const validationLeft = validateSafeZone(rectLeftViolated);
      expect(validationLeft.inTitleSafe).toBe(false);

      const rectRightViolated = { left: 1750, right: 1850, top: 500, bottom: 550, width: 100, height: 50 };
      const validationRight = validateSafeZone(rectRightViolated);
      expect(validationRight.inTitleSafe).toBe(false);
      expect(validationRight.inActionSafe).toBe(true);
    });
  });

  describe('3. APCA Contrast Verification', () => {
    
    it('deve retornar pontuação alta de contraste para combinações de alto contraste sRGB (Texto Branco em Fundo Preto)', () => {
      const score = calculateAPCA('#ffffff', '#000000');
      expect(score).toBeGreaterThanOrEqual(100);
    });

    it('deve retornar pontuação nula ou muito baixa para Texto Cinza Escuro em Fundo Preto', () => {
      const score = calculateAPCA('#333333', '#000000');
      expect(score).toBeLessThan(45);
    });
  });

});
