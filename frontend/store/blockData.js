import { create } from "zustand";

const useBlockData = create((set) => ({
  blockData: {},
  loading: false,
  error: null,

  setBlockData: (blockData) => set({ blockData }),
  addBlockData: (block) =>
    set((state) => ({ blockData: [...state.blockData, block] })),

  clearBlockData: () => set({ blockData: {} }),
}));

export default useBlockData;
