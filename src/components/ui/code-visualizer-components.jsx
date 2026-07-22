import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Cpu,
  ChevronRight,
  ChevronLeft,
  RotateCcw,
  Upload,
  Download,
  Settings,
  ChevronDown,
  Terminal,
  Keyboard,
  FileCode,
  Gauge,
  Layers,
  Database,
  Braces,
  ListCollapse,
  Activity,
  Sparkles,
  Info,
} from "lucide-react";

// ==========================================
// TYPES & CONSTANTS
// ==========================================

export const DEFAULT_CODE_LINES = [
  {
    text: "function binarySearch(arr, target) {",
    indent: 0,
    tokens: [
      { t: "function", c: "text-amber-500 font-semibold" },
      { t: " ", c: "" },
      { t: "binarySearch", c: "text-blue-400 font-medium" },
      { t: "(", c: "" },
      { t: "arr", c: "text-orange-300" },
      { t: ", ", c: "" },
      { t: "target", c: "text-orange-300" },
      { t: ") {", c: "" },
    ],
  },
  {
    text: "  let left = 0;",
    indent: 1,
    tokens: [
      { t: "  let", c: "text-amber-500 font-semibold" },
      { t: " left = ", c: "" },
      { t: "0", c: "text-emerald-400" },
      { t: ";", c: "" },
    ],
  },
  {
    text: "  let right = arr.length - 1;",
    indent: 1,
    tokens: [
      { t: "  let", c: "text-amber-500 font-semibold" },
      { t: " right = arr.", c: "" },
      { t: "length", c: "text-sky-300" },
      { t: " - ", c: "" },
      { t: "1", c: "text-emerald-400" },
      { t: ";", c: "" },
    ],
  },
  { text: "  ", indent: 1, tokens: [{ t: "", c: "" }] },
  {
    text: "  while (left <= right) {",
    indent: 1,
    tokens: [
      { t: "  while", c: "text-amber-500 font-semibold" },
      { t: " (left <= right) {", c: "" },
    ],
  },
  {
    text: "    const mid = Math.floor((left + right) / 2);",
    indent: 2,
    tokens: [
      { t: "    const", c: "text-amber-500 font-semibold" },
      { t: " mid = ", c: "" },
      { t: "Math", c: "text-teal-400" },
      { t: ".", c: "" },
      { t: "floor", c: "text-blue-400" },
      { t: "((left + right) / ", c: "" },
      { t: "2", c: "text-emerald-400" },
      { t: ");", c: "" },
    ],
  },
  {
    text: "    if (arr[mid] === target) {",
    indent: 2,
    tokens: [
      { t: "    if", c: "text-amber-500 font-semibold" },
      { t: " (arr[mid] === target) {", c: "" },
    ],
  },
  {
    text: "      return mid; // Found!",
    indent: 3,
    tokens: [
      { t: "      return", c: "text-amber-500 font-semibold" },
      { t: " mid; ", c: "" },
      { t: "// Found!", c: "text-zinc-500 italic" },
    ],
  },
  { text: "    }", indent: 2, tokens: [{ t: "    }", c: "" }] },
  {
    text: "    if (arr[mid] < target) {",
    indent: 2,
    tokens: [
      { t: "    if", c: "text-amber-500 font-semibold" },
      { t: " (arr[mid] < target) {", c: "" },
    ],
  },
  {
    text: "      left = mid + 1;",
    indent: 3,
    tokens: [
      { t: "      left = mid + ", c: "" },
      { t: "1", c: "text-emerald-400" },
      { t: ";", c: "" },
    ],
  },
  {
    text: "    } else {",
    indent: 2,
    tokens: [
      { t: "    }", c: "" },
      { t: " else", c: "text-amber-500 font-semibold" },
      { t: " {", c: "" },
    ],
  },
  {
    text: "      right = mid - 1;",
    indent: 3,
    tokens: [
      { t: "      right = mid - ", c: "" },
      { t: "1", c: "text-emerald-400" },
      { t: ";", c: "" },
    ],
  },
  { text: "    }", indent: 2, tokens: [{ t: "    }", c: "" }] },
  { text: "  }", indent: 1, tokens: [{ t: "  }", c: "" }] },
  {
    text: "  return -1; // Not found",
    indent: 1,
    tokens: [
      { t: "  return", c: "text-amber-500 font-semibold" },
      { t: " -", c: "" },
      { t: "1", c: "text-emerald-400" },
      { t: "; ", c: "" },
      { t: "// Not found", c: "text-zinc-500 italic" },
    ],
  },
  { text: "}", indent: 0, tokens: [{ t: "}", c: "" }] },
];

