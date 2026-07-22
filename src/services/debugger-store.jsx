import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

const DebuggerContext = createContext(undefined);

const LOCAL_STORAGE_KEY_PROVIDER = "codeinsight-debugger-provider";

export function DebuggerProvider({ children }) {
  const [debugProvider, setDebugProvider] = useState(() => 
    localStorage.getItem(LOCAL_STORAGE_KEY_PROVIDER) || "mock"
  );

  const [auditResponse, setAuditResponse] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Sync settings with localStorage
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY_PROVIDER, debugProvider);
  }, [debugProvider]);

  // Run the code diagnostic audit
  const runCodeAudit = useCallback(async (currentCode) => {
    setIsLoading(true);
    setError(null);

    const activeLang = localStorage.getItem("codeinsight-lang") || "python";

    try {
      const response = await fetch("http://localhost:8080/api/debugger/diagnose", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          code: currentCode,
          language: activeLang,
          errorLogs: "", // optional compilation error logs
          provider: debugProvider.toUpperCase()
        })
      });

      if (!response.ok) {
        throw new Error(`AI Debugger server error: ${response.statusText}`);
      }

      const result = await response.json();
      setAuditResponse(result);
    } catch (err) {
      console.error("AI Debugger diagnose request failed", err);
      setError(err.message || String(err));
    } finally {
      setIsLoading(false);
    }
  }, [debugProvider]);

  const resetDebugger = useCallback(() => {
    setAuditResponse(null);
    setError(null);
  }, []);

  return (
    <DebuggerContext.Provider
      value={{
        debugProvider,
        setDebugProvider,
        auditResponse,
        isLoading,
        error,
        runCodeAudit,
        resetDebugger
      }}
    >
      {children}
    </DebuggerContext.Provider>
  );
}

export function useDebugger() {
  const context = useContext(DebuggerContext);
  if (!context) {
    throw new Error("useDebugger must be used within a DebuggerProvider");
  }
  return context;
}
