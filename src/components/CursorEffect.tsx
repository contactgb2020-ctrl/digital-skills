import { useEffect, useRef, useState } from 'react';

/**
 * Subtle cursor-tracking effect: a small dot follows the mouse instantly,
 * and a larger ring trails smoothly behind it with a soft blue glow.
 * Automatically disabled on touch devices (no mouse to track).
 */
export default function CursorEffect() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const [enabled] = useState(() => {
    if (typeof window === 'undefined') return false;
    const isTouchDevice = window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
    return !isTouchDevice;
  });
  const [visible, setVisible] = useState(false);
  const [hoveringInteractive, setHoveringInteractive] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    const mouse = { x: 0, y: 0 };
    const ring = { x: 0, y: 0 };

    const handleMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      setVisible(true);
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${mouse.x}px, ${mouse.y}px, 0) translate(-50%, -50%)`;
      }
      const target = e.target as HTMLElement;
      setHoveringInteractive(!!target.closest('a, button, input, textarea, select, [role="button"]'));
    };

    const handleLeave = () => setVisible(false);

    let raf: number;
    const animateRing = () => {
      ring.x += (mouse.x - ring.x) * 0.18;
      ring.y += (mouse.y - ring.y) * 0.18;
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${ring.x}px, ${ring.y}px, 0) translate(-50%, -50%)`;
      }
      raf = requestAnimationFrame(animateRing);
    };
    raf = requestAnimationFrame(animateRing);

    window.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseleave', handleLeave);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseleave', handleLeave);
      cancelAnimationFrame(raf);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[9999]"
      style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.3s ease' }}
      aria-hidden="true"
    >
      <div
        ref={dotRef}
        className="fixed top-0 left-0 rounded-full bg-primary-500"
        style={{
          width: 6,
          height: 6,
          boxShadow: '0 0 8px 2px rgba(0, 112, 186, 0.6)',
          willChange: 'transform',
        }}
      />
      <div
        ref={ringRef}
        className="fixed top-0 left-0 rounded-full border transition-[width,height] duration-200 ease-out"
        style={{
          width: hoveringInteractive ? 44 : 32,
          height: hoveringInteractive ? 44 : 32,
          borderColor: 'rgba(0, 112, 186, 0.35)',
          boxShadow: '0 0 16px 4px rgba(0, 112, 186, 0.15)',
          willChange: 'transform',
        }}
      />
    </div>
  );
}
