export const questions = [
    {
        id: "remove_element",
        title: "Remove Element",
        description: "There are 5 numbers on the screen. Write Python code to remove the element with the value '3'.\n\nUse `visualizer.remove(id)` where id is 'block_N' (0 to 4).",
        initialCode: `# The blocks are already spawned for you with IDs: block_0 to block_4
# Their values are [1, 2, 3, 4, 5] respectively.

def solve():
    # Write your code here to remove the block with value 3
    pass
    
solve()
`,
        setupScene: (vAPI) => {
            vAPI.clearAll();
            // Spawn 5 blocks: 1, 2, 3, 4, 5
            for (let i = 0; i < 5; i++) {
                vAPI.spawn(`block_${i}`, i + 1, 'DEFAULT', -3 + i * 1.5, 0, 0);
            }
        }
    },
    {
        id: "update_element",
        title: "Double the Values",
        description: "You have 3 numbers on the screen: 2, 4, 6. Double each of their values using `visualizer.update(id, newValue)`.",
        initialCode: `# The blocks are spawned with IDs: block_0 to block_2
# Current values: [2, 4, 6]

def solve():
    # Double the values here
    pass

solve()
`,
        setupScene: (vAPI) => {
            vAPI.clearAll();
            vAPI.spawn('block_0', 2, 'DEFAULT', -1.5, 0, 0);
            vAPI.spawn('block_1', 4, 'DEFAULT', 0, 0, 0);
            vAPI.spawn('block_2', 6, 'DEFAULT', 1.5, 0, 0);
        }
    }
];
