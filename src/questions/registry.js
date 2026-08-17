/**
 * ProViz Question Registry
 *
 * Each question is a pure data object conforming to the question schema.
 * No animation logic lives here — the execution engine runs the code
 * and produces a trace that the visualization engine renders.
 *
 * Question Schema:
 * {
 *   id:          string  — unique, URL-safe
 *   title:       string
 *   description: string
 *   difficulty:  'easy' | 'medium' | 'hard'
 *   category:    string
 *   tags:        string[]
 *   starter_code:  string  — shown to user in editor
 *   solution_code: string  — executed through same engine for "View Solution" mode
 *   visualization: {
 *     primary_visualizer: 'variables' | 'array' | 'call_stack' | 'none'
 *     secondary_visualizers: string[]
 *     tracked_variables: string[]   — if empty, ALL locals are shown
 *     initial_scene: fn(BaseVisualizer) — optional: sets up 3D scene before trace
 *   }
 * }
 *
 * Adding a new question: add an entry to the `questions` array below.
 * No other application code needs to change.
 */

export const questions = [

    // ─── 1. Variables & Loops ─────────────────────────────────────────────────
    {
        id: 'sum-squares-even',
        title: 'Sum of Squares of Even Numbers',
        description:
`Write a function sum_of_squares_of_even that takes a list of integers and returns the sum of squares of all even numbers.

Example:
>>> nums = [1, 2, 3, 4, 5, 6]
>>> sum_of_squares_of_even(nums)
56

Hint: A number n is even if n % 2 == 0. Its square is n ** 2.`,
        difficulty: 'easy',
        category: 'loops',
        tags: ['loops', 'conditionals', 'math'],
        starter_code:
`def sum_of_squares_of_even(nums):
    total = 0
    for num in nums:
        if num % 2 == 0:
            total += num ** 2
    return total

nums = [1, 2, 3, 4, 5, 6]
result = sum_of_squares_of_even(nums)
print(result)
`,
        solution_code:
`def sum_of_squares_of_even(nums):
    total = 0
    for num in nums:
        if num % 2 == 0:
            total += num ** 2
    return total

nums = [1, 2, 3, 4, 5, 6]
result = sum_of_squares_of_even(nums)
print(result)
`,
        visualization: {
            primary_visualizer: 'array',
            secondary_visualizers: ['variables', 'call_stack'],
            tracked_variables: ['total', 'num', 'result'],
            initial_scene: (vis) => {
                // Render the nums array in 3D
                vis.arrayViz?.initialize('nums', [1, 2, 3, 4, 5, 6]);
            },
        },
    },

    // ─── 2. Two Sum (Hash Map) ────────────────────────────────────────────────
    {
        id: 'two-sum',
        title: 'Two Sum',
        description:
`Given an array of integers nums and a target integer, return the indices of the two numbers that add up to the target.

Example:
>>> two_sum([2, 7, 11, 15], 9)
[0, 1]  # nums[0] + nums[1] == 9

Use a dictionary to solve this in O(n) time.`,
        difficulty: 'easy',
        category: 'arrays',
        tags: ['array', 'hashmap', 'searching'],
        starter_code:
`def two_sum(nums, target):
    seen = {}
    for i, value in enumerate(nums):
        complement = target - value
        if complement in seen:
            return [seen[complement], i]
        seen[value] = i
    return []

result = two_sum([2, 7, 11, 15], 9)
print(result)
`,
        solution_code:
`def two_sum(nums, target):
    seen = {}
    for i, value in enumerate(nums):
        complement = target - value
        if complement in seen:
            return [seen[complement], i]
        seen[value] = i
    return []

result = two_sum([2, 7, 11, 15], 9)
print(result)
`,
        visualization: {
            primary_visualizer: 'array',
            secondary_visualizers: ['variables', 'call_stack'],
            tracked_variables: ['i', 'value', 'complement', 'seen', 'result'],
            initial_scene: (vis) => {
                vis.arrayViz?.initialize('nums', [2, 7, 11, 15]);
            },
        },
    },

    // ─── 3. Fibonacci (Recursion) ─────────────────────────────────────────────
    {
        id: 'fibonacci-recursive',
        title: 'Fibonacci (Recursive)',
        description:
`Write a recursive function fib(n) that returns the nth Fibonacci number.

fib(0) = 0
fib(1) = 1
fib(n) = fib(n-1) + fib(n-2)

Example:
>>> fib(6)
8

Watch the call stack grow and shrink as the recursion unfolds!`,
        difficulty: 'easy',
        category: 'recursion',
        tags: ['recursion', 'math', 'call-stack'],
        starter_code:
`def fib(n):
    if n <= 1:
        return n
    return fib(n - 1) + fib(n - 2)

result = fib(5)
print(result)
`,
        solution_code:
`def fib(n):
    if n <= 1:
        return n
    return fib(n - 1) + fib(n - 2)

result = fib(5)
print(result)
`,
        visualization: {
            primary_visualizer: 'call_stack',
            secondary_visualizers: ['variables'],
            tracked_variables: ['n', 'result'],
            initial_scene: null,
        },
    },

    // ─── 4. Binary Search ────────────────────────────────────────────────────
    {
        id: 'binary-search',
        title: 'Binary Search',
        description:
`Given a sorted array and a target value, implement binary search to find the target's index.
Return -1 if the target is not found.

Example:
>>> binary_search([1, 3, 5, 7, 9, 11], 7)
3

Binary search halves the search space on every iteration — O(log n) time!`,
        difficulty: 'easy',
        category: 'searching',
        tags: ['array', 'searching', 'pointers'],
        starter_code:
`def binary_search(arr, target):
    left = 0
    right = len(arr) - 1
    while left <= right:
        mid = (left + right) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    return -1

arr = [1, 3, 5, 7, 9, 11]
result = binary_search(arr, 7)
print(result)
`,
        solution_code:
`def binary_search(arr, target):
    left = 0
    right = len(arr) - 1
    while left <= right:
        mid = (left + right) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    return -1

arr = [1, 3, 5, 7, 9, 11]
result = binary_search(arr, 7)
print(result)
`,
        visualization: {
            primary_visualizer: 'array',
            secondary_visualizers: ['variables', 'call_stack'],
            tracked_variables: ['left', 'right', 'mid', 'result'],
            initial_scene: (vis) => {
                vis.arrayViz?.initialize('arr', [1, 3, 5, 7, 9, 11]);
            },
        },
    },

    // ─── 5. Bubble Sort ───────────────────────────────────────────────────────
    {
        id: 'bubble-sort',
        title: 'Bubble Sort',
        description:
`Implement bubble sort to sort an array of integers in ascending order.

In each pass, compare adjacent elements and swap them if they are in the wrong order.
Repeat until no swaps are needed.

Example:
>>> bubble_sort([64, 34, 25, 12, 22, 11, 90])
[11, 12, 22, 25, 34, 64, 90]`,
        difficulty: 'easy',
        category: 'sorting',
        tags: ['array', 'sorting', 'loops'],
        starter_code:
`def bubble_sort(arr):
    n = len(arr)
    for i in range(n):
        swapped = False
        for j in range(0, n - i - 1):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
                swapped = True
        if not swapped:
            break
    return arr

arr = [64, 34, 25, 12, 22]
result = bubble_sort(arr)
print(result)
`,
        solution_code:
`def bubble_sort(arr):
    n = len(arr)
    for i in range(n):
        swapped = False
        for j in range(0, n - i - 1):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
                swapped = True
        if not swapped:
            break
    return arr

arr = [64, 34, 25, 12, 22]
result = bubble_sort(arr)
print(result)
`,
        visualization: {
            primary_visualizer: 'array',
            secondary_visualizers: ['variables'],
            tracked_variables: ['i', 'j', 'swapped'],
            initial_scene: (vis) => {
                vis.arrayViz?.initialize('arr', [64, 34, 25, 12, 22]);
            },
        },
    },

];

/** Lookup by question ID. */
export function getQuestion(id) {
    return questions.find(q => q.id === id) || null;
}
