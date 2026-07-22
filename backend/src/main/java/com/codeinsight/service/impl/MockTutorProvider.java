package com.codeinsight.service.impl;

import com.codeinsight.dto.TutorRequest;
import com.codeinsight.dto.TutorResponse;
import com.codeinsight.service.AiTutorProvider;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Service("mockTutorProvider")
public class MockTutorProvider implements AiTutorProvider {

    @Override
    public TutorResponse consultTutor(TutorRequest request) {
        String code = request.getCode() != null ? request.getCode() : "";
        String problem = request.getProblemName() != null ? request.getProblemName().toLowerCase() : "binary search";
        
        List<String> hints = new ArrayList<>();
        List<String> socraticQuestions = new ArrayList<>();
        String teachingExplanation = "";
        List<String> patterns = new ArrayList<>();
        List<String> dataStructures = new ArrayList<>();
        List<String> algorithms = new ArrayList<>();
        String attemptAnalysis = "Analyzing your code attempt...";
        List<String> roadmap = new ArrayList<>();
        List<String> relatedProblems = new ArrayList<>();
        String feedbackSummary = "";

        boolean isBinarySearch = problem.contains("binary") || code.contains("binarySearch") || code.contains("binary_search");
        boolean isBubbleSort = problem.contains("bubble") || problem.contains("sort") || code.contains("bubbleSort") || code.contains("swap");

        if (isBinarySearch) {
            // Set patterns, structures, and algorithms
            patterns.addAll(Arrays.asList(
                "Binary Search (Divide search space in half)",
                "Divide and Conquer (Prune search bounds)",
                "Two Pointer (Left and Right segment markers)"
            ));
            dataStructures.addAll(Arrays.asList(
                "Array (Permits O(1) random access direct index access)"
            ));
            algorithms.addAll(Arrays.asList(
                "Binary Search Algorithm (Maintains O(log N) logarithmic worst-case bounds)"
            ));

            // Layered progressive hints (Level 1 to 7)
            hints.addAll(Arrays.asList(
                "Level 1: Understand the requirements. We need to search for a target value inside a sorted list of items. How can we make it faster than checking item-by-item?",
                "Level 2: Identify constraints. Binary Search strictly relies on the array being already sorted. What does that tell you about the elements left and right of any midpoint?",
                "Level 3: Choose a data structure. A simple contiguous Array is perfect because it allows us to jump to the middle element in O(1) constant time.",
                "Level 4: Recognize the pointer pattern. Maintain two integer trackers: 'left' initialized to index 0, and 'right' initialized to length - 1.",
                "Level 5: Formulate the search loop. Run a while loop condition `while (left <= right)`. Why is '<=' correct here rather than strictly '<'?",
                "Level 6: Calculate middle index safely. Use `mid = left + (right - left) / 2` instead of `(left + right) / 2` to prevent potential integer overflow in languages with fixed integer sizes.",
                "Level 7: (Optimized Solution) Compare `arr[mid]` to target. If equal, return `mid`. If target is larger, adjust search window: `left = mid + 1`. If smaller, adjust: `right = mid - 1`."
            ));

            // Socratic guiding questions
            socraticQuestions.addAll(Arrays.asList(
                "What happens if the search window narrows down to a single element? Does your loop condition still evaluate it?",
                "Can you identify how the search space size decreases at each step of the loop? By what factor?",
                "If the target element is not present in the array, what boundary coordinates does the loop terminate with? What should the function return in that case?",
                "Would recursion help here, or is an iterative approach more memory-efficient? Think about the stack frames allocation."
            ));

            // Teaching structured analysis
            teachingExplanation = "### Problem Intuition\n" +
                "Instead of looking at every item one-by-one (linear search, O(N)), we can leverage the sorted order to discard half of the remaining elements at each step. This is like looking up a word in a physical dictionary.\n\n" +
                "### Approach Details\n" +
                "1. Declare boundary pointers left and right.\n" +
                "2. Calculate the midpoint index, fetch its value, and perform equality checks.\n" +
                "3. Shift bounds to halving segments.\n\n" +
                "### Complexity Analysis\n" +
                "- **Time Complexity**: O(log N) since we divide the array in half at each iteration.\n" +
                "- **Space Complexity**: O(1) auxiliary space for iterative, or O(log N) memory frames for recursion.\n\n" +
                "### Edge Cases\n" +
                "- Empty arrays.\n" +
                "- Target element is at index 0 or index size - 1.\n" +
                "- Array contains duplicate elements (Binary search returns first match, not necessarily the index of first occurrence).";

            // Attempt Analysis based on code content
            if (code.contains("while") && !code.contains("<=")) {
                attemptAnalysis = "⚠️ **Logic Error Detected (Boundary Case)**:\n" +
                    "Your code uses a loop condition like `left < right`. If the target element is located at the last remaining index (where `left == right`), your loop will terminate without checking it. Try changing the condition to `left <= right`.";
            } else if (code.contains("left + right") && !code.contains("right - left")) {
                attemptAnalysis = "💡 **Optimization Recommendation (Overflow Prevention)**:\n" +
                    "Your midpoint calculation is likely using `(left + right) / 2`. In languages like Java or C++, if `left` and `right` are very large, their sum can exceed the maximum integer boundary, causing negative integer overflow. Use `left + (right - left) / 2` to safely calculate mid.";
            } else if (!code.contains("while") && !code.contains("def") && !code.contains("public")) {
                attemptAnalysis = "📝 **Tutor Assessment**:\n" +
                    "No search loop is detected yet. Begin by defining your loop variables `left` and `right` and setting up the iteration bounds.";
            } else {
                attemptAnalysis = "✅ **Logic Assessment**:\n" +
                    "Your search bounds and loop condition look correct. The O(log N) halving structure is successfully implemented. Excellent work!";
            }

            // Learning Roadmap progression
            roadmap.addAll(Arrays.asList(
                "Topic: Binary Search Basics (Active)",
                "Topic: Binary Search in Rotated Spaces (Next)",
                "Topic: Binary Search on Matrix Grids (Future)",
                "Topic: Search Space Pruning Optimization (Advanced)"
            ));

            // Related Problems grouped by difficulty
            relatedProblems.addAll(Arrays.asList(
                "Easy: Guess Number Higher or Lower (Reinforces midpoint calculation)",
                "Medium: Search in Rotated Sorted Array (Reinforces handling boundary partitions)",
                "Hard: Median of Two Sorted Arrays (Reinforces search boundary pruning across multiple arrays)"
            ));

            feedbackSummary = "Strengths: Strong understanding of the divide-and-conquer strategy.\n" +
                "Mistakes: Minor boundary index logic check warning (resolved).\n" +
                "Efficiency: Perfect O(log N) time bounds achieved.\n" +
                "Suggested next exercise: Try solving 'First Bad Version' to apply binary search on a boolean predicate space.";

        } else if (isBubbleSort) {
            patterns.addAll(Arrays.asList(
                "Brute Force (Nested passes)",
                "Adjacent Comparison (In-place comparison)"
            ));
            dataStructures.add("Array");
            algorithms.add("Bubble Sort (O(N^2) sorting)");

            hints.addAll(Arrays.asList(
                "Level 1: We want to sort an array. Bubble sort compares adjacent elements and swaps them if they are in the wrong order.",
                "Level 2: Think about what happens to the largest element after one complete pass through the array. It 'bubbles' to the end.",
                "Level 3: Choose an Array structure. The swaps modify elements directly in-place.",
                "Level 4: Use nested loops. The outer loop tracks passes; the inner loop compares adjacent items.",
                "Level 5: For the inner loop variable j, compare `arr[j]` with `arr[j+1]`.",
                "Level 6: If `arr[j] > arr[j+1]`, perform a swap using a temporary variable `temp`.",
                "Level 7: (Optimized Solution) Add a boolean flag `swapped` to detect if any swaps occurred in a pass. If no swaps occurred, the array is already sorted, and we can break early to optimize best-case complexity to O(N)."
            ));

            socraticQuestions.addAll(Arrays.asList(
                "What is the maximum number of comparisons needed for an array of size N?",
                "If the array is already sorted, does your code still perform nested loop checks? How can you prevent this?",
                "Why is Bubble Sort considered inefficient for large arrays? What is its average time complexity?"
            ));

            teachingExplanation = "### Bubble Sort Intuition\n" +
                "Bubble Sort repeatedly steps through the list, compares adjacent elements, and swaps them if they are in the wrong order. The pass is repeated until the list is sorted.\n\n" +
                "### Complexity\n" +
                "- Time Complexity: Worst/Average O(N^2), Best O(N) with early exit flag.\n" +
                "- Space Complexity: O(1) auxiliary space (in-place).\n\n" +
                "### Edge Cases\n" +
                "- Already sorted array.\n" +
                "- Reverse sorted array (worst case).\n" +
                "- Array with identical elements.";

            attemptAnalysis = "Bubble sort passes through the array using nested loops. Check if you can optimize the best-case execution to O(N) by adding a swapped boolean flag.";

            roadmap.addAll(Arrays.asList(
                "Topic: Elementary Sorting (Bubble/Selection) (Active)",
                "Topic: Divide and Conquer Sorting (Merge/Quick) (Next)",
                "Topic: Heap Sort and Priority Queues (Advanced)"
            ));

            relatedProblems.addAll(Arrays.asList(
                "Easy: Sort Colors (Medium - Partitioning)",
                "Medium: Kth Largest Element in an Array (Harder sorting/heaping)"
            ));

            feedbackSummary = "Strengths: In-place array mutations implemented.\n" +
                "Mistakes: Can be optimized for best case.\n" +
                "Efficiency: O(N^2) worst case is stable.";
        } else {
            // General problem fallback
            patterns.add("Linear Scan");
            dataStructures.add("Variable Registers");
            algorithms.add("Sequential Evaluation");

            hints.addAll(Arrays.asList(
                "Level 1: Read the problem carefully. Break down the inputs and expected outputs.",
                "Level 2: Trace the constraints. What are the maximum sizes of the inputs?",
                "Level 3: Identify variables to store state values.",
                "Level 4: Structure your logic using conditional branches or loops.",
                "Level 5: Code step by step, solving simple sub-cases first.",
                "Level 6: Test your logic with boundary conditions (e.g. empty or zero inputs).",
                "Level 7: Optimize time or space complexity bounds where possible."
            ));

            socraticQuestions.addAll(Arrays.asList(
                "What are the baseline constraints? Can we simplify the storage?",
                "How does your algorithm behave with empty inputs?"
            ));

            teachingExplanation = "Structured analysis placeholder. Step through problem constraints and verify correctness step by step.";
            attemptAnalysis = "Code scan is complete. Standard sequential execution bounds are active.";
            roadmap.add("General programming foundations");
            relatedProblems.add("Easy: Two Sum");
            feedbackSummary = "Ready for execution trace tutor metrics.";
        }

        return new TutorResponse(
            hints,
            socraticQuestions,
            teachingExplanation,
            patterns,
            dataStructures,
            algorithms,
            attemptAnalysis,
            roadmap,
            relatedProblems,
            feedbackSummary
        );
    }
}
