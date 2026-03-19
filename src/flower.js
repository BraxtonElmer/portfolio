import * as THREE from 'three';

/**
 * Lycoris radiata — spider lily.
 * 4 rings of petals with per-ring spine shapes, thin arcing stamens.
 */
export function buildFlower() {
  const group = new THREE.Group();

  // ─── Materials ────────────────────────────────────────────────────
  const petalMat = new THREE.MeshPhongMaterial({
    color:             0xcc2200,
    emissive:          0x660000,
    emissiveIntensity: 0.45,
    shininess:         130,
    side:              THREE.DoubleSide,
  });

  const stamenMat = new THREE.MeshPhongMaterial({
    color:             0xbb1100,
    emissive:          0x550000,
    emissiveIntensity: 0.9,
    shininess:         60,
  });

  const antherMat = new THREE.MeshPhongMaterial({
    color:    0xffcc00,
    emissive: 0x664400,
    shininess: 200,
  });

  const stemMat = new THREE.MeshPhongMaterial({
    color:    0x1a2200,
    emissive: 0x050800,
    shininess: 20,
  });

  // ─── Petal builder — parametric spine ─────────────────────────────
  // Each ring uses a slightly different spine curve so petals read as
  // 3-D layers rather than clones of the same shape.
  //   length    – how far the petal sweeps radially
  //   rise      – amplitude of upward arc (S-curve peak height)
  //   reflex    – how far the tip drops below the base (reflexed droop)
  //   maxW      – peak ribbon half-width
  //   zCurl     – how far the tip curls toward camera
  function buildPetalGeo({ length, rise, reflex, maxW, zCurl }) {
    const geo       = new THREE.BufferGeometry();
    const segments  = 42;
    const widthSegs = 6;
    const positions = [];
    const uvs       = [];
    const indices   = [];

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;

      const spineX = Math.pow(t, 0.52) * length;
      // S-curve: rises to (rise), reflexes back to (-reflex + sin contribution)
      const spineY = Math.sin(t * Math.PI * 0.62) * rise  -  t * reflex;
      // Gentle curl toward viewer so camera catches the petal face
      const spineZ = Math.pow(t, 2.2) * zCurl;

      // Narrow ribbon — slightly wider than before for more visible body
      const halfW = Math.pow(Math.sin(t * Math.PI), 0.60) * maxW;

      // Slight twist so the ribbon rolls naturally along its length
      const twist = t * Math.PI * 0.32;

      for (let j = 0; j <= widthSegs; j++) {
        const w  = (j / widthSegs - 0.5) * 2;
        const lY = Math.cos(twist) * w * halfW;
        const lZ = Math.sin(twist) * w * halfW;
        positions.push(spineX, spineY + lY, spineZ + lZ);
        uvs.push(j / widthSegs, t);
      }
    }

    for (let i = 0; i < segments; i++) {
      for (let j = 0; j < widthSegs; j++) {
        const a = i * (widthSegs + 1) + j;
        const b = a + widthSegs + 1;
        indices.push(a, b, a + 1);
        indices.push(b, b + 1, a + 1);
      }
    }

    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('uv',       new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
  }

  // ─── 4 petal geometries — outer to inner ──────────────────────────
  // Outer ring: long, strong reflex, widest — the big sweeping petals visible in the ref
  const geoA = buildPetalGeo({ length:1.90, rise:1.35, reflex:1.50, maxW:0.120, zCurl:0.60 });
  // Second ring: slightly shorter, different rise profile
  const geoB = buildPetalGeo({ length:1.65, rise:1.20, reflex:1.30, maxW:0.115, zCurl:0.55 });
  // Third ring: shorter, more upright, medium reflex — the mid-layer petals
  const geoC = buildPetalGeo({ length:1.30, rise:1.05, reflex:1.00, maxW:0.100, zCurl:0.45 });
  // Inner ring: short, strongly upright/curled, fills the flower centre
  const geoD = buildPetalGeo({ length:0.90, rise:0.85, reflex:0.65, maxW:0.085, zCurl:0.30 });

  // ─── Petal rings ──────────────────────────────────────────────────
  // Ring tilts are carefully chosen so petals fan up AND down AND sideways,
  // creating the dense 3-D cluster of the reference illustration.

  // Ring A — outer 6, varied droop
  const tiltsA = [-0.45, 0.30, -0.20, 0.42, -0.32, 0.18];
  for (let i = 0; i < 6; i++) {
    const pivot = new THREE.Group();
    pivot.rotation.y = (i / 6) * Math.PI * 2;
    const p = new THREE.Mesh(geoA, petalMat);
    p.rotation.x = tiltsA[i];
    pivot.add(p);
    group.add(pivot);
  }

  // Ring B — 6 at 30° offset, opposite tilt direction
  const tiltsB = [0.35, -0.40, 0.25, -0.30, 0.38, -0.22];
  for (let i = 0; i < 6; i++) {
    const pivot = new THREE.Group();
    pivot.rotation.y = (i / 6) * Math.PI * 2 + Math.PI / 6;
    const p = new THREE.Mesh(geoB, petalMat);
    p.rotation.x = tiltsB[i];
    pivot.add(p);
    group.add(pivot);
  }

  // Ring C — 6 at 15° offset, more upright (tilted toward vertical)
  const tiltsC = [-0.55, -0.20, -0.48, -0.15, -0.52, -0.25];
  for (let i = 0; i < 6; i++) {
    const pivot = new THREE.Group();
    pivot.rotation.y = (i / 6) * Math.PI * 2 + Math.PI / 12;
    const p = new THREE.Mesh(geoC, petalMat);
    p.rotation.x = tiltsC[i];
    pivot.add(p);
    group.add(pivot);
  }

  // Ring D — innermost 6, strongly upright, tightly curled — fills the centre
  const tiltsD = [-0.70, -0.55, -0.65, -0.60, -0.68, -0.58];
  for (let i = 0; i < 6; i++) {
    const pivot = new THREE.Group();
    pivot.rotation.y = (i / 6) * Math.PI * 2 + Math.PI / 4;
    const p = new THREE.Mesh(geoD, petalMat);
    p.rotation.x = tiltsD[i];
    pivot.add(p);
    group.add(pivot);
  }

  // ─── Stamens — 18 graceful dome-arc threads ───────────────────────
  // All emerge from one umbel point, arc upward then outward like an
  // opening umbrella — matching the consistent spoke-pattern in the ref.
  const STAMEN_COUNT = 18;
  const stamenLen = [1.00,0.93,1.07,0.96,1.04,0.88,1.10,0.97,1.05,
                     0.91,1.09,0.85,1.03,1.13,0.94,1.06,0.98,1.01];

  for (let s = 0; s < STAMEN_COUNT; s++) {
    const angle = (s / STAMEN_COUNT) * Math.PI * 2;
    const x = Math.cos(angle);
    const z = Math.sin(angle);
    const k = stamenLen[s];

    // Shallower dome — rises then sweeps outward, stays close to flower head
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0,           0.00,      0          ),
      new THREE.Vector3(x*0.08*k,    0.40*k,    z*0.08*k   ),
      new THREE.Vector3(x*0.45*k,    0.72*k,    z*0.45*k   ),
      new THREE.Vector3(x*1.00*k,    0.92*k,    z*1.00*k   ),
      new THREE.Vector3(x*1.55*k,    0.78*k,    z*1.55*k   ),
    ]);

    group.add(new THREE.Mesh(
      new THREE.TubeGeometry(curve, 28, 0.004, 5, false),
      stamenMat
    ));

    // Bi-lobed anther — two tiny spheres side-by-side at the tip
    const tipPos  = curve.getPoint(1);
    const tangent = curve.getTangent(1).normalize();
    const perp    = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize().multiplyScalar(0.013);
    const aL = new THREE.Mesh(new THREE.SphereGeometry(0.013, 7, 7), antherMat);
    const aR = new THREE.Mesh(new THREE.SphereGeometry(0.013, 7, 7), antherMat);
    aL.position.copy(tipPos).add(perp);
    aR.position.copy(tipPos).sub(perp);
    group.add(aL, aR);
  }

  // ─── Pistil — longer than stamens, slightly offset ────────────────
  const pistilCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3( 0.00,  0.00,  0.00),
    new THREE.Vector3( 0.04,  0.35,  0.01),
    new THREE.Vector3( 0.10,  0.70,  0.02),
    new THREE.Vector3( 0.16,  1.00,  0.03),
    new THREE.Vector3( 0.20,  1.20,  0.04),
  ]);
  group.add(new THREE.Mesh(
    new THREE.TubeGeometry(pistilCurve, 22, 0.005, 5, false),
    stamenMat
  ));
  // Three-lobed stigma at the tip
  for (let i = 0; i < 3; i++) {
    const a  = (i / 3) * Math.PI * 2;
    const sg = new THREE.Mesh(new THREE.SphereGeometry(0.011, 6, 6), antherMat);
    sg.position.set(0.20 + Math.cos(a)*0.017, 1.20, 0.04 + Math.sin(a)*0.017);
    group.add(sg);
  }

  // ─── Stem ─────────────────────────────────────────────────────────
  // Long, gently curved, dark maroon — visual anchor of the composition.
  const stemCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3( 0.00,  0.00,  0.00),
    new THREE.Vector3(-0.04, -0.75,  0.00),
    new THREE.Vector3(-0.07, -1.70,  0.00),
    new THREE.Vector3(-0.07, -2.80,  0.01),
    new THREE.Vector3(-0.04, -4.00,  0.01),
  ]);
  group.add(new THREE.Mesh(
    new THREE.TubeGeometry(stemCurve, 36, 0.052, 10, false),
    stemMat
  ));

  return { group };
}
