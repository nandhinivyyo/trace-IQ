package com.codeinsight.service.impl;

import com.codeinsight.dto.CompleteProgramRequest;
import com.codeinsight.dto.CompleteProgramResponse;
import com.codeinsight.service.AiProgramCompletionService;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service("mockProgramCompletionService")
public class MockProgramCompletionService implements AiProgramCompletionService {

    @Override
    public CompleteProgramResponse completeProgram(CompleteProgramRequest request) {
        String code = request.getCode() != null ? request.getCode() : "";
        String language = request.getLanguage() != null ? request.getLanguage().toLowerCase() : "python";
        
        // Check if the code is already a complete program
        if (isCompleteProgram(code, language)) {
            return new CompleteProgramResponse(code, false);
        }
        
        // Wrap the standalone function in a complete program template
        String wrappedCode = wrapCode(code, language);
        return new CompleteProgramResponse(wrappedCode, true);
    }

    public static boolean isCompleteProgram(String code, String language) {
        if (code == null || code.trim().isEmpty()) {
            return true;
        }
        String cleanCode = code.replaceAll("//.*|/\\*.*?\\*/|#.*", ""); // Basic comment strip
        String lang = language.toLowerCase();
        
        if (lang.equals("java")) {
            return cleanCode.contains("public static void main");
        } else if (lang.equals("cpp") || lang.equals("c")) {
            return cleanCode.contains("main(") || cleanCode.contains("main (");
        } else if (lang.equals("python")) {
            return cleanCode.contains("__main__") || cleanCode.contains("main()") || 
                   cleanCode.contains("print(") || 
                   cleanCode.matches("(?s).*\\n(if|for|while|import|from)\\b.*") ||
                   cleanCode.matches("(?s)^(if|for|while|import|from)\\b.*");
        }
        return false;
    }

    static class MethodSignature {
        String returnType = "void";
        String name = "solution";
        List<Param> params = new ArrayList<>();
    }

    static class Param {
        String type;
        String name;
        Param(String type, String name) {
            this.type = type.trim();
            this.name = name.trim();
        }
    }

    private MethodSignature parseSignature(String code, String language) {
        MethodSignature sig = new MethodSignature();
        String cleanCode = code.replaceAll("//.*|/\\*.*?\\*/|#.*", "");
        
        if (language.equals("python")) {
            Pattern pattern = Pattern.compile("def\\s+(\\w+)\\s*\\(([^\\)]*)\\)");
            Matcher matcher = pattern.matcher(cleanCode);
            if (matcher.find()) {
                sig.name = matcher.group(1);
                String paramsStr = matcher.group(2);
                if (!paramsStr.trim().isEmpty()) {
                    for (String p : paramsStr.split(",")) {
                        String pName = p.trim();
                        if (!pName.isEmpty() && !pName.equals("self")) {
                            sig.params.add(new Param("any", pName));
                        }
                    }
                }
            }
        } else {
            // Java/C++/C signature regex
            // Matches returnType name(parameters)
            Pattern pattern = Pattern.compile("(\\w+(?:\\[\\]|<\\w+>)*)\\s+(\\w+)\\s*\\(([^\\)]*)\\)");
            Matcher matcher = pattern.matcher(cleanCode);
            if (matcher.find()) {
                sig.returnType = matcher.group(1);
                sig.name = matcher.group(2);
                String paramsStr = matcher.group(3);
                if (!paramsStr.trim().isEmpty()) {
                    for (String p : paramsStr.split(",")) {
                        String trimmed = p.trim();
                        int lastSpace = trimmed.lastIndexOf(' ');
                        if (lastSpace != -1) {
                            String type = trimmed.substring(0, lastSpace).trim();
                            String name = trimmed.substring(lastSpace + 1).trim();
                            // Clean up C++ references/pointers
                            type = type.replace("&", "").replace("*", "").trim();
                            sig.params.add(new Param(type, name));
                        }
                    }
                }
            }
        }
        return sig;
    }

