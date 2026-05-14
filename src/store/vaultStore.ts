import { create } from "zustand";
import { persist } from "zustand/middleware";
import { VaultTrade } from "../types/vault";
import { v4 as uuidv4 } from "uuid";

interface VaultState {
  trades: VaultTrade[];
  addTrade: (trade: Omit<VaultTrade, "id">) => void;
  updateTrade: (id: string, updates: Partial<VaultTrade>) => void;
  deleteTrade: (id: string) => void;
  normalizeExistingTrades: () => void;
}

export const normalizePair = (pair: string) => pair.replace(/\//g, "").toUpperCase();

export const useVaultStore = create<VaultState>()(
  persist(
    (set) => ({
      trades: [],
      addTrade: (trade) =>
        set((state) => ({
          trades: [{ ...trade, id: uuidv4(), pair: normalizePair(trade.pair) }, ...state.trades],
        })),
      updateTrade: (id, updates) =>
        set((state) => ({
          trades: state.trades.map((t) =>
            t.id === id ? { ...t, ...updates, ...(updates.pair ? { pair: normalizePair(updates.pair) } : {}) } : t
          ),
        })),
      deleteTrade: (id) =>
        set((state) => ({
          trades: state.trades.filter((t) => t.id !== id),
        })),
      normalizeExistingTrades: () =>
        set((state) => ({
          trades: state.trades.map(t => ({ ...t, pair: normalizePair(t.pair) })),
        })),
    }),
    {
      name: "trader-fx-vault",
    }
  )
);