export const SIMULATION_STEPS = [
  {
    stepNum: 1,
    lineNum: 1,
    status: "Completed",
    timestamp: "10:25:31.002",
    variables: { arr: "[1, 3, 5, 7, 9]", target: "7" },
    stack: [
      { name: "binarySearch", args: "arr=[1,3,5,7,9], target=7", vars: {} },
    ],
    heap: [{ address: "0x8fa12", type: "Array(5)", value: "[1, 3, 5, 7, 9]" }],
    consoleOut: ["> Invoked binarySearch with target 7"],
    explanation:
      "The execution starts. The function `binarySearch` is invoked with array `[1, 3, 5, 7, 9]` and target `7`. A new stack frame is pushed.",
  },
  {
    stepNum: 2,
    lineNum: 2,
    status: "Completed",
    timestamp: "10:25:31.250",
    variables: { arr: "[1, 3, 5, 7, 9]", target: "7", left: "0" },
    stack: [
      {
        name: "binarySearch",
        args: "arr=[1,3,5,7,9], target=7",
        vars: { left: 0 },
      },
    ],
    heap: [{ address: "0x8fa12", type: "Array(5)", value: "[1, 3, 5, 7, 9]" }],
    consoleOut: [
      "> Invoked binarySearch with target 7",
      "> left pointer initialized to 0",
    ],
    explanation:
      "Line 2: The pointer `left` is initialized to `0` representing the start boundary of the search space.",
  },
  {
    stepNum: 3,
    lineNum: 3,
    status: "Completed",
    timestamp: "10:25:31.500",
    variables: { arr: "[1, 3, 5, 7, 9]", target: "7", left: "0", right: "4" },
    stack: [
      {
        name: "binarySearch",
        args: "arr=[1,3,5,7,9], target=7",
        vars: { left: 0, right: 4 },
      },
    ],
    heap: [{ address: "0x8fa12", type: "Array(5)", value: "[1, 3, 5, 7, 9]" }],
    consoleOut: [
      "> Invoked binarySearch with target 7",
      "> left pointer initialized to 0",
      "> right pointer initialized to 4",
    ],
    explanation:
      "Line 3: The pointer `right` is initialized to `4` (arr.length - 1), representing the end boundary of the search space.",
  },
  {
    stepNum: 4,
    lineNum: 5,
    status: "Completed",
    timestamp: "10:25:31.810",
    variables: { arr: "[1, 3, 5, 7, 9]", target: "7", left: "0", right: "4" },
    stack: [
      {
        name: "binarySearch",
        args: "arr=[1,3,5,7,9], target=7",
        vars: { left: 0, right: 4 },
      },
    ],
    heap: [{ address: "0x8fa12", type: "Array(5)", value: "[1, 3, 5, 7, 9]" }],
    consoleOut: [
      "> Invoked binarySearch with target 7",
      "> left pointer initialized to 0",
      "> right pointer initialized to 4",
      "> loop check left <= right (0 <= 4) is True",
    ],
    explanation:
      "Line 5: Entering the while loop. The condition `left <= right` (0 <= 4) holds true, so we proceed inside the loop block.",
  },
  {
    stepNum: 5,
    lineNum: 6,
    status: "Completed",
    timestamp: "10:25:32.112",
    variables: {
      arr: "[1, 3, 5, 7, 9]",
      target: "7",
      left: "0",
      right: "4",
      mid: "2",
    },
    stack: [
      {
        name: "binarySearch",
        args: "arr=[1,3,5,7,9], target=7",
        vars: { left: 0, right: 4, mid: 2 },
      },
    ],
    heap: [{ address: "0x8fa12", type: "Array(5)", value: "[1, 3, 5, 7, 9]" }],
    consoleOut: [
      "> Invoked binarySearch with target 7",
      "> left pointer initialized to 0",
      "> right pointer initialized to 4",
      "> loop check left <= right (0 <= 4) is True",
      "> mid index calculated: 2 (value: arr[2] = 5)",
    ],
    explanation:
      "Line 6: We calculate the midpoint: `mid = Math.floor((0 + 4) / 2) = 2`. The element at index 2 is `5`.",
  },
  {
    stepNum: 6,
    lineNum: 7,
    status: "Completed",
    timestamp: "10:25:32.400",
    variables: {
      arr: "[1, 3, 5, 7, 9]",
      target: "7",
      left: "0",
      right: "4",
      mid: "2",
    },
    stack: [
      {
        name: "binarySearch",
        args: "arr=[1,3,5,7,9], target=7",
        vars: { left: 0, right: 4, mid: 2 },
      },
    ],
    heap: [{ address: "0x8fa12", type: "Array(5)", value: "[1, 3, 5, 7, 9]" }],
    consoleOut: [
      "> Invoked binarySearch with target 7",
      "> left pointer initialized to 0",
      "> right pointer initialized to 4",
      "> loop check left <= right (0 <= 4) is True",
      "> mid index calculated: 2 (value: arr[2] = 5)",
      "> check arr[mid] === target (5 === 7 is False)",
    ],
    explanation:
      "Line 7: Check if `arr[mid] === target` (5 === 7). It is false, so we bypass the return statement.",
  },
  {
    stepNum: 7,
    lineNum: 10,
    status: "Completed",
    timestamp: "10:25:32.650",
    variables: {
      arr: "[1, 3, 5, 7, 9]",
      target: "7",
      left: "0",
      right: "4",
      mid: "2",
    },
    stack: [
      {
        name: "binarySearch",
        args: "arr=[1,3,5,7,9], target=7",
        vars: { left: 0, right: 4, mid: 2 },
      },
    ],
    heap: [{ address: "0x8fa12", type: "Array(5)", value: "[1, 3, 5, 7, 9]" }],
    consoleOut: [
      "> Invoked binarySearch with target 7",
      "> left pointer initialized to 0",
      "> right pointer initialized to 4",
      "> loop check left <= right (0 <= 4) is True",
      "> mid index calculated: 2 (value: arr[2] = 5)",
      "> check arr[mid] === target (5 === 7 is False)",
      "> check arr[mid] < target (5 < 7 is True)",
    ],
    explanation:
      "Line 10: Check if `arr[mid] < target` (5 < 7). This is true. The target must be in the right half.",
  },
  {
    stepNum: 8,
    lineNum: 11,
    status: "Completed",
    timestamp: "10:25:32.900",
    variables: {
      arr: "[1, 3, 5, 7, 9]",
      target: "7",
      left: "3",
      right: "4",
      mid: "2",
    },
    stack: [
      {
        name: "binarySearch",
        args: "arr=[1,3,5,7,9], target=7",
        vars: { left: 3, right: 4, mid: 2 },
      },
    ],
    heap: [{ address: "0x8fa12", type: "Array(5)", value: "[1, 3, 5, 7, 9]" }],
    consoleOut: [
      "> Invoked binarySearch with target 7",
      "> left pointer initialized to 0",
      "> right pointer initialized to 4",
      "> loop check left <= right (0 <= 4) is True",
      "> mid index calculated: 2 (value: arr[2] = 5)",
      "> check arr[mid] === target (5 === 7 is False)",
      "> check arr[mid] < target (5 < 7 is True)",
      "> left updated to mid + 1 = 3",
    ],
    explanation:
      "Line 11: We adjust the search window. `left` is set to `mid + 1`, which is `3`. The search space is now index 3 to 4.",
  },
  {
    stepNum: 9,
    lineNum: 5,
    status: "Completed",
    timestamp: "10:25:33.200",
    variables: {
      arr: "[1, 3, 5, 7, 9]",
      target: "7",
      left: "3",
      right: "4",
      mid: "2",
    },
    stack: [
      {
        name: "binarySearch",
        args: "arr=[1,3,5,7,9], target=7",
        vars: { left: 3, right: 4, mid: 2 },
      },
    ],
    heap: [{ address: "0x8fa12", type: "Array(5)", value: "[1, 3, 5, 7, 9]" }],
    consoleOut: [
      "> Invoked binarySearch with target 7",
      "> left pointer initialized to 0",
      "> right pointer initialized to 4",
      "> loop check left <= right (0 <= 4) is True",
      "> mid index calculated: 2 (value: arr[2] = 5)",
      "> check arr[mid] === target (5 === 7 is False)",
      "> check arr[mid] < target (5 < 7 is True)",
      "> left updated to mid + 1 = 3",
      "> loop check left <= right (3 <= 4) is True",
    ],
    explanation:
      "Line 5: Loop check again. `left <= right` (3 <= 4) holds true. We enter the loop a second time.",
  },
  {
    stepNum: 10,
    lineNum: 6,
    status: "Completed",
    timestamp: "10:25:33.450",
    variables: {
      arr: "[1, 3, 5, 7, 9]",
      target: "7",
      left: "3",
      right: "4",
      mid: "3",
    },
    stack: [
      {
        name: "binarySearch",
        args: "arr=[1,3,5,7,9], target=7",
        vars: { left: 3, right: 4, mid: 3 },
      },
    ],
    heap: [{ address: "0x8fa12", type: "Array(5)", value: "[1, 3, 5, 7, 9]" }],
    consoleOut: [
      "> Invoked binarySearch with target 7",
      "> left pointer initialized to 0",
      "> right pointer initialized to 4",
      "> loop check left <= right (0 <= 4) is True",
      "> mid index calculated: 2 (value: arr[2] = 5)",
      "> check arr[mid] === target (5 === 7 is False)",
      "> check arr[mid] < target (5 < 7 is True)",
      "> left updated to mid + 1 = 3",
      "> loop check left <= right (3 <= 4) is True",
      "> mid index calculated: 3 (value: arr[3] = 7)",
    ],
    explanation:
      "Line 6: We calculate the midpoint: `mid = Math.floor((3 + 4) / 2) = 3`. The element at index 3 is `7`.",
  },
  {
    stepNum: 11,
    lineNum: 7,
    status: "Completed",
    timestamp: "10:25:33.700",
    variables: {
      arr: "[1, 3, 5, 7, 9]",
      target: "7",
      left: "3",
      right: "4",
      mid: "3",
    },
    stack: [
      {
        name: "binarySearch",
        args: "arr=[1,3,5,7,9], target=7",
        vars: { left: 3, right: 4, mid: 3 },
      },
    ],
    heap: [{ address: "0x8fa12", type: "Array(5)", value: "[1, 3, 5, 7, 9]" }],
    consoleOut: [
      "> Invoked binarySearch with target 7",
      "> left pointer initialized to 0",
      "> right pointer initialized to 4",
      "> loop check left <= right (0 <= 4) is True",
      "> mid index calculated: 2 (value: arr[2] = 5)",
      "> check arr[mid] === target (5 === 7 is False)",
      "> check arr[mid] < target (5 < 7 is True)",
      "> left updated to mid + 1 = 3",
      "> loop check left <= right (3 <= 4) is True",
      "> mid index calculated: 3 (value: arr[3] = 7)",
      "> check arr[mid] === target (7 === 7 is True)",
    ],
    explanation:
      "Line 7: Check if `arr[mid] === target` (7 === 7). This is true!",
  },
  {
    stepNum: 12,
    lineNum: 8,
    status: "Current",
    timestamp: "10:25:33.950",
    variables: {
      arr: "[1, 3, 5, 7, 9]",
      target: "7",
      left: "3",
      right: "4",
      mid: "3",
      returnValue: "3",
    },
    stack: [
      {
        name: "binarySearch",
        args: "arr=[1,3,5,7,9], target=7",
        vars: { left: 3, right: 4, mid: 3, returnValue: 3 },
      },
    ],
    heap: [{ address: "0x8fa12", type: "Array(5)", value: "[1, 3, 5, 7, 9]" }],
    consoleOut: [
      "> Invoked binarySearch with target 7",
      "> left pointer initialized to 0",
      "> right pointer initialized to 4",
      "> loop check left <= right (0 <= 4) is True",
      "> mid index calculated: 2 (value: arr[2] = 5)",
      "> check arr[mid] === target (5 === 7 is False)",
      "> check arr[mid] < target (5 < 7 is True)",
      "> left updated to mid + 1 = 3",
      "> loop check left <= right (3 <= 4) is True",
      "> mid index calculated: 3 (value: arr[3] = 7)",
      "> check arr[mid] === target (7 === 7 is True)",
      "> return mid (3) from binarySearch",
    ],
    explanation:
      "Line 8: Return the index `3`. The target was found successfully in `12` operations. Execution ends here.",
  },
];

