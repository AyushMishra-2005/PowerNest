import { create } from "zustand";

const useEspDataStore = create((set) => ({
  allEspData: {},
  loading: false,
  error: null,

  setAllEspData: (allEspData) => set({ allEspData }),
  addBlock: (espData) =>
    set((state) => ({ allEspData: [...state.allEspData, espData] })),

  clearAllEspData: () => set({ allEspData: [] }),
}));

export default useEspDataStore;
