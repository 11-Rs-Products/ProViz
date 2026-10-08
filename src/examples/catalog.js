/**
 * catalog.js — the example programs offered in the editor's example menu.
 *
 * Examples are just starting code: the Visualizer runs and renders any Python program the
 * same way, whether it came from here or was typed from scratch. They are grouped to show
 * the range of what can be visualised, from small algorithms to tables of data.
 */

import { questions } from '../questions/registry.js';

/** Extra examples that demonstrate data structures and tabular data. */
const DATA_EXAMPLES = [
    {
        id: 'ex-linked-list',
        group: 'Data structures',
        title: 'Linked list (classes)',
        starter_code: `class Node:
    def __init__(self, value, next=None):
        self.value = value
        self.next = next

# Build 1 -> 2 -> 3, then reverse it in place
head = Node(1, Node(2, Node(3)))

prev = None
current = head
while current:
    nxt = current.next
    current.next = prev
    prev = current
    current = nxt
head = prev
`,
    },
    {
        id: 'ex-dicts-sets',
        group: 'Data structures',
        title: 'Dictionaries, sets & Counter',
        starter_code: `from collections import Counter

text = "the quick brown fox jumps over the lazy dog the end"
words = text.split()

counts = Counter(words)
unique = set(words)
lengths = {w: len(w) for w in unique if len(w) > 3}
top = counts.most_common(2)
`,
    },
    {
        id: 'ex-matrix',
        group: 'Data & tables',
        title: 'Matrix (2-D list)',
        starter_code: `# A 2-D list is shown as a table
grid = [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9],
]

# Transpose it
size = len(grid)
for i in range(size):
    for j in range(i + 1, size):
        grid[i][j], grid[j][i] = grid[j][i], grid[i][j]
`,
    },
    {
        id: 'ex-records',
        group: 'Data & tables',
        title: 'Records (list of dicts)',
        starter_code: `# Rows with the same keys are shown as a table
students = [
    {"name": "Ana", "score": 91, "passed": True},
    {"name": "Bo", "score": 58, "passed": False},
    {"name": "Cy", "score": 77, "passed": True},
]

passed = [s["name"] for s in students if s["passed"]]
average = sum(s["score"] for s in students) / len(students)
best = max(students, key=lambda s: s["score"])
`,
    },
    {
        id: 'ex-pandas',
        group: 'Data & tables',
        title: 'pandas DataFrame',
        starter_code: `import pandas as pd

sales = pd.DataFrame({
    "region": ["North", "South", "East", "West"],
    "units": [120, 95, 143, 80],
    "price": [9.5, 11.0, 8.75, 12.0],
})

sales["revenue"] = sales["units"] * sales["price"]
top = sales.sort_values("revenue", ascending=False).head(2)
total = float(sales["revenue"].sum())
`,
    },
    {
        id: 'ex-numpy',
        group: 'Data & tables',
        title: 'NumPy arrays',
        starter_code: `import numpy as np

a = np.arange(1, 10).reshape(3, 3)
identity = np.eye(3, dtype=int)
product = a @ identity
column_sums = a.sum(axis=0)
`,
    },
];

export const SCRATCHPAD_ID = '__scratchpad__';

/** Example groups in menu order. Algorithm examples come from the original registry. */
export function exampleGroups() {
    return [
        { label: 'Algorithms', items: questions.map(q => ({ id: q.id, title: q.title, starter_code: q.starter_code })) },
        { label: 'Data structures', items: DATA_EXAMPLES.filter(e => e.group === 'Data structures') },
        { label: 'Data & tables', items: DATA_EXAMPLES.filter(e => e.group === 'Data & tables') },
    ];
}

export function findExample(id) {
    for (const g of exampleGroups()) {
        const hit = g.items.find(i => i.id === id);
        if (hit) return hit;
    }
    return null;
}
