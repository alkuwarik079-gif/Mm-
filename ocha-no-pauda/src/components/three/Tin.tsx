"use client";

import { forwardRef, useEffect, useMemo, useRef } from "react";
import { useFrame, type ThreeElements } from "@react-three/fiber";
import * as THREE from "three";
import type { TinVariant } from "@/lib/products";
import { makeTinTextures, TIN_H, TIN_R } from "./textures";

export const BODY_HEIGHT = TIN_H;
const R = TIN_R;
const LID_H = 0.62;

/** Lathe profile of the lid: a slightly wider sleeve with rolled edges. */
function lidProfile() {
  const pts: THREE.Vector2[] = [];
  const r = R + 0.035;
  pts.push(new THREE.Vector2(r - 0.004, -0.004));
  pts.push(new THREE.Vector2(r + 0.006, 0.008));
  pts.push(new THREE.Vector2(r + 0.008, 0.03));
  pts.push(new THREE.Vector2(r + 0.004, 0.05));
  pts.push(new THREE.Vector2(r, 0.07));
  pts.push(new THREE.Vector2(r, LID_H - 0.045));
  pts.push(new THREE.Vector2(r - 0.006, LID_H - 0.015));
  pts.push(new THREE.Vector2(r - 0.03, LID_H));
  pts.push(new THREE.Vector2(r - 0.07, LID_H + 0.004));
  return pts;
}

/** A mound of powder with soft, irregular peaks. */
function powderGeometry() {
  const g = new THREE.CircleGeometry(R - 0.035, 96, 0, Math.PI * 2);
  g.rotateX(-Math.PI / 2);
  const pos = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const d = Math.sqrt(x * x + z * z);
    const h =
      (R - d) * 0.06 +
      Math.sin(x * 9.0) * Math.cos(z * 7.0) * 0.012 +
      Math.sin(x * 23.0 + z * 17.0) * 0.006 +
      (Math.random() - 0.5) * 0.008;
    pos.setY(i, Math.max(0, h));
  }
  g.computeVertexNormals();
  return g;
}

type TinProps = {
  variant: TinVariant;
  /** read every frame — 0 closed, 1 fully open */
  open: React.MutableRefObject<number>;
} & Omit<ThreeElements["group"], "ref">;

export const Tin = forwardRef<THREE.Group, TinProps>(function Tin({ variant, open, ...rest }, ref) {
  const lid = useRef<THREE.Group>(null);
  const tex = useMemo(() => makeTinTextures(variant), [variant]);

  const isRed = variant === "red";

  const mats = useMemo(() => {
    const body = new THREE.MeshPhysicalMaterial({
      map: tex.map,
      roughnessMap: tex.mask,
      metalnessMap: tex.mask,
      roughness: 1,
      metalness: 1,
      clearcoat: isRed ? 1 : 0.25,
      clearcoatRoughness: isRed ? 0.08 : 0.3,
      envMapIntensity: isRed ? 1.1 : 1.35,
    });
    const lidOuter = new THREE.MeshPhysicalMaterial({
      color: isRed ? "#ad1f1a" : "#cdced2",
      metalness: isRed ? 0.3 : 1,
      roughness: isRed ? 0.2 : 0.26,
      clearcoat: isRed ? 1 : 0.3,
      clearcoatRoughness: 0.08,
      envMapIntensity: 1.3,
    });
    const interior = new THREE.MeshStandardMaterial({
      color: isRed ? "#cdb98a" : "#c3c5c9",
      metalness: 1,
      roughness: 0.32,
      side: THREE.BackSide,
      envMapIntensity: 1,
    });
    const lidTop = new THREE.MeshPhysicalMaterial({
      map: tex.lidTop,
      metalness: isRed ? 0.35 : 0.85,
      roughness: isRed ? 0.22 : 0.3,
      clearcoat: isRed ? 0.6 : 0.2,
      envMapIntensity: 0.55,
    });
    const lidInner = new THREE.MeshStandardMaterial({
      map: tex.lidInner,
      metalness: 0.9,
      roughness: 0.3,
    });
    const rim = new THREE.MeshStandardMaterial({
      color: isRed ? "#c9b27e" : "#d9dadd",
      metalness: 1,
      roughness: 0.22,
    });
    const powder = new THREE.MeshStandardMaterial({ color: "#7da23a", roughness: 1, metalness: 0 });
    return { body, lidOuter, interior, lidTop, lidInner, rim, powder };
  }, [tex, isRed]);

  useEffect(
    () => () => {
      Object.values(mats).forEach((m) => m.dispose());
      Object.values(tex).forEach((t) => t.dispose());
    },
    [mats, tex],
  );

  const geo = useMemo(() => {
    const body = new THREE.CylinderGeometry(R, R, BODY_HEIGHT, 160, 1, true);
    const lidLathe = new THREE.LatheGeometry(lidProfile(), 160);
    const disc = new THREE.CircleGeometry(R + 0.03, 96);
    const rim = new THREE.TorusGeometry(R + 0.002, 0.014, 12, 160);
    const powder = powderGeometry();
    const bottom = new THREE.CircleGeometry(R, 64);
    return { body, lidLathe, disc, rim, powder, bottom };
  }, []);

  useEffect(() => () => Object.values(geo).forEach((g) => g.dispose()), [geo]);

  const top = BODY_HEIGHT / 2;
  const lidBase = top - LID_H + 0.02;

  useFrame(() => {
    if (!lid.current) return;
    const o = open.current;
    // lift, then tilt and slide aside like the lid being set down
    const lift = THREE.MathUtils.smoothstep(o, 0, 0.55);
    const swing = THREE.MathUtils.smoothstep(o, 0.35, 1);
    lid.current.position.y = lidBase + lift * 0.85 + swing * 0.15;
    lid.current.position.x = swing * 1.05;
    lid.current.position.z = swing * 0.25;
    lid.current.rotation.z = -swing * 0.95;
    lid.current.rotation.x = swing * 0.12;
  });

  return (
    <group ref={ref} {...rest}>
      {/* body — rotated so the label (u = 0.5) faces the camera */}
      <mesh geometry={geo.body} material={mats.body} rotation-y={Math.PI} castShadow receiveShadow />
      <mesh geometry={geo.body} material={mats.interior} scale={[0.995, 1, 0.995]} />
      <mesh geometry={geo.bottom} material={mats.rim} rotation-x={Math.PI / 2} position-y={-top} />
      <mesh geometry={geo.rim} material={mats.rim} rotation-x={Math.PI / 2} position-y={-top + 0.006} />
      <mesh geometry={geo.rim} material={mats.rim} rotation-x={Math.PI / 2} position-y={top} />
      {/* matcha inside */}
      <mesh geometry={geo.powder} material={mats.powder} position-y={top - 0.09} />

      {/* lid */}
      <group ref={lid} position-y={lidBase}>
        <mesh geometry={geo.lidLathe} material={mats.lidOuter} castShadow />
        <mesh geometry={geo.lidLathe} material={mats.interior} />
        <mesh geometry={geo.disc} material={mats.lidTop} rotation-x={-Math.PI / 2} position-y={LID_H + 0.004} />
        <mesh geometry={geo.disc} material={mats.lidInner} rotation-x={Math.PI / 2} position-y={LID_H - 0.006} />
      </group>
    </group>
  );
});
