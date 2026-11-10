import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { GoogleGenerativeAI } from "@google/generative-ai";
import confetti from "canvas-confetti";
import { ChevronRight } from "lucide-react";
import { DsaSidebar } from "./sidebar";
import { DsaMainContent } from "./main-content";
import { MunaChatbot } from "./muna-chatbot";
import { DSA_PROBLEMS } from "./dsa-data";
import { DSA_TRANSLATIONS } from "./dsa-translations";

export default function DsaTutorContainer() {
  const { t, i18n } = useTranslation();
  const [activeProblemId, setActiveProblemId] = useState("two-sum");
  const [activeProblem, setActiveProblem] = useState(DSA_PROBLEMS["two-sum"]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState("en");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // User lists synced with localStorage
  const [savedList, setSavedList] = useState(() => {
    try {
      const saved = localStorage.getItem("traceiq-dsa-saved");
      return saved ? JSON.parse(saved) : ["two-sum"];
    } catch (e) {
      return ["two-sum"];
    }
  });

  const [bookmarkList, setBookmarkList] = useState(() => {
    try {
      const saved = localStorage.getItem("traceiq-dsa-bookmarks");
      return saved ? JSON.parse(saved) : ["two-sum"];
    } catch (e) {
      return ["two-sum"];
    }
  });

  const [historyList, setHistoryList] = useState(() => {
    try {
      const saved = localStorage.getItem("traceiq-dsa-history");
      return saved ? JSON.parse(saved) : [
        { problemId: "two-sum", problemName: "Two Sum", timestamp: new Date().toLocaleTimeString() }
      ];
    } catch (e) {
      return [];
    }
  });

  const [activeCategory, setActiveCategory] = useState("Arrays");

  useEffect(() => {
    localStorage.setItem("traceiq-dsa-saved", JSON.stringify(savedList));
  }, [savedList]);

  useEffect(() => {
    localStorage.setItem("traceiq-dsa-bookmarks", JSON.stringify(bookmarkList));
  }, [bookmarkList]);

  useEffect(() => {
    localStorage.setItem("traceiq-dsa-history", JSON.stringify(historyList));
  }, [historyList]);

  // Reactive translation trigger (offline dictionary lookup + API fallback)
  useEffect(() => {
    const translateActiveProblem = async () => {
      const baseProblem = DSA_PROBLEMS[activeProblemId];
      if (!baseProblem) return;

      // Revert immediately to base English if selected
      if (currentLanguage === "en") {
        setActiveProblem(baseProblem);
        return;
      }

      // Check for high-fidelity offline translation
      const localTrans = DSA_TRANSLATIONS[currentLanguage]?.[activeProblemId];
      if (localTrans) {
        const mergedProblem = {
          ...baseProblem,
          title: localTrans.title || baseProblem.title,
          beginnerExplanation: localTrans.beginnerExplanation || baseProblem.beginnerExplanation,
          whyExists: localTrans.whyExists || baseProblem.whyExists,
          ioWalkthrough: localTrans.ioWalkthrough || baseProblem.ioWalkthrough,
          problemStatement: {
            ...baseProblem.problemStatement,
            question: localTrans.problemStatement?.question || baseProblem.problemStatement?.question,
            subText: localTrans.problemStatement?.subText || baseProblem.problemStatement?.subText,
            constraints: localTrans.problemStatement?.constraints || baseProblem.problemStatement?.constraints
          },
          realLifeAnalogy: {
            ...baseProblem.realLifeAnalogy,
            title: localTrans.realLifeAnalogy?.title || baseProblem.realLifeAnalogy?.title,
            description: localTrans.realLifeAnalogy?.description || baseProblem.realLifeAnalogy?.description
          },
          bruteForce: {
            ...baseProblem.bruteForce,
            idea: localTrans.bruteForce?.idea || baseProblem.bruteForce?.idea
          },
          betterApproach: {
            ...baseProblem.betterApproach,
            idea: localTrans.betterApproach?.idea || baseProblem.betterApproach?.idea
          },
          optimalApproach: {
            ...baseProblem.optimalApproach,
            thinkingProcess: localTrans.optimalApproach?.thinkingProcess || baseProblem.optimalApproach?.thinkingProcess,
            patternRec: localTrans.optimalApproach?.patternRec || baseProblem.optimalApproach?.patternRec
          }
        };
        setActiveProblem(mergedProblem);
        return;
      }

      // Fallback to Gemini translation
      const apiKey = process.env.GEMINI_API_KEY || "";
      if (!apiKey) {
        setActiveProblem(baseProblem);
        return;
      }

      setIsLoading(true);
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
          model: "gemini-1.5-flash",
          generationConfig: { responseMimeType: "application/json" }
        });

        const languageNames = {
          ta: "Tamil", hi: "Hindi", te: "Telugu", kn: "Kannada", ml: "Malayalam",
          bn: "Bangla", de: "German", es: "Spanish", fr: "French", ja: "Japanese",
          zh: "Chinese", ko: "Korean"
        };

        const prompt = `You are a translation bot.
Translate the text values in this JSON object into ${languageNames[currentLanguage] || "Spanish"}.
Keep key names, variable names, code blocks (variables and code syntax logic), numbers, and Big-O complexity symbols (e.g. O(N)) EXACTLY unchanged. Translate explanations, paragraphs, descriptions, titles, list items, and comments in the code blocks.
Here is the JSON object to translate:
${JSON.stringify(baseProblem)}`;

        const response = await model.generateContent(prompt);
        let text = response.response.text().trim();
        
        if (text.startsWith("```json")) text = text.substring(7);
        if (text.endsWith("```")) text = text.substring(0, text.length - 3);
        text = text.trim();

        const parsed = JSON.parse(text);
        setActiveProblem(parsed);
      } catch (err) {
        console.error("Gemini Translation failed, using English:", err);
        setActiveProblem(baseProblem);
      } finally {
        setIsLoading(false);
      }
    };

    translateActiveProblem();
  }, [activeProblemId, currentLanguage]);

  const handleSelectProblem = (id) => {
    if (DSA_PROBLEMS[id]) {
      setActiveProblemId(id);
      
      const exists = historyList.some((h) => h.problemId === id);
      if (!exists) {
        setHistoryList((prev) => [
          { problemId: id, problemName: DSA_PROBLEMS[id].title, timestamp: new Date().toLocaleTimeString() },
          ...prev
        ]);
      }
    }
  };

  const handleSearchSubmit = async (query) => {
    setIsLoading(true);

    let searchKey = query.toLowerCase().replace(/[^a-z0-9]/g, "-").trim();
    if (searchKey.includes("leetcode") || searchKey.includes("geeksforgeeks") || searchKey.includes("hackerrank")) {
      const matches = query.match(/\/problems\/([a-zA-Z0-9-]+)/);
      if (matches && matches[1]) {
        searchKey = matches[1];
      }
    }

    if (DSA_PROBLEMS[searchKey]) {
      setActiveProblemId(searchKey);
      setIsLoading(false);
      
      setHistoryList((prev) => [
        { problemId: searchKey, problemName: DSA_PROBLEMS[searchKey].title, timestamp: new Date().toLocaleTimeString() },
        ...prev
      ]);
      confetti({ particleCount: 80, spread: 50 });
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY || "";
    if (!apiKey) {
      setTimeout(() => {
        const dummyDynamicProblem = {
          id: searchKey,
          title: query.length > 25 ? "Custom DSA Question" : query,
          difficulty: "Medium",
          category: "Trees",
          companyTags: ["Google", "Microsoft"],
          readingTime: "5 mins",
          confidenceScore: 75,
          patternDifficulty: "Medium",
          problemStatement: {
            question: `Custom DSA problem fetched from URL: "${query}". (Gemini API offline simulation)\n\nGiven the inputs, optimize space complexity.`,
            constraints: ["1 <= n <= 1000"],
            examples: [{ input: "n = 1", output: "true", explanation: "Verified match" }]
          },
          beginnerExplanation: "Here is a simplified outline of the custom problem you queried. We iterate and save records.",
          optimalApproach: {
            thinkingProcess: "Analyze the base structures for matches.",
            patternRec: "Tree nodes match traversal logic.",
            stepByStep: ["Start root node", "Recurse subtrees"],
            code: {
              python: `def solveTree(root):\n    return root`,
              java: `public TreeNode solveTree(TreeNode root) {\n    return root;\n}`
            },
            complexity: "O(N)"
          },
          dryRun: [
            { step: 1, ptr: 0, val: 1, action: "Traversing node", decision: "Valid root" }
          ],
          algorithm: ["Perform depth first traversal", "Return node matches"],
          complexityTable: [
            { approach: "Optimal Traversal", time: "O(N)", space: "O(H)" }
          ]
        };
        setActiveProblemId(searchKey);
        setActiveProblem(dummyDynamicProblem);
        setIsLoading(false);
      }, 1200);
      return;
    }

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        generationConfig: { responseMimeType: "application/json" }
      });

      const prompt = `You are a premium AI DSA tutor.
Generate a structured, extremely detailed explanation for the problem: "${query}".
The output MUST be a valid JSON object matching this schema exactly:
{
  "id": "${searchKey}",
  "title": "Problem Name",
  "difficulty": "Easy" | "Medium" | "Hard",
  "category": "Arrays" | "Strings" | "Two Pointers" | "Sliding Window" | "Binary Search" | "Trees" | "Graphs" | "DP" | "Greedy" | "Stack" | "Queue" | "Heap" | "Backtracking",
  "companyTags": ["Amazon", "Google", "Microsoft"],
  "readingTime": "5 mins",
  "confidenceScore": 80,
  "patternDifficulty": "Medium",
  "problemStatement": {
    "question": "Original question and constraints details in Markdown format",
    "subText": "Additional notes",
    "constraints": ["constraint 1"],
    "examples": [{"input": "nums = [1]", "output": "[0]", "explanation": "..."}]
  },
  "beginnerExplanation": "Simplified explanation for beginners in plain English",
  "realLifeAnalogy": {
    "title": "Analogy Title",
    "description": "Custom real-world analogy"
  },
  "whyExists": "Why interviewers test this pattern",
  "ioWalkthrough": "Step by step walk-through of the sample inputs",
  "bruteForce": {
    "idea": "idea details",
    "complexity": "O(N^2)",
    "pros": "pros",
    "cons": "cons",
    "code": {"java": "...", "python": "..."}
  },
  "betterApproach": {
    "idea": "...",
    "complexity": "...",
    "code": "..."
  },
  "optimalApproach": {
    "thinkingProcess": "Detailed thinking process of interviewer",
    "patternRec": "...",
    "stepByStep": ["Step 1", "Step 2"],
    "code": {
      "java": "...",
      "python": "...",
      "cpp": "...",
      "javascript": "...",
      "typescript": "...",
      "go": "..."
    },
    "edgeCases": "...",
    "duplicateHandling": "...",
    "mistakes": "...",
    "complexity": "O(N)"
  },
  "dryRun": [
    {"step": 1, "ptr": 0, "val": 1, "action": "...", "decision": "...", "highlight": [0]}
  ],
  "diagram": {
    "type": "two-pointer",
    "elements": [1],
    "steps": [{"index": 0, "pointers": {"i": 0}, "highlights": [0], "description": "..."}]
  },
  "algorithm": ["step 1"],
  "complexityTable": [
    {"approach": "Optimal", "time": "O(N)", "space": "O(1)"}
  ],
  "patternRecognition": "...",
  "interviewTips": {"mistakes": "...", "optimization": "...", "followups": "...", "expectedDiscussion": "..."},
  "similarProblems": [{"title": "...", "difficulty": "Easy"}],
  "practiceQuestions": [{"title": "...", "difficulty": "Medium"}],
  "keyTakeaways": {"summary": "...", "formulas": ["..."], "patterns": ["..."], "complexities": ["..."]}
}`;

      const response = await model.generateContent(prompt);
      const responseText = response.response.text();
      
      let cleaned = responseText.trim();
      if (cleaned.startsWith("```json")) cleaned = cleaned.substring(7);
      if (cleaned.endsWith("```")) cleaned = cleaned.substring(0, cleaned.length - 3);
      cleaned = cleaned.trim();

      const parsed = JSON.parse(cleaned);
      setActiveProblemId(parsed.id);
      setActiveProblem(parsed);
      
      setHistoryList((prev) => [
        { problemId: parsed.id, problemName: parsed.title, timestamp: new Date().toLocaleTimeString() },
        ...prev
      ]);
      confetti({ particleCount: 100, spread: 70 });
    } catch (err) {
      console.error("Gemini failed to generate explanation, falling back to mock generator:", err);
      
      // 1. Extract a beautiful title from query/URL
      let problemTitle = query.trim();
      if (problemTitle.startsWith("http://") || problemTitle.startsWith("https://")) {
        try {
          const urlObj = new URL(problemTitle);
          const pathParts = urlObj.pathname.split("/").filter(Boolean);
          const probIndex = pathParts.indexOf("problems");
          if (probIndex !== -1 && pathParts[probIndex + 1]) {
            problemTitle = pathParts[probIndex + 1];
          } else {
            problemTitle = pathParts[pathParts.length - 1] || "Custom Problem";
          }
        } catch (e) {
          problemTitle = "Custom Problem";
        }
      }
      
      // Clean up string: e.g. "create-maximum-number" -> "Create Maximum Number"
      problemTitle = problemTitle
        .replace(/-/g, " ")
        .replace(/_/g, " ")
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

      // 2. Determine category, analogies and complexities based on keywords
      let fallbackCategory = "Arrays";
      let fallbackAnalogyTitle = "The File Cabinet";
      let fallbackAnalogyDesc = "Imagine searching for a document in a file cabinet folders one by one until you locate it.";
      let fallbackTimeComp = "O(N)";
      let fallbackSpaceComp = "O(1)";
      let fallbackConstraints = ["1 <= input.length <= 10^5", "-10^4 <= input[i] <= 10^4"];
      let fallbackExampleInput = "input = standard";
      let fallbackExampleOutput = "valid result";
      
      const lowerTitle = problemTitle.toLowerCase();
      if (lowerTitle.includes("tree") || lowerTitle.includes("binary search tree") || lowerTitle.includes("bst")) {
        fallbackCategory = "Trees";
        fallbackAnalogyTitle = "The Family Tree";
        fallbackAnalogyDesc = "Imagine tracing ancestors down a family tree. At each node, you decide whether to look at the maternal or paternal side.";
        fallbackTimeComp = "O(log N)";
        fallbackSpaceComp = "O(H) where H is tree height";
        fallbackConstraints = ["The number of nodes in the tree is in the range [0, 5000].", "-1000 <= Node.val <= 1000"];
        fallbackExampleInput = "root = [4,2,7,1,3], val = 2";
        fallbackExampleOutput = "[2,1,3]";
      } else if (lowerTitle.includes("graph") || lowerTitle.includes("path") || lowerTitle.includes("island") || lowerTitle.includes("connected")) {
        fallbackCategory = "Graphs";
        fallbackAnalogyTitle = "The Metro Network Map";
        fallbackAnalogyDesc = "Imagine navigating a subway system. You start at one station and follow connections (edges) to explore other stations (nodes).";
        fallbackTimeComp = "O(V + E)";
        fallbackSpaceComp = "O(V)";
        fallbackConstraints = ["2 <= n <= 100", "0 <= edges.length <= n * (n - 1) / 2"];
        fallbackExampleInput = "n = 3, edges = [[0,1],[1,2],[2,0]]";
        fallbackExampleOutput = "true";
      } else if (lowerTitle.includes("sort") || lowerTitle.includes("merge") || lowerTitle.includes("interval")) {
        fallbackCategory = "Two Pointers";
        fallbackAnalogyTitle = "Sorting Books on a Shelf";
        fallbackAnalogyDesc = "Imagine aligning books by height. You compare pairs and place them in the correct slots index by index.";
        fallbackTimeComp = "O(N log N)";
        fallbackSpaceComp = "O(N)";
        fallbackConstraints = ["1 <= intervals.length <= 10^4", "intervals[i].length == 2"];
        fallbackExampleInput = "intervals = [[1,3],[2,6],[8,10]]";
        fallbackExampleOutput = "[[1,6],[8,10]]";
      } else if (lowerTitle.includes("string") || lowerTitle.includes("anagram") || lowerTitle.includes("palindrome")) {
        fallbackCategory = "Strings";
        fallbackAnalogyTitle = "Checking a Mirror Text";
        fallbackAnalogyDesc = "Imagine reading a word forward and backward to check if it reads identically, like reading 'radar'.";
        fallbackTimeComp = "O(N)";
        fallbackSpaceComp = "O(1)";
        fallbackConstraints = ["1 <= s.length <= 2 * 10^5", "s consists only of printable ASCII characters."];
        fallbackExampleInput = 's = "racecar"';
        fallbackExampleOutput = "true";
      } else if (lowerTitle.includes("search") || lowerTitle.includes("find") || lowerTitle.includes("binary")) {
        fallbackCategory = "Binary Search";
        fallbackAnalogyTitle = "The Dictionary Lookup";
        fallbackAnalogyDesc = "Imagine looking up 'Python' in a physical dictionary. You open to the middle, see if 'Python' is before or after, and discard the other half.";
        fallbackTimeComp = "O(log N)";
        fallbackSpaceComp = "O(1)";
        fallbackConstraints = ["1 <= nums.length <= 10^4", "-10^4 < nums[i] < 10^4"];
        fallbackExampleInput = "nums = [-1,0,3,5,9,12], target = 9";
        fallbackExampleOutput = "4";
      } else if (lowerTitle.includes("sum") || lowerTitle.includes("duplicate") || lowerTitle.includes("map") || lowerTitle.includes("hash")) {
        fallbackCategory = "Arrays";
        fallbackAnalogyTitle = "The Guest List Desk";
        fallbackAnalogyDesc = "Imagine checking visitors into a party. You keep a checklist (hash table) to immediately check if someone has already entered in O(1) time.";
        fallbackTimeComp = "O(N)";
        fallbackSpaceComp = "O(N)";
      }

      // Generate function stubs dynamically
      const functionName = problemTitle.charAt(0).toLowerCase() + problemTitle.slice(1).replace(/\s+/g, "");

      const fallbackProblem = {
        id: searchKey,
        title: problemTitle,
        difficulty: "Medium",
        category: fallbackCategory,
        companyTags: ["Google", "Amazon", "Microsoft"],
        readingTime: "5 mins",
        confidenceScore: 75,
        patternDifficulty: "Medium",
        problemStatement: {
          question: `Given the description for **${problemTitle}**, design an optimal solution that satisfies standard performance constraints.`,
          subText: "This is a dynamically generated explanation shell (Gemini API offline).",
          constraints: fallbackConstraints,
          examples: [
            { input: fallbackExampleInput, output: fallbackExampleOutput, explanation: "Standard execution walkthrough." }
          ]
        },
        beginnerExplanation: `Let's break down the logic of **${problemTitle}** in simple terms. We iterate through the elements, keep track of state transitions, and optimize our loop checks.`,
        realLifeAnalogy: {
          title: fallbackAnalogyTitle,
          description: fallbackAnalogyDesc
        },
        whyExists: "This is commonly tested in technical interviews to gauge clean index traversal and optimal data structure selection.",
        ioWalkthrough: `Start traversing inputs. Compare elements according to ${fallbackCategory} guidelines. Return output.`,
        bruteForce: {
          idea: "Verify all candidate options iteratively by comparing every single pair or element via nested loop sweeps.",
          complexity: "Time: O(N^2), Space: O(1)",
          pros: "Extremely simple to write and intuitive to verify.",
          cons: "Tails off on performance when inputs scale, leading to Time Limit Exceeded (TLE) errors.",
          code: {
            python: `def ${functionName}_brute(arr):\n    # Brute force approach for ${problemTitle}\n    # Time Complexity: O(N^2)\n    for i in range(len(arr)):\n        for j in range(i + 1, len(arr)):\n            # Process combinations\n            pass\n    return -1`,
            java: `public class Solution {\n    public Object ${functionName}Brute(Object arr) {\n        // Brute force nested loops\n        for (int i = 0; i < 10; i++) {\n            for (int j = i + 1; j < 10; j++) {\n                // Check combination\n            }\n        }\n        return null;\n    }\n}`,
            cpp: `class Solution {\npublic:\n    void ${functionName}Brute() {\n        // Brute force nested scan\n    }\n};`,
            javascript: `function ${functionName}Brute(arr) {\n    // Brute force nested scanner\n    return null;\n}`,
            typescript: `function ${functionName}Brute(arr: any[]): any {\n    // Brute force nested scanner\n    return null;\n}`,
            go: `func ${functionName}Brute(arr []interface{}) interface{} {\n    // Brute force nested scanner\n    return nil\n}`
          }
        },
        betterApproach: {
          idea: "Optimize loop scans by sorting the inputs first or utilizing a temporary hash dictionary to record seen elements.",
          complexity: "Time: O(N log N) or O(N), Space: O(N)",
          code: {
            python: `def ${functionName}_better(arr):\n    # Better approach for ${problemTitle}\n    # Time Complexity: O(N log N) or O(N) space\n    seen = {}\n    for idx, val in enumerate(arr):\n        # Store records to avoid nested scan\n        seen[val] = idx\n    return -1`,
            java: `public class Solution {\n    public Object ${functionName}Better(Object arr) {\n        // Better approach using helper tables\n        return null;\n    }\n}`,
            cpp: `class Solution {\npublic:\n    void ${functionName}Better() {\n        // Better approach using hashing/sorting\n    }\n};`,
            javascript: `function ${functionName}Better(arr) {\n    // Better approach using hash dictionary\n    return null;\n}`,
            typescript: `function ${functionName}Better(arr: any[]): any {\n    // Better approach using hash dictionary\n    return null;\n}`,
            go: `func ${functionName}Better(arr []interface{}) interface{} {\n    // Better approach using hash dictionary\n    return nil\n}`
          }
        },
        optimalApproach: {
          thinkingProcess: `To achieve ${fallbackTimeComp} runtime, we must avoid nested checks. By leveraging the properties of ${fallbackCategory}, we can process the input in a single pass.`,
          patternRec: `Keywords and layout point to a ${fallbackCategory} pattern.`,
          stepByStep: ["Initialize indices or tables", "Scan inputs in sequence", "Update state and return matched bounds"],
          code: {
            python: `def ${functionName}(arr):\n    # Optimized ${problemTitle} solution\n    # Time Complexity: ${fallbackTimeComp}\n    # Space Complexity: ${fallbackSpaceComp}\n    # TODO: Implement optimal traversal logic\n    pass`,
            java: `public class Solution {\n    public Object ${functionName}(Object arr) {\n        // Optimized ${problemTitle} solution\n        // Time: ${fallbackTimeComp} | Space: ${fallbackSpaceComp}\n        return null;\n    }\n}`,
            cpp: `class Solution {\npublic:\n    void ${functionName}() {\n        // Optimized ${problemTitle} solution\n    }\n};`,
            javascript: `function ${functionName}(arr) {\n    // Optimized ${problemTitle} solution\n    return null;\n}`,
            typescript: `function ${functionName}(arr: any[]): any {\n    // Optimized ${problemTitle} solution\n    return null;\n}`,
            go: `func ${functionName}(arr []interface{}) interface{} {\n    // Optimized ${problemTitle} solution\n    return nil\n}`
          },
          complexity: fallbackTimeComp,
          mistakes: "Handling out of bounds elements or off-by-one errors."
        },
        dryRun: [
          { step: 1, ptr: 0, val: 1, action: "Initialize traversal index", decision: "Begin loops" },
          { step: 2, ptr: 1, val: 2, action: "Processing elements", decision: "Matched correct target" }
        ],
        diagram: {
          type: "two-pointer",
          elements: [1, 2, 3, 4],
          steps: [
            { index: 0, pointers: { i: 0 }, highlights: [0], description: "Initialize scans." },
            { index: 1, pointers: { i: 1 }, highlights: [1], description: "Compute results." }
          ]
        },
        algorithm: ["Initialize state tracking.", "Loop through items in sequence.", "Update indexes or pointers.", "Return optimal bounds."],
        complexityTable: [
          { approach: "Brute Force Scan", time: "O(N^2)", space: "O(1)" },
          { approach: `Optimized (${fallbackCategory})`, time: fallbackTimeComp, space: fallbackSpaceComp }
        ],
        patternRecognition: `This problem matches the core ${fallbackCategory} pattern.`,
        interviewTips: {
          mistakes: "Off-by-one errors on indices.",
          optimization: "Use temporary caches to store intermediate steps.",
          followups: "Can you design a solution with zero extra memory?"
        },
        similarProblems: [
          { title: "Two Sum", difficulty: "Easy" }
        ],
        practiceQuestions: [
          { title: "Contains Duplicate", difficulty: "Easy" }
        ],
        keyTakeaways: {
          summary: `Solve ${problemTitle} by using optimal ${fallbackCategory} scans.`,
          formulas: ["None"],
          patterns: [`Optimal ${fallbackCategory} scan`],
          complexities: [`${fallbackTimeComp} Time`, `${fallbackSpaceComp} Space`]
        }
      };

      setActiveProblemId(searchKey);
      setActiveProblem(fallbackProblem);

      setHistoryList((prev) => {
        const exists = prev.some((h) => h.problemId === searchKey);
        if (exists) return prev;
        return [
          { problemId: searchKey, problemName: fallbackProblem.title, timestamp: new Date().toLocaleTimeString() },
          ...prev
        ];
      });
      confetti({ particleCount: 55, spread: 40 });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLanguageChange = (langCode) => {
    setCurrentLanguage(langCode);
  };

  const handleToggleBookmark = () => {
    setBookmarkList((prev) =>
      prev.includes(activeProblemId)
        ? prev.filter((id) => id !== activeProblemId)
        : [...prev, activeProblemId]
    );
  };

  const handleToggleFavorite = () => {
    setSavedList((prev) =>
      prev.includes(activeProblemId)
        ? prev.filter((id) => id !== activeProblemId)
        : [...prev, activeProblemId]
    );
  };

  const handleExplainAgain = async (mode) => {
    const apiKey = process.env.GEMINI_API_KEY || "";
    if (!apiKey) return;

    setIsLoading(true);
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = `You are a DSA tutor. Explain the optimal solution of this problem: "${activeProblem?.title}" in a different tone. Mode: "${mode}". Keep it under 200 words.`;
      const response = await model.generateContent(prompt);
      const text = response.response.text();
      
      setActiveProblem((prev) => ({
        ...prev,
        beginnerExplanation: text
      }));
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-row h-full w-full bg-[var(--color-canvas)] text-[var(--color-text-primary)] overflow-hidden font-sans select-none relative">
      
      {/* 1. Collapsible Left Sidebar */}
      {!isSidebarCollapsed ? (
        <DsaSidebar
          activeProblemId={activeProblemId}
          onSelectProblem={handleSelectProblem}
          history={historyList}
          favorites={savedList}
          activeCategory={activeCategory}
          onSelectCategory={setActiveCategory}
          problemsList={Object.values(DSA_PROBLEMS)}
          streak={5}
          onCollapse={() => setIsSidebarCollapsed(true)}
        />
      ) : (
        <button
          onClick={() => setIsSidebarCollapsed(false)}
          className="absolute left-4 top-5.5 z-45 p-2.5 bg-[var(--color-surface-raised)] border border-[var(--color-border)] hover:border-[var(--color-accent)] rounded-xl shadow-[var(--shadow-panel)] text-[var(--color-text-secondary)] hover:text-[var(--color-accent-text)] cursor-pointer transition-all hover:scale-105"
          title="Expand Sidebar"
        >
          <ChevronRight className="h-4.5 w-4.5" />
        </button>
      )}

      {/* 2. Center Panel (Flexible, scrolls independently) */}
      <DsaMainContent
        activeProblem={activeProblem}
        onSearch={handleSearchSubmit}
        isLoading={isLoading}
        currentLanguage={currentLanguage}
        onLanguageChange={handleLanguageChange}
        isBookmarked={bookmarkList.includes(activeProblemId)}
        onToggleBookmark={handleToggleBookmark}
        isFavorite={savedList.includes(activeProblemId)}
        onToggleFavorite={handleToggleFavorite}
        onExplainAgain={handleExplainAgain}
      />

      {/* 3. Right Sidebar (Fixed 350px, no collapsing) */}
      <MunaChatbot
        activeProblem={activeProblem}
        currentLanguage={currentLanguage}
      />

    </div>
  );
}

