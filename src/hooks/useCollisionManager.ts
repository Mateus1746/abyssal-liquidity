import { useLayoutEffect, useCallback, useRef } from 'react';

export interface CollidableElementData {
  el: HTMLElement;
  rect: DOMRect;
  offsetY: number;
}

export function useCollisionManager(selector: string = '.collidable-element', padding: number = 10) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const resolveCollisions = useCallback(() => {
    if (!containerRef.current) return;

    const elements = Array.from(containerRef.current.querySelectorAll(selector)) as HTMLElement[];
    if (elements.length < 2) return;

    // Reset previous transformations and states
    elements.forEach(el => {
      el.style.transform = 'translateY(0px)';
      el.setAttribute('data-colliding', 'false');
    });

    // Get fresh bounding rectangles
    const rects: CollidableElementData[] = elements.map(el => ({
      el,
      rect: el.getBoundingClientRect(),
      offsetY: 0
    }));

    // Sort elements from top to bottom
    rects.sort((a, b) => a.rect.top - b.rect.top);

    let collisionDetected = false;

    for (let i = 0; i < rects.length; i++) {
      for (let j = 0; j < i; j++) {
        const itemA = rects[j];
        const itemB = rects[i];

        const rA = {
          left: itemA.rect.left,
          right: itemA.rect.right,
          top: itemA.rect.top + itemA.offsetY,
          bottom: itemA.rect.bottom + itemA.offsetY
        };

        const rB = {
          left: itemB.rect.left,
          right: itemB.rect.right,
          top: itemB.rect.top + itemB.offsetY,
          bottom: itemB.rect.bottom + itemB.offsetY
        };

        // AABB check + vertical padding
        const isColliding = 
          rA.left < rB.right && 
          rA.right > rB.left && 
          rA.top < (rB.bottom + padding) && 
          (rA.bottom + padding) > rB.top;

        if (isColliding) {
          const overlap = rA.bottom - rB.top + padding;
          itemB.offsetY += overlap;
          collisionDetected = true;
          
          itemA.el.setAttribute('data-colliding', 'true');
          itemB.el.setAttribute('data-colliding', 'true');
        }
      }
    }

    if (collisionDetected) {
      rects.forEach(item => {
        if (item.offsetY !== 0) {
          item.el.style.transform = `translateY(${item.offsetY}px)`;
        }
      });
    }
  }, [selector, padding]);

  useLayoutEffect(() => {
    resolveCollisions();
    
    if (!containerRef.current || typeof ResizeObserver === 'undefined') return;
    
    const observer = new ResizeObserver(() => {
      resolveCollisions();
    });
    
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [resolveCollisions]);

  return { containerRef, forceRecalculate: resolveCollisions };
}
