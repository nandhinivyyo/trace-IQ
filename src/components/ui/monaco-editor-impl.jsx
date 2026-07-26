import { useState, useRef, useEffect } from "react";
import Editor from "@monaco-editor/react";
import { useTheme } from "@/components/theme/theme-provider";
import {
  compileCode,
  runCode,
  detectInputRequirement,
  generateTrace,
  parseInputRequirements,
  isInputLine,
  completeProgram,
} from "@/services/execution-service";

import { InputDialog } from "@/components/ui/input-dialog";
import {
  Database,
  Activity,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  RotateCcw,
  Trash2,
  Copy,
  Download,
  AlignLeft,
  Sparkles,
} from "lucide-react";
import { usePlayback } from "@/services/playback-store";
import { ExecutionTimeline } from "./execution-timeline";
import { VisualizationCanvas } from "@/components/visualization/visualization-canvas";
import { ReplayTimeline } from "./replay-timeline";
import { AiMentorPanel } from "./ai-mentor-panel";
import { AiTutorPanel } from "./ai-tutor-panel";
import { AiDebuggerPanel } from "./ai-debugger-panel";
import {
  exportTraceJson,
  exportSvgFrame,
  printExecutionReport,
} from "@/services/export-manager";

// ==========================================
// DEFAULT SAMPLES
// ==========================================

const CODE_SAMPLES = {
  python: `def binary_search(arr, target):
    """
    Finds the target in a sorted list 'arr'.
    Returns the index if found, else -1.
    """
    left = 0
    right = len(arr) - 1
    
    while left <= right:
        mid = left + (right - left) // 2
        
        # Check if target is present at mid
        if arr[mid] == target:
            return mid
            
        # If target is greater, ignore left half
        elif arr[mid] < target:
            left = mid + 1
            
        # If target is smaller, ignore right half
        else:
            right = mid - 1
            
    # Element was not present
    return -1

# Example usage
numbers = [1, 3, 5, 7, 9]
target_val = 7
result = binary_search(numbers, target_val)
print(f"Target found at index: {result}")
`,
  java: `public class BinarySearch {
    /**
     * Performs standard binary search on a sorted array.
     */
    public static int binarySearch(int[] arr, int target) {
        int left = 0;
        int right = arr.length - 1;
        
        while (left <= right) {
            int mid = left + (right - left) / 2;
            
            // Check if target is present at mid
            if (arr[mid] == target) {
                return mid;
            }
            
            // If target is greater, ignore left half
            if (arr[mid] < target) {
                left = mid + 1;
            } 
            // If target is smaller, ignore right half
            else {
                right = mid - 1;
            }
        }
        
        // Element was not present
        return -1;
    }

    public static void main(String[] args) {
        int[] numbers = {1, 3, 5, 7, 9};
        int targetVal = 7;
        int result = binarySearch(numbers, targetVal);
        System.out.println("Target found at index: " + result);
    }
}
`,
  c: `#include <stdio.h>

/**
 * Performs binary search on a sorted array of integers.
 */
int binarySearch(int arr[], int size, int target) {
    int left = 0;
    int right = size - 1;
    
    while (left <= right) {
        int mid = left + (right - left) / 2;
        
        // Check if target is present at mid
        if (arr[mid] == target) {
            return mid;
        }
        
        // If target is greater, ignore left half
        if (arr[mid] < target) {
            left = mid + 1;
        }
        // If target is smaller, ignore right half
        else {
            right = mid - 1;
        }
    }
    
    // Element not present
    return -1;
}

int main() {
    int numbers[] = {1, 3, 5, 7, 9};
    int size = sizeof(numbers) / sizeof(numbers[0]);
    int targetVal = 7;
    
    int result = binarySearch(numbers, size, targetVal);
    printf("Target found at index: %d\\n", result);
    return 0;
}
`,
  cpp: `#include <iostream>
#include <vector>

/**
 * Searches for target in a sorted std::vector.
 */
int binarySearch(const std::vector<int>& arr, int target) {
    int left = 0;
    int right = arr.size() - 1;
    
    while (left <= right) {
        int mid = left + (right - left) / 2;
        
        // Check if target is present at mid
        if (arr[mid] == target) {
            return mid;
        }
        
        // If target is greater, ignore left half
        if (arr[mid] < target) {
            left = mid + 1;
        }
        // If target is smaller, ignore right half
        else {
            right = mid - 1;
        }
    }
    
    // Element not present
    return -1;
}

int main() {
    std::vector<int> numbers = {1, 3, 5, 7, 9};
    int targetVal = 7;
    
    int result = binarySearch(numbers, targetVal);
    std::cout << "Target found at index: " << result << std::endl;
    return 0;
}
`,
};

