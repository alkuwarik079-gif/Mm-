"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer } from "@react-three/drei";
import * as THREE from "three";
import { stage, variantStore } from "@/lib/scene-state";
import type { TinVariant } from "@/lib/products";
import { FLOOR_Y, Tin } from "./Tin";
import { Powder, Steam, StudioLights } from "./Atmosphere";

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
const damp = THREE.MathUtils.damp;

function Rig() {
  const root = useRef<THREE.Group>(null);
  const spinner = useRef<THREE.Group>(null);
  const red = useRef<THREE.Group>(null);
  const silver = useRef<THREE.Group>(null);
  const openRef = useRef(0);
  const steamRef = useRef(0);
  const burstRef = useRef(0);
  const { size } = useThree();

  const swap = useRef({ target: variantStore.get() as TinVariant, extraSpin: 0, mix: variantStore.get() === "red" ? 1 : 0 });

  useEffect(
    () =>
      variantStore.subscribe((v) => {
        swap.current.target = v;
        swap.current.extraSpin += Math.PI * 2;
      }),
    [],
  );

  useFrame((state, dt) => {
    if (!root.current || !spinner.current || !red.current || !silver.current) return;
    const mobile = size.width < 768;
    const t = state.clock.elapsedTime;

    const h = ease(clamp01(stage.hero));
    const m = clamp01(stage.manifesto);
    const c = ease(clamp01(stage.collection));

    // ── position choreography across hero → manifesto → collection ──
    const heroX = mobile ? 0 : 1.5;
    // on phones keep the whole tin (and its lifting lid) below the nav bar
    const heroY = mobile ? 1.24 : -0.12;
    // hero (right) → manifesto (right, lid open, text on the left) → collection (left)
    let x = THREE.MathUtils.lerp(heroX, mobile ? 0 : 1.55, h);
    let y = THREE.MathUtils.lerp(heroY, mobile ? 0.5 : -0.35, h);
    let s = THREE.MathUtils.lerp(mobile ? 0.46 : 0.92, mobile ? 0.5 : 0.85, h);
    x = THREE.MathUtils.lerp(x, mobile ? 0 : -1.7, c);
    y = THREE.MathUtils.lerp(y, mobile ? 1.0 : -0.12, c);
    s = THREE.MathUtils.lerp(s, mobile ? 0.42 : 0.9, c);

    // a gentle float, plus pointer parallax
    y += Math.sin(t * 0.8) * 0.04;
    root.current.position.x = damp(root.current.position.x, x, 4, dt);
    root.current.position.y = damp(root.current.position.y, y, 4, dt);
    root.current.scale.setScalar(damp(root.current.scale.x, s, 4, dt));
    // tipped toward the camera like the product photos, so the lid (and its sticker) shows
    root.current.rotation.x = damp(root.current.rotation.x, 0.42 + stage.pointerY * 0.08, 3, dt);
    root.current.rotation.z = damp(root.current.rotation.z, -stage.pointerX * 0.06, 3, dt);

    // ── rotation: slow turntable + scroll + variant spin ──
    const sw = swap.current;
    const baseSpin = t * 0.25 + stage.hero * Math.PI * 1.2 + m * Math.PI * 0.8;
    // settle the label toward the viewer in the collection
    const settled = THREE.MathUtils.lerp(baseSpin, Math.round(baseSpin / (Math.PI * 2)) * Math.PI * 2 + 0.3, c);
    const targetY = settled + sw.extraSpin + stage.pointerX * 0.4;
    spinner.current.rotation.y = damp(spinner.current.rotation.y, targetY, 3.2, dt);

    // ── variant crossfade by scale (both tins stay mounted) ──
    const want = sw.target === "red" ? 1 : 0;
    sw.mix = damp(sw.mix, want, 5, dt);
    const rs = THREE.MathUtils.smoothstep(sw.mix, 0.35, 1);
    const ss = THREE.MathUtils.smoothstep(1 - sw.mix, 0.35, 1);
    red.current.scale.setScalar(Math.max(0.0001, rs));
    silver.current.scale.setScalar(Math.max(0.0001, ss));
    red.current.visible = rs > 0.001;
    silver.current.visible = ss > 0.001;

    // ── lid: opens as the hero leaves, closes again before the collection ──
    const open = THREE.MathUtils.smoothstep(stage.hero, 0.35, 1) * (1 - THREE.MathUtils.smoothstep(m, 0.7, 1));
    openRef.current = damp(openRef.current, open, 4, dt);
    steamRef.current = openRef.current;
    burstRef.current = openRef.current;
  });

  return (
    <>
      <group ref={root}>
        <group ref={spinner}>
          <Tin ref={red} variant="red" open={openRef} />
          <Tin ref={silver} variant="silver" open={openRef} />
        </group>
        <Steam amount={steamRef} position={[0, 0.72, 0]} />
        <ContactShadows position={[0, FLOOR_Y + 0.01, 0]} scale={6} blur={2.6} opacity={0.55} far={2} resolution={512} color="#02120c" />
      </group>
      <Powder count={size.width < 768 ? 320 : 720} burst={burstRef} />
    </>
  );
}

function PointerTracker() {
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      stage.pointerX = (e.clientX / window.innerWidth) * 2 - 1;
      stage.pointerY = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);
  return null;
}

/** Studio environment built from light-formers — no HDR download needed. */
function Studio() {
  return (
    <Environment resolution={256} frames={1}>
      <color attach="background" args={["#06140f"]} />
      <Lightformer form="rect" intensity={1.4} color="#fff4dc" position={[0, 4, 3]} scale={[6, 1, 1]} rotation-x={Math.PI / 2} />
      <Lightformer form="rect" intensity={1.6} color="#fff6e4" position={[0, 0.5, 5]} scale={[3, 2.5, 1]} />
      <Lightformer form="rect" intensity={2.4} color="#ffffff" position={[-4, 1, 1]} scale={[1, 6, 1]} rotation-y={Math.PI / 2} />
      <Lightformer form="rect" intensity={2.4} color="#fff0d2" position={[4, 1, 1]} scale={[1, 6, 1]} rotation-y={-Math.PI / 2} />
      <Lightformer form="ring" intensity={0.5} color="#d9b770" position={[0, 0, -5]} scale={4} />
      <Lightformer form="rect" intensity={0.6} color="#d9b770" position={[0, -3, 2]} scale={[8, 1, 1]} rotation-x={-Math.PI / 2} />
    </Environment>
  );
}

export default function HeroScene() {
  const [dpr, setDpr] = useState<[number, number]>([1, 1.75]);
  useEffect(() => {
    if (window.innerWidth < 768) setDpr([1, 1.5]);
  }, []);

  return (
    <Canvas
      shadows
      dpr={dpr}
      camera={{ position: [0, 0.6, 7.5], fov: 30 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance", toneMapping: THREE.ACESFilmicToneMapping }}
      onCreated={({ gl, camera }) => {
        gl.toneMappingExposure = 1.05;
        camera.lookAt(0, 0, 0);
      }}
    >
      <PointerTracker />
      <StudioLights />
      <Suspense fallback={null}>
        <Studio />
        <Rig />
      </Suspense>
    </Canvas>
  );
}
