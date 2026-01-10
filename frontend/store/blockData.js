import { create } from "zustand";
import { persist } from "zustand/middleware";

const useBlockData = create(
  persist(
    (set) => ({
      blockData: null,
      loading: false,
      error: null,

      setBlockData: (blockData) => set({ blockData }),

      updateBlockData: (partial) =>
        set((state) => ({
          blockData: state.blockData
            ? { ...state.blockData, ...partial }
            : partial,
        })),

      clearBlockData: () => set({ blockData: null }),
    }),
    {
      name: "block-data-storage", 
      version: 1,
    }
  )
);

export default useBlockData;
