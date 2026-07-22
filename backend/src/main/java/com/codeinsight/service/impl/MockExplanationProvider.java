package com.codeinsight.service.impl;

import com.codeinsight.dto.AiExplanationRequest;
import com.codeinsight.dto.AiExplanationResponse;
import com.codeinsight.service.AiExplanationProvider;
import com.codeinsight.model.VariableSnapshot;
import com.codeinsight.model.FunctionFrame;
import org.springframework.stereotype.Service;
import java.util.List;

@Service("mockExplanationProvider")
public class MockExplanationProvider implements AiExplanationProvider {

    @Override
    public AiExplanationResponse explainStep(AiExplanationRequest request) {
        String mode = request.getLearningMode() != null ? request.getLearningMode().toUpperCase() : "INTERMEDIATE";
        String codeLine = request.getExecutedSourceCode() != null ? request.getExecutedSourceCode().trim() : "";
        int step = request.getStepNumber();
        int line = request.getCurrentLineNumber();
        String fnName = request.getCurrentFunction() != null ? request.getCurrentFunction() : "main";

        // Initial default explanation parts
        String explanationText = "";
        String varChangesText = "";
        String memoryText = "";
        String loopText = "";
        String fnText = "";
        String dsaText = "";
        String insightText = "";
        String optimizationText = "";

        // Standard variable lists
        List<VariableSnapshot> vars = request.getVariablesAfter();
        String activeVarsSummary = formatVariablesSummary(vars);

        // Standard function stack lists
        List<FunctionFrame> stack = request.getFunctionStack();
        int stackDepth = stack != null ? stack.size() : 1;

        // Compile context specific insights
        boolean isBinarySearch = request.getCode() != null && (request.getCode().contains("binary_search") || request.getCode().contains("binarySearch"));
        boolean isBubbleSort = request.getCode() != null && (request.getCode().contains("bubble") || request.getCode().contains("swap"));

        // Compute explanation tier by tier
        if (isBinarySearch) {
            insightText = "Algorithm: Binary Search (Divide and Conquer). Phase: Splitting search window. Goal: Find target elements in O(log N) time.";
            if (codeLine.contains("left = 0") || codeLine.contains("right = len") || codeLine.contains("right = arr.length") || codeLine.contains("right = size")) {
                if (mode.equals("BEGINNER")) {
                    explanationText = "We set up two pointers, 'left' at the start and 'right' at the end, like placing bookmarks at the beginning and end of a dictionary.";
                    varChangesText = "Pointers are initialized. They represent the boundaries of the pages we are allowed to search through.";
                    memoryText = "Stack frame allocates 'left' and 'right' primitive integers. No heap elements are modified.";
                } else if (mode.equals("ADVANCED")) {
                    explanationText = "Initialize boundary pointers. Left starts at lower bounds index 0; right occupies upper boundary size - 1. Time complexity of index definition: O(1).";
                    varChangesText = "Left pointer index points to 0. Right pointer index references array boundary offset. Storage slots occupied on call stack: 2 x 32-bit registers.";
                    memoryText = "Stack allocation adds activation frame pointers. Space allocation bounds: O(1) auxiliary memory footprint.";
                } else {
                    explanationText = "Pointers 'left' and 'right' are initialized to represent the start and end indices of the array boundaries.";
                    varChangesText = "Left pointer set to 0. Right pointer set to array length - 1.";
                    memoryText = "Creates local variables in the current call stack frame.";
                }
                optimizationText = "Initialize variables inside the loop scope only if needed, otherwise declare them at local registers to optimize cycles.";
            } else if (codeLine.contains("left <= right") || codeLine.contains("while")) {
                if (mode.equals("BEGINNER")) {
                    explanationText = "We check if there is still a search window left. If 'left' goes past 'right', it means our book is closed and the word was not found.";
                    loopText = "Loop checks condition: left <= right. It keeps going as long as the search window is valid.";
                } else if (mode.equals("ADVANCED")) {
                    explanationText = "Evaluates loop invariant search bounds. The loop continues while the left bound is index-equal or index-lesser than the right bound.";
                    loopText = "Condition 'left <= right' maintains search segment validity. Termination triggers when search domain is exhausted.";
                } else {
                    explanationText = "Checks loop condition: left <= right. The loop continues if the search interval contains at least one item.";
                    loopText = "While condition is evaluated. If left > right, the search halts.";
                }
            } else if (codeLine.contains("mid =") || codeLine.contains("midValue") || codeLine.contains("mid = left +")) {
                if (mode.equals("BEGINNER")) {
                    explanationText = "We look exactly in the middle of our active search space to see if our target is there.";
                    varChangesText = "Calculates 'mid' index. It divides our remaining search space in half.";
                } else if (mode.equals("ADVANCED")) {
                    explanationText = "Calculates the partition midpoint. We write it as 'left + (right - left) / 2' to avoid integer overflow, which can occur with '(left + right) / 2' in large arrays.";
                    varChangesText = "Mid is calculated. Mid value index points to the middle index offset of the current stack boundaries.";
                } else {
                    explanationText = "Calculates the midpoint 'mid' index by dividing the remaining bounds in half.";
                    varChangesText = "Mid variable updated. Represents the division marker.";
                }
                dsaText = "Array layout access at index mid. Performs O(1) direct offset retrieval.";
            } else if (codeLine.contains("arr[mid] == target") || codeLine.contains("arr[mid] === target")) {
                explanationText = "We compare the middle value with our target value. If they are equal, our search is complete!";
                dsaText = "Array element lookup. Checks element equality.";
            } else if (codeLine.contains("left = mid + 1") || codeLine.contains("arr[mid] < target")) {
                if (mode.equals("BEGINNER")) {
                    explanationText = "Since the middle item is smaller than our target, we know the target must be in the right half. We move our 'left' marker to skip the left half.";
                } else if (mode.equals("ADVANCED")) {
                    explanationText = "Middle value is strictly less than target. The target must reside in the upper subsegment. We shift the left boundary to mid + 1, discarding the lower half.";
                } else {
                    explanationText = "The middle value is smaller than the target. We prune the left half of the array by shifting 'left' to mid + 1.";
                }
                varChangesText = "Left pointer index moves past mid, narrowing active search size by half.";
            } else if (codeLine.contains("right = mid - 1") || codeLine.contains("else")) {
                if (mode.equals("BEGINNER")) {
                    explanationText = "Since the middle item is larger than our target, we know the target must be in the left half. We move our 'right' marker to skip the right half.";
                } else if (mode.equals("ADVANCED")) {
                    explanationText = "Middle value exceeds target. We shrink our search domain to the lower subsegment by moving the right boundary to mid - 1, discarding the upper half.";
                } else {
                    explanationText = "The middle value is greater than the target. We discard the right half of the array by shifting 'right' to mid - 1.";
                }
                varChangesText = "Right pointer index moves below mid, narrowing search partition.";
            }
        } else if (isBubbleSort) {
            insightText = "Algorithm: Bubble Sort. Phase: Nested comparison loop. Goal: Sort array elements in ascending order.";
            if (codeLine.contains("swap") || codeLine.contains("arr[j] =") || codeLine.contains("temp =")) {
                if (mode.equals("BEGINNER")) {
                    explanationText = "The value at index j is larger than the next one. We swap them like swapping two cups to put them in the correct height order.";
                    varChangesText = "Elements are swapped in the array.";
                    dsaText = "Array write updates element indices. Larger elements bubble up to the right.";
                } else if (mode.equals("ADVANCED")) {
                    explanationText = "Performs element swap in-place using temporary space. Relocates element j to j+1, bubbling the local maximum towards the array suffix.";
                    varChangesText = "Array elements modified. Swap alters values at offsets j and j+1. Complexity: O(1) auxiliary swaps operations.";
                    dsaText = "Array values mutated in-place. Displaces references.";
                } else {
                    explanationText = "Swaps the out-of-order adjacent elements at indices j and j+1.";
                    varChangesText = "Swaps array indexes to sort elements.";
                    dsaText = "Array structure mutated in-place.";
                }
            } else if (codeLine.contains(">") || codeLine.contains("if") || codeLine.contains("compare")) {
                explanationText = "Compares adjacent elements. If the left item is greater than the right item, they are out of order and must be swapped.";
                dsaText = "Array indexing traversal read.";
            } else {
                explanationText = "Bubble sort passes through the array, comparing elements. Each pass bubbles the next largest unsorted element to its final sorted position.";
            }
        }

        // Fallbacks if no specific algorithm matched
        if (explanationText.isEmpty()) {
            if (codeLine.isEmpty()) {
                explanationText = "Trace compiled successfully. Step through the playhead timeline to see detailed programming mentor insights.";
            } else {
                explanationText = "Execution steps to: `" + codeLine + "` inside function " + fnName + ".";
                if (mode.equals("ADVANCED")) {
                    explanationText += " Statement translates into machine execution cycles. Stack activation depth is currently level " + stackDepth + ".";
                }
            }
        }

        if (varChangesText.isEmpty()) {
            varChangesText = activeVarsSummary.isEmpty() ? "No variables initialized in this stack frame." : "Current scope variables: " + activeVarsSummary;
        }

        if (memoryText.isEmpty()) {
            memoryText = "Stack Frame activation level: " + stackDepth + ". Active local frame pointers occupy stack slots. Heap allocation is stable.";
        }

        if (loopText.isEmpty() && request.getLoopInformation() != null) {
            loopText = "Loop Iteration #" + request.getLoopInformation().getIterationNumber() + " evaluated. Condition is active.";
        } else if (loopText.isEmpty()) {
            loopText = "No active loops at this statement.";
        }

        if (fnText.isEmpty()) {
            fnText = "Active Frame Function: " + fnName + ". Calling stack depth: " + stackDepth;
        }

        if (dsaText.isEmpty()) {
            dsaText = "Active structure memory contains primitive variables. Visualizer canvas is active.";
        }

        if (optimizationText.isEmpty()) {
            optimizationText = "Optimization tip: Keep functions small and focused on a single responsibility to reduce recursion call stack depth.";
        }

        return new AiExplanationResponse(
            step,
            line,
            explanationText,
            varChangesText,
            memoryText,
            loopText,
            fnText,
            dsaText,
            insightText,
            optimizationText
        );
    }

    private String formatVariablesSummary(List<VariableSnapshot> vars) {
        if (vars == null || vars.isEmpty()) return "";
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < vars.size(); i++) {
            VariableSnapshot v = vars.get(i);
            sb.append(v.getName()).append("=").append(v.getValue());
            if (i < vars.size() - 1) {
                sb.append(", ");
            }
        }
        return sb.toString();
    }
}
