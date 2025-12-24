import { create } from "zustand";

const useBlockStore = create((set) => ({
  blocks: [],
  loading: false,
  error: null,

  setBlocks: (blocks) => set({ blocks }),
  addBlock: (block) =>
    set((state) => ({ blocks: [...state.blocks, block] })),

  clearBlocks: () => set({ blocks: [] }),
}));

export default useBlockStore;
