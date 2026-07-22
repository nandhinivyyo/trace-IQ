package com.codeinsight.service.impl;

import com.codeinsight.dto.DebugIssue;
import com.codeinsight.dto.DebugRemedy;
import com.codeinsight.dto.DebugRequest;
import com.codeinsight.dto.DebugResponse;
import com.codeinsight.service.AiDebuggerProvider;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Service("mockDebuggerProvider")
public class MockDebuggerProvider implements AiDebuggerProvider {

    @Override
    public DebugResponse diagnoseCode(DebugRequest request) {
        String code = request.getCode() != null ? request.getCode() : "";
        String logs = request.getErrorLogs() != null ? request.getErrorLogs() : "";
        String lang = request.getLanguage() != null ? request.getLanguage() : "python";

        List<DebugIssue> issues = new ArrayList<>();
        List<DebugRemedy> remedies = new ArrayList<>();
        List<String> optimizations = new ArrayList<>();
        List<String> securityAlerts = new ArrayList<>();
        List<String> bottlenecks = new ArrayList<>();
        List<String> concepts = new ArrayList<>();

        // 1. Analyze code contents for standard errors and warnings
        boolean isBinarySearch = code.contains("binary") || code.contains("binarySearch") || code.contains("left");
        boolean isBubbleSort = code.contains("bubble") || code.contains("swap") || code.contains("temp");

        if (isBinarySearch) {
            // Check for common boundary error
            if (code.contains("left < right") || code.contains("while(left < right)")) {
                issues.add(new DebugIssue(
                    "LOGICAL",
                    "ERROR",
                    "Off-by-one boundary loop termination error.",
                    code.indexOf("left < right") >= 0 ? 8 : 1, // mock line index
                    "The loop terminates when `left == right`, leaving the element at that final index un-evaluated. If the target resides at that final boundary, the search fails.",
                    "Execute search on array `[2, 5, 8]`, target `8`. Left pointer moves to index 2 (where left == right == 2). The loop terminates immediately without examining index 2, erroneously returning -1.",
                    "Change loop condition from `while (left < right)` to `while (left <= right)`.",
                    "Forgetting to include the equality check in binary search boundaries, leading to missing target lookup at search margins."
                ));
            }

            // Check for integer overflow risk
            if (code.contains("(left + right) / 2") || code.contains("left + right") && !code.contains("right - left")) {
                issues.add(new DebugIssue(
                    "BEST_PRACTICE",
                    "WARNING",
                    "Potential integer overflow risk in midpoint calculation.",
                    12,
                    "Adding `left` and `right` can yield a sum greater than the maximum storage size of a signed 32-bit integer (2,147,483,647). This results in arithmetic wrap-around, leading to a negative value.",
                    "Define array search range boundaries where `left = 2,000,000,000` and `right = 2,000,000,000`. Adding them returns `4,000,000,000`, which overflows to `-294,967,296`. Dividing by 2 yields a negative index, triggering an Array Index Out Of Bounds runtime crash.",
                    "Update mid formula to `left + (right - left) / 2`.",
                    "Using standard addition average formula for index averages in high-data structures."
                ));
            }

            // Mock remedies
            remedies.add(new DebugRemedy(
                "MINIMAL",
                "// Minimal fix: adjust loop comparison sign\n" +
                "while (left <= right) {\n" +
                "    int mid = (left + right) / 2;\n" +
                "    // ... rest of code\n" +
                "}",
                "Resolves the edge-case boundary miss with minimal lines changes.",
                "Still leaves the integer summation overflow vulnerability unresolved."
            ));

            remedies.add(new DebugRemedy(
                "RECOMMENDED",
                "// Recommended fix: resolve both loop and overflow issues\n" +
                "while (left <= right) {\n" +
                "    int mid = left + (right - left) / 2;\n" +
                "    if (arr[mid] == target) return mid;\n" +
                "    else if (arr[mid] < target) left = mid + 1;\n" +
                "    else right = mid - 1;\n" +
                "}",
                "Fully robust. Fixes the loop termination invariant and guards midpoint arithmetic overflow.",
                "None. This is the standard correct implementation."
            ));

            remedies.add(new DebugRemedy(
                "OPTIMIZED",
                "// Optimized fix: use bitwise shift division\n" +
                "while (left <= right) {\n" +
                "    int mid = left + ((right - left) >> 1);\n" +
                "    if (arr[mid] == target) return mid;\n" +
                "    if (arr[mid] < target) left = mid + 1;\n" +
                "    else right = mid - 1;\n" +
                "}",
                "Leverages bitwise right-shift operations (`>> 1`) which executes faster on cpu ALU registers than standard arithmetic divisions.",
                "Slightly lower code readability for junior developers unfamiliar with bitwise manipulation."
            ));

            optimizations.addAll(Arrays.asList(
                "Replace standard division with bitwise right-shift operation (`>> 1`) to reduce CPU cycle costs.",
                "Extract array length properties outside loops to prevent constant evaluation cycles."
            ));

            securityAlerts.add(
                "Input Validation Alert: Ensure that the search array size is verified and non-negative before executing pointer index ranges checks."
            );

            bottlenecks.addAll(Arrays.asList(
                "Division operation inside loop: Arithmetic divisions consume more instruction cycles than additions or shifts.",
                "Sequential array access bounds checking at entry of each loop pass."
            ));

            concepts.addAll(Arrays.asList(
                "Divide and Conquer Search Space Partitioning",
                "Integer Limit Boundaries & Overflow Wrap-around",
                "Loop Invariant Validity Checks"
            ));

        } else if (isBubbleSort) {
            issues.add(new DebugIssue(
                "SMELL",
                "WARNING",
                "Nested loop execution introduces O(N^2) time complexity.",
                4,
                "Using double nested loops to sort arrays of size N runs in quadratic instruction complexity regardless of input sorting states.",
                "Pass an array that is already sorted, e.g. `[1, 2, 3]`. The algorithm continues nested loop passes, executing comparisons.",
                "Add an early exit boolean flag `swapped` that halts passes if no swaps occurred.",
                "Using quadratic algorithms for large database list sorting."
            ));

            remedies.add(new DebugRemedy(
                "MINIMAL",
                "// Minimal early exit flag addition\n" +
                "boolean swapped;\n" +
                "for (int i = 0; i < n-1; i++) {\n" +
                "    swapped = false;\n" +
                "    for (int j = 0; j < n-i-1; j++) {\n" +
                "        if (arr[j] > arr[j+1]) {\n" +
                "            swap(arr, j, j+1);\n" +
                "            swapped = true;\n" +
                "        }\n" +
                "    }\n" +
                "    if (!swapped) break;\n" +
                "}",
                "Optimizes sorted/best-case inputs to linear time O(N) complexity.",
                "Still exhibits O(N^2) worst-case time complexity, unsuitable for large data sorting."
            ));

            optimizations.add("Implement early exit swapped flags to abort passes when array becomes sorted.");
            securityAlerts.add("Ensure in-place array writes do not bypass size ranges.");
            bottlenecks.add("Nested array swaps displacement cycles.");
            concepts.addAll(Arrays.asList(
                "In-place sorting",
                "Early-exit loop invariants",
                "Worst vs Best case complexity bounds"
            ));
        } else {
            // General fallback
            issues.add(new DebugIssue(
                "BEST_PRACTICE",
                "INFO",
                "Standard code review completed.",
                1,
                "The code operates sequentially. No syntax anomalies detected.",
                "Run standard executions.",
                "None needed.",
                "Ensure clean variable names."
            ));

            remedies.add(new DebugRemedy(
                "RECOMMENDED",
                code,
                "Stable baseline execution.",
                "No optimization changes applied."
            ));

            optimizations.add("Encapsulate functions to separate concerns and improve reusability.");
            securityAlerts.add("Sanitize variables bindings inputs.");
            bottlenecks.add("Sequential linear checks constraints.");
            concepts.add("General functional programming layout");
        }

        // Generate quality reviews scores
        int qualityScore = isBinarySearch && code.contains("left <= right") && code.contains("right - left") ? 92 :
                           isBinarySearch ? 68 : 80;

        return new DebugResponse(
            issues,
            remedies,
            qualityScore,
            "Code displays clear structural layout. Spacing and indentation are standard.",
            "Variable labels are standard but single-letter variables could be descriptive (e.g. `left` instead of `l`).",
            "Functional partitioning is active. Consider segregating algorithm parameters checks.",
            "Logic branches are concise, facilitating clean feature extension modifications.",
            optimizations,
            securityAlerts,
            isBinarySearch ? "O(log N)" : isBubbleSort ? "O(N^2)" : "O(N)",
            isBinarySearch ? "O(1)" : isBubbleSort ? "O(1)" : "O(1)",
            bottlenecks,
            concepts
        );
    }
}
