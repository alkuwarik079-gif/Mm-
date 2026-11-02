"use client";

import { forwardRef, useEffect, useMemo, useRef } from "react";
import { useFrame, type ThreeElements } from "@react-three/fiber";
import * as THREE from "three";
import type { TinVariant } from "@/lib/products";
import { makeTinTextures, TIN_DIMS } from "./textures";

/** every tin stands on the same floor line so the contact shadow fits both */
export const FLOOR_Y = -0.95;

/** Lathe profile of the lid: a slightly wider sleeve with rolled edges. */
function lidProfile(R: number, LID_H: number) {
  const r = R + 0.03;
  return [
    new THREE.Vector2(r - 0.004, -0.004),
    new THREE.Vector2(r + 0.006, 0.008),
    new THREE.Vector2(r + 0.008, 0.028),
    new THREE.Vector2(r + 0.003, 0.045),
    new THREE.Vector2(r, 0.06),
    new THREE.Vector2(r, LID_H - 0.04),
    new THREE.Vector2(r - 0.006, LID_H - 0.012),
    new THREE.Vector2(r - 0.028, LID_H),
    new THREE.Vector2(r - 0.07, LID_H + 0.003),
  ];
}

/** A mound of powder with soft, irregular peaks. */
function powderGeometry(R: number) {
  const g = new THREE.CircleGeometry(R - 0.03, 96, 0, Math.PI * 2);
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
  const { r: R, h: H, lid: LID_H } = TIN_DIMS[variant];
  const tex = useMemo(() => makeTinTextures(variant), [variant]);
  const isRed = variant === "red";

  const mats = useMemo(() => {
    const body = new THREE.MeshPhysicalMaterial({
      map: tex.map,
      roughnessMap: tex.mask,
      metalnessMap: tex.mask,
      roughness: 1,
      metalness: 1,
      // red: deep glossy lacquer · silver: soft satin, barely any coat
      clearcoat: isRed ? 1 : 0,
      clearcoatRoughness: 0.06,
      envMapIntensity: isRed ? 1.1 : 1.0,
    });
    const lidOuter = new THREE.MeshPhysicalMaterial({
      color: isRed ? "#c22a1f" : "#cfd1d4",
      metalness: isRed ? 0.2 : 0.6,
      roughness: isRed ? 0.18 : 0.48,
      clearcoat: isRed ? 1 : 0,
      clearcoatRoughness: 0.06,
      envMapIntensity: isRed ? 1.2 : 1.0,
    });
    const interior = new THREE.MeshStandardMaterial({
      color: isRed ? "#cdb98a" : "#c3c5c9",
      metalness: 1,
      roughness: 0.32,
      side: THREE.BackSide,
    });
    const lidTop = new THREE.MeshPhysicalMaterial({
      map: tex.lidTop,
      metalness: isRed ? 0.1 : 0.4,
      roughness: isRed ? 0.35 : 0.55,
      clearcoat: isRed ? 0.35 : 0,
      clearcoatRoughness: 0.2,
      envMapIntensity: 0.35,
    });
    const lidInner = new THREE.MeshStandardMaterial({ map: tex.lidInner, metalness: 0.9, roughness: 0.3 });
    const rim = new THREE.MeshStandardMaterial({
      color: isRed ? "#8a1812" : "#b9bbbf",
      metalness: isRed ? 0.4 : 1,
      roughness: isRed ? 0.25 : 0.4,
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
    const body = new THREE.CylinderGeometry(R, R, H, 160, 1, true);
    const lidLathe = new THREE.LatheGeometry(lidProfile(R, LID_H), 160);
    const disc = new THREE.CircleGeometry(R + 0.025, 96);
    const rim = new THREE.TorusGeometry(R + 0.002, 0.012, 12, 160);
    const powder = powderGeometry(R);
    const bottom = new THREE.CircleGeometry(R, 64);
    return { body, lidLathe, disc, rim, powder, bottom };
  }, [R, H, LID_H]);

  useEffect(() => () => Object.values(geo).forEach((g) => g.dispose()), [geo]);

  const top = H / 2;
  const lidBase = top - LID_H + 0.02;

  useFrame(() => {
    if (!lid.current) return;
    const o = open.current;
    // lift straight up a little, then set the lid down beside the tin
    const lift = THREE.MathUtils.smoothstep(o, 0, 0.5);
    const swing = THREE.MathUtils.smoothstep(o, 0.3, 1);
    lid.current.position.y = lidBase + lift * 0.55 - swing * 0.35;
    lid.current.position.x = swing * (R * 1.5 + 0.15);
    lid.current.position.z = swing * 0.15;
    lid.current.rotation.z = -swing * 0.5;
    lid.current.rotation.x = swing * 0.1;
  });

  return (
    <group ref={ref} {...rest}>
      <group position-y={FLOOR_Y + top}>
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
    </group>
  );
});
