const API_BASE = "http://localhost:8080/api";

/**
 * Checks if the source code contains statements requesting stdin user inputs.
 */
export function detectInputRequirement(code, language) {
  const codeClean = code.replace(/\/\/.*|\/\*[\s\S]*?\*\/|#.*/g, ""); // strip comments
  switch (language.toLowerCase()) {
    case "python":
      return /input\s*\(/i.test(codeClean);
    case "java":
      return /Scanner|BufferedReader|System\.in\.read/i.test(codeClean);
    case "cpp":
      return /std::cin|cin\s*>>|getline\s*\(\s*cin/i.test(codeClean);
    case "c":
      return /scanf\s*\(|getchar\s*\(|gets\s*\(|fgets\s*\(.*stdin/i.test(
        codeClean,
      );
    default:
      return false;
  }
}

/**
 * Checks if a specific line of code contains an input statement.
 */
export function isInputLine(line, language) {
  if (!line) return false;
  const clean = line.replace(/\/\/.*|\/\*[\s\S]*?\*\/|#.*/g, "").trim();
  switch (language.toLowerCase()) {
    case "python":
      return /input\s*\(/i.test(clean);
    case "java":
      return /\.(?:next|nextInt|nextDouble|nextFloat|nextLong|nextShort|nextByte|nextLine|read|readLine)\b/i.test(clean);
    case "cpp":
      return /std::cin|cin\s*>>|getline\s*\(\s*(?:std::)?cin/i.test(clean);
    case "c":
      return /scanf\s*\(|getchar\s*\(|gets\s*\(|fgets\s*\(.*stdin/i.test(clean);
    default:
      return false;
  }
}

/**
 * Compiles the source code on the Spring Boot backend.
 */
export async function compileCode(code, language) {
  const response = await fetch(`${API_BASE}/compile`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ code, language }),
  });

  if (!response.ok) {
    throw new Error(`Compiler API error: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Runs the source code with optional stdin inputs on the Spring Boot backend.
 */
export async function runCode(code, language, input) {
  const response = await fetch(`${API_BASE}/run`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ code, language, input }),
  });

  if (!response.ok) {
    throw new Error(`Execution API error: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Requests execution trace stepping logs from the Spring Boot backend.
 */
export async function generateTrace(code, language, input) {
  const response = await fetch(`${API_BASE}/trace`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ code, language, input }),
  });

  if (!response.ok) {
    throw new Error(`Trace API error: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Requests AI program completion from the Spring Boot backend.
 */
export async function completeProgram(code, language, isFunction) {
  const response = await fetch(`${API_BASE}/debugger/complete-program`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ code, language, isFunction, provider: "GEMINI" }),
  });

  if (!response.ok) {
    throw new Error(`AI Completion API error: ${response.statusText}`);
  }

  return response.json();
}


/**
 * Parses user input statements and their expected data types.
 */
export function parseInputRequirements(code, language) {
  const requirements = [];
  const lines = code.split("\n");
  const codeClean = code.replace(/\/\*[\s\S]*?\*\//g, ""); // strip block comments

  let lastPrintMsg = "";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith("//") || line.startsWith("#")) continue;

    // Detect print statements to extract custom labels
    let printMatch = null;
    if (language.toLowerCase() === "python") {
      printMatch = line.match(/(?:print|input)\s*\(\s*["']([^"']+)["']/i);
    } else if (language.toLowerCase() === "java") {
      printMatch = line.match(/System\.out\.print(?:ln)?\s*\(\s*["']([^"']+)["']/i);
    } else if (language.toLowerCase() === "cpp") {
      printMatch = line.match(/(?:std::)?cout\s*<<\s*["']([^"']+)["']/i);
    } else if (language.toLowerCase() === "c") {
      printMatch = line.match(/printf\s*\(\s*["']([^"']+)["']/i);
    }
    if (printMatch) {
      lastPrintMsg = printMatch[1];
    }

    // Now detect input statements
    if (language.toLowerCase() === "python") {
      const intInput = /int\s*\(\s*input\s*\(/i.test(line);
      const floatInput = /float\s*\(\s*input\s*\(/i.test(line);
      const strInput = /input\s*\(/i.test(line);

      if (strInput) {
        let label = lastPrintMsg || "Enter input:";
        const inlineLabel = line.match(/input\s*\(\s*["']([^"']+)["']/i);
        if (inlineLabel) label = inlineLabel[1];

        requirements.push({
          label,
          type: intInput ? "int" : (floatInput ? "float" : "string")
        });
        lastPrintMsg = "";
      }
    } else if (language.toLowerCase() === "java") {
      const nextInt = /\.nextInt\s*\(/i.test(line);
      const nextFloat = /\.(?:nextFloat|nextDouble)\s*\(/i.test(line);
      const nextStr = /\.(?:next|nextLine)\s*\(/i.test(line);

      if (nextInt || nextFloat || nextStr) {
        requirements.push({
          label: lastPrintMsg || `Enter input ${requirements.length + 1}:`,
          type: nextInt ? "int" : (nextFloat ? "float" : "string")
        });
        lastPrintMsg = "";
      }
    } else if (language.toLowerCase() === "cpp") {
      const cinMatch = line.match(/(?:std::)?cin\s*>>\s*(\w+)/i);
      if (cinMatch) {
        const varName = cinMatch[1];
        let type = "string";
        const declRegex = new RegExp(`\\b(int|float|double|string|char)\\s+\\b${varName}\\b`, 'i');
        const declMatch = codeClean.match(declRegex);
        if (declMatch) {
          const cType = declMatch[1].toLowerCase();
          if (cType === "int") type = "int";
          else if (cType === "float" || cType === "double") type = "float";
        }
        requirements.push({
          label: lastPrintMsg || `Enter value for ${varName}:`,
          type
        });
        lastPrintMsg = "";
      }
    } else if (language.toLowerCase() === "c") {
      const scanfMatch = line.match(/scanf\s*\(\s*["']([^"']+)["']/i);
      if (scanfMatch) {
        const fmt = scanfMatch[1];
        const matches = fmt.match(/%[dffss]/g) || [];
        matches.forEach((spec) => {
          let type = "string";
          if (spec === "%d") type = "int";
          else if (spec === "%f" || spec === "%lf") type = "float";
          requirements.push({
            label: lastPrintMsg || `Enter input ${requirements.length + 1}:`,
            type
          });
        });
        lastPrintMsg = "";
      }
    }
  }

  if (requirements.length === 0) {
    requirements.push({ label: "Enter input:", type: "string" });
  }

  return requirements;
}