// ==========================================
// FULL EDITOR CONTAINER (IMPLEMENTATION)
// ==========================================

export default function MonacoEditorImpl() {
  const [lang, setLang] = useState(
    () => localStorage.getItem("codeinsight-lang") || "python",
  );
  const { theme } = useTheme();
  const [editorValue, setEditorValue] = useState(CODE_SAMPLES[lang] || "");
  
  const [rightPanelTab, setRightPanelTab] = useState("tutor");
  const [isFunctionOnly, setIsFunctionOnly] = useState(true);
  const [isGeneratingProgram, setIsGeneratingProgram] = useState(false);

  useEffect(() => {
    localStorage.setItem("codeinsight-lang", lang);
  }, [lang]);

  useEffect(() => {
    localStorage.setItem("codeinsight-theme", theme);
  }, [theme]);

  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const [decorations, setDecorations] = useState([]);

  const {
    traces,
    setTraces,
    currentStepIdx,
    setCurrentStepIdx,
    clearTraces,
    nextStep,
    prevStep,
    togglePlay,
    isPlaying,
    playbackSpeed,
    setPlaybackSpeed,
    restart,
    jumpToStep,
    bookmarks,
    snapshots,
    saveCurrentSession,
    setConsoleLogs,
    consoleLogs,
    setComplexity,
  } = usePlayback();

  // Monaco line highlighting synchronizer (Line-by-Line PythonTutor Style)
  useEffect(() => {
    if (
      editorRef.current &&
      monacoRef.current &&
      traces.length > 0 &&
      currentStepIdx >= 0 &&
      currentStepIdx < traces.length
    ) {
      const step = traces[currentStepIdx];
      const line = step.currentLineNumber;

      const activeDecorations = [];

      // 1. Green Arrow (Current line executing)
      activeDecorations.push({
        range: new monacoRef.current.Range(line, 1, line, 1),
        options: {
          isWholeLine: true,
          className: "bg-[#34D399]/10 border-l-[3px] border-[#34D399]",
          glyphMarginClassName: "prev-exec-line-glyph",
          hoverMessage: {
            value: `Line currently executing (Step ${step.stepNumber}/${traces.length})`,
          },
        },
      });

      // 2. Red Arrow (Line that just executed) - only if index > 0 and different line
      if (currentStepIdx > 0) {
        const prevStep = traces[currentStepIdx - 1];
        const prevLine = prevStep.currentLineNumber;
        if (prevLine !== line && prevLine > 0) {
          activeDecorations.push({
            range: new monacoRef.current.Range(prevLine, 1, prevLine, 1),
            options: {
              isWholeLine: false,
              className: "bg-[#d01257]/5",
              glyphMarginClassName: "next-exec-line-glyph",
              hoverMessage: {
                value: `Line that just executed`,
              },
            },
          });
        }
      }

      const ids = editorRef.current.deltaDecorations(
        decorations,
        activeDecorations,
      );
      setDecorations(ids);

      // Auto scroll line into view smoothly
      editorRef.current.revealLineInCenter(line);
    } else if (
      editorRef.current &&
      traces.length === 0 &&
      decorations.length > 0
    ) {
      editorRef.current.deltaDecorations(decorations, []);
      setDecorations([]);
    }
  }, [currentStepIdx, traces, editorValue]);

  // Auto-evaluate Time & Space Complexity analysis at the last animation step
  useEffect(() => {
    if (traces.length > 0 && currentStepIdx === traces.length - 1) {
      const codeLower = editorValue.toLowerCase();
      const hasLoop = /\b(for|while)\b/i.test(codeLower) || codeLower.includes(".foreach");
      let timeComp = hasLoop ? "O(N)" : "O(1)";
      let spaceComp = "O(1)";

      if (codeLower.includes("binary_search") || codeLower.includes("binarysearch")) {
        timeComp = "O(log N)";
        spaceComp = "O(1)";
      } else if (codeLower.includes("bubble_sort") || codeLower.includes("bubblesort") ||
                 codeLower.includes("selection_sort") || codeLower.includes("selectionsort") ||
                 codeLower.includes("insertion_sort") || codeLower.includes("insertionsort")) {
        timeComp = "O(N²)";
        spaceComp = "O(1)";
      } else if (codeLower.includes("merge_sort") || codeLower.includes("mergesort")) {
        timeComp = "O(N log N)";
        spaceComp = "O(N)";
      } else if (codeLower.includes("quick_sort") || codeLower.includes("quicksort")) {
        timeComp = "O(N log N)";
        spaceComp = "O(log N)";
      } else if (codeLower.includes("fibonacci") || codeLower.includes("recursion")) {
        if (codeLower.includes("memo") || codeLower.includes("dp")) {
          timeComp = "O(N)";
          spaceComp = "O(N)";
        } else {
          timeComp = "O(2^N)";
          spaceComp = "O(N)";
        }
      }

      setComplexity({ timeComplexity: timeComp, spaceComplexity: spaceComp });
    }
  }, [currentStepIdx, traces, editorValue, setComplexity]);

  // Load sample code when language changes

  useEffect(() => {
    setEditorValue(CODE_SAMPLES[lang] || "");
  }, [lang]);

  // Sync active editor code to localStorage for AI explanation queries
  useEffect(() => {
    localStorage.setItem("codeinsight-code", editorValue);
  }, [editorValue]);

  // Execution & Pipeline states
  const [isCompiling, setIsCompiling] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isInputDialogActive, setIsInputDialogActive] = useState(false);
  const [isConsoleVisible, setIsConsoleVisible] = useState(false);
  const [isWaitingForInput, setIsWaitingForInput] = useState(false);
  const [terminalInputValue, setTerminalInputValue] = useState("");
  const [pendingInputCallback, setPendingInputCallback] = useState(null);

  // Popups & Modal Dialog States
  const [errorModal, setErrorModal] = useState({ show: false, message: "" });
  const [inputModal, setInputModal] = useState({ show: false, requirements: [] });
  const [inputValues, setInputValues] = useState([]);
  const [inputErrors, setInputErrors] = useState([]);
  const [submittedInputs, setSubmittedInputs] = useState([]);
  const lastPromptedStepIdx = useRef(-1);

  // Detect and prompt for dynamic user inputs during stepping
  useEffect(() => {
    if (traces.length === 0 || currentStepIdx === -1) return;

    const currentStep = traces[currentStepIdx];
    if (!currentStep) return;

    // If step crashed with runtime error, do not show the input modal
    if (currentStep.executionStatus === "ERROR") return;

    const codeLine = currentStep.executedSourceCode || "";
    const isInput = isInputLine(codeLine, lang);
    const isLastStep = currentStepIdx === traces.length - 1;

    // Trigger input modal popup if visualizer reaches the blocking input line
    // and we haven't already prompted or collected the input for this specific step index.
    if (isLastStep && isInput && submittedInputs.length <= currentStepIdx && lastPromptedStepIdx.current !== currentStepIdx) {
      lastPromptedStepIdx.current = currentStepIdx;
      const reqs = parseInputRequirements(codeLine, lang);
      const req = reqs[0] || { label: `Enter input:`, type: "string" };

      // Initialize inputs and errors state
      setInputValues([""]);
      setInputErrors([""]);
      setInputModal({
        show: true,
        requirements: [req]
      });
    }
  }, [currentStepIdx, traces, lang, submittedInputs]);

  // Synchronizer: feed editor contents to session manager callback
  useEffect(() => {
    const handleRequestEditorContent = (e) => {
      const cb = e.detail?.callback;
      if (cb && editorRef.current) {
        cb(editorRef.current.getValue());
      }
    };
    window.addEventListener(
      "request-editor-content-for-session",
      handleRequestEditorContent,
    );
    return () => {
      window.removeEventListener(
        "request-editor-content-for-session",
        handleRequestEditorContent,
      );
    };
  }, [editorValue]);

  // Synchronizer: change selected language dropdown from sessions tab
  useEffect(() => {
    const handleChangeLang = (e) => {
      const newLang = e.detail;
      if (newLang) {
        setLang(newLang);
      }
    };
    window.addEventListener("editor-change-lang", handleChangeLang);
    return () => {
      window.removeEventListener("editor-change-lang", handleChangeLang);
    };
  }, []);

  // Handle global upload event
  useEffect(() => {
    const handleUploadEvent = (e) => {
      const text = e.detail;
      if (text !== undefined) {
        setEditorValue(text);
      }
    };
    window.addEventListener("editor-upload-file", handleUploadEvent);
    return () => {
      window.removeEventListener("editor-upload-file", handleUploadEvent);
    };
  }, []);

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Define custom dark theme
    monaco.editor.defineTheme("traceiq-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "", foreground: "D4D4D4", background: "0B0B0B" },
        { token: "comment", foreground: "6A9955", fontStyle: "italic" },
        { token: "keyword", foreground: "569CD6", fontStyle: "bold" },
        { token: "string", foreground: "CE9178" },
        { token: "number", foreground: "B5CEA8" },
      ],
      colors: {
        "editor.background": "#0B0B0B",
        "editor.foreground": "#D4D4D4",
        "editor.selectionBackground": "#1F2937",
        "editor.lineHighlightBackground": "#111111",
        "editor.cursorForeground": "#22C55E",
        editorBorder: "#232323",
        "editorLineNumber.foreground": "#48494F",
        "editorLineNumber.activeForeground": "#22C55E",
        "editor.lineHighlightBorder": "#111111",
        "minimap.background": "#0B0B0B",
      },
    });

    // Track content changes
    editor.onDidChangeModelContent(() => {
      const val = editor.getValue();
      setEditorValue(val);
    });
  };

  const handleGenerateCompleteProgram = async () => {
    if (isGeneratingProgram) return;
    setIsGeneratingProgram(true);
    setConsoleLogs((prev) => [
      ...prev,
      `[AI] Requesting program completion from Gemini API...`,
    ]);

    try {
      const response = await completeProgram(editorValue, lang, isFunctionOnly);
      if (response.code) {
        if (editorRef.current) {
          editorRef.current.setValue(response.code);
        } else {
          setEditorValue(response.code);
        }
        setConsoleLogs((prev) => [
          ...prev,
          `[AI] Success: converted function to a complete program.`,
        ]);
        setIsFunctionOnly(false);
      }
    } catch (err) {
      setConsoleLogs((prev) => [
        ...prev,
        `[AI] Failed to generate program: ${err.message || String(err)}`,
      ]);
    } finally {
      setIsGeneratingProgram(false);
    }
  };

  const handleClear = () => {
    if (editorRef.current) {
      editorRef.current.setValue("");
    }
  };

  const handleFormat = () => {
    if (editorRef.current) {
      editorRef.current.trigger("editor", "editor.action.formatDocument", null);
    }
  };

  const handleCopy = () => {
    if (editorRef.current) {
      navigator.clipboard.writeText(editorRef.current.getValue());
    }
  };

  const handleDownload = () => {
    if (editorRef.current) {
      const content = editorRef.current.getValue();
      const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const ext =
        lang === "python"
          ? "py"
          : lang === "java"
            ? "java"
            : lang === "cpp"
              ? "cpp"
              : "c";
      a.href = url;
      a.download = `traceiq_program.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleCompile = async (stdinInput = "") => {
    if (isCompiling) return;
    setIsCompiling(true);
    setConsoleLogs([
      `[Compiler] Starting compilation and execution check...`,
    ]);

    // Clear previous error decorations
    if (editorRef.current && monacoRef.current) {
      editorRef.current.deltaDecorations(decorations, []);
      setDecorations([]);
    }

    try {
      const result = await compileCode(editorValue, lang);
      if (result.status === "SUCCESS") {
        setConsoleLogs((prev) => [
          ...prev,
          `[Compiler] Syntax compilation check passed.`,
          result.compilerOutput,
          `[Execution] Running program...`,
        ]);

        const runResult = await runCode(editorValue, lang, stdinInput);
        if (runResult.status === "SUCCESS") {
          setConsoleLogs((prev) => [
            ...prev,
            `[Execution] Success: program finished executing.`,
            `[stdout]`,
            runResult.output || "(No console output)",
          ]);
          // Compilation & execution check succeeded, hide console
          setIsConsoleVisible(false);
        } else {
          setConsoleLogs((prev) => [
            ...prev,
            `[Execution] Failed with runtime error:`,
            runResult.error,
          ]);
          // Show console on runtime error
          setIsConsoleVisible(true);
        }
      } else {
        setConsoleLogs((prev) => [
          ...prev,
          `[Compiler] Syntax compilation check failed.`,
          `[Compiler] Errors found: ${result.lineErrors.length}`,
          result.compilerOutput,
        ]);
        // Show console on compiler error
        setIsConsoleVisible(true);

        // Highlight error lines in Monaco
        if (
          editorRef.current &&
          monacoRef.current &&
          result.lineErrors.length > 0
        ) {
          const newDecorations = result.lineErrors.map((err) => ({
            range: new monacoRef.current.Range(err.line, 1, err.line, 1),
            options: {
              isWholeLine: true,
              className: "bg-red-500/10 border-l-[3px] border-red-500",
              glyphMarginClassName: "bg-red-500 rounded-full",
              hoverMessage: { value: err.message },
            },
          }));
          const ids = editorRef.current.deltaDecorations([], newDecorations);
          setDecorations(ids);
          // Scroll first error line into view
          editorRef.current.revealLine(result.lineErrors[0].line);
        }
      }
    } catch (err) {
      setConsoleLogs((prev) => [
        ...prev,
        `[Compiler] Connection failed: unable to reach execution backend.`,
        err.message || String(err),
      ]);
    } finally {
      setIsCompiling(false);
    }
  };

  const handleRun = async (stdinInput, preserveStepIdx = -1) => {
    if (isRunning) return;
    setIsRunning(true);
    if (preserveStepIdx === -1) {
      clearTraces();
    }

    let codeToRun = editorValue;

    if (isFunctionOnly) {
      setConsoleLogs([
        `[AI] Automatically completing standalone function before execution...`,
      ]);
      try {
        const response = await completeProgram(editorValue, lang, true);
        if (response.code) {
          codeToRun = response.code;
          if (editorRef.current) {
            editorRef.current.setValue(response.code);
          }
          setEditorValue(response.code);
          setIsFunctionOnly(false);
          setConsoleLogs((prev) => [
            ...prev,
            `[AI] Success: program completed successfully.`,
          ]);
        }
      } catch (err) {
        setConsoleLogs((prev) => [
          ...prev,
          `[AI] Failed to complete program automatically: ${err.message || String(err)}`,
          `[AI] Attempting execution with original code...`,
        ]);
      }
    }

    setConsoleLogs((prev) => [
      ...prev,
      `[Execution] Preparing compilation symbols...`,
      `[Execution] Requesting step trace from execution engine...`,
    ]);

    try {
      const result = await generateTrace(codeToRun, lang, stdinInput);
      setTraces(result);
      if (preserveStepIdx !== -1) {
        setCurrentStepIdx(preserveStepIdx);
      }

      if (result.length > 0 && result[0].executionStatus === "ERROR") {
        setConsoleLogs([
          `[Execution] Trace generation failed.`,
          result[0].currentConsoleOutput,
        ]);
        // Popup error modal
        setErrorModal({ show: true, message: result[0].currentConsoleOutput });
        setIsConsoleVisible(true);
      } else {
        setConsoleLogs([
          `[Execution] Success: execution trace initialized.`,
          `[Execution] Tracing engine compiled ${result.length} execution steps.`,
          `[Execution] Use the bottom playback controls and timeline to step through visually.`,
        ]);
        setIsConsoleVisible(false);
      }
    } catch (err) {
      setConsoleLogs([
        `[Execution] Sandbox server trace execution error.`,
        err.message || String(err),
      ]);
      // Popup error modal
      setErrorModal({ show: true, message: err.message || String(err) });
      setIsConsoleVisible(true);
    } finally {
      setIsRunning(false);
    }
  };

  const handleRunRequest = () => {
    setSubmittedInputs([]);
    lastPromptedStepIdx.current = -1;
    handleRun("");
  };

  const handleInputChange = (idx, value, type) => {
    const newValues = [...inputValues];
    newValues[idx] = value;
    setInputValues(newValues);

    const newErrors = [...inputErrors];
    if (type === "int") {
      if (value.trim() && !/^-?\d+$/.test(value.trim())) {
        newErrors[idx] = "Value must be a valid integer.";
      } else {
        newErrors[idx] = "";
      }
    } else if (type === "float") {
      if (value.trim() && !/^-?\d*(?:\.\d+)?$/.test(value.trim())) {
        newErrors[idx] = "Value must be a valid number.";
      } else {
        newErrors[idx] = "";
      }
    } else {
      newErrors[idx] = "";
    }
    setInputErrors(newErrors);
  };

  const editorOptions = {
    fontSize: 14,
    tabSize: 4,
    wordWrap: "on",
    minimap: { enabled: false },
    lineNumbers: "on",
    glyphMargin: true,
    folding: true,
    matchBrackets: "always",
    autoClosingBrackets: "always",
    autoClosingQuotes: "always",
    autoIndent: "full",
    stickyScroll: { enabled: true },
    breadcrumbs: { enabled: true },
    formatOnPaste: true,
    formatOnType: true,
    automaticLayout: true,
    fontFamily: "var(--font-mono)",
    fontLigatures: true,
    scrollbar: {
      verticalScrollbarSize: 8,
      horizontalScrollbarSize: 8,
    },
  };

  return (
    <div className="flex h-full w-full flex-col bg-[var(--color-canvas)] border border-[var(--color-border)] overflow-hidden rounded-[var(--radius-md)] select-none">
      {/* Top Header Panel: Unified Execution & Playback Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--color-border)] bg-[var(--color-surface-raised)]/95 px-4 py-2 backdrop-blur-md shrink-0">
        {/* Left: Language & Compilation Triggers */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#22C55E] animate-pulse" />
            <span className="text-caption font-bold tracking-wider text-[var(--color-text-primary)] font-mono uppercase">
              TraceIQ AI
            </span>
          </div>

          <div className="h-4 w-px bg-[var(--color-border)]" />

          <select
            value={lang}
            onChange={(e) => setLang(e.target.value)}
            className="h-8 appearance-none rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface-elevated)] pl-2.5 pr-8 text-caption font-semibold text-[var(--color-text-primary)] hover:border-[var(--color-border-strong)] focus:outline-none cursor-pointer"
          >
            <option value="python">Python</option>
            <option value="java">Java</option>
            <option value="c">C</option>
            <option value="cpp">C++</option>
          </select>

          <div className="h-4 w-px bg-[var(--color-border)]" />

          <label className="flex items-center gap-1.5 text-micro font-semibold text-[var(--color-text-secondary)] cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isFunctionOnly}
              onChange={(e) => setIsFunctionOnly(e.target.checked)}
              className="rounded border-[var(--color-border)] bg-[var(--color-surface-elevated)] accent-[#22C55E] h-3.5 w-3.5 cursor-pointer"
            />
            <span>Function Only</span>
          </label>

          <button
            onClick={handleGenerateCompleteProgram}
            disabled={isGeneratingProgram || isRunning}
            className="flex h-8 items-center gap-1.5 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-2.5 text-micro font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-overlay)] disabled:opacity-50 cursor-pointer transition-colors"
            title="AI: convert standalone function into complete executable program"
          >
            <Sparkles className={`h-3.5 w-3.5 text-emerald-400 ${isGeneratingProgram ? "animate-pulse" : ""}`} />
            <span>{isGeneratingProgram ? "Generating..." : "Generate Program"}</span>
          </button>

          <div className="h-4 w-px bg-[var(--color-border)]" />

          <button
            onClick={handleRunRequest}
            disabled={isRunning}
            className="flex h-8 items-center gap-1.5 rounded-[var(--radius-sm)] bg-[#22C55E] px-3.5 text-caption font-bold text-black hover:bg-[#2fd66d] disabled:opacity-50 cursor-pointer transition-all shadow-[0_0_10px_rgba(34,197,94,0.1)]"
          >
            <Play className="h-3.5 w-3.5 fill-black text-black" />
            <span>{isRunning ? "Running..." : "Run Trace"}</span>
          </button>
        </div>

        {/* Center: Playback & Timeline Controls (Visible when traces exist) */}
        {traces.length > 0 && (
          <div className="flex items-center gap-3 bg-[var(--color-surface-elevated)] border border-[var(--color-border)] px-3 py-1 rounded-[var(--radius-sm)]">
            <button
              onClick={prevStep}
              disabled={currentStepIdx <= 0}
              className="flex h-7 items-center justify-center gap-1 rounded bg-[var(--color-surface-raised)] border border-[var(--color-border)] px-2.5 text-micro font-bold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-overlay)] disabled:opacity-30 cursor-pointer"
              title="Previous Step"
            >
              <span>&lt;</span>
              <span>Prev</span>
            </button>

            <button
              onClick={togglePlay}
              className="flex h-7 px-3 items-center justify-center gap-1.5 rounded bg-[#22C55E] text-black font-bold text-micro hover:bg-[#2fd66d] cursor-pointer"
            >
              {isPlaying ? (
                <>
                  <Pause className="h-3 w-3 fill-black text-black" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="h-3 w-3 fill-black text-black" />
                  <span>Full Execution</span>
                </>
              )}
            </button>

            <button
              onClick={nextStep}
              disabled={currentStepIdx >= traces.length - 1}
              className="flex h-7 items-center justify-center gap-1 rounded bg-[var(--color-surface-raised)] border border-[var(--color-border)] px-2.5 text-micro font-bold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-overlay)] disabled:opacity-30 cursor-pointer"
              title="Next Step"
            >
              <span>Next</span>
              <span>&gt;</span>
            </button>

            <div className="h-4 w-px bg-[var(--color-border)]" />

            {/* Slider progress */}
            <div className="flex items-center gap-2 min-w-[120px]">
              <input
                type="range"
                min="0"
                max={traces.length - 1}
                value={currentStepIdx}
                onChange={(e) => jumpToStep(parseInt(e.target.value))}
                className="h-1 flex-1 appearance-none rounded bg-[var(--color-border-strong)] accent-[#22C55E] cursor-pointer"
              />

              <span className="text-[10px] font-mono text-[var(--color-text-tertiary)] select-none">
                {String(currentStepIdx + 1).padStart(2, "0")}/
                {String(traces.length).padStart(2, "0")}
              </span>
            </div>
          </div>
        )}

        {/* Right: Utilities */}
        <div className="flex items-center gap-2">
          {/* Download */}
          <button
            onClick={handleDownload}
            className="flex h-8 w-8 items-center justify-center rounded border border-[var(--color-border)] bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-overlay)] cursor-pointer transition-colors"
            title="Download Program File"
          >
            <Download className="h-3.5 w-3.5" />
          </button>

          {/* Clear */}
          <button
            onClick={handleClear}
            className="flex h-8 w-8 items-center justify-center rounded border border-red-500/30 bg-red-500/10 text-red-500 hover:bg-red-500/20 cursor-pointer transition-colors"
            title="Clear Editor Code"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Main Workspace: Left Column (Editor & Console) | Right Column (Visualization Canvas & Timeline) */}
      <div className="flex-1 min-h-0 flex w-full relative gap-4 px-4 py-3 bg-[var(--color-canvas)]">
        {/* Left Column: Monaco Editor & Console Log Output (50% width split, shrinks when visualizing) */}
        <div className={`${traces.length > 0 ? "w-[30%]" : "w-1/2"} shrink-0 flex flex-col gap-3 h-full transition-all duration-300`}>
          <div className="flex-1 min-h-0 relative border border-[var(--color-border)] rounded-[var(--radius-sm)] overflow-hidden">
            <Editor
              height="100%"
              language={lang}
              theme={theme === "light" ? "light" : "traceiq-dark"}
              value={editorValue}
              options={editorOptions}
              onMount={handleEditorDidMount}
              loading={
                <div className="flex h-full w-full items-center justify-center bg-[var(--color-canvas)] text-zinc-500 font-mono text-caption">
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--color-accent)] border-t-transparent" />
                    <span>Loading IDE components...</span>
                  </div>
                </div>
              }
            />
          </div>
          
          {/* Console & Compiler Output Panel (Pops up automatically) */}
          {isConsoleVisible && (
            <div className="h-[220px] shrink-0 border border-[var(--color-border)] rounded-[var(--radius-sm)] overflow-hidden bg-[var(--color-surface-raised)] flex flex-col">
              <div className="flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface-elevated)]/80 px-3 py-1.5 shrink-0 text-micro font-sans font-bold text-[var(--color-text-secondary)] select-none">
                <span>Console & Compilation Output</span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setConsoleLogs([])}
                    className="text-[10px] text-zinc-500 hover:text-zinc-300 underline cursor-pointer"
                  >
                    Clear
                  </button>
                  <button
                    onClick={() => {
                      setIsConsoleVisible(false);
                      setIsWaitingForInput(false);
                    }}
                    className="text-[10px] text-zinc-500 hover:text-red-400 font-bold cursor-pointer transition-colors"
                    title="Close Terminal"
                  >
                    ✕
                  </button>
                </div>
              </div>
              <div className="flex-1 p-3 bg-[var(--color-canvas)] font-mono text-micro overflow-y-auto whitespace-pre-wrap select-text leading-relaxed scrollbar-thin">
                {consoleLogs && consoleLogs.length > 0 ? (
                  <div className="space-y-1">
                    {consoleLogs.map((log, idx) => (
                      <div
                        key={idx}
                        className={
                          log.startsWith("[Execution] Success") ||
                          log.startsWith("[Compiler] Syntax compilation check passed")
                            ? "text-[#22c55e] font-bold"
                            : log.startsWith("[Execution] Failed") ||
                              log.startsWith("[stderr]") ||
                              log.startsWith("[Compiler] Syntax compilation check failed")
                              ? "text-red-500"
                              : "text-zinc-400"
                        }
                      >
                        {log}
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="text-zinc-600 italic select-none">No compiler logs or console output messages.</span>
                )}
              </div>

              {/* Inline input bar for user inputs */}
              {isWaitingForInput && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!terminalInputValue.trim()) return;
                    const val = terminalInputValue;
                    setTerminalInputValue("");
                    setIsWaitingForInput(false);
                    setConsoleLogs((prev) => [
                      ...prev,
                      `[stdin] Input submitted: ${val}`,
                    ]);
                    handleRun(val);
                  }}
                  className="flex items-center gap-2 border-t border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-3 py-1.5 shrink-0 text-micro select-none"
                >
                  <span className="font-mono text-emerald-400 font-bold">stdin &gt;</span>
                  <input
                    type="text"
                    value={terminalInputValue}
                    onChange={(e) => setTerminalInputValue(e.target.value)}
                    placeholder="Type execution inputs here and press Enter..."
                    className="flex-1 bg-transparent font-mono text-[var(--color-text-primary)] border-none outline-none"
                    autoFocus
                  />
                </form>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Visualization Canvas */}
        <div className="flex-1 min-w-0 flex flex-col gap-3 h-full">
          <div className="flex-1 min-h-0 relative border border-[var(--color-border)] rounded-[var(--radius-sm)] overflow-hidden">
            <VisualizationCanvas />
          </div>
        </div>
      </div>

      {/* Input Modal Popup */}
      {inputModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-[480px] rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-6 shadow-2xl">
            <div className="flex items-center gap-3 border-b border-[var(--color-border)] pb-3 mb-5 select-none">
              <span className="h-2.5 w-2.5 rounded-full bg-[#22C55E]" />
              <h3 className="text-body font-bold text-[var(--color-text-primary)]">User Input Required</h3>
            </div>
            
            <div className="space-y-4 mb-6">
              {inputModal.requirements.map((req, idx) => (
                <div key={idx} className="flex flex-col gap-1.5 animate-[fadeIn_0.2s_ease-out]">
                  <label className="text-caption font-bold text-[var(--color-text-secondary)]">
                    {req.label} <span className="text-zinc-500 font-normal">({req.type})</span>
                  </label>
                  <input
                    type="text"
                    id={`input-field-${idx}`}
                    value={inputValues[idx] || ""}
                    onChange={(e) => handleInputChange(idx, e.target.value, req.type)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        if (idx < inputModal.requirements.length - 1) {
                          const nextField = document.getElementById(`input-field-${idx + 1}`);
                          if (nextField) nextField.focus();
                        } else {
                          const isValid = !inputErrors.some((err) => err !== "") && 
                                          !inputValues.some((val) => val === undefined || val === null || val.trim() === "");
                          if (isValid) {
                            const val = inputValues.join("\n");
                            const newInputs = [...submittedInputs, val];
                            setSubmittedInputs(newInputs);
                            setInputModal({ show: false, requirements: [] });
                            handleRun(newInputs.join("\n"), currentStepIdx);
                          }
                        }
                      }
                    }}
                    placeholder={`Enter ${req.type} value...`}
                    className={`w-full rounded-[var(--radius-sm)] border p-2.5 font-mono text-caption text-[var(--color-text-primary)] bg-[var(--color-canvas)] focus:outline-none transition-all ${
                      inputErrors[idx]
                        ? "border-red-500/50 focus:border-red-500"
                        : "border-[var(--color-border)] focus:border-[#22C55E]"
                    }`}
                  />
                  {inputErrors[idx] && (
                    <span className="text-micro font-medium text-red-500 animate-[fadeIn_0.15s_ease-out]">
                      {inputErrors[idx]}
                    </span>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3 select-none">
              <button
                onClick={() => setInputModal({ show: false, requirements: [] })}
                className="px-4 py-2 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] text-caption font-bold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-overlay)] cursor-pointer transition-all"
              >
                Cancel
              </button>
              <button
                disabled={
                  inputErrors.some((err) => err !== "") ||
                  inputValues.some((val) => val === undefined || val === null || val.trim() === "")
                }
                onClick={() => {
                  const val = inputValues.join("\n");
                  const newInputs = [...submittedInputs, val];
                  setSubmittedInputs(newInputs);
                  setInputModal({ show: false, requirements: [] });
                  handleRun(newInputs.join("\n"), currentStepIdx);
                }}
                className="px-5 py-2 rounded-[var(--radius-sm)] bg-[#22C55E] text-caption font-bold text-black hover:bg-[#2fd66d] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all shadow-[0_0_15px_rgba(34,197,94,0.2)]"
              >
                Submit Input
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Modal Popup */}
      {errorModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-[520px] rounded-[var(--radius-md)] border border-red-500/30 bg-[var(--color-surface-elevated)] p-6 shadow-2xl">
            <div className="flex items-center gap-3 border-b border-[var(--color-border)] pb-3 mb-4 select-none">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
              <h3 className="text-body font-bold text-red-500">Trace Execution Error</h3>
            </div>
            <div className="max-h-[250px] overflow-y-auto rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-canvas)] p-4 font-mono text-micro text-red-400 whitespace-pre-wrap leading-relaxed mb-5 scrollbar-thin select-text">
              {errorModal.message || "An unknown compilation or trace engine error occurred."}
            </div>
            <div className="flex justify-end select-none">
              <button
                onClick={() => setErrorModal({ show: false, message: "" })}
                className="px-5 py-2 rounded-[var(--radius-sm)] border border-red-500 bg-red-500/10 text-caption font-bold text-red-400 hover:bg-red-500/20 cursor-pointer transition-all"
              >
                Close Dialog
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
