"use client";

import { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer } from "@react-three/drei";
import * as THREE from "three";
import { ritual } from "@/lib/scene-state";
import { Powder } from "./Atmosphere";

const damp = THREE.MathUtils.damp;
const sstep = THREE.MathUtils.smoothstep;

/* ── chawan (tea bowl) ─────────────────────────────────────────────────── */

function bowlProfile() {
  const p: THREE.Vector2[] = [];
  // foot ring
  p.push(new THREE.Vector2(0.0, -0.62));
  p.push(new THREE.Vector2(0.42, -0.62));
  p.push(new THREE.Vector2(0.44, -0.55));
  p.push(new THREE.Vector2(0.48, -0.53));
  // outer wall — a slightly irregular, hand-thrown curve
  for (let i = 0; i <= 24; i++) {
    const t = i / 24;
    const r = 0.5 + Math.sin(t * Math.PI * 0.55) * 0.72 + Math.sin(t * 17) * 0.006;
    const y = -0.53 + t * 1.05;
    p.push(new THREE.Vector2(r, y));
  }
  // rounded lip
  p.push(new THREE.Vector2(1.2, 0.54));
  p.push(new THREE.Vector2(1.17, 0.56));
  p.push(new THREE.Vector2(1.14, 0.53));
  // inner wall back down
  for (let i = 24; i >= 0; i--) {
    const t = i / 24;
    const r = 0.36 + Math.sin(t * Math.PI * 0.55) * 0.76;
    const y = -0.44 + t * 0.96;
    p.push(new THREE.Vector2(r, y));
  }
  p.push(new THREE.Vector2(0.0, -0.44));
  return p;
}

function useBowlMaterial() {
  return useMemo(() => {
    const m = new THREE.MeshPhysicalMaterial({
      color: "#1c2a22",
      roughness: 0.55,
      metalness: 0,
      clearcoat: 0.45,
      clearcoatRoughness: 0.35,
      envMapIntensity: 0.6,
      sheen: 0.4,
      sheenColor: new THREE.Color("#5c7a5f"),
    });
    // a raku-style glaze: drips of lighter celadon towards the rim
    m.onBeforeCompile = (shader) => {
      shader.vertexShader = shader.vertexShader
        .replace("#include <common>", "#include <common>\nvarying vec3 vObjPos;")
        .replace("#include <begin_vertex>", "#include <begin_vertex>\nvObjPos = position;");
      shader.fragmentShader = shader.fragmentShader
        .replace(
          "#include <common>",
          `#include <common>
           varying vec3 vObjPos;
           float h1(float n){ return fract(sin(n)*43758.5453); }`,
        )
        .replace(
          "#include <color_fragment>",
          `#include <color_fragment>
           float ang = atan(vObjPos.z, vObjPos.x);
           float drip = sin(ang * 9.0) * 0.08 + sin(ang * 23.0 + 1.3) * 0.04;
           float band = smoothstep(0.05 + drip, 0.4 + drip, vObjPos.y);
           vec3 celadon = vec3(0.42, 0.52, 0.42);
           diffuseColor.rgb = mix(diffuseColor.rgb, celadon, band * 0.7);
           float foot = smoothstep(-0.5, -0.58, vObjPos.y);
           diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.55, 0.42, 0.30), foot);`,
        );
    };
    return m;
  }, []);
}

/* ── matcha surface with foam ─────────────────────────────────────────── */

