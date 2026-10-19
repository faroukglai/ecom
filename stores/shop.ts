"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartLine } from "@/lib/pricing";
type ShopState = { lines: CartLine[]; wishlist: string[]; add: (id: string, quantity?: number) => void; update: (id: string, quantity: number) => void; toggleWish: (id: string) => void; clear: () => void; };
export const useShop = create<ShopState>()(persist((set) => ({
  lines: [], wishlist: [],
  add: (id, quantity = 1) => set(state => ({ lines: state.lines.some(l => l.id === id) ? state.lines.map(l => l.id === id ? {...l, quantity: Math.min(20,l.quantity + quantity)} : l) : [...state.lines, { id, quantity: Math.min(20,quantity) }] })),
  update: (id, quantity) => set(state => ({ lines: quantity <= 0 ? state.lines.filter(l => l.id !== id) : state.lines.map(l => l.id === id ? {...l, quantity: Math.min(20,quantity)} : l) })),
  toggleWish: id => set(state => ({ wishlist: state.wishlist.includes(id) ? state.wishlist.filter(i => i !== id) : [...state.wishlist, id] })),
  clear: () => set({ lines: [] }),
}), { name: "hearth-and-hue-shop", skipHydration: true }));
