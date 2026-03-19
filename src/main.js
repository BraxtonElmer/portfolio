import * as THREE from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass }     from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass }     from 'three/examples/jsm/postprocessing/OutputPass.js';
import { buildFlower }    from './flower.js';
import { initScroll }     from './scroll.js';

gsap.registerPlugin(ScrollTrigger);

// ─── Renderer ─────────────────────────────────────────────────────
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000, 0);
renderer.toneMapping        = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.6;
renderer.domElement.id = 'three-canvas';
document.body.prepend(renderer.domElement);

// ─── Scene & Camera ───────────────────────────────────────────────
const scene  = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  50,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);
camera.position.set(0, 0.5, 9.5);
camera.lookAt(0, 0.3, 0);

// ─── Post-processing: Bloom ────────────────────────────────────────
// UnrealBloomPass makes the hot core and bright petal edges glow —
// the single biggest jump toward "premium 3-D website" quality.
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.55,  // strength
  0.45,  // radius
  0.42   // threshold — only hottest highlights bloom
);
composer.addPass(bloomPass);
composer.addPass(new OutputPass());

// ─── Lighting ─────────────────────────────────────────────────────
// All intensities are tuned for ACESFilmic + bloom.

// World-space lights — positioned around where the flower actually sits (x≈2.4)
// Front key — aimed right at the flower, close and bright
const mainLight = new THREE.PointLight(0xff3300, 16, 22);
mainLight.position.set(4.5, 2.5, 7);
scene.add(mainLight);

// Second front — slightly lower angle, fills the petal undersides
const fillLight = new THREE.PointLight(0xff2200, 10, 16);
fillLight.position.set(2.4, -1, 7);
scene.add(fillLight);

// Left side fill
const sideLight = new THREE.PointLight(0xff1100, 6, 12);
sideLight.position.set(-0.5, 0.5, 5);
scene.add(sideLight);

// Rim from behind — petal edge separation
const rimLight = new THREE.PointLight(0xdd1100, 5, 10);
rimLight.position.set(2.4, 2.5, -3);
scene.add(rimLight);

// Warm ambient — fills in shadow areas so petals stay red not black
const ambient = new THREE.AmbientLight(0x550000, 5.5);
scene.add(ambient);

// Core light — child of flowerGroup so it always sits at the flower centre.
// This is what drives the hot inner bloom highlight.
const coreLight = new THREE.PointLight(0xff6600, 6, 4);
coreLight.position.set(0, 0.4, 0.3); // local to flowerGroup

// ─── Flower ───────────────────────────────────────────────────────
const { group: flowerGroup } = buildFlower();

flowerGroup.position.set(2.4, 0.1, 0);
flowerGroup.rotation.z = -0.18;
flowerGroup.rotation.y =  0.38;
flowerGroup.userData.baseScale = 1;
flowerGroup.userData.baseY     = 0.1;
// Core light travels with flower — always at centre
coreLight.intensity = 5;
flowerGroup.add(coreLight);
scene.add(flowerGroup);

// ─── Resize ───────────────────────────────────────────────────────
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  composer.setSize(window.innerWidth, window.innerHeight);
});

// ─── Render loop ──────────────────────────────────────────────────
const clock = new THREE.Clock();
let breathingActive = false;

function animate() {
  requestAnimationFrame(animate);
  const elapsed = clock.getElapsedTime();

  if (breathingActive) {
    const baseY = flowerGroup.userData.baseY ?? 0.1;
    flowerGroup.position.y = baseY + Math.sin(elapsed * 0.55) * 0.055;
    const baseRY = flowerGroup.userData.baseRotY ?? 0.38;
    flowerGroup.rotation.y = baseRY + Math.sin(elapsed * 0.22) * 0.04;
    flowerGroup.rotation.z = -0.18  + Math.sin(elapsed * 0.38) * 0.012;

    const scroll = flowerGroup.userData.baseScale ?? 1;
    flowerGroup.scale.setScalar(1.15 * scroll);

    // Core pulses gently — breathing life
    coreLight.intensity = 6 + Math.sin(elapsed * 1.0) * 1.2;
  }

  // Use composer (bloom) instead of raw renderer.render
  composer.render();
}
animate();

// ─── Load sequence ────────────────────────────────────────────────
function startLoadSequence() {
  flowerGroup.scale.set(1.15, 1.15, 1.15);

  // Flower scales in with elastic bounce
  gsap.from(flowerGroup.scale, {
    x: 0, y: 0, z: 0,
    duration: 1.8,
    ease: 'elastic.out(1, 0.5)',
    delay: 0.3,
    onComplete() { breathingActive = true; },
  });

  // ── Name reveal: masked slide-up with skewY — premium portfolio look ──
  const tl = gsap.timeline({ delay: 0.55 });

  // BRAXTON
  tl.to('#hero-line-1', { opacity: 1, duration: 0 })
    .from('#hero-line-1 span', {
      y: '115%', skewY: 5,
      duration: 0.90, ease: 'power4.out',
    }, '<')

  // ELMER — slight stagger
    .to('#hero-line-2', { opacity: 1, duration: 0 }, '-=0.55')
    .from('#hero-line-2 span', {
      y: '115%', skewY: 5,
      duration: 0.90, ease: 'power4.out',
    }, '<')

  // Role line slides up gently after name lands
    .fromTo('.hero-role',
      { y: 12, opacity: 0 },
      { y: 0,  opacity: 1, duration: 0.5, ease: 'power2.out' },
      '-=0.25'
    )

  // Scroll hint fades in last
    .to('.scroll-hint', { opacity: 1, duration: 0.4 }, '+=0.15');
}

// ─── Boot ─────────────────────────────────────────────────────────
requestAnimationFrame(() => {
  startLoadSequence();
  initScroll(flowerGroup);
});
