export const DSA_PROBLEMS = {
  "two-sum": {
    id: "two-sum",
    title: "Two Sum",
    difficulty: "Easy",
    category: "Arrays & Hashing",
    companyTags: ["Google", "Amazon", "Microsoft", "Meta", "Apple"],
    readingTime: "4 mins",
    confidenceScore: 85,
    patternDifficulty: "Easy",
    problemStatement: {
      question: "Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.",
      subText: "You may assume that each input would have exactly one solution, and you may not use the same element twice. You can return the answer in any order.",
      constraints: [
        "2 <= nums.length <= 10^4",
        "-10^9 <= nums[i] <= 10^9",
        "-10^9 <= target <= 10^9",
        "Only one valid answer exists."
      ],
      examples: [
        {
          input: "nums = [2,7,11,15], target = 9",
          output: "[0,1]",
          explanation: "Because nums[0] + nums[1] == 2 + 7 == 9, we return [0, 1]."
        },
        {
          input: "nums = [3,2,4], target = 6",
          output: "[1,2]",
          explanation: "Because nums[1] + nums[2] == 2 + 4 == 6, we return [1, 2]."
        }
      ]
    },
    beginnerExplanation: "Imagine you are trying to find two numbers in a list that add up to a specific target number. The most basic way is to pick a number and look at every other number in the list to see if they add up to the target. However, a smarter way is to remember the numbers we have seen so far. As we walk through the list, we calculate what number we need (the difference between the target and our current number). If we have already seen that needed number earlier, we've found our pair!",
    realLifeAnalogy: {
      title: "The Coat Check Clue",
      description: "Imagine a coat-check room. You are searching for two bags that have tag numbers summing up to a lucky number, say 10. As guests arrive and hand you their bag with a tag number, instead of searching all stored bags every time, you write down the tag number and its bag location on a whiteboard. When a new bag with tag number 7 arrives, you know you need a bag with tag 3 to make 10. You check your whiteboard, see that tag 3 is at shelf location 0, and immediately retrieve it. You solved the problem in a single pass!"
    },
    whyExists: "This problem is the absolute foundation of Hash Map data structures. Interviewers use it to test if a candidate understands how to trade space (using a hash map/dictionary) for time (reducing a slow quadratic search to a fast linear lookup). It is the gateway to understanding caching and lookup patterns.",
    ioWalkthrough: "Let's use `nums = [2, 7, 11, 15]` and `target = 9`.\n- Element at index 0 is 2. The complement we need is `9 - 2 = 7`. Our 'seen' map is empty, so we save `{ 2: 0 }` (number 2 is at index 0) and move on.\n- Element at index 1 is 7. The complement we need is `9 - 7 = 2`. We check our 'seen' map. Yes! 2 is in the map at index 0. We immediately return `[0, 1]`.",
    bruteForce: {
      idea: "Use two nested loops to check every possible pair of numbers in the array. If any pair sums up to the target, return their indices.",
      complexity: "Time: O(N^2) because of nested loops. Space: O(1) as we don't use extra storage.",
      pros: "Simple to understand; requires no extra memory.",
      cons: "Extremely slow for large lists. If the list has 10,000 numbers, it performs up to 100,000,000 checks.",
      code: {
        java: `public int[] twoSum(int[] nums, int target) {
    for (int i = 0; i < nums.length; i++) {
        for (int j = i + 1; j < nums.length; j++) {
            if (nums[i] + nums[j] == target) {
                return new int[] { i, j };
            }
        }
    }
    return new int[] {};
}`,
        python: `def twoSum(nums, target):
    n = len(nums)
    for i in range(n):
        for j in range(i + 1, n):
            if nums[i] + nums[j] == target:
                return [i, j]
    return []`
      }
    },
    betterApproach: {
      idea: "Sort the array first, then use a Two-Pointer technique (one pointer at the start, one at the end). If the current sum is too small, move the left pointer right. If it's too large, move the right pointer left. Note: This changes the indices, so we would have to store original indices before sorting.",
      complexity: "Time: O(N log N) for sorting. Space: O(N) to preserve indices.",
      code: {
        python: `def twoSumBetter(nums, target):
    # Store value and original index pairs
    elements = [(val, idx) for idx, val in enumerate(nums)]
    # Sort elements by value
    elements.sort(key=lambda x: x[0])
    
    left, right = 0, len(nums) - 1
    while left < right:
        current_sum = elements[left][0] + elements[right][0]
        if current_sum == target:
            return [elements[left][1], elements[right][1]]
        elif current_sum < target:
            left += 1
        else:
            right -= 1
    return []`,
        java: `import java.util.*;

public int[] twoSumBetter(int[] nums, int target) {
    int[][] elements = new int[nums.length][2];
    for (int i = 0; i < nums.length; i++) {
        elements[i][0] = nums[i];
        elements[i][1] = i;
    }
    // Sort array based on values
    Arrays.sort(elements, Comparator.comparingInt(a -> a[0]));
    
    int left = 0;
    int right = nums.length - 1;
    while (left < right) {
        int sum = elements[left][0] + elements[right][0];
        if (sum == target) {
            return new int[]{elements[left][1], elements[right][1]};
        } else if (sum < target) {
            left++;
        } else {
            right--;
        }
    }
    return new int[0];
}`,
        cpp: `#include <vector>
#include <algorithm>

using namespace std;

vector<int> twoSumBetter(vector<int>& nums, int target) {
    vector<pair<int, int>> elements;
    for (int i = 0; i < nums.size(); ++i) {
        elements.push_back({nums[i], i});
    }
    sort(elements.begin(), elements.end());
    
    int left = 0;
    int right = nums.size() - 1;
    while (left < right) {
        int sum = elements[left].first + elements[right].first;
        if (sum == target) {
            return {elements[left].second, elements[right].second};
        } else if (sum < target) {
            left++;
        } else {
            right--;
        }
    }
    return {};
}`,
        javascript: `function twoSumBetter(nums, target) {
    const elements = nums.map((val, idx) => ({ val, idx }));
    elements.sort((a, b) => a.val - b.val);
    
    let left = 0, right = nums.length - 1;
    while (left < right) {
        const sum = elements[left].val + elements[right].val;
        if (sum === target) {
            return [elements[left].idx, elements[right].idx];
        } else if (sum < target) {
            left++;
        } else {
            right--;
        }
    }
    return [];
}`,
        typescript: `function twoSumBetter(nums: number[], target: number): number[] {
    const elements = nums.map((val, idx) => ({ val, idx }));
    elements.sort((a, b) => a.val - b.val);
    
    let left = 0, right = nums.length - 1;
    while (left < right) {
        const sum = elements[left].val + elements[right].val;
        if (sum === target) {
            return [elements[left].idx, elements[right].idx];
        } else if (sum < target) {
            left++;
        } else {
            right--;
        }
    }
    return [];
}`,
        go: `func twoSumBetter(nums []int, target int) []int {
    type Pair struct {
        val int
        idx int
    }
    elements := make([]Pair, len(nums))
    for i, v := range nums {
        elements[i] = Pair{val: v, idx: i}
    }
    
    sort.Slice(elements, func(i, j int) bool {
        return elements[i].val < elements[j].val
    })
    
    left, right := 0, len(nums)-1
    for left < right {
        sum := elements[left].val + elements[right].val
        if sum == target {
            return []int{elements[left].idx, elements[right].idx}
        } else if sum < target {
            left++
        } else {
            right--
        }
    }
    return []int{}
}`
      }
    },
    optimalApproach: {
      thinkingProcess: "Can we find the pair in a single pass? Yes, if we store each number we visit along with its index. For each number `x`, we search if `target - x` is already in our store. Since a Hash Map provides O(1) average lookup time, this reduces the time complexity to linear O(N).",
      patternRec: "This is a classic 'Complement Hashing' pattern. We store elements in a Hash Map to enable O(1) lookup of required values in subsequent steps.",
      stepByStep: [
        "Create an empty Hash Map `seen` to store `{ value: index }`.",
        "Loop through the array with index `i` and value `num`.",
        "Calculate the complement: `complement = target - num`.",
        "Check if `seen` contains `complement`. If yes, return `[seen.get(complement), i]`.",
        "If not, add `num` to `seen`: `seen.put(num, i)`.",
        "If no pair is found, return an empty array (though the problem guarantees one solution exists)."
      ],
      code: {
        java: `import java.util.HashMap;
import java.util.Map;

public int[] twoSum(int[] nums, int target) {
    Map<Integer, Integer> seen = new HashMap<>();
    for (int i = 0; i < nums.length; i++) {
        int complement = target - nums[i];
        if (seen.containsKey(complement)) {
            return new int[] { seen.get(complement), i }; // Found complement!
        }
        seen.put(nums[i], i); // Store index of current number
    }
    return new int[] {};
}`,
        python: `def twoSum(nums, target):
    seen = {} # val -> index
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i] # Complement found!
        seen[num] = i
    return []`,
        cpp: `#include <unordered_map>
#include <vector>

std::vector<int> twoSum(std::vector<int>& nums, int target) {
    std::unordered_map<int, int> seen;
    for (int i = 0; i < nums.size(); i++) {
        int complement = target - nums[i];
        if (seen.count(complement)) {
            return {seen[complement], i};
        }
        seen[nums[i]] = i;
    }
    return {};
}`,
        javascript: `function twoSum(nums, target) {
    const seen = new Map();
    for (let i = 0; i < nums.length; i++) {
        const complement = target - nums[i];
        if (seen.has(complement)) {
            return [seen.get(complement), i];
        }
        seen.set(nums[i], i);
    }
    return [];
}`,
        typescript: `function twoSum(nums: number[], target: number): number[] {
    const seen = new Map<number, number>();
    for (let i = 0; i < nums.length; i++) {
        const complement = target - nums[i];
        if (seen.has(complement)) {
            return [seen.get(complement)!, i];
        }
        seen.set(nums[i], i);
    }
    return [];
}`,
        go: `func twoSum(nums []int, target int) []int {
    seen := make(map[int]int)
    for i, num := range nums {
        complement := target - num
        if idx, found := seen[complement]; found {
            return []int{idx, i}
        }
        seen[num] = i
    }
    return nil
}`
      },
      edgeCases: "Handle negative numbers, duplicates (e.g. `nums = [3, 3], target = 6`), and cases where the complement equals the number itself but at a different index.",
      duplicateHandling: "Since we insert elements into the Map *after* checking, we prevent using the same index twice, which naturally handles duplicate numbers like `[3, 3]` correctly.",
      mistakes: "Adding the current number to the hash map before checking for its complement, which would cause the element to pair with itself (e.g. `nums = [3, 2, 4], target = 6` returning `[0, 0]` since `6 - 3 = 3` and 3 is already in the map).",
      complexity: "Time: O(N) single pass. Space: O(N) to store up to N numbers in the hash map."
    },
    dryRun: [
      { step: 1, ptr: 0, val: 2, complement: 7, action: "Check seen for complement 7", seen: "{}", decision: "7 not seen. Add 2 to seen.", highlight: [0] },
      { step: 2, ptr: 1, val: 7, complement: 2, action: "Check seen for complement 2", seen: "{2: 0}", decision: "2 found at index 0!", highlight: [0, 1] }
    ],
    diagram: {
      type: "two-pointer",
      elements: [2, 7, 11, 15],
      steps: [
        {
          index: 0,
          pointers: { i: 0 },
          highlights: [0],
          description: "seen = {}, checking 2, complement needed = 7"
        },
        {
          index: 1,
          pointers: { i: 1 },
          highlights: [0, 1],
          description: "seen = {2:0}, checking 7, complement 2 found at index 0! Return [0, 1]"
        }
      ]
    },
    algorithm: [
      "Initialize an empty hash map `seen`.",
      "Iterate through the array using index `i`.",
      "For each element `nums[i]`, calculate `complement = target - nums[i]`.",
      "If `complement` exists in `seen`, return `[seen[complement], i]`.",
      "Otherwise, insert `nums[i]` into `seen` with value `i`."
    ],
    complexityTable: [
      { approach: "Brute Force", time: "O(N^2)", space: "O(1)" },
      { approach: "Sorting + Two Pointers", time: "O(N log N)", space: "O(N)" },
      { approach: "Hash Map (Optimal)", time: "O(N)", space: "O(N)" }
    ],
    patternRecognition: "This problem belongs to the **Arrays & Hashing** pattern. It highlights the use of a hash map to reduce lookups from linear O(N) to constant O(1) time by trading auxiliary space.",
    interviewTips: {
      mistakes: "Ensure you don't return the same index twice. Be careful with duplicate values in the array.",
      optimization: "Mention that if the input array is already sorted, we can solve it in O(1) auxiliary space using a two-pointer technique.",
      followups: "What if the array is sorted? What if we need to return ALL unique pairs that sum to the target? What if there are duplicates?",
      expectedDiscussion: "Interviewers will expect you to explain the trade-offs between sorting + two-pointers versus using a hash table."
    },
    similarProblems: [
      { title: "3Sum", difficulty: "Medium" },
      { title: "4Sum", difficulty: "Medium" },
      { title: "Two Sum II - Input Array Is Sorted", difficulty: "Medium" }
    ],
    practiceQuestions: [
      { title: "Contains Duplicate", difficulty: "Easy" },
      { title: "Group Anagrams", difficulty: "Medium" }
    ],
    keyTakeaways: {
      summary: "Hash map lookup is O(1) on average. Trade memory for execution speed.",
      formulas: ["Complement = Target - CurrentValue"],
      patterns: ["Use lookup cache for past historical values"],
      complexities: ["O(N) Time", "O(N) Space"]
    }
  },
  "binary-search": {
    id: "binary-search",
    title: "Binary Search",
    difficulty: "Easy",
    category: "Binary Search",
    companyTags: ["Google", "Amazon", "Microsoft", "Apple", "Uber"],
    readingTime: "5 mins",
    confidenceScore: 90,
    patternDifficulty: "Medium",
    problemStatement: {
      question: "Given an array of integers `nums` which is sorted in ascending order, and an integer `target`, write a function to search `target` in `nums`. If `target` exists, then return its index. Otherwise, return `-1`.",
      subText: "You must write an algorithm with `O(log n)` runtime complexity.",
      constraints: [
        "1 <= nums.length <= 10^4",
        "-10^4 < nums[i], target < 10^4",
        "All the integers in nums are unique.",
        "nums is sorted in ascending order."
      ],
      examples: [
        {
          input: "nums = [-1,0,3,5,9,12], target = 9",
          output: "4",
          explanation: "9 exists in nums and its index is 4."
        },
        {
          input: "nums = [-1,0,3,5,9,12], target = 2",
          output: "-1",
          explanation: "2 does not exist in nums so we return -1."
        }
      ]
    },
    beginnerExplanation: "Imagine you are looking for a name in a physical telephone directory sorted alphabetically. You don't start from the first page and read one by one. Instead, you open it right in the middle. If the name you want comes after the names on the middle page, you ignore the entire first half of the book. You repeat this middle-splitting process in the remaining half until you find the name or run out of pages. Binary search does exactly this with a list of sorted numbers!",
    realLifeAnalogy: {
      title: "The Guessing Game",
      description: "A friend thinks of a number between 1 and 100. Whenever you guess, they say 'too high', 'too low', or 'correct'. To find the number in the fewest guesses, you guess 50. If they say 'too high', you immediately eliminate all numbers from 50 to 100. Your next guess is 25 (the middle of 1 and 49). By cutting the search space in half with every single guess, you can find any number from 1 to 100 in at most 7 guesses!"
    },
    whyExists: "Binary Search is the cornerstone of logarithmic algorithm design. Interviewers use it to see if you can correctly identify when search spaces are sorted and if you can avoid off-by-one errors (like infinite loops), which are incredibly common in binary search implementations.",
    ioWalkthrough: "Let's search for `9` in `[-1, 0, 3, 5, 9, 12]`.\n- Initially, left pointer `L = 0` (value -1), right pointer `R = 5` (value 12).\n- Midpoint index is `(0 + 5) / 2 = 2` (value 3). Since 3 < 9, we search the right half by moving `L` to `mid + 1 = 3`.\n- New midpoint is `(3 + 5) / 2 = 4` (value 9). Since `nums[4] == 9`, we have found the target and return its index `4`.",
    bruteForce: {
      idea: "Scan the array from left to right one by one (Linear Search) until the target is found or the end of the array is reached.",
      complexity: "Time: O(N) because in the worst case we check all elements. Space: O(1).",
      pros: "Extremely simple; works on unsorted lists too.",
      cons: "Inefficient for large arrays. If there are 1,000,000 items, we check 1,000,000 items in the worst case.",
      code: {
        java: `public int search(int[] nums, int target) {
    for (int i = 0; i < nums.length; i++) {
        if (nums[i] == target) return i;
    }
    return -1;
}`,
        python: `def search(nums, target):
    for i in range(len(nums)):
        if nums[i] == target:
            return i
    return -1`
      }
    },
    betterApproach: {
      idea: "Standard Binary Search is already optimal. No 'better' intermediary exists except recursive vs iterative implementations.",
      complexity: "Time: O(log N). Space: O(1) for iterative, O(log N) stack depth for recursive.",
      code: `// Iterative is generally preferred over recursive due to call stack overhead.`
    },
    optimalApproach: {
      thinkingProcess: "Since the input is sorted, we can search in O(log N) by maintaining left and right boundary pointers and halving the range at each step.",
      patternRec: "Look for sorted structures, monotonic functions, or searching inside a range. These are classic triggers for Binary Search.",
      stepByStep: [
        "Initialize `left = 0` and `right = nums.length - 1`.",
        "While `left <= right`:",
        "  Calculate `mid = left + (right - left) / 2` to avoid integer overflow.",
        "  If `nums[mid] == target`, return `mid`.",
        "  If `nums[mid] < target`, discard the left half: set `left = mid + 1`.",
        "  If `nums[mid] > target`, discard the right half: set `right = mid - 1`.",
        "Return `-1` if target is not found in the loop."
      ],
      code: {
        java: `public int search(int[] nums, int target) {
    int left = 0;
    int right = nums.length - 1;
    
    while (left <= right) {
        // Safe mid calculation to prevent integer overflow in Java
        int mid = left + (right - left) / 2; 
        
        if (nums[mid] == target) {
            return mid;
        } else if (nums[mid] < target) {
            left = mid + 1; // Search right half
        } else {
            right = mid - 1; // Search left half
        }
    }
    return -1; // Target not found
}`,
        python: `def search(nums, target):
    left = 0
    right = len(nums) - 1
    
    while left <= right:
        mid = left + (right - left) // 2
        if nums[mid] == target:
            return mid
        elif nums[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
            
    return -1`,
        cpp: `#include <vector>

int search(std::vector<int>& nums, int target) {
    int left = 0;
    int right = nums.size() - 1;
    while (left <= right) {
        int mid = left + (right - left) / 2;
        if (nums[mid] == target) return mid;
        else if (nums[mid] < target) left = mid + 1;
        else right = mid - 1;
    }
    return -1;
}`,
        javascript: `function search(nums, target) {
    let left = 0;
    let right = nums.length - 1;
    while (left <= right) {
        let mid = Math.floor(left + (right - left) / 2);
        if (nums[mid] === target) return mid;
        else if (nums[mid] < target) left = mid + 1;
        else right = mid - 1;
    }
    return -1;
}`,
        typescript: `function search(nums: number[], target: number): number {
    let left = 0;
    let right = nums.length - 1;
    while (left <= right) {
        let mid = Math.floor(left + (right - left) / 2);
        if (nums[mid] === target) return mid;
        else if (nums[mid] < target) left = mid + 1;
        else right = mid - 1;
    }
    return -1;
}`,
        go: `func search(nums []int, target int) int {
    left := 0
    right := len(nums) - 1
    for left <= right {
        mid := left + (right-left)/2
        if nums[mid] == target {
            return mid
        } else if nums[mid] < target {
            left = mid + 1
        } else {
            right = mid - 1
        }
    }
    return -1
}`
      },
      edgeCases: "Array with 1 element, target not present, target smaller than first element, target larger than last element.",
      duplicateHandling: "Standard binary search doesn't guarantee which duplicate index is returned. For left-most or right-most element retrieval, we adjust the equality check.",
      mistakes: "Using `while (left < right)` instead of `while (left <= right)`, which misses searching arrays of size 1. Using `mid = (left + right) / 2` which can cause integer overflow in languages like C++/Java if left + right exceeds 2^31 - 1.",
      complexity: "Time: O(log N) as the search range is halved each step. Space: O(1) iterative space."
    },
    dryRun: [
      { step: 1, left: 0, right: 5, mid: 2, val: 3, action: "Compare 3 with target 9", decision: "3 < 9. Shift left boundary pointer to mid + 1 (3).", highlight: [2] },
      { step: 2, left: 3, right: 5, mid: 4, val: 9, action: "Compare 9 with target 9", decision: "9 == 9. Return mid index (4).", highlight: [4] }
    ],
    diagram: {
      type: "binary-search",
      elements: [-1, 0, 3, 5, 9, 12],
      steps: [
        {
          index: 0,
          pointers: { left: 0, right: 5, mid: 2 },
          highlights: [2],
          description: "L = 0, R = 5, Mid = 2 (val = 3). Target 9 is greater than 3. Search right half."
        },
        {
          index: 1,
          pointers: { left: 3, right: 5, mid: 4 },
          highlights: [4],
          description: "L = 3, R = 5, Mid = 4 (val = 9). Found! Return index 4."
        }
      ]
    },
    algorithm: [
      "Set boundary pointers: `left = 0`, `right = length - 1`.",
      "Loop as long as `left <= right`.",
      "Calculate search center index: `mid = left + (right - left) / 2`.",
      "If target equals `nums[mid]`, return `mid`.",
      "If target is greater than `nums[mid]`, search right half: set `left = mid + 1`.",
      "If target is smaller, search left half: set `right = mid - 1`.",
      "If range terminates without a match, return `-1`."
    ],
    complexityTable: [
      { approach: "Linear Search (Brute Force)", time: "O(N)", space: "O(1)" },
      { approach: "Binary Search (Optimal)", time: "O(log N)", space: "O(1)" }
    ],
    patternRecognition: "This problem is the foundational **Binary Search** pattern. When a problem contains a sorted list or search space, consider binary search first to reduce linear runtimes.",
    interviewTips: {
      mistakes: "Always mention integer overflow prevention: write `left + (right - left) / 2` instead of `(left + right) / 2`.",
      optimization: "If memory footprint is critical, highlight that the iterative version is better than the recursive version due to lack of recursion stack overhead.",
      followups: "How would you find the first or last occurrence of a target in an array with duplicate values? How do you search in a rotated sorted array?",
      expectedDiscussion: "Be prepared to write down the exact math showing why Binary Search runs in O(log N) iterations."
    },
    similarProblems: [
      { title: "Search in Rotated Sorted Array", difficulty: "Medium" },
      { title: "Find First and Last Position of Element in Sorted Array", difficulty: "Medium" },
      { title: "Search Insert Position", difficulty: "Easy" }
    ],
    practiceQuestions: [
      { title: "First Bad Version", difficulty: "Easy" },
      { title: "Sqrt(x)", difficulty: "Easy" }
    ],
    keyTakeaways: {
      summary: "Divide-and-conquer strategy cuts the search boundary space in half on every check step.",
      formulas: ["mid = left + (right - left) / 2"],
      patterns: ["Halving range criteria (Sorted lists)"],
      complexities: ["O(log N) Time", "O(1) Space"]
    }
  },
  "3sum": {
    id: "3sum",
    title: "3Sum",
    difficulty: "Medium",
    category: "Two Pointers",
    companyTags: ["Google", "Amazon", "Microsoft", "Adobe", "Meta", "Apple"],
    readingTime: "6 mins",
    confidenceScore: 78,
    patternDifficulty: "Medium",
    problemStatement: {
      question: "Given an integer array nums, return all the triplets `[nums[i], nums[j], nums[k]]` such that `i != j`, `i != k`, and `j != k`, and `nums[i] + nums[j] + nums[k] == 0`.",
      subText: "Notice that the solution set must not contain duplicate triplets.",
      constraints: [
        "3 <= nums.length <= 3000",
        "-10^5 <= nums[i] <= 10^5"
      ],
      examples: [
        {
          input: "nums = [-1,0,1,2,-1,-4]",
          output: "[[-1,-1,2],[-1,0,1]]",
          explanation: "nums[0] + nums[1] + nums[2] == (-1) + 0 + 1 == 0.\nnums[1] + nums[2] + nums[4] == 0 + 1 + (-1) == 0.\nnums[0] + nums[3] + nums[4] == (-1) + 2 + (-1) == 0.\nThe unique triplets are [-1,0,1] and [-1,-1,2]."
        }
      ]
    },
    beginnerExplanation: "Imagine you are trying to find groups of three numbers in a basket that add up to exactly 0. The simple way is to check every combination of three numbers. But that takes a very long time! A faster way is to sort the numbers in order. Then, we pick one number as our 'anchor'. For the rest of the numbers, we place one pointer at the start and one at the end. Since the numbers are sorted, we can move the pointers inward to find pairs that sum to the negative of our anchor, avoiding combinations that look the same.",
    realLifeAnalogy: {
      title: "Trios at a Dance Party",
      description: "Imagine trying to balance the scales with groups of three people. You line them up by weight from lightest to heaviest. You pick one person, and now you want to find a pair of people whose combined weight balances the anchor. You select the lightest remaining person and the heaviest remaining person. If the sum is too heavy, you swap the heavy person with the next heaviest. If it's too light, you swap the light person with the next lightest. You easily find all matching trios without checking everyone!"
    },
    whyExists: "3Sum tests a candidate's ability to reduce multi-variable lookup times. It shows whether they can build on top of Two Sum and correctly skip duplicate values in sorted lists, which is a major edge case that trips up many developers.",
    ioWalkthrough: "Let's use `nums = [-1, 0, 1, 2, -1, -4]`. First, sort the array: `[-4, -1, -1, 0, 1, 2]`.\n- Anchor is `nums[0] = -4`. We need a pair summing to `+4` from the remaining `[-1, -1, 0, 1, 2]`. The left pointer starts at `-1`, right at `2`. Sum is 1, which is less than 4. Move left. Eventually no pair matches -4.\n- Anchor moves to `nums[1] = -1`. We need a pair summing to `+1` from `[-1, 0, 1, 2]`. Left pointer at `nums[2] = -1`, right pointer at `nums[5] = 2`. Sum is `-1 + 2 = 1`. Perfect! We add `[-1, -1, 2]` to the result, and shift both pointers to find more.",
    bruteForce: {
      idea: "Use three nested loops to test every combination of three integers in the array. Check if their sum equals 0 and filter out duplicates manually.",
      complexity: "Time: O(N^3). Space: O(1) (excluding result list).",
      pros: "Extremely simple; requires no pre-sorting.",
      cons: "Takes far too long for arrays of size 3,000. 3000^3 equals 27 billion computations, which will crash the browser.",
      code: {
        java: `public List<List<Integer>> threeSum(int[] nums) {
    Set<List<Integer>> res = new HashSet<>();
    for (int i = 0; i < nums.length; i++) {
        for (int j = i + 1; j < nums.length; j++) {
            for (int k = j + 1; k < nums.length; k++) {
                if (nums[i] + nums[j] + nums[k] == 0) {
                    List<Integer> trio = Arrays.asList(nums[i], nums[j], nums[k]);
                    Collections.sort(trio);
                    res.add(trio);
                }
            }
        }
    }
    return new ArrayList<>(res);
}`,
        python: `def threeSum(nums):
    res = set()
    n = len(nums)
    for i in range(n):
        for j in range(i+1, n):
            for k in range(j+1, n):
                if nums[i] + nums[j] + nums[k] == 0:
                    trio = tuple(sorted([nums[i], nums[j], nums[k]]))
                    res.add(trio)
    return [list(t) for t in res]`
      }
    },
    betterApproach: {
      idea: "Use a Hash Map inside a double loop. For each anchor `nums[i]`, do a Two Sum lookup on the rest of the array.",
      complexity: "Time: O(N^2). Space: O(N) due to hash sets.",
      code: `// Hash Map-based double loop...`
    },
    optimalApproach: {
      thinkingProcess: "If we sort the array first, we can fix an anchor `i` and use the Two Pointer technique on the remaining elements. This avoids using extra space for hashing and makes it easy to skip duplicates by looking at neighboring values.",
      patternRec: "Three nested variables summing to a constant in a sorted list is the ultimate indicator for a Two-Pointer after sorting pattern.",
      stepByStep: [
        "Sort the array `nums` in ascending order.",
        "Loop through `nums` with index `i`. This is our fixed anchor.",
        "If `nums[i] > 0`, break early (since three positive numbers cannot sum to 0 in a sorted array).",
        "If `i > 0` and `nums[i] == nums[i-1]`, skip to avoid duplicate anchor sets.",
        "Set pointers: `left = i + 1` and `right = nums.length - 1`.",
        "While `left < right`:",
        "  Calculate `sum = nums[i] + nums[left] + nums[right]`.",
        "  If `sum == 0`, add `[nums[i], nums[left], nums[right]]` to results.",
        "    Increment `left` and decrement `right`.",
        "    Skip any duplicates: `while (left < right && nums[left] == nums[left-1]) left++`.",
        "  Else if `sum < 0`, increment `left` to increase the sum.",
        "  Else, decrement `right` to decrease the sum."
      ],
      code: {
        java: `import java.util.*;

public List<List<Integer>> threeSum(int[] nums) {
    List<List<Integer>> result = new ArrayList<>();
    Arrays.sort(nums); // Sort array
    
    for (int i = 0; i < nums.length - 2; i++) {
        if (nums[i] > 0) break; // Early exit
        if (i > 0 && nums[i] == nums[i - 1]) continue; // Skip duplicates
        
        int left = i + 1;
        int right = nums.length - 1;
        
        while (left < right) {
            int sum = nums[i] + nums[left] + nums[right];
            if (sum == 0) {
                result.add(Arrays.asList(nums[i], nums[left], nums[right]));
                left++;
                right--;
                // Skip duplicate values for pointers
                while (left < right && nums[left] == nums[left - 1]) left++;
                while (left < right && nums[right] == nums[right + 1]) right--;
            } else if (sum < 0) {
                left++;
            } else {
                right--;
            }
        }
    }
    return result;
}`,
        python: `def threeSum(nums):
    result = []
    nums.sort()
    
    for i in range(len(nums) - 2):
        if nums[i] > 0:
            break
        if i > 0 and nums[i] == nums[i - 1]:
            continue
            
        left = i + 1
        right = len(nums) - 1
        
        while left < right:
            s = nums[i] + nums[left] + nums[right]
            if s == 0:
                result.append([nums[i], nums[left], nums[right]])
                left += 1
                right -= 1
                while left < right and nums[left] == nums[left - 1]:
                    left += 1
                while left < right and nums[right] == nums[right + 1]:
                    right -= 1
            elif s < 0:
                left += 1
            else:
                right -= 1
    return result`,
        cpp: `#include <vector>
#include <algorithm>

std::vector<std::vector<int>> threeSum(std::vector<int>& nums) {
    std::vector<std::vector<int>> result;
    std::sort(nums.begin(), nums.end());
    
    for (int i = 0; i < (int)nums.size() - 2; i++) {
        if (nums[i] > 0) break;
        if (i > 0 && nums[i] == nums[i - 1]) continue;
        
        int left = i + 1;
        int right = nums.size() - 1;
        while (left < right) {
            int sum = nums[i] + nums[left] + nums[right];
            if (sum == 0) {
                result.push_back({nums[i], nums[left], nums[right]});
                left++;
                right--;
                while (left < right && nums[left] == nums[left - 1]) left++;
                while (left < right && nums[right] == nums[right + 1]) right--;
            } else if (sum < 0) {
                left++;
            } else {
                right--;
            }
        }
    }
    return result;
}`,
        javascript: `function threeSum(nums) {
    const result = [];
    nums.sort((a, b) => a - b);
    for (let i = 0; i < nums.length - 2; i++) {
        if (nums[i] > 0) break;
        if (i > 0 && nums[i] === nums[i - 1]) continue;
        
        let left = i + 1;
        let right = nums.length - 1;
        while (left < right) {
            const sum = nums[i] + nums[left] + nums[right];
            if (sum === 0) {
                result.push(nums[i], nums[left], nums[right]);
                left++;
                right--;
                while (left < right && nums[left] === nums[left - 1]) left++;
                while (left < right && nums[right] === nums[right + 1]) right--;
            } else if (sum < 0) {
                left++;
            } else {
                right--;
            }
        }
    }
    return result;
}`
      },
      edgeCases: "Array with all zeros, negative values, duplicates at boundary pointers.",
      duplicateHandling: "We skip duplicate anchors using `nums[i] == nums[i-1]` and duplicate inner values inside the sum matches using left/right pointer comparisons.",
      mistakes: "Forgetting to sort the array before pointer manipulation. Forgetting to skip duplicate elements, which causes duplicate answers in output sets.",
      complexity: "Time: O(N^2) due to nested loops. Space: O(log N) to O(N) depending on the sorting implementation's storage."
    },
    dryRun: [
      { step: 1, anchor: 0, left: 1, right: 5, sum: -3, action: "[-4, -1, -1, 0, 1, 2]", decision: "Sum < 0. Shift left pointer right to increase sum.", highlight: [0, 1, 5] },
      { step: 2, anchor: 1, left: 2, right: 5, sum: 0, action: "[-4, -1, -1, 0, 1, 2]", decision: "Sum == 0. Found Trio [-1, -1, 2]! Move left & right pointers, skipping duplicates.", highlight: [1, 2, 5] }
    ],
    diagram: {
      type: "two-pointer",
      elements: [-4, -1, -1, 0, 1, 2],
      steps: [
        {
          index: 0,
          pointers: { anchor: 0, left: 1, right: 5 },
          highlights: [0, 1, 5],
          description: "Anchor = -4, L = -1, R = 2. Sum = -3 < 0. Increment L pointer."
        },
        {
          index: 1,
          pointers: { anchor: 1, left: 2, right: 5 },
          highlights: [1, 2, 5],
          description: "Anchor = -1, L = -1, R = 2. Sum = 0! Match found. Save triplet and shift L and R."
        }
      ]
    },
    algorithm: [
      "Sort array in ascending order.",
      "Fix anchor `i` from index `0` to `n-3`.",
      "If anchor value > 0, stop immediately (no sum possible).",
      "If anchor value is identical to prior index, skip to prevent duplicates.",
      "Set `left = i + 1`, `right = n - 1`.",
      "Loop while `left < right`.",
      "Compare `nums[i] + nums[left] + nums[right]` against target 0.",
      "If matched, append triplet and shift pointers, skipping equal values."
    ],
    complexityTable: [
      { approach: "Triple Loops (Brute Force)", time: "O(N^3)", space: "O(1)" },
      { approach: "Anchor Sorting + Dual Pointers (Optimal)", time: "O(N^2)", space: "O(N)" }
    ],
    patternRecognition: "This problem uses the **Two Pointers** pattern. The sorting stage prepares the array, allowing a linear scan with pointers instead of a quadratic scan.",
    interviewTips: {
      mistakes: "Ensure sorting handles negative values correctly (e.g. JavaScript defaults to string sort). Don't forget duplicate checks.",
      optimization: "Use an early-break if the anchor exceeds zero since subsequent entries are positive.",
      followups: "Can you solve it without sorting? (Yes, using a hash table, but it requires more memory). How does this extend to 4Sum?",
      expectedDiscussion: "Explain how pointer adjustments leverage sorted properties to avoid redundant combinations."
    },
    similarProblems: [
      { title: "Two Sum", difficulty: "Easy" },
      { title: "3Sum Closest", difficulty: "Medium" },
      { title: "4Sum", difficulty: "Medium" }
    ],
    practiceQuestions: [
      { title: "Container With Most Water", difficulty: "Medium" },
      { title: "Squares of a Sorted Array", difficulty: "Easy" }
    ],
    keyTakeaways: {
      summary: "Sort values first, anchor one index, then solve remaining targets via two-pointer compression.",
      formulas: ["nums[anchor] + nums[left] + nums[right] == 0"],
      patterns: ["Dual-pointers sorting strategy"],
      complexities: ["O(N^2) Time", "O(N) Space"]
    }
  },
  "linear-search": {
    id: "linear-search",
    title: "Linear Search",
    difficulty: "Easy",
    category: "Arrays",
    companyTags: ["Google", "Amazon", "Microsoft", "TCS", "Infosys"],
    readingTime: "3 mins",
    confidenceScore: 95,
    patternDifficulty: "Easy",
    problemStatement: {
      question: "Given an array of integers `nums` and an integer `target`, write a function to search `target` in `nums`. If `target` exists, return its index. Otherwise, return `-1`.",
      subText: "You can assume that numbers in the array are unsorted.",
      constraints: [
        "1 <= nums.length <= 10^4",
        "-10^4 <= nums[i], target <= 10^4"
      ],
      examples: [
        {
          input: "nums = [4, 5, 1, 9, 2], target = 9",
          output: "3",
          explanation: "9 exists at index 3."
        }
      ]
    },
    beginnerExplanation: "Imagine looking for a particular shirt in a wardrobe where shirts are not sorted. You start checking from the first hanger, moving from left to right, one by one, until you find it or reach the end. This is linear search!",
    realLifeAnalogy: {
      title: "Finding a Card in a Shuffled Deck",
      description: "Imagine looking for the Ace of Spades in a shuffled deck. Since the cards are in random order, your only option is to turn cards over one by one from the top until you find it."
    },
    whyExists: "Linear Search is the baseline search. Interviewers use it to set the standard before asking you to optimize using binary search or hashing.",
    ioWalkthrough: "Let's search for `9` in `[4, 5, 1, 9, 2]`.\n- Index 0: value 4 (not 9). Continue.\n- Index 1: value 5 (not 9). Continue.\n- Index 2: value 1 (not 9). Continue.\n- Index 3: value 9 (matched!). Return index 3.",
    bruteForce: {
      idea: "Search every element sequentially. This is already standard linear search.",
      complexity: "Time: O(N), Space: O(1)",
      pros: "Simple; works on unsorted collections.",
      cons: "Slow for large datasets.",
      code: {
        java: `public int search(int[] nums, int target) {\n    for (int i = 0; i < nums.length; i++) {\n        if (nums[i] == target) return i;\n    }\n    return -1;\n}`,
        python: `def search(nums, target):\n    for i, num in enumerate(nums):\n        if num == target:\n            return i\n    return -1`
      }
    },
    optimalApproach: {
      thinkingProcess: "Since the input is unsorted, we must examine every element at least once in the worst case, so O(N) is the optimal time complexity.",
      patternRec: "Monotonic sequences do not exist here, so linear scan is appropriate.",
      stepByStep: [
        "Iterate through the array with index `i` from 0 to N-1.",
        "Check if `nums[i]` equals `target`.",
        "If matched, return index `i`.",
        "If the loop ends without finding a match, return `-1`."
      ],
      code: {
        python: `def search(nums, target):\n    for i, num in enumerate(nums):\n        if num == target:\n            return i\n    return -1`,
        java: `public int search(int[] nums, int target) {\n    for (int i = 0; i < nums.length; i++) {\n        if (nums[i] == target) {\n            return i;\n        }\n    }\n    return -1;\n}`,
        cpp: `int search(vector<int>& nums, int target) {\n    for (int i = 0; i < nums.size(); i++) {\n        if (nums[i] == target) return i;\n    }\n    return -1;\n}`,
        javascript: `function search(nums, target) {\n    return nums.indexOf(target);\n}`,
        typescript: `function search(nums: number[], target: number): number {\n    return nums.indexOf(target);\n}`,
        go: `func search(nums []int, target int) int {\n    for i, v := range nums {\n        if v == target { return i }\n    }\n    return -1\n}`
      },
      complexity: "Time: O(N), Space: O(1)"
    },
    dryRun: [
      { step: 1, ptr: 0, val: 4, action: "Check index 0", decision: "4 != 9, move to next index", highlight: [0] },
      { step: 2, ptr: 1, val: 5, action: "Check index 1", decision: "5 != 9, move to next index", highlight: [1] },
      { step: 3, ptr: 2, val: 1, action: "Check index 2", decision: "1 != 9, move to next index", highlight: [2] },
      { step: 4, ptr: 3, val: 9, action: "Check index 3", decision: "9 == 9. Return index 3.", highlight: [3] }
    ],
    diagram: {
      type: "two-pointer",
      elements: [4, 5, 1, 9, 2],
      steps: [
        { index: 0, pointers: { i: 0 }, highlights: [0], description: "Check element 4. Not target 9." },
        { index: 3, pointers: { i: 3 }, highlights: [3], description: "Check element 9. Matched! Return index 3." }
      ]
    },
    algorithm: [
      "Loop through array elements.",
      "If element matches target, return its index.",
      "Else return -1."
    ],
    complexityTable: [
      { approach: "Linear Scan", time: "O(N)", space: "O(1)" }
    ],
    patternRecognition: "Sequential checking.",
    interviewTips: {
      mistakes: "Index out of bounds.",
      optimization: "If searching repeatedly, consider building a hash index.",
      followups: "What if the array is sorted? (Use Binary Search)"
    },
    similarProblems: [
      { title: "Binary Search", difficulty: "Easy" }
    ],
    practiceQuestions: [
      { title: "Contains Duplicate", difficulty: "Easy" }
    ],
    keyTakeaways: {
      summary: "Linear search checks every item sequentially.",
      formulas: ["None"],
      patterns: ["Standard iteration"],
      complexities: ["O(N) Time", "O(1) Space"]
    }
  }
};