const liquidFrag = /* glsl */ `
  uniform float uTime;
  uniform float uFoam;
  uniform float uMilk;
  uniform float uSwirl;
  varying vec2 vUv;
  float hash(vec2 p){ return fract(sin(dot(p, vec2(41.3, 289.1))) * 45758.5453); }
  float noise(vec2 p){ vec2 i=floor(p), f=fract(p); vec2 u=f*f*(3.0-2.0*f);
    return mix(mix(hash(i),hash(i+vec2(1,0)),u.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x), u.y); }
  void main(){
    vec2 c = vUv - 0.5;
    float r = length(c);
    float a = atan(c.y, c.x) + uSwirl * (1.0 - r * 1.6);
    vec2 p = vec2(cos(a), sin(a)) * r;
    vec3 deep = vec3(0.24, 0.40, 0.12);
    vec3 bright = vec3(0.56, 0.70, 0.27);
    vec3 col = mix(deep, bright, smoothstep(0.5, 0.0, r) * 0.6 + noise(p * 18.0) * 0.25);
    // micro-foam: fine bubbles
    float bubbles = smoothstep(0.55, 0.9, noise(p * 90.0 + uTime * 0.3)) * 0.5 + noise(p * 40.0) * 0.35;
    vec3 foam = vec3(0.70, 0.80, 0.42) + bubbles * 0.12;
    col = mix(col, foam, uFoam * smoothstep(0.52, 0.2, r));
    // oat milk swirl
    float swirl = smoothstep(0.35, 0.7, noise(vec2(a * 2.0, r * 6.0) + uTime * 0.05));
    vec3 latte = mix(vec3(0.80, 0.86, 0.62), vec3(0.95, 0.94, 0.86), swirl);
    col = mix(col, latte, uMilk * (0.6 + swirl * 0.4));
    float edge = smoothstep(0.5, 0.47, r);
    gl_FragColor = vec4(col, edge);
  }
`;

/* ── chasen (bamboo whisk) ────────────────────────────────────────────── */

function Chasen({ g }: { g: React.RefObject<THREE.Group | null> }) {
  const tines = useRef<THREE.InstancedMesh>(null);
  const inner = useRef<THREE.InstancedMesh>(null);
  const OUT = 72;
  const IN = 36;

  const bamboo = useMemo(
    () => new THREE.MeshPhysicalMaterial({ color: "#d9bc7f", roughness: 0.55, sheen: 0.6, sheenColor: new THREE.Color("#f3dfae"), clearcoat: 0.3 }),
    [],
  );

  useEffect(() => {
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    const place = (mesh: THREE.InstancedMesh, n: number, r0: number, flare: number, len: number) => {
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        e.set(0, -a, flare);
        q.setFromEuler(e);
        const pos = new THREE.Vector3(Math.cos(a) * r0, -len / 2, Math.sin(a) * r0);
        // rotate around the attachment point by offsetting along the tilted axis
        const dir = new THREE.Vector3(0, -1, 0).applyQuaternion(q).multiplyScalar(len / 2);
        pos.set(Math.cos(a) * r0 + dir.x, dir.y, Math.sin(a) * r0 + dir.z);
        m.compose(pos, q, new THREE.Vector3(1, 1, 1));
        mesh.setMatrixAt(i, m);
      }
      mesh.instanceMatrix.needsUpdate = true;
    };
    if (tines.current) place(tines.current, OUT, 0.13, 0.3, 0.62);
    if (inner.current) place(inner.current, IN, 0.08, 0.12, 0.5);
  }, []);

  return (
    <group ref={g} position={[1.75, -0.02, 0]}>
      {/* handle with a bamboo node */}
      <mesh material={bamboo} position-y={0.45} castShadow>
        <cylinderGeometry args={[0.14, 0.15, 0.9, 40]} />
      </mesh>
      <mesh material={bamboo} position-y={0.32}>
        <torusGeometry args={[0.152, 0.012, 8, 40]} />
      </mesh>
      {/* thread binding */}
      <mesh position-y={-0.02}>
        <torusGeometry args={[0.17, 0.018, 8, 48]} />
        <meshStandardMaterial color="#efe6d0" roughness={0.9} />
      </mesh>
      {/* gold star charm */}
      <mesh position={[0, -0.1, 0.24]} rotation-x={0.2}>
        <octahedronGeometry args={[0.05, 0]} />
        <meshStandardMaterial color="#e6c37a" metalness={1} roughness={0.18} />
      </mesh>
      <instancedMesh ref={tines} args={[undefined, undefined, OUT]} material={bamboo} castShadow>
        <boxGeometry args={[0.012, 0.62, 0.004]} />
      </instancedMesh>
      <instancedMesh ref={inner} args={[undefined, undefined, IN]} material={bamboo}>
        <boxGeometry args={[0.01, 0.5, 0.004]} />
      </instancedMesh>
    </group>
  );
}

