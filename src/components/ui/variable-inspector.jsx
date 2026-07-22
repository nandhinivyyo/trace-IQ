import { usePlayback } from "@/services/playback-store";
import { Eye, Shield } from "lucide-react";

export function VariableInspector() {
  const { traces, currentStepIdx } = usePlayback();

  if (traces.length === 0 || currentStepIdx === -1) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-6 text-center select-none text-[var(--color-text-tertiary)] font-sans border border-[#232323] bg-[#111111] rounded-[var(--radius-sm)]">
        <Eye className="h-8 w-8 mb-2 opacity-30 text-[var(--color-accent)]" />
        <h4 className="text-caption font-semibold">No Variable Scope Trace</h4>
        <p className="text-micro mt-1 max-w-[200px]">
          Compile and execute code to view variable memory states.
        </p>
      </div>
    );
  }

  const currentStep = traces[currentStepIdx];
  const stepNum = currentStep.stepNumber;
  const vars = currentStep.variablesAfter || [];
  const modifiedNames = new Set(
    currentStep.modifiedVariables?.map((v) => v.name) || [],
  );

  // Split variables by scope
  const localVars = vars.filter((v) => v.scope === "local");
  const globalVars = vars.filter((v) => v.scope === "global");

  return (
    <div className="flex flex-col gap-4 p-4 border border-[#232323] bg-[#111111] rounded-[var(--radius-sm)] h-full overflow-y-auto scrollbar-thin select-none">
      <div className="flex items-center justify-between pb-2 border-b border-[#232323]">
        <div className="flex items-center gap-2">
          <Shield className="h-4.5 w-4.5 text-[#22C55E]" />
          <h3 className="text-caption font-semibold text-[var(--color-text-primary)]">
            Scope Inspector
          </h3>
        </div>
        <span className="text-micro font-mono bg-[#1c1d21] border border-[#232323] px-2 py-0.5 rounded text-[var(--color-text-secondary)]">
          Step {stepNum}
        </span>
      </div>

      {/* Local Variables */}
      <div className="flex flex-col gap-2.5">
        <h4 className="text-micro font-bold text-[var(--color-text-tertiary)] uppercase tracking-wider">
          Local Scope
        </h4>
        <div className="flex flex-col gap-1.5">
          {localVars.map((v) => {
            const isModified = modifiedNames.has(v.name);
            const isCreated = v.createdStep === stepNum;
            return (
              <div
                key={v.name}
                className={`flex flex-col gap-1.5 p-2.5 rounded-[var(--radius-sm)] border transition-all duration-200 ${
                  isModified
                    ? "bg-[#12321f]/20 border-[#22c55e]/40 shadow-[0_0_8px_rgba(34,197,94,0.05)]"
                    : isCreated
                      ? "bg-[#10243c]/20 border-blue-500/30"
                      : "bg-[#0B0B0B] border-[#232323]"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-caption font-mono font-bold text-[var(--color-text-primary)]">
                    {v.name}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <span className="text-micro font-mono text-[var(--color-text-tertiary)] bg-[#161616] px-1.5 py-0.5 border border-[#232323] rounded">
                      {v.datatype}
                    </span>
                    <span className="text-[10px] font-mono text-zinc-600">
                      {v.memoryAddress}
                    </span>
                    {isModified && (
                      <span className="text-[9px] font-bold bg-[#12321f] text-[#22c55e] border border-[#22c55e]/30 px-1 py-0.5 rounded uppercase">
                        Mod
                      </span>
                    )}
                    {isCreated && (
                      <span className="text-[9px] font-bold bg-blue-950 text-blue-400 border border-blue-500/30 px-1 py-0.5 rounded uppercase">
                        New
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-body-sm font-mono text-[var(--color-text-secondary)] bg-[#161616]/40 p-1.5 rounded border border-[#232323]/50 break-all select-text">
                  {v.value}
                </div>
              </div>
            );
          })}
          {localVars.length === 0 && (
            <div className="text-micro text-zinc-700 italic py-1">
              No active variables in local frame.
            </div>
          )}
        </div>
      </div>

      {/* Global Variables */}
      <div className="flex flex-col gap-2.5">
        <h4 className="text-micro font-bold text-[var(--color-text-tertiary)] uppercase tracking-wider">
          Global Scope
        </h4>
        <div className="flex flex-col gap-1.5">
          {globalVars.map((v) => {
            const isModified = modifiedNames.has(v.name);
            const isCreated = v.createdStep === stepNum;
            return (
              <div
                key={v.name}
                className={`flex flex-col gap-1.5 p-2.5 rounded-[var(--radius-sm)] border transition-all duration-200 ${
                  isModified
                    ? "bg-[#12321f]/20 border-[#22c55e]/40 shadow-[0_0_8px_rgba(34,197,94,0.05)]"
                    : isCreated
                      ? "bg-[#10243c]/20 border-blue-500/30"
                      : "bg-[#0B0B0B] border-[#232323]"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-caption font-mono font-bold text-[var(--color-text-primary)]">
                    {v.name}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <span className="text-micro font-mono text-[var(--color-text-tertiary)] bg-[#161616] px-1.5 py-0.5 border border-[#232323] rounded">
                      {v.datatype}
                    </span>
                    <span className="text-[10px] font-mono text-zinc-600">
                      {v.memoryAddress}
                    </span>
                    {isModified && (
                      <span className="text-[9px] font-bold bg-[#12321f] text-[#22c55e] border border-[#22c55e]/30 px-1 py-0.5 rounded uppercase">
                        Mod
                      </span>
                    )}
                    {isCreated && (
                      <span className="text-[9px] font-bold bg-blue-950 text-blue-400 border border-blue-500/30 px-1 py-0.5 rounded uppercase">
                        New
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-body-sm font-mono text-[var(--color-text-secondary)] bg-[#161616]/40 p-1.5 rounded border border-[#232323]/50 break-all select-text">
                  {v.value}
                </div>
              </div>
            );
          })}
          {globalVars.length === 0 && (
            <div className="text-micro text-zinc-700 italic py-1">
              No global scope allocations.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
