import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function initScroll(flowerGroup) {
  // ─── Lenis smooth scroll ──────────────────────────────────────────
  const lenis = new Lenis({ lerp: 0.08, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  // ─── Flower journey — keyframe map ───────────────────────────────
  // The flower travels through the entire page as you scroll.
  // Each keyframe: { at: 0-1, x, y, scale, ry (rotation.y offset) }
  const keyframes = [
    { at: 0.00, x:  2.40, y:  0.10, scale: 1.00, ry:  0.38 },  // hero — right, full size
    { at: 0.18, x:  2.00, y:  0.10, scale: 0.90, ry:  0.45 },  // hero fading out
    { at: 0.35, x:  0.20, y:  1.20, scale: 0.65, ry:  0.60 },  // entering projects — drifts up-left
    { at: 0.55, x: -1.20, y:  0.60, scale: 0.50, ry:  0.80 },  // mid projects — far left
    { at: 0.72, x: -2.00, y:  0.00, scale: 0.38, ry:  1.00 },  // bottom projects
    { at: 0.88, x: -2.40, y: -0.80, scale: 0.25, ry:  1.20 },  // links section
    { at: 1.00, x: -2.40, y: -2.50, scale: 0.12, ry:  1.40 },  // footer — drifts off
  ];

  // Smoothstep easing for keyframe interpolation
  function smoothstep(t) { return t * t * (3 - 2 * t); }

  function getFlowerState(p) {
    for (let i = 0; i < keyframes.length - 1; i++) {
      const a = keyframes[i], b = keyframes[i + 1];
      if (p >= a.at && p <= b.at) {
        const t = smoothstep((p - a.at) / (b.at - a.at));
        return {
          x:     a.x     + (b.x     - a.x)     * t,
          y:     a.y     + (b.y     - a.y)     * t,
          scale: a.scale + (b.scale - a.scale) * t,
          ry:    a.ry    + (b.ry    - a.ry)    * t,
        };
      }
    }
    return keyframes[keyframes.length - 1];
  }

  // Single ScrollTrigger spanning the whole page
  ScrollTrigger.create({
    start:  0,
    end:    'max',
    scrub:  1.2,
    onUpdate(self) {
      const state = getFlowerState(self.progress);
      // Write into userData so the render-loop floating animation
      // adds its gentle offset on top rather than fighting scroll
      flowerGroup.position.x          = state.x;
      flowerGroup.userData.baseY       = state.y;
      flowerGroup.userData.baseScale   = state.scale;
      flowerGroup.userData.baseRotY    = state.ry;
    },
  });

  // ─── Hero text fade — scrolls out as projects section arrives ────
  gsap.to('.hero-text', {
    opacity: 0,
    y: -24,
    duration: 0.4,
    ease: 'power2.in',
    scrollTrigger: {
      trigger: '#projects',
      start: 'top 80%',
      end:   'top 40%',
      scrub: true,
    },
  });

  // ─── Project rows stagger ─────────────────────────────────────────
  document.querySelectorAll('.project-row').forEach((row, i) => {
    gsap.from(row, {
      y: 36, opacity: 0, duration: 0.55, ease: 'power2.out',
      delay: i * 0.08,
      scrollTrigger: { trigger: row, start: 'top 85%' },
    });
  });

  // ─── Links section ────────────────────────────────────────────────
  gsap.from('#links .links-inner', {
    opacity: 0, y: 20, duration: 0.8, ease: 'power2.out',
    scrollTrigger: { trigger: '#links', start: 'top 80%' },
  });

  return lenis;
}