/* ── pouring stream ───────────────────────────────────────────────────── */

const streamFrag = /* glsl */ `
  uniform float uTime; uniform vec3 uColor; uniform float uOpacity;
  varying vec2 vUv;
  void main(){
    float flow = 0.75 + 0.25 * sin(vUv.y * 60.0 + uTime * 18.0);
    float core = smoothstep(0.0, 0.5, 1.0 - abs(vUv.x - 0.5) * 2.0);
    gl_FragColor = vec4(uColor * flow, core * uOpacity * smoothstep(0.0, 0.08, vUv.y));
  }
`;
const simpleVert = /* glsl */ `
  varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }
`;

function Scene() {
  const bowlMat = useBowlMaterial();
  const bowlGeo = useMemo(() => new THREE.LatheGeometry(bowlProfile(), 128), []);
  const whisk = useRef<THREE.Group>(null);
  const liquid = useRef<THREE.Mesh>(null);
  const mound = useRef<THREE.Mesh>(null);
  const stream = useRef<THREE.Mesh>(null);
  const world = useRef<THREE.Group>(null);
  const burst = useRef(0);
  const { size, camera } = useThree();

  const liquidUniforms = useMemo(
    () => ({ uTime: { value: 0 }, uFoam: { value: 0 }, uMilk: { value: 0 }, uSwirl: { value: 0 } }),
    [],
  );
  const streamUniforms = useMemo(
    () => ({ uTime: { value: 0 }, uColor: { value: new THREE.Color("#dfeee8") }, uOpacity: { value: 0 } }),
    [],
  );

  useEffect(() => () => bowlGeo.dispose(), [bowlGeo]);

  useFrame((state, dt) => {
    const s = ritual.progress * 4; // four steps
    const t = state.clock.elapsedTime;
    liquidUniforms.uTime.value = t;
    streamUniforms.uTime.value = t;

    // step 1 — sift: the mound of powder appears
    const powderIn = sstep(s, 0.1, 0.9);
    // step 2 — pour water
    const water = sstep(s, 1.05, 1.9);
    const pouring = sstep(s, 1.0, 1.15) * (1 - sstep(s, 1.85, 2.0));
    // step 3 — whisk
    const whiskIn = sstep(s, 2.0, 2.25) * (1 - sstep(s, 2.85, 3.05));
    const foam = sstep(s, 2.15, 2.9);
    // step 4 — oat milk
    const milkPour = sstep(s, 3.05, 3.2) * (1 - sstep(s, 3.85, 4.0));
    const milk = sstep(s, 3.1, 3.9);

    if (mound.current) {
      const k = Math.max(0.0001, powderIn * (1 - water));
      mound.current.scale.set(k, k * 0.8, k);
    }
    if (liquid.current) {
      const fill = Math.max(water, milk * 1.0);
      liquid.current.visible = fill > 0.001;
      liquid.current.position.y = -0.4 + fill * 0.38 + milk * 0.1;
      const r = 0.52 + fill * 0.45 + milk * 0.08;
      liquid.current.scale.set(r, r, r);
    }
    liquidUniforms.uFoam.value = foam;
    liquidUniforms.uMilk.value = milk;
    liquidUniforms.uSwirl.value = damp(liquidUniforms.uSwirl.value, foam * 3 + milk * 4, 2, dt);

    if (stream.current) {
      const op = Math.max(pouring, milkPour);
      streamUniforms.uOpacity.value = damp(streamUniforms.uOpacity.value, op * 0.85, 8, dt);
      stream.current.visible = streamUniforms.uOpacity.value > 0.01;
      streamUniforms.uColor.value.set(milkPour > pouring ? "#f4efe2" : "#d7ece4");
    }

    if (whisk.current) {
      // resting upright beside the bowl → dipped in and whisking in a fast "M" motion
      const restX = 1.75;
      const zig = Math.sin(t * 22) * 0.32 * whiskIn;
      const drift = Math.sin(t * 2.3) * 0.12 * whiskIn;
      const x = THREE.MathUtils.lerp(restX, zig, whiskIn);
      const y = THREE.MathUtils.lerp(-0.02, 0.22, whiskIn);
      whisk.current.position.x = damp(whisk.current.position.x, x, whiskIn > 0.5 ? 30 : 6, dt);
      whisk.current.position.y = damp(whisk.current.position.y, y, 6, dt);
      whisk.current.position.z = damp(whisk.current.position.z, drift, 20, dt);
      whisk.current.rotation.z = damp(whisk.current.rotation.z, -zig * 0.35, 20, dt);
    }

    burst.current = sstep(s, 0.1, 0.6) * (1 - sstep(s, 0.9, 1.2)) * 1.5;

    if (world.current) {
      world.current.rotation.y = damp(world.current.rotation.y, -0.2 + ritual.progress * 0.6, 3, dt);
    }

    // slow camera push in
    const mobile = size.width < 768;
    const dist = (mobile ? 9.2 : 7.2) - ritual.progress * 0.8;
    camera.position.set(0, dist * 0.5, dist);
    camera.lookAt(0, -0.1, 0);
  });

  return (
    <>
      <group ref={world}>
        <mesh geometry={bowlGeo} material={bowlMat} castShadow receiveShadow />
        <mesh ref={mound} position-y={-0.44} scale={0.0001}>
          <sphereGeometry args={[0.35, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#7fa23b" roughness={1} />
        </mesh>
        <mesh ref={liquid} rotation-x={-Math.PI / 2} position-y={-0.4} visible={false}>
          <circleGeometry args={[1.02, 96]} />
          <shaderMaterial vertexShader={simpleVert} fragmentShader={liquidFrag} uniforms={liquidUniforms} transparent />
        </mesh>
        <mesh ref={stream} position={[0.15, 1.9, 0.1]} visible={false}>
          <cylinderGeometry args={[0.035, 0.05, 4.4, 16, 1, true]} />
          <shaderMaterial vertexShader={simpleVert} fragmentShader={streamFrag} uniforms={streamUniforms} transparent depthWrite={false} />
        </mesh>
        
        <Chasen g={whisk} />
      </group>
      <group position-y={-1.5} scale={0.6}>
        <Powder count={size.width < 768 ? 140 : 260} burst={burst} opacity={0.7} />
      </group>
      <ContactShadows position={[0, -0.63, 0]} scale={8} blur={2.2} opacity={0.6} far={2} color="#02120c" />
    </>
  );
}

export default function RitualScene() {
  return (
    <Canvas
      shadows
      dpr={[1, 1.6]}
      camera={{ position: [0, 3.6, 7.2], fov: 30 }}
      gl={{ antialias: true, alpha: true, toneMapping: THREE.ACESFilmicToneMapping }}
    >
      <ambientLight intensity={0.25} />
      <spotLight position={[3, 7, 3]} angle={0.45} penumbra={1} intensity={70} color="#fff1d4" castShadow shadow-mapSize={[1024, 1024]} />
      <spotLight position={[-4, 3, -2]} angle={0.6} penumbra={1} intensity={30} color="#a8dcc0" />
      <Suspense fallback={null}>
        <Environment resolution={128} frames={1}>
          <Lightformer form="rect" intensity={2.5} color="#fff4dc" position={[0, 5, 2]} scale={[6, 1.5, 1]} rotation-x={Math.PI / 2} />
          <Lightformer form="rect" intensity={1.6} color="#ffffff" position={[-4, 1, 2]} scale={[1, 5, 1]} rotation-y={Math.PI / 2} />
          <Lightformer form="ring" intensity={1} color="#b6e0c6" position={[3, 1, -4]} scale={3} />
        </Environment>
        <Scene />
      </Suspense>
    </Canvas>
  );
}
