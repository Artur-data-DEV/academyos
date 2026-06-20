"use client";

import { useState } from "react";
import { Button } from "@academyos/ui/button";
import { useAIStore, AIProvider } from "@academyos/store/ai";
import { KeyRound, Check, Bot } from "lucide-react";

export function BYOKSettings() {
  const { provider, apiKey, setAIConfig, clearAIConfig } = useAIStore();
  const [isOpen, setIsOpen] = useState(false);
  
  const [localProvider, setLocalProvider] = useState<AIProvider>(provider || "none");
  const [localKey, setLocalKey] = useState(apiKey || "");

  const handleSave = () => {
    if (localProvider !== "none" && !localKey) {
      alert("Por favor, insira a chave da API.");
      return;
    }
    setAIConfig(localProvider, localProvider === "none" ? null : localKey);
    setIsOpen(false);
  };

  const handleClear = () => {
    clearAIConfig();
    setLocalProvider("none");
    setLocalKey("");
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => setIsOpen(!isOpen)}
        className="gap-2 text-xs font-medium"
      >
        <Bot className="size-4" />
        AI Mentor: {provider !== "none" ? <span className="text-emerald-500">ON</span> : <span className="text-muted-foreground">OFF</span>}
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-xl border border-border bg-card p-4 shadow-lg">
          <h3 className="flex items-center gap-2 text-sm font-bold text-foreground">
            <KeyRound className="size-4" />
            Bring Your Own Key (BYOK)
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Insira sua chave para habilitar avaliações avançadas (roast arquitetural) sem custo na plataforma.
          </p>

          <div className="mt-4 space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">Provedor</label>
              <select 
                value={localProvider}
                onChange={(e) => setLocalProvider(e.target.value as AIProvider)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="none">Desativado (Cálculo Padrão)</option>
                <option value="openai">OpenAI (gpt-4o-mini)</option>
                <option value="groq">Groq (Llama 3)</option>
                <option value="minimax">MiniMax (M2.5 / M3)</option>
              </select>
            </div>

            {localProvider !== "none" && (
              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">API Key</label>
                <input 
                  type="password"
                  value={localKey}
                  onChange={(e) => setLocalKey(e.target.value)}
                  placeholder={localProvider === "openai" ? "sk-..." : localProvider === "groq" ? "gsk_..." : "Chave da MiniMax..."}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" size="sm" onClick={handleClear}>
                Limpar
              </Button>
              <Button size="sm" onClick={handleSave} className="gap-1">
                <Check className="size-3" />
                Salvar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