// ==========================================
// TOP TOOLBAR COMPONENT
// ==========================================

export function Toolbar({
  currentStep,
  maxSteps,
  onStepForward,
  onStepBack,
  onReset,
  lang,
  setLang,
  speed,
  setSpeed,
  isInputOpen,
  setIsInputOpen,
  isCompiling,
  onCompile,
  isRunning,
  onRun,
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#232323] bg-[#111111]/80 px-4 py-2.5 backdrop-blur-md">
      {/* Left side actions */}
      <div className="flex items-center gap-2">
        {/* Language selector */}
        <div className="relative">
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value)}
            className="h-8 appearance-none rounded-[var(--radius-sm)] border border-[#232323] bg-[#161616] pl-2.5 pr-8 text-caption font-medium text-[var(--color-text-primary)] hover:border-[#35363c] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
          >
            <option value="javascript">JavaScript</option>
            <option value="python">Python</option>
            <option value="cpp">C++</option>
            <option value="java">Java</option>
          </select>
          <ChevronDown className="absolute right-2 top-2.5 h-3.5 w-3.5 pointer-events-none text-[var(--color-text-tertiary)]" />
        </div>

        <div className="h-5 w-px bg-[#232323]" />

        {/* Compile/Run Actions */}
        <button
          onClick={onCompile}
          disabled={isCompiling}
          className={`flex h-8 items-center gap-1.5 rounded-[var(--radius-sm)] border border-[#232323] bg-[#161616] px-3 text-caption font-medium text-[var(--color-text-primary)] transition-all hover:bg-[#1f1f1f] hover:border-[#35363c] disabled:opacity-50 cursor-pointer`}
        >
          <Cpu
            className={`h-3.5 w-3.5 ${isCompiling ? "animate-spin text-[var(--color-accent)]" : ""}`}
          />
          <span>{isCompiling ? "Compiling..." : "Compile"}</span>
        </button>

        <button
          onClick={onRun}
          disabled={isRunning}
          className={`flex h-8 items-center gap-1.5 rounded-[var(--radius-sm)] bg-[#22C55E] px-3.5 text-caption font-semibold text-black transition-all hover:bg-[#2fd66d] disabled:opacity-50 cursor-pointer`}
        >
          <Play
            className={`h-3.5 w-3.5 fill-black ${isRunning ? "animate-pulse" : ""}`}
          />
          <span>{isRunning ? "Running..." : "Run"}</span>
        </button>
      </div>

      {/* Middle side timeline navigation */}
      <div className="flex items-center gap-1.5 rounded-[var(--radius-sm)] border border-[#232323] bg-[#161616] p-0.5">
        <button
          onClick={onStepBack}
          disabled={currentStep === 1}
          className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-xs)] text-[var(--color-text-secondary)] hover:bg-[#232323] hover:text-[var(--color-text-primary)] disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
          title="Step Backward"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <span className="px-2 text-micro font-mono text-[var(--color-text-tertiary)] min-w-[70px] text-center select-none">
          Step {currentStep} / {maxSteps}
        </span>

        <button
          onClick={onStepForward}
          disabled={currentStep === maxSteps}
          className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-xs)] text-[var(--color-text-secondary)] hover:bg-[#232323] hover:text-[var(--color-text-primary)] disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
          title="Step Forward"
        >
          <ChevronRight className="h-4 w-4" />
        </button>

        <div className="mx-0.5 h-4 w-px bg-[#232323]" />

        <button
          onClick={onReset}
          className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-xs)] text-[var(--color-text-secondary)] hover:bg-[#232323] hover:text-[var(--color-text-primary)] cursor-pointer"
          title="Reset Execution"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Right side controls */}
      <div className="flex items-center gap-2">
        {/* Speed Selector */}
        <div className="relative flex items-center">
          <span className="hidden lg:inline mr-1.5 text-caption text-[var(--color-text-tertiary)]">
            Speed:
          </span>
          <div className="relative">
            <select
              value={speed}
              onChange={(e) => setSpeed(e.target.value)}
              className="h-8 appearance-none rounded-[var(--radius-sm)] border border-[#232323] bg-[#161616] pl-2.5 pr-8 text-caption font-medium text-[var(--color-text-primary)] hover:border-[#35363c] focus:outline-none"
            >
              <option value="0.5">0.5x</option>
              <option value="1.0">1.0x (Normal)</option>
              <option value="2.0">2.0x</option>
            </select>
            <Gauge className="absolute right-2 top-2.5 h-3.5 w-3.5 pointer-events-none text-[var(--color-text-tertiary)]" />
          </div>
        </div>

        {/* Input Toggle Button */}
        <button
          onClick={() => setIsInputOpen(!isInputOpen)}
          className={`flex h-8 items-center gap-1.5 rounded-[var(--radius-sm)] border border-[#232323] px-3 text-caption font-medium transition-all cursor-pointer ${
            isInputOpen
              ? "bg-[#12321f] border-[#22c55e]/30 text-[#22c55e]"
              : "bg-[#161616] text-[var(--color-text-primary)] hover:bg-[#1f1f1f] hover:border-[#35363c]"
          }`}
        >
          <Keyboard className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Input</span>
        </button>

        <div className="h-5 w-px bg-[#232323]" />

        {/* Upload Code */}
        <button
          className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] border border-[#232323] bg-[#161616] text-[var(--color-text-secondary)] hover:bg-[#1f1f1f] hover:text-[var(--color-text-primary)] cursor-pointer"
          title="Upload Code"
        >
          <Upload className="h-3.5 w-3.5" />
        </button>

        {/* Download Code */}
        <button
          className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] border border-[#232323] bg-[#161616] text-[var(--color-text-secondary)] hover:bg-[#1f1f1f] hover:text-[var(--color-text-primary)] cursor-pointer"
          title="Download Code File"
        >
          <Download className="h-3.5 w-3.5" />
        </button>

        {/* Settings button */}
        <button
          className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] border border-[#232323] bg-[#161616] text-[var(--color-text-secondary)] hover:bg-[#1f1f1f] hover:text-[var(--color-text-primary)] cursor-pointer"
          title="Editor Settings"
        >
          <Settings className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

// ==========================================
// MOCK MONACO EDITOR COMPONENT
// ==========================================

export function EditorPanel({ currentLineNum, language }) {
  const [foldedLines, setFoldedLines] = useState({});

  const toggleFold = (lineIndex) => {
    setFoldedLines((prev) => ({
      ...prev,
      [lineIndex]: !prev[lineIndex],
    }));
  };

  // Determine if a line should be collapsed based on parent folders
  const isLineHidden = (lineIndex) => {
    // Basic hardcoded folding scope for our sample code:
    if (foldedLines[1] && lineIndex >= 2 && lineIndex <= 15) return true;
    if (foldedLines[5] && lineIndex >= 6 && lineIndex <= 13) return true;
    if (foldedLines[7] && lineIndex >= 8 && lineIndex <= 8) return true;
    if (foldedLines[10] && lineIndex >= 11 && lineIndex <= 13) return true;

    return false;
  };

  return (
    <div className="flex h-full flex-col bg-[#0b0b0b]">
      {/* Editor Header */}
      <div className="flex items-center justify-between border-b border-[#232323] bg-[#111111]/70 px-4 py-2 text-micro text-[var(--color-text-secondary)] select-none">
        <div className="flex items-center gap-2">
          <FileCode className="h-3.5 w-3.5 text-[#22C55E]" />
          <span className="font-mono font-medium">
            binary_search.
            {language === "cpp"
              ? "cpp"
              : language === "python"
                ? "py"
                : language === "java"
                  ? "java"
                  : "js"}
          </span>
          <span className="rounded-full bg-[#232323] px-1.5 py-0.5 text-[10px]">
            main branch
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-[#22C55E]" />
          <span>Active Session</span>
        </div>
      </div>

      {/* Editor Main Content Area */}
      <div className="relative flex flex-1 min-h-0 w-full overflow-hidden">
        {/* Editor Body */}
        <div className="flex-1 overflow-auto py-3 font-mono text-body-sm leading-6 selection:bg-[#22c55e]/20 select-text">
          {DEFAULT_CODE_LINES.map((line, idx) => {
            const lineNum = idx + 1;
            const isCurrent = lineNum === currentLineNum;
            const isFolded = foldedLines[lineNum];
            const hasFoldOption = [1, 5, 7, 10, 12].includes(lineNum);
            const isHidden = isLineHidden(lineNum);

            if (isHidden) return null;

            return (
              <div
                key={idx}
                className={`relative flex items-start group min-w-max transition-colors ${
                  isCurrent
                    ? "bg-[#22C55E]/10 border-l-[3px] border-[#22C55E]"
                    : "border-l-[3px] border-transparent"
                }`}
              >
                {/* Line Gutter (Numbers & Folding) */}
                <div className="flex w-12 shrink-0 select-none items-center justify-end pr-3 text-right text-caption text-[var(--color-text-disabled)] font-mono">
                  {hasFoldOption && (
                    <button
                      onClick={() => toggleFold(lineNum)}
                      className="absolute left-1.5 opacity-0 group-hover:opacity-100 transition-opacity text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] cursor-pointer"
                    >
                      <ChevronDown
                        className={`h-3 w-3 transition-transform ${isFolded ? "-rotate-90" : ""}`}
                      />
                    </button>
                  )}
                  <span
                    className={isCurrent ? "text-[#22C55E] font-semibold" : ""}
                  >
                    {lineNum}
                  </span>
                </div>

                {/* Line content tokens */}
                <div
                  className={`pr-4 flex-1 whitespace-pre pl-1 ${isCurrent ? "text-[var(--color-text-primary)]" : "text-[var(--color-text-secondary)]"}`}
                >
                  {isFolded ? (
                    <span className="text-[var(--color-text-disabled)] italic font-sans text-caption bg-[#1b1b1b] px-1 rounded-sm border border-[#232323] cursor-pointer">
                      {line.text.slice(0, 25)} ... {/* folded indicator */}
                    </span>
                  ) : (
                    line.tokens.map((token, tokIdx) => (
                      <span key={tokIdx} className={token.c}>
                        {token.t}
                      </span>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Monaco Minimap Mock */}
        <div className="hidden md:flex flex-col w-[60px] border-l border-[#232323] bg-[#0b0b0b] select-none py-4 overflow-hidden shrink-0 opacity-40 hover:opacity-85 transition-opacity">
          {DEFAULT_CODE_LINES.map((line, idx) => {
            const lineNum = idx + 1;
            const isCurrent = lineNum === currentLineNum;
            const isFolded = foldedLines[lineNum];
            const isHidden = isLineHidden(lineNum);

            if (isHidden) return null;

            return (
              <div
                key={idx}
                className={`h-[3px] w-full flex items-center px-1 py-0.5 gap-0.5`}
              >
                <div
                  className={`h-full rounded-sm transition-all ${
                    isCurrent
                      ? "bg-[#22C55E] w-[85%]"
                      : isFolded
                        ? "bg-amber-500 w-[20%]"
                        : "bg-[var(--color-text-disabled)]"
                  }`}
                  style={{
                    width: `${Math.max(15, line.text.trim().length * 2.2)}%`,
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Editor Status Bar */}
      <div className="flex items-center justify-between border-t border-[#232323] bg-[#111111] px-4 py-1.5 text-micro text-[var(--color-text-tertiary)] font-mono select-none">
        <div className="flex items-center gap-3">
          <span>LN {currentLineNum}, COL 1</span>
          <span>SPACES: 2</span>
          <span>UTF-8</span>
        </div>
        <div className="flex items-center gap-3">
          <span>LF</span>
          <span className="uppercase text-[var(--color-accent)]">
            {language === "javascript" ? "JS / ES6" : language}
          </span>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// INPUT CONSOLE CONTROLLER (BOTTOM LEFT)
// ==========================================

export function InputConsole() {
  const [inputValue, setInputValue] = useState("[1, 3, 5, 7, 9]\n7");

  return (
    <div className="flex h-full flex-col bg-[#111111] text-[var(--color-text-primary)]">
      {/* Title */}
      <div className="flex items-center gap-1.5 border-b border-[#232323] bg-[#161616]/70 px-4 py-2 text-caption font-semibold select-none">
        <Terminal className="h-3.5 w-3.5 text-[var(--color-text-secondary)]" />
        <span>Input Console</span>
        <span className="ml-auto text-micro text-[var(--color-text-tertiary)] italic">
          Placeholder Only
        </span>
      </div>

      {/* Console Input area */}
      <div className="flex-1 p-3">
        <textarea
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="h-full w-full bg-transparent font-mono text-body-sm text-[var(--color-text-primary)] placeholder-zinc-700 focus:outline-none resize-none"
          placeholder="Enter program input here (e.g. array numbers or target)"
        />
      </div>

      {/* Console details */}
      <div className="flex items-center border-t border-[#232323] bg-[#161616]/30 px-4 py-1 text-micro text-[var(--color-text-tertiary)] font-mono select-none">
        <span>stdin buffer</span>
        <span className="ml-auto">Ctrl + Enter to Save</span>
      </div>
    </div>
  );
}

// ==========================================
// EXECUTION TIMELINE (CENTER PANEL)
// ==========================================

export function TimelinePanel({ steps, currentStepIndex, onSelectStep }) {
  return (
    <div className="flex h-full flex-col bg-[#111111]">
      {/* Timeline Header */}
      <div className="flex items-center gap-2 border-b border-[#232323] bg-[#161616]/70 px-4 py-2.5 text-caption font-semibold select-none">
        <Activity className="h-3.5 w-3.5 text-[#22C55E]" />
        <span>Execution Timeline</span>
        <span className="rounded-full bg-[#12321f] text-[#22c55e] border border-[#22c55e]/20 px-2 py-0.5 text-micro font-mono">
          {steps.length} Steps Trace
        </span>
      </div>

      {/* Steps List Scroll Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {steps.map((step, idx) => {
          const isCurrent = idx === currentStepIndex;
          const isPassed = idx < currentStepIndex;

          return (
            <div key={idx} className="relative flex flex-col items-stretch">
              {/* Connector line between steps */}
              {idx < steps.length - 1 && (
                <div
                  className={`absolute left-4 top-8 bottom-[-20px] w-0.5 z-0 transition-colors ${
                    idx < currentStepIndex ? "bg-[#22C55E]/50" : "bg-[#232323]"
                  }`}
                />
              )}

              {/* Step Row Component */}
              <button
                onClick={() => onSelectStep(idx)}
                className={`relative flex items-start gap-3 rounded-[var(--radius-md)] p-3 text-left w-full border transition-all z-10 cursor-pointer ${
                  isCurrent
                    ? "bg-[#22C55E]/5 border-[#22C55E] shadow-[0_0_16px_-4px_rgba(34,197,94,0.35)]"
                    : isPassed
                      ? "bg-[#161616]/40 border-[#232323] hover:border-[#35363c]"
                      : "bg-[#161616]/20 border-transparent opacity-40 hover:opacity-60"
                }`}
              >
                {/* Step Marker Circle */}
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-mono text-caption font-bold border transition-colors ${
                    isCurrent
                      ? "bg-[#22C55E] text-black border-[#22C55E]"
                      : isPassed
                        ? "bg-[#12321f] text-[#22c55e] border-[#1f5c38]"
                        : "bg-[#161616] text-[var(--color-text-tertiary)] border-[#232323]"
                  }`}
                >
                  {step.stepNum}
                </div>

                {/* Step Details */}
                <div className="flex-1 min-w-0 pr-2">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-body-sm font-semibold text-[var(--color-text-primary)]">
                      Line {step.lineNum}
                    </span>
                    <span className="text-micro font-mono text-[var(--color-text-tertiary)]">
                      {step.timestamp}
                    </span>
                  </div>

                  <p className="mt-1 text-caption text-[var(--color-text-secondary)] line-clamp-2 leading-relaxed">
                    {step.explanation}
                  </p>

                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {Object.entries(step.variables).map(([name, val]) => (
                      <span
                        key={name}
                        className="inline-flex items-center gap-1 font-mono text-micro bg-[#1a1b1f] border border-[#26272c] rounded px-1.5 py-0.5 text-[var(--color-text-secondary)]"
                      >
                        <span className="text-orange-300 font-semibold">
                          {name}
                        </span>
                        <span className="text-[var(--color-text-disabled)]">
                          =
                        </span>
                        <span className="text-sky-300 truncate max-w-[80px]">
                          {String(val)}
                        </span>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Status indicator */}
                <div className="flex flex-col items-end gap-1.5 shrink-0 select-none">
                  <span
                    className={`rounded-full px-2 py-0.5 text-micro font-medium border font-sans ${
                      isCurrent
                        ? "bg-[#12321f] text-[#22c55e] border-[#22c55e]/30"
                        : isPassed
                          ? "bg-[#161616] text-[var(--color-text-secondary)] border-transparent"
                          : "bg-transparent text-[var(--color-text-disabled)] border-transparent"
                    }`}
                  >
                    {isCurrent ? "Current" : isPassed ? "Passed" : "Pending"}
                  </span>
                </div>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ==========================================
// RIGHT PANEL - ACCORDION SECTIONS
// ==========================================

export function MemoryAccordions({ currentStep }) {
  const [openSections, setOpenSections] = useState({
    variables: true,
    stack: true,
    heap: false,
    callstack: true,
    console: false,
  });

  const toggleSection = (id) => {
    setOpenSections((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div className="flex h-full flex-col overflow-y-auto space-y-2.5 pr-1 select-none">
      {/* 1. VARIABLES ACCORDION */}
      <div className="rounded-[var(--radius-md)] border border-[#232323] bg-[#111111] overflow-hidden">
        <button
          onClick={() => toggleSection("variables")}
          className="flex w-full items-center justify-between px-4 py-2.5 bg-[#161616]/80 text-caption font-semibold text-[var(--color-text-primary)] hover:bg-[#1a1b1f] transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Braces className="h-3.5 w-3.5 text-[#22C55E]" />
            <span>Variables</span>
            <span className="rounded bg-[#232323] px-1.5 py-0.5 text-micro font-mono text-[var(--color-text-tertiary)]">
              {Object.keys(currentStep.variables).length}
            </span>
          </div>
          <ChevronDown
            className={`h-4 w-4 text-[var(--color-text-tertiary)] transition-transform duration-200 ${openSections.variables ? "" : "-rotate-90"}`}
          />
        </button>

        <AnimatePresence initial={false}>
          {openSections.variables && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <div className="border-t border-[#232323] p-3 space-y-1.5">
                {Object.keys(currentStep.variables).length === 0 ? (
                  <p className="text-caption text-[var(--color-text-disabled)] text-center py-2">
                    No variables initialized in this step.
                  </p>
                ) : (
                  Object.entries(currentStep.variables).map(([name, val]) => (
                    <div
                      key={name}
                      className="flex items-center justify-between rounded bg-[#161616] border border-[#232323] px-3 py-1.5 font-mono text-caption"
                    >
                      <span className="text-orange-300 font-semibold">
                        {name}
                      </span>
                      <span className="text-[var(--color-text-disabled)]">
                        :
                      </span>
                      <span className="text-sky-300 font-semibold font-mono truncate max-w-[150px]">
                        {String(val)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 2. STACK MEMORY ACCORDION */}
      <div className="rounded-[var(--radius-md)] border border-[#232323] bg-[#111111] overflow-hidden">
        <button
          onClick={() => toggleSection("stack")}
          className="flex w-full items-center justify-between px-4 py-2.5 bg-[#161616]/80 text-caption font-semibold text-[var(--color-text-primary)] hover:bg-[#1a1b1f] transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Layers className="h-3.5 w-3.5 text-[#22C55E]" />
            <span>Stack Memory</span>
            <span className="rounded bg-[#232323] px-1.5 py-0.5 text-micro font-mono text-[var(--color-text-tertiary)]">
              {currentStep.stack.length} Frame
            </span>
          </div>
          <ChevronDown
            className={`h-4 w-4 text-[var(--color-text-tertiary)] transition-transform duration-200 ${openSections.stack ? "" : "-rotate-90"}`}
          />
        </button>

        <AnimatePresence initial={false}>
          {openSections.stack && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <div className="border-t border-[#232323] p-3 space-y-2.5">
                {currentStep.stack.map((frame, index) => (
                  <div
                    key={index}
                    className="rounded bg-[#161616] border border-[#232323] p-2.5"
                  >
                    <div className="flex items-baseline justify-between mb-1.5 border-b border-[#232323] pb-1">
                      <span className="font-mono text-caption text-[#22C55E] font-bold">
                        {frame.name}
                      </span>
                      <span className="text-micro font-mono text-[var(--color-text-tertiary)]">
                        FP: 0x8aef{index}
                      </span>
                    </div>
                    {/* Frame variables */}
                    <div className="space-y-1">
                      {Object.keys(frame.vars).length === 0 ? (
                        <p className="text-micro text-[var(--color-text-disabled)]">
                          No local frame variables.
                        </p>
                      ) : (
                        Object.entries(frame.vars).map(([k, v]) => (
                          <div
                            key={k}
                            className="flex justify-between font-mono text-micro"
                          >
                            <span className="text-[var(--color-text-secondary)]">
                              {k}
                            </span>
                            <span className="text-sky-300 font-semibold">
                              {String(v)}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 3. HEAP MEMORY ACCORDION */}
      <div className="rounded-[var(--radius-md)] border border-[#232323] bg-[#111111] overflow-hidden">
        <button
          onClick={() => toggleSection("heap")}
          className="flex w-full items-center justify-between px-4 py-2.5 bg-[#161616]/80 text-caption font-semibold text-[var(--color-text-primary)] hover:bg-[#1a1b1f] transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Database className="h-3.5 w-3.5 text-[#22C55E]" />
            <span>Heap Memory</span>
            <span className="rounded bg-[#232323] px-1.5 py-0.5 text-micro font-mono text-[var(--color-text-tertiary)]">
              {currentStep.heap.length}
            </span>
          </div>
          <ChevronDown
            className={`h-4 w-4 text-[var(--color-text-tertiary)] transition-transform duration-200 ${openSections.heap ? "" : "-rotate-90"}`}
          />
        </button>

        <AnimatePresence initial={false}>
          {openSections.heap && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <div className="border-t border-[#232323] p-3 space-y-2">
                {currentStep.heap.map((obj, index) => (
                  <div
                    key={index}
                    className="flex flex-col gap-1 rounded bg-[#161616] border border-[#232323] p-2 font-mono text-caption"
                  >
                    <div className="flex items-center justify-between border-b border-[#232323] pb-1 mb-1">
                      <span className="text-[#22C55E] font-bold text-micro">
                        {obj.address}
                      </span>
                      <span className="text-micro text-[var(--color-text-tertiary)]">
                        {obj.type}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-micro text-[var(--color-text-secondary)]">
                        value:
                      </span>
                      <span className="text-sky-300 font-bold">
                        {String(obj.value)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 4. FUNCTION CALL STACK ACCORDION */}
      <div className="rounded-[var(--radius-md)] border border-[#232323] bg-[#111111] overflow-hidden">
        <button
          onClick={() => toggleSection("callstack")}
          className="flex w-full items-center justify-between px-4 py-2.5 bg-[#161616]/80 text-caption font-semibold text-[var(--color-text-primary)] hover:bg-[#1a1b1f] transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <ListCollapse className="h-3.5 w-3.5 text-[#22C55E]" />
            <span>Function Call Stack</span>
          </div>
          <ChevronDown
            className={`h-4 w-4 text-[var(--color-text-tertiary)] transition-transform duration-200 ${openSections.callstack ? "" : "-rotate-90"}`}
          />
        </button>

        <AnimatePresence initial={false}>
          {openSections.callstack && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <div className="border-t border-[#232323] p-3 space-y-1.5">
                {currentStep.stack.map((frame, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 rounded bg-[#161616] border border-[#232323] px-3 py-2 font-mono text-caption"
                  >
                    <span className="h-2 w-2 rounded-full bg-[#22C55E] shrink-0" />
                    <span className="text-amber-500 font-bold">
                      {frame.name}
                    </span>
                    <span className="text-[var(--color-text-disabled)] font-sans truncate">
                      ({frame.args})
                    </span>
                  </div>
                ))}
                {/* Global scope */}
                <div className="flex items-center gap-2 rounded bg-[#161616]/30 border border-transparent px-3 py-1.5 font-mono text-caption text-[var(--color-text-tertiary)]">
                  <span className="h-2 w-2 rounded-full bg-zinc-700 shrink-0" />
                  <span>anonymous (global scope)</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 5. OUTPUT CONSOLE ACCORDION */}
      <div className="rounded-[var(--radius-md)] border border-[#232323] bg-[#111111] overflow-hidden">
        <button
          onClick={() => toggleSection("console")}
          className="flex w-full items-center justify-between px-4 py-2.5 bg-[#161616]/80 text-caption font-semibold text-[var(--color-text-primary)] hover:bg-[#1a1b1f] transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Terminal className="h-3.5 w-3.5 text-[#22C55E]" />
            <span>Output Console</span>
          </div>
          <ChevronDown
            className={`h-4 w-4 text-[var(--color-text-tertiary)] transition-transform duration-200 ${openSections.console ? "" : "-rotate-90"}`}
          />
        </button>

        <AnimatePresence initial={false}>
          {openSections.console && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <div className="border-t border-[#232323] bg-[#08090a] p-3">
                <div className="h-36 overflow-y-auto font-mono text-micro text-zinc-400 space-y-1 select-text">
                  {currentStep.consoleOut.map((line, index) => (
                    <div
                      key={index}
                      className={
                        line.startsWith(">")
                          ? "text-[#22C55E]/90"
                          : "text-zinc-300"
                      }
                    >
                      {line}
                    </div>
                  ))}
                  <div className="animate-pulse w-1.5 h-3 bg-[var(--color-text-secondary)] inline-block ml-0.5" />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ==========================================
// AI EXPLANATION COMPONENT (BOTTOM PANEL)
// ==========================================

export function AiExplanationPanel() {
  return (
    <div className="rounded-[var(--radius-md)] border border-[#232323] bg-[#111111] p-4 flex flex-col gap-2 h-full">
      <div className="flex items-center gap-2 text-caption font-semibold text-[var(--color-text-primary)] select-none">
        <Sparkles className="h-4 w-4 text-[#22C55E]" />
        <span>AI Tutor Explanation</span>
      </div>
      <div className="flex flex-1 items-center justify-center text-center p-3 bg-[#161616]/40 rounded border border-[#232323]/50">
        <div className="flex flex-col items-center gap-2 max-w-sm">
          <Info className="h-5 w-5 text-[var(--color-text-tertiary)]" />
          <p className="text-body-sm text-[var(--color-text-secondary)] select-text">
            Execution explanations will appear here.
          </p>
          <span className="text-micro text-[var(--color-text-disabled)] select-none">
            Step through the program execution or click Compile to start
            tracing.
          </span>
        </div>
      </div>
    </div>
  );
}
