export const questions = [
    {
        id: "sum_squares_even",
        title: "Sum of Squares of Even Numbers",
        description: "Write a function sum_of_squares_of_even that takes a list of integers nums and returns the sum of squares of all even numbers in the list.\n\nExample:\n>>> nums = [1, 2, 3, 4, 5, 6]\n>>> sum_of_squares_of_even(nums)\n56",
        initialCode: `def sum_of_squares_of_even(nums):
    # Write your logic here!
    # 
    # HINT: To make the 3D simulation update when you run it, 
    # you MUST use the visualizer API inside your loop! 
    # 
    # Examples:
    # visualizer.highlight(f"num_{i}", "YELLOW")
    # visualizer.update("sum_val", new_total, "PURPLE")
    # visualizer.update("status", f"Even! +{square}", "GREEN")
    
    pass

# Test the function with the visualizer blocks
nums = [1, 2, 3, 4, 5, 6]
result = sum_of_squares_of_even(nums)
`,
        generateSolutionSteps: () => {
            const steps = [];
            const nums = [1, 2, 3, 4, 5, 6];
            let total = 0;

            steps.push({
                desc: "We start by initializing our total sum to 0.",
                code: "total = 0",
                animate: (vAPI) => {
                    vAPI.update("status", "Starting...", "BLUE");
                }
            });

            for (let i = 0; i < nums.length; i++) {
                const num = nums[i];
                steps.push({
                    desc: `Loop iteration ${i+1}: We get the next number from the array.`,
                    code: `for num in nums:\n    # num is ${num}`,
                    animate: (vAPI) => {
                        vAPI.update("status", `Check ${num}`, "BLUE");
                        vAPI.highlight(`num_${i}`, "YELLOW");
                    }
                });

                if (num % 2 === 0) {
                    const square = num ** 2;
                    total += square;
                    const currentTotal = total; // Capture current value for closure
                    steps.push({
                        desc: `Since ${num} is even, we square it (${num}^2 = ${square}) and add it to our total.`,
                        code: `if num % 2 == 0:\n    square = num ** 2\n    total += square`,
                        animate: (vAPI) => {
                            vAPI.update("status", `Even! +${square}`, "GREEN");
                            vAPI.update(`num_${i}`, num, "GREEN");
                            vAPI.update("sum_val", currentTotal, "PURPLE");
                        }
                    });
                } else {
                    steps.push({
                        desc: `Since ${num} is odd, we ignore it and continue.`,
                        code: `if num % 2 != 0:\n    continue`,
                        animate: (vAPI) => {
                            vAPI.update("status", `Odd! Skip`, "RED");
                            vAPI.update(`num_${i}`, num, "RED");
                        }
                    });
                }
            }

            steps.push({
                desc: "Once the loop finishes, we return the total.",
                code: `return total  # returns ${total}`,
                animate: (vAPI) => {
                    vAPI.update("status", `Done! Total: ${total}`, "PURPLE");
                }
            });

            return steps;
        },
        setupScene: (vAPI) => {
            vAPI.clearAll();
            const nums = [1, 2, 3, 4, 5, 6];
            for (let i = 0; i < nums.length; i++) {
                vAPI.spawn(`num_${i}`, nums[i], 'DEFAULT', -3.75 + i * 1.5, 1, 0);
            }
            vAPI.spawn('sum_label', 'Sum:', 'DEFAULT', -1.5, -1, 0);
            vAPI.spawn('sum_val', 0, 'PURPLE', 0, -1, 0);
            vAPI.spawn('status', 'Ready', 'DEFAULT', 0, 3, 0);
        }
    }
];