    private String wrapCode(String code, String language) {
        MethodSignature sig = parseSignature(code, language);
        
        switch (language.toLowerCase()) {
            case "java":
                return generateJavaWrapper(code, sig);
            case "cpp":
                return generateCppWrapper(code, sig);
            case "c":
                return generateCWrapper(code, sig);
            case "python":
            default:
                return generatePythonWrapper(code, sig);
        }
    }

    private String generateJavaWrapper(String code, MethodSignature sig) {
        StringBuilder sb = new StringBuilder();
        sb.append("import java.util.*;\n\n");

        // Append ListNode / TreeNode definitions if referred to but not declared in user code
        if (code.contains("ListNode") && !code.contains("class ListNode")) {
            sb.append("class ListNode {\n");
            sb.append("    int val;\n");
            sb.append("    ListNode next;\n");
            sb.append("    ListNode() {}\n");
            sb.append("    ListNode(int val) { this.val = val; }\n");
            sb.append("    ListNode(int val, ListNode next) { this.val = val; this.next = next; }\n");
            sb.append("}\n\n");
        }
        if (code.contains("TreeNode") && !code.contains("class TreeNode")) {
            sb.append("class TreeNode {\n");
            sb.append("    int val;\n");
            sb.append("    TreeNode left;\n");
            sb.append("    TreeNode right;\n");
            sb.append("    TreeNode() {}\n");
            sb.append("    TreeNode(int val) { this.val = val; }\n");
            sb.append("    TreeNode(int val, TreeNode left, TreeNode right) {\n");
            sb.append("        this.val = val; \n");
            sb.append("        this.left = left; \n");
            sb.append("        this.right = right;\n");
            sb.append("    }\n");
            sb.append("}\n\n");
        }

        sb.append("public class Main {\n\n");
        
        // Add original code
        for (String line : code.split("\n")) {
            sb.append("    ").append(line).append("\n");
        }
        sb.append("\n");
        
        // Add main method
        sb.append("    public static void main(String[] args) {\n");
        sb.append("        Scanner sc = new Scanner(System.in);\n");
        
        List<String> callArgs = new ArrayList<>();
        
        // Read each parameter input
        for (Param param : sig.params) {
            String name = param.name;
            String type = param.type;
            callArgs.add(name);
            
            if (type.equals("int[]") || type.equals("Integer[]")) {
                sb.append("        int ").append(name).append("_len = sc.nextInt();\n");
                sb.append("        int[] ").append(name).append(" = new int[").append(name).append("_len];\n");
                sb.append("        for (int i = 0; i < ").append(name).append("_len; i++) {\n");
                sb.append("            ").append(name).append("[i] = sc.nextInt();\n");
                sb.append("        }\n");
            } else if (type.equals("int[][]")) {
                sb.append("        int ").append(name).append("_rows = sc.nextInt();\n");
                sb.append("        int ").append(name).append("_cols = sc.nextInt();\n");
                sb.append("        int[][] ").append(name).append(" = new int[").append(name).append("_rows][")
                  .append(name).append("_cols];\n");
                sb.append("        for (int i = 0; i < ").append(name).append("_rows; i++) {\n");
                sb.append("            for (int j = 0; j < ").append(name).append("_cols; j++) {\n");
                sb.append("                ").append(name).append("[i][j] = sc.nextInt();\n");
                sb.append("            }\n");
                sb.append("        }\n");
            } else if (type.equals("ListNode")) {
                sb.append("        int ").append(name).append("_len = sc.nextInt();\n");
                sb.append("        ListNode ").append(name).append("Dummy = new ListNode(0);\n");
                sb.append("        ListNode ").append(name).append("Curr = ").append(name).append("Dummy;\n");
                sb.append("        for (int i = 0; i < ").append(name).append("_len; i++) {\n");
                sb.append("            ").append(name).append("Curr.next = new ListNode(sc.nextInt());\n");
                sb.append("            ").append(name).append("Curr = ").append(name).append("Curr.next;\n");
                sb.append("        }\n");
                sb.append("        ListNode ").append(name).append(" = ").append(name).append("Dummy.next;\n");
            } else if (type.equals("String")) {
                sb.append("        String ").append(name).append(" = sc.next();\n");
            } else if (type.equals("double")) {
                sb.append("        double ").append(name).append(" = sc.nextDouble();\n");
            } else if (type.equals("float")) {
                sb.append("        float ").append(name).append(" = sc.nextFloat();\n");
            } else if (type.equals("boolean")) {
                sb.append("        boolean ").append(name).append(" = sc.nextBoolean();\n");
            } else { // default to int
                sb.append("        int ").append(name).append(" = sc.nextInt();\n");
            }
        }
        
        sb.append("\n");
        sb.append("        Main solver = new Main();\n");
        String argsList = String.join(", ", callArgs);
        
        if (sig.returnType.equals("void")) {
            sb.append("        solver.").append(sig.name).append("(").append(argsList).append(");\n");
        } else if (sig.returnType.equals("int[]") || sig.returnType.equals("Integer[]")) {
            sb.append("        int[] ans = solver.").append(sig.name).append("(").append(argsList).append(");\n");
            sb.append("        System.out.println(Arrays.toString(ans));\n");
        } else if (sig.returnType.equals("ListNode")) {
            sb.append("        ListNode ans = solver.").append(sig.name).append("(").append(argsList).append(");\n");
            sb.append("        while (ans != null) {\n");
            sb.append("            System.out.print(ans.val + \" \");\n");
            sb.append("            ans = ans.next;\n");
            sb.append("        }\n");
            sb.append("        System.out.println();\n");
        } else {
            sb.append("        ").append(sig.returnType).append(" ans = solver.").append(sig.name).append("(")
              .append(argsList).append(");\n");
            sb.append("        System.out.println(ans);\n");
        }
        
        sb.append("    }\n");
        sb.append("}\n");
        return sb.toString();
    }

