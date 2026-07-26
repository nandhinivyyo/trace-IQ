import React, { useRef } from "react";
import {
  Upload,
  Download,
  ChevronDown,
  Copy,
  Trash2,
  AlignLeft,
  ZoomIn,
  ZoomOut,
  AppWindow,
  WrapText,
  Play,
  Cpu,
} from "lucide-react";

// ==========================================
// REUSABLE LANGUAGE SELECTOR
// ==========================================

export function LanguageSelector({ value, onChange }) {
  return (
    <div className="relative select-none">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 appearance-none rounded-[var(--radius-sm)] border border-[#232323] bg-[#161616] pl-2.5 pr-8 text-caption font-semibold text-[var(--color-text-primary)] hover:border-[#35363c] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] cursor-pointer"
      >
        <option value="python">Python</option>
        <option value="java">Java</option>
        <option value="c">C</option>
        <option value="cpp">C++</option>
      </select>
      <ChevronDown className="absolute right-2.5 top-2.5 h-3.5 w-3.5 pointer-events-none text-[var(--color-text-tertiary)]" />
    </div>
  );
}

// ==========================================
// REUSABLE THEME SELECTOR
// ==========================================

export function ThemeSelector({ value, onChange }) {
  return (
    <div className="relative select-none">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 appearance-none rounded-[var(--radius-sm)] border border-[#232323] bg-[#161616] pl-2.5 pr-8 text-caption font-semibold text-[var(--color-text-primary)] hover:border-[#35363c] focus:outline-none cursor-pointer"
      >
        <option value="traceiq-dark">TraceIQ Dark</option>
        <option value="vs-dark">VS Dark</option>
        <option value="light">VS Light</option>
      </select>
      <ChevronDown className="absolute right-2.5 top-2.5 h-3.5 w-3.5 pointer-events-none text-[var(--color-text-tertiary)]" />
    </div>
  );
}

// ==========================================
// REUSABLE EDITOR TOOLBAR
// ==========================================

export function EditorToolbar({
  lang,
  setLang,
  theme,
  setTheme,
  fontSize,
  setFontSize,
  tabSize,
  setTabSize,
  wordWrap,
  setWordWrap,
  showMinimap,
  setShowMinimap,
  onClear,
  onFormat,
  onCopy,
  onDownload,
  onCompile,
  onRun,
  isCompiling,
  isRunning,
}) {
  const fileInputRef = useRef(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result;
        if (text !== undefined) {
          // Detect file extension
          const ext = file.name.split(".").pop()?.toLowerCase();
          if (ext === "py") setLang("python");
          else if (ext === "java") setLang("java");
          else if (ext === "c") setLang("c");
          else if (
            ext === "cpp" ||
            ext === "cc" ||
            ext === "h" ||
            ext === "hpp"
          )
            setLang("cpp");
          // Trigger upload logic in parent
          const customEvent = new CustomEvent("editor-upload-file", {
            detail: text,
          });
          window.dispatchEvent(customEvent);
        }
      };
      reader.readAsText(file);
      e.target.value = ""; // Reset
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#232323] bg-[#111111]/80 px-4 py-2 backdrop-blur-md select-none shrink-0">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept=".py,.java,.c,.cpp,.cc,.h,.hpp,.txt"
      />

      {/* Selectors Group */}
      <div className="flex items-center gap-2 flex-wrap">
        <LanguageSelector value={lang} onChange={setLang} />
        <ThemeSelector value={theme} onChange={setTheme} />

        {/* Font Size Selector */}
        <div className="relative hidden sm:block">
          <select
            value={fontSize}
            onChange={(e) => setFontSize(parseInt(e.target.value))}
            className="h-8 appearance-none rounded-[var(--radius-sm)] border border-[#232323] bg-[#161616] pl-2.5 pr-8 text-caption font-semibold text-[var(--color-text-primary)] hover:border-[#35363c] focus:outline-none cursor-pointer"
          >
            <option value="12">12px</option>
            <option value="14">14px</option>
            <option value="16">16px</option>
            <option value="18">18px</option>
            <option value="20">20px</option>
          </select>
          <ChevronDown className="absolute right-2.5 top-2.5 h-3.5 w-3.5 pointer-events-none text-[var(--color-text-tertiary)]" />
        </div>

        {/* Tab Size Selector */}
        <div className="relative hidden sm:block">
          <select
            value={tabSize}
            onChange={(e) => setTabSize(parseInt(e.target.value))}
            className="h-8 appearance-none rounded-[var(--radius-sm)] border border-[#232323] bg-[#161616] pl-2.5 pr-8 text-caption font-semibold text-[var(--color-text-primary)] hover:border-[#35363c] focus:outline-none cursor-pointer"
          >
            <option value="2">Tab: 2</option>
            <option value="4">Tab: 4</option>
            <option value="8">Tab: 8</option>
          </select>
          <ChevronDown className="absolute right-2.5 top-2.5 h-3.5 w-3.5 pointer-events-none text-[var(--color-text-tertiary)]" />
        </div>

        <div className="h-5 w-px bg-[#232323]" />

        {/* Compile/Run Actions */}
        <button
          onClick={onCompile}
          disabled={isCompiling}
          className="flex h-8 items-center gap-1.5 rounded-[var(--radius-sm)] border border-[#232323] bg-[#161616] px-3 text-caption font-semibold text-[var(--color-text-primary)] transition-all hover:bg-[#1f1f1f] hover:border-[#35363c] disabled:opacity-50 cursor-pointer"
          title="Compile source code"
        >
          <Cpu
            className={`h-3.5 w-3.5 ${isCompiling ? "animate-spin text-[var(--color-accent)]" : ""}`}
          />
          <span>{isCompiling ? "Compiling..." : "Compile"}</span>
        </button>

        <button
          onClick={onRun}
          disabled={isRunning || isCompiling}
          className="flex h-8 items-center gap-1.5 rounded-[var(--radius-sm)] bg-[#22C55E] px-3.5 text-caption font-bold text-black transition-all hover:bg-[#2fd66d] disabled:opacity-50 cursor-pointer shadow-[0_0_12px_rgba(34,197,94,0.15)]"
          title="Run compiled program"
        >
          <Play
            className={`h-3.5 w-3.5 fill-black ${isRunning ? "animate-pulse" : ""}`}
          />
          <span>{isRunning ? "Running..." : "Run"}</span>
        </button>
      </div>

      {/* Editor Toggles & Actions */}
      <div className="flex items-center gap-1.5">
        {/* Zoom Controls */}
        <button
          onClick={() => setFontSize((prev) => Math.min(24, prev + 1))}
          className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] border border-[#232323] bg-[#161616] text-[var(--color-text-secondary)] hover:bg-[#1f1f1f] hover:text-[var(--color-text-primary)] cursor-pointer"
          title="Zoom In"
        >
          <ZoomIn className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => setFontSize((prev) => Math.max(10, prev - 1))}
          className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] border border-[#232323] bg-[#161616] text-[var(--color-text-secondary)] hover:bg-[#1f1f1f] hover:text-[var(--color-text-primary)] cursor-pointer"
          title="Zoom Out"
        >
          <ZoomOut className="h-3.5 w-3.5" />
        </button>

        <div className="h-5 w-px bg-[#232323]" />

        {/* Word Wrap Toggle */}
        <button
          onClick={() => setWordWrap(!wordWrap)}
          className={`flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] border px-1.5 text-caption font-medium transition-all cursor-pointer ${
            wordWrap
              ? "bg-[#12321f] border-[#22c55e]/30 text-[#22c55e]"
              : "bg-[#161616] border-[#232323] text-[var(--color-text-secondary)] hover:bg-[#1f1f1f]"
          }`}
          title="Toggle Word Wrap"
        >
          <WrapText className="h-3.5 w-3.5" />
        </button>

        {/* Minimap Toggle */}
        <button
          onClick={() => setShowMinimap(!showMinimap)}
          className={`hidden md:flex h-8 items-center gap-1 rounded-[var(--radius-sm)] border px-2.5 text-caption font-semibold transition-all cursor-pointer ${
            showMinimap
              ? "bg-[#12321f] border-[#22c55e]/30 text-[#22c55e]"
              : "bg-[#161616] border-[#232323] text-[var(--color-text-secondary)] hover:bg-[#1f1f1f]"
          }`}
          title="Toggle Minimap"
        >
          <AppWindow className="h-3.5 w-3.5" />
          <span className="text-micro font-sans">Minimap</span>
        </button>

        <div className="h-5 w-px bg-[#232323]" />

        {/* Action buttons */}
        <button
          onClick={onFormat}
          className="flex h-8 items-center gap-1.5 rounded-[var(--radius-sm)] border border-[#232323] bg-[#161616] px-2.5 text-caption font-semibold text-[var(--color-text-secondary)] hover:bg-[#1f1f1f] hover:text-[var(--color-text-primary)] cursor-pointer"
          title="Format Code (Alt+Shift+F)"
        >
          <AlignLeft className="h-3.5 w-3.5" />
          <span className="hidden md:inline text-micro">Format</span>
        </button>

        <button
          onClick={onCopy}
          className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] border border-[#232323] bg-[#161616] text-[var(--color-text-secondary)] hover:bg-[#1f1f1f] hover:text-[var(--color-text-primary)] cursor-pointer"
          title="Copy Code"
        >
          <Copy className="h-3.5 w-3.5" />
        </button>

        <button
          onClick={onClear}
          className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] border border-[#232323] bg-[#161616] text-[var(--color-danger)] hover:bg-[#f0473f]/10 cursor-pointer"
          title="Clear Editor"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>

        <div className="h-5 w-px bg-[#232323]" />

        {/* File Actions */}
        <button
          onClick={handleUploadClick}
          className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] border border-[#232323] bg-[#161616] text-[var(--color-text-secondary)] hover:bg-[#1f1f1f] hover:text-[var(--color-text-primary)] cursor-pointer"
          title="Upload Code File"
        >
          <Upload className="h-3.5 w-3.5" />
        </button>

        <button
          onClick={onDownload}
          className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] border border-[#232323] bg-[#161616] text-[var(--color-text-secondary)] hover:bg-[#1f1f1f] hover:text-[var(--color-text-primary)] cursor-pointer"
          title="Download Code File"
        >
          <Download className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

// ==========================================
// REUSABLE EDITOR STATUS BAR
// ==========================================

export function EditorStatusBar({
  lang,
  cursorLine,
  cursorCol,
  lineCount,
  charCount,
  tabSize,
}) {
  return (
    <div className="flex flex-wrap items-center justify-between border-t border-[#232323] bg-[#111111] px-4 py-1.5 text-micro text-[var(--color-text-tertiary)] font-mono select-none shrink-0 gap-2">
      <div className="flex items-center gap-4 flex-wrap">
        <span>
          LN {cursorLine}, COL {cursorCol}
        </span>
        <span>{lineCount} LINES</span>
        <span>{charCount} CHARS</span>
      </div>
      <div className="flex items-center gap-4 flex-wrap">
        <span>SPACES: {tabSize}</span>
        <span>UTF-8</span>
        <span>LF</span>
        <span className="uppercase font-semibold text-[var(--color-accent)]">
          {lang}
        </span>
      </div>
    </div>
  );
}
