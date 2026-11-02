"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { makeDotTexture } from "./textures";

/* ───────────────────────── floating matcha powder ───────────────────────── */

const powderVert = /* glsl */ `
  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uBurst;
  attribute float aSeed;
  attribute float aSize;
  varying float vAlpha;
  varying float vSeed;
  void main() {
    vec3 p = position;
    float t = uTime * (0.04 + aSeed * 0.05);
    // slow upward drift, wrapping vertically
    p.y = mod(p.y + t * 2.0 + 3.0, 6.0) - 3.0;
    p.x += sin(uTime * 0.3 + aSeed * 40.0) * 0.15;
    p.z += cos(uTime * 0.25 + aSeed * 30.0) * 0.15;
    // burst: particles nearest the tin mouth are thrown up and out
    float near = smoothstep(2.4, 0.0, length(p.xz));
    p.y += uBurst * near * (0.6 + aSeed) * 0.9;
    p.xz *= 1.0 + uBurst * near * 0.35;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = aSize * uPixelRatio * (34.0 / -mv.z);
    float edge = smoothstep(3.0, 2.2, abs(p.y));
    vAlpha = edge * (0.35 + aSeed * 0.65);
    vSeed = aSeed;
  }
`;

const powderFrag = /* glsl */ `
  uniform sampler2D uDot;
  uniform float uOpacity;
  varying float vAlpha;
  varying float vSeed;
  void main() {
    vec4 d = texture2D(uDot, gl_PointCoord);
    vec3 matcha = mix(vec3(0.49, 0.64, 0.24), vec3(0.72, 0.80, 0.42), vSeed);
    vec3 gold = vec3(0.86, 0.74, 0.47);
    vec3 col = mix(matcha, gold, step(0.9, vSeed));
    gl_FragColor = vec4(col, d.a * vAlpha * uOpacity);
  }
`;

export function Powder({
  count = 700,
  burst,
  opacity = 1,
}: {
  count?: number;
  burst?: React.MutableRefObject<number>;
  opacity?: number;
}) {
  const mat = useRef<THREE.ShaderMaterial>(null);
  const { geometry, uniforms } = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const seed = new Float32Array(count);
    const size = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const r = 0.6 + Math.pow(Math.random(), 0.7) * 5.5;
      const a = Math.random() * Math.PI * 2;
      pos[i * 3] = Math.cos(a) * r;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 6;
      pos[i * 3 + 2] = Math.sin(a) * r * 0.6 - 0.5;
      seed[i] = Math.random();
      size[i] = 0.6 + Math.pow(Math.random(), 3) * 3.4;
    }
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
    g.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
    return {
      geometry: g,
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: 1 },
        uBurst: { value: 0 },
        uOpacity: { value: opacity },
        uDot: { value: makeDotTexture() },
      },
    };
  }, [count, opacity]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame((state, dt) => {
    uniforms.uTime.value += dt;
    uniforms.uPixelRatio.value = state.gl.getPixelRatio();
    const target = burst?.current ?? 0;
    uniforms.uBurst.value += (target - uniforms.uBurst.value) * Math.min(1, dt * 3);
  });

  return (
    <points geometry={geometry} frustumCulled={false}>
      <shaderMaterial
        ref={mat}
        vertexShader={powderVert}
        fragmentShader={powderFrag}
        uniforms={uniforms}
        transparent
        depthWrite={false}
      />
    </points>
  );
}

/* ───────────────────────────────── steam ───────────────────────────────── */

const steamVert = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const steamFrag = /* glsl */ `
  uniform float uTime;
  uniform float uOpacity;
  uniform float uSeed;
  varying vec2 vUv;
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
  }
  float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 5; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; }
    return v;
  }
  void main() {
    vec2 uv = vUv;
    float t = uTime * 0.18 + uSeed * 10.0;
    // curl the column sideways as it rises
    uv.x += sin(uv.y * 4.0 + t * 2.0) * 0.08 * uv.y;
    float n = fbm(vec2(uv.x * 3.0, uv.y * 2.2 - t * 1.6));
    float column = smoothstep(0.5, 0.05, abs(uv.x - 0.5));
    float fade = smoothstep(0.0, 0.18, uv.y) * smoothstep(1.0, 0.45, uv.y);
    float a = smoothstep(0.42, 0.85, n) * column * fade;
    gl_FragColor = vec4(vec3(0.96, 0.93, 0.86), a * uOpacity);
  }
`;

export function Steam({
  amount,
  position = [0, 1.9, 0],
}: {
  amount: React.MutableRefObject<number>;
  position?: [number, number, number];
}) {
  const group = useRef<THREE.Group>(null);
  const planes = useMemo(
    () =>
      [0, 1, 2].map((i) => ({
        seed: i * 1.37 + 0.2,
        x: (i - 1) * 0.22,
        scale: 1 + i * 0.18,
        uniforms: { uTime: { value: 0 }, uOpacity: { value: 0 }, uSeed: { value: i * 1.37 + 0.2 } },
      })),
    [],
  );

  useFrame((state, dt) => {
    planes.forEach((p) => {
      p.uniforms.uTime.value += dt;
      const target = amount.current * 0.42;
      p.uniforms.uOpacity.value += (target - p.uniforms.uOpacity.value) * Math.min(1, dt * 2);
    });
    // billboard towards camera (yaw only)
    if (group.current) group.current.quaternion.copy(state.camera.quaternion);
  });

  return (
    <group position={position}>
      <group ref={group}>
        {planes.map((p, i) => (
          <mesh key={i} position={[p.x, p.scale * 0.9, -i * 0.05]} scale={[p.scale * 1.1, p.scale * 2, 1]}>
            <planeGeometry args={[1, 1]} />
            <shaderMaterial
              vertexShader={steamVert}
              fragmentShader={steamFrag}
              uniforms={p.uniforms}
              transparent
              depthWrite={false}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
}

/* ─────────────────────────── studio lighting rig ───────────────────────── */

export function StudioLights({ warm = 1 }: { warm?: number }) {
  return (
    <>
      <ambientLight intensity={0.15} />
      <spotLight
        position={[4, 6, 4]}
        angle={0.4}
        penumbra={1}
        intensity={60 * warm}
        color="#fff2d6"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0001}
      />
      <spotLight position={[-5, 3, -3]} angle={0.5} penumbra={1} intensity={40} color="#9fd8b4" />
      <pointLight position={[0, -2, 3]} intensity={3} color="#e4c98f" />
    </>
  );
}