    private String generateCppWrapper(String code, MethodSignature sig) {
        StringBuilder sb = new StringBuilder();
        sb.append("#include <iostream>\n");
        sb.append("#include <vector>\n");
        sb.append("#include <string>\n");
        sb.append("#include <algorithm>\n\n");
        sb.append("using namespace std;\n\n");

        if (code.contains("ListNode") && !code.contains("struct ListNode")) {
            sb.append("struct ListNode {\n");
            sb.append("    int val;\n");
            sb.append("    ListNode *next;\n");
            sb.append("    ListNode(int x) : val(x), next(NULL) {}\n");
            sb.append("};\n\n");
        }
        if (code.contains("TreeNode") && !code.contains("struct TreeNode")) {
            sb.append("struct TreeNode {\n");
            sb.append("    int val;\n");
            sb.append("    TreeNode *left;\n");
            sb.append("    TreeNode *right;\n");
            sb.append("    TreeNode(int x) : val(x), left(NULL), right(NULL) {}\n");
            sb.append("};\n\n");
        }

        sb.append(code).append("\n\n");
        sb.append("int main() {\n");
        
        List<String> callArgs = new ArrayList<>();
        for (Param param : sig.params) {
            String name = param.name;
            String type = param.type;
            callArgs.add(name);
            
            if (type.contains("vector")) {
                sb.append("    int ").append(name).append("_len;\n");
                sb.append("    cin >> ").append(name).append("_len;\n");
                sb.append("    vector<int> ").append(name).append("(").append(name).append("_len);\n");
                sb.append("    for (int i = 0; i < ").append(name).append("_len; i++) {\n");
                sb.append("        cin >> ").append(name).append("[i];\n");
                sb.append("    }\n");
            } else if (type.equals("ListNode")) {
                sb.append("    int ").append(name).append("_len;\n");
                sb.append("    cin >> ").append(name).append("_len;\n");
                sb.append("    ListNode* ").append(name).append("Dummy = new ListNode(0);\n");
                sb.append("    ListNode* ").append(name).append("Curr = ").append(name).append("Dummy;\n");
                sb.append("    for (int i = 0; i < ").append(name).append("_len; i++) {\n");
                sb.append("        int val;\n");
                sb.append("        cin >> val;\n");
                sb.append("        ").append(name).append("Curr->next = new ListNode(val);\n");
                sb.append("        ").append(name).append("Curr = ").append(name).append("Curr->next;\n");
                sb.append("    }\n");
                sb.append("    ListNode* ").append(name).append(" = ").append(name).append("Dummy->next;\n");
            } else if (type.equals("string")) {
                sb.append("    string ").append(name).append(";\n");
                sb.append("    cin >> ").append(name).append(";\n");
            } else {
                sb.append("    int ").append(name).append(";\n");
                sb.append("    cin >> ").append(name).append(";\n");
            }
        }
        
        sb.append("\n");
        String argsList = String.join(", ", callArgs);
        if (sig.returnType.equals("void")) {
            sb.append("    ").append(sig.name).append("(").append(argsList).append(");\n");
        } else if (sig.returnType.contains("vector")) {
            sb.append("    vector<int> ans = ").append(sig.name).append("(").append(argsList).append(");\n");
            sb.append("    for(int x : ans) cout << x << \" \";\n");
            sb.append("    cout << endl;\n");
        } else if (sig.returnType.equals("ListNode")) {
            sb.append("    ListNode* ans = ").append(sig.name).append("(").append(argsList).append(");\n");
            sb.append("    while (ans != NULL) {\n");
            sb.append("        cout << ans->val << \" \";\n");
            sb.append("        ans = ans->next;\n");
            sb.append("    }\n");
            sb.append("    cout << endl;\n");
        } else {
            sb.append("    auto ans = ").append(sig.name).append("(").append(argsList).append(");\n");
            sb.append("    cout << ans << endl;\n");
        }
        
        sb.append("    return 0;\n");
        sb.append("}\n");
        return sb.toString();
    }

