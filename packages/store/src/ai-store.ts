import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AIProvider = "openai" | "groq" | "minimax" | "none";

interface AIState {
  provider: AIProvider;
  apiKey: string | null;
  setAIConfig: (provider: AIProvider, apiKey: string | null) => void;
  clearAIConfig: () => void;
}

export const useAIStore = create<AIState>()(
  persist(
    (set) => ({
      provider: "none",
      apiKey: null,
      setAIConfig: (provider, apiKey) => set({ provider, apiKey }),
      clearAIConfig: () => set({ provider: "none", apiKey: null }),
    }),
    {
      name: "academyos-ai-settings",
    }
  )
);
