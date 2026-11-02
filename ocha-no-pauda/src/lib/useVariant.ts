"use client";
import { useSyncExternalStore } from "react";
import { variantStore } from "./scene-state";

export function useVariant() {
  return useSyncExternalStore(variantStore.subscribe, variantStore.get, variantStore.get);
}