    private String generateCWrapper(String code, MethodSignature sig) {
        StringBuilder sb = new StringBuilder();
        sb.append("#include <stdio.h>\n");
        sb.append("#include <stdlib.h>\n");
        sb.append("#include <string.h>\n\n");
        sb.append(code).append("\n\n");
        sb.append("int main() {\n");
        
        List<String> callArgs = new ArrayList<>();
        for (Param param : sig.params) {
            String name = param.name;
            callArgs.add(name);
            sb.append("    int ").append(name).append(";\n");
            sb.append("    scanf(\"%d\", &").append(name).append(");\n");
        }
        
        sb.append("\n");
        String argsList = String.join(", ", callArgs);
        if (sig.returnType.equals("void")) {
            sb.append("    ").append(sig.name).append("(").append(argsList).append(");\n");
        } else {
            sb.append("    int ans = ").append(sig.name).append("(").append(argsList).append(");\n");
            sb.append("    printf(\"%d\\n\", ans);\n");
        }
        sb.append("    return 0;\n");
        sb.append("}\n");
        return sb.toString();
    }

    private String generatePythonWrapper(String code, MethodSignature sig) {
        StringBuilder sb = new StringBuilder();
        sb.append(code).append("\n\n");
        sb.append("if __name__ == \"__main__\":\n");
        
        List<String> callArgs = new ArrayList<>();
        for (Param param : sig.params) {
            String name = param.name.toLowerCase();
            callArgs.add(param.name);
            
            if (name.contains("arr") || name.contains("nums") || name.contains("list")) {
                sb.append("    import sys\n");
                sb.append("    ").append(param.name).append(" = list(map(int, sys.stdin.readline().split()))\n");
            } else if (name.contains("grid") || name.contains("matrix")) {
                sb.append("    import sys\n");
                sb.append("    ").append(param.name).append("_rows = int(sys.stdin.readline())\n");
                sb.append("    ").append(param.name).append(" = [list(map(int, sys.stdin.readline().split())) for _ in range(").append(param.name).append("_rows)]\n");
            } else if (name.contains("s") || name.contains("t") || name.contains("str")) {
                sb.append("    import sys\n");
                sb.append("    ").append(param.name).append(" = sys.stdin.readline().strip()\n");
            } else {
                sb.append("    import sys\n");
                sb.append("    ").append(param.name).append(" = int(sys.stdin.readline())\n");
            }
        }
        
        sb.append("    ans = ").append(sig.name).append("(").append(String.join(", ", callArgs)).append(")\n");
        sb.append("    print(ans)\n");
        return sb.toString();
    }
}
