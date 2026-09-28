# Universal Control-Flow Graph, Static Single Assignment (SSA) & Program Slicing Engine

## 1. Motivation
While Stages 1–12 established execution tracing, deterministic state reconstruction, and dynamic dataflow tracking ("where did this runtime value come from?"), Stage 13 introduces the static structural and semantic foundation of ProViz. It answers:
- **Which statements can execute, and how can execution flow between them?**
- **Which definitions reach which uses across all possible paths?**
- **Which parts of the program are statically relevant or dynamically responsible for a selected variable or statement?**
- **Why did a specific branch execute, and why are certain blocks structurally unreachable?**

This establishes an immutable, language-neutral, deterministic static analysis layer that complements dynamic runtime observations.

---

## 2. CFG Architecture
The Control-Flow Graph (CFG) is a directed graph where:
- **Nodes** (`ControlFlowNode`) represent program execution points (Entry, Exit, Statements, Branch Conditions, Loop Headers, Return sites, Exception Handlers).
- **Edges** (`ControlFlowEdge`) represent legal control-flow transitions annotated with semantic types (`NORMAL`, `TRUE_BRANCH`, `FALSE_BRANCH`, `LOOP_BACK`, `LOOP_EXIT`, `RETURN`, `EXCEPTION`, `FALLTHROUGH`).

```
                    WORKSPACE / SOURCE
                            ↓
               LANGUAGE CONTROL-FLOW ADAPTER
                            ↓
                   CONTROL-FLOW GRAPH
                            ↓
                 DOMINATORS / REACHABILITY
                            ↓
                    SSA CONSTRUCTION
                            ↓
             DEF-USE / REACHING-DEFINITION ANALYSIS
                            ↓
                     PROGRAM SLICING
                            ↓
             STATIC + DYNAMIC ANALYSIS QUERIES
```

---

## 3. Basic Blocks
A `BasicBlock` is a maximal linear sequence of program statements with:
1. **Single Entry:** Control enters only at the first statement.
2. **Single Exit:** Control leaves only at the last statement.
3. **No Internal Branching:** No branch targets or branching operations exist inside the block.

Basic blocks are deterministically ordered and indexed to enable efficient intra-block and inter-block dataflow equations.

---

## 4. Control-Flow Edges
Explicit edge semantics distinguish different types of transitions:
- `NORMAL`: Standard fall-through and sequential statement execution.
- `TRUE_BRANCH` / `FALSE_BRANCH`: Conditional branch outcomes.
- `LOOP_BACK`: Latch edge back to loop header.
- `LOOP_EXIT`: Termination edge from loop header or break statement to loop post-dominator.
- `EXCEPTION`: Exceptional transfer from try block to except / finally handler.
- `RETURN`: Explicit return from function to function exit.
- `FALLTHROUGH`: Implicit continuation after branch/merge completion.

---

## 5. Function and Module Boundaries
CFGs maintain strict encapsulation across scopes:
- Every function has its own `FUNCTION_ENTRY` and `FUNCTION_EXIT` nodes.
- Inter-procedural calls are modeled as call sites with continuation blocks rather than flattening callee graphs into callers.
- Module boundaries (e.g., `main.py`, `utils.py`) are preserved through `fileId` and `moduleId` metadata.

---

## 6. Branches (If / Elif / Else)
Branch structures are modeled with:
1. A `CONDITION` node holding the predicate expression.
2. `TRUE_BRANCH` pointing to the `then` block.
3. `FALSE_BRANCH` pointing to the `else`/`elif` block (or directly to merge if no else clause exists).
4. A canonical `MERGE` node where divergent control paths converge.

```
                  Condition (x > 0)
                   /             \
       [True]     /               \    [False]
                 ↓                 ↓
              x = 1              x = 2
                 \                 /
                  \               /
                   ↓             ↓
                     Merge Point
                         ↓
                       y = x
```

---

## 7. Loops (While / For)
Loops are modeled with:
- `LOOP_HEADER`: Predicate evaluation and iteration entry.
- `TRUE_BRANCH`: Loop body execution.
- `LOOP_BACK`: Back edge from the loop latch / continue statement back to header.
- `LOOP_EXIT`: Edge taken when condition evaluates to false or break statement executes.

---

## 8. Exceptions (Try / Except / Finally)
Exception control flow is explicitly modeled:
- `try` blocks connect to `except` handlers via `EXCEPTION` edges.
- Unhandled exceptional paths route to `finally` cleanup nodes and propagate to function exits.
- Ensures reachability and liveness analysis account for error handling.

---

## 9. Dominators & Dominator Tree
For a node $D$ and node $N$, $D$ **dominates** $N$ ($D \text{ dom } N$) if every path from the CFG entry to $N$ must pass through $D$.
- **Immediate Dominator ($idom$):** The unique strict dominator of $N$ that does not dominate any other strict dominator of $N$.
- **Dominance Frontier ($DF(X)$):** The set of all nodes $Y$ such that $X$ dominates a predecessor of $Y$, but $X$ does not strictly dominate $Y$.
Dominance frontiers are the exact mathematical locations where $\phi$-nodes must be placed during SSA construction.

---

## 10. Post-Dominators
A node $P$ **post-dominates** $N$ ($P \text{ pdom } N$) if every path from $N$ to the CFG exit must pass through $P$.
- Computed over the reversed CFG with the `EXIT` node acting as the entry.
- Immediate post-dominance ($ipdom$) forms the post-dominator tree used for control dependence analysis.

---

## 11. Control Dependence
A node $Y$ is **control dependent** on a conditional node $X$ ($Y \text{ cd } X$) if:
1. There exists a directed path from $X$ to $Y$ such that every node on the path (excluding $X$ and $Y$) is post-dominated by $Y$.
2. $X$ is not post-dominated by $Y$.

This guarantees that $X$ has at least two exit paths, one of which can prevent $Y$ from executing.

---

## 12. Static Single Assignment (SSA)
In SSA form, every variable is defined exactly once, and every use refers to exactly one definition version:
- Each variable version is assigned a deterministic identifier: `ssa_<func>_<var>_<version>`.
- Preserves source-level names while removing all anti-dependencies (write-after-read) and output-dependencies (write-after-write).

---

## 13. Phi Nodes ($\phi$)
When distinct definitions of variable $x$ reach a control merge point $M$ from different incoming predecessor blocks $B_1, B_2$:
$$\phi(x_{B1}, x_{B2})$$
is placed at $M$ to produce a new version $x_3$.
Phi nodes record incoming predecessor block IDs and value references.

---

## 14. Reaching Definitions
Reaching definition analysis computes for every program point $P$ the set of assignment sites $(v, d)$ that may reach $P$ without being killed by an intervening assignment to $v$:
$$IN[B] = \bigcup_{P \in Pred(B)} OUT[P]$$
$$OUT[B] = GEN[B] \cup (IN[B] \setminus KILL[B])$$

---

## 15. Static Dataflow
`StaticDataflow` implements:
- **Live Variable Analysis:** Computes variables that may be read along some path before being overwritten (backward analysis).
- **Available Expressions / Def-Use Chains:** Links static definitions directly to their use sites.

---

## 16. Program Slicing (Static Backward & Forward)
A program slice consists of all statements that potentially affect (backward) or are affected by (forward) a slicing criterion $(v, L)$:
- **Backward Slicing:** Traverses data dependency chains (producers of used variables) and control dependency chains (controlling conditions) backward from the criterion.
- **Forward Slicing:** Traverses data dependency consumers and branch consequences forward from the criterion.

---

## 17. Dynamic Slicing
Dynamic slicing integrates Stage 12 runtime evidence from `DataflowGraph` and `Universal Execution Trace (UET)`:
- Considers only the statements and values that **actually executed and flowed** in the recorded run.
- Distinguishes observed execution reality from theoretical static potential.

---

## 18. Static vs Dynamic Analysis Distinction
| Aspect | Static Analysis (Stage 13) | Dynamic Analysis (Stage 12) |
|---|---|---|
| **Underlying Graph** | Control-Flow Graph / SSA | Universal Execution Trace / PDG |
| **Question Answered** | "What *can* happen across all paths?" | "What *did* happen in this execution?" |
| **Branch Handling** | Both branches are analyzed | Only the taken branch is analyzed |
| **Aliases** | Conservative approximation | Exact observed heap pointer identities |
| **Role** | Structural foundation & potentiality | Concrete historical verification |

---

## 19. Stage 12 PDG Integration
Stage 13 CFG and SSA nodes connect to Stage 12 `DataflowGraph` nodes via canonical source locations and deterministic identifiers:
$$\text{CFG Node} \longleftrightarrow \text{SSA Def/Value} \longleftrightarrow \text{PDG Node} \longleftrightarrow \text{Runtime Value}$$
Enables seamless transition from static slicing to dynamic runtime explanation.

---

## 20. Debugger Integration
The `Debugger` exposes high-level program analysis methods:
- `dbg.getControlFlow(functionId)`: Retrieves active function CFG.
- `dbg.getSSA(functionId)`: Retrieves active SSA form.
- `dbg.getBackwardSlice(criterion, options)`: Computes backward slice from current cursor/variable.
- `dbg.getForwardSlice(criterion, options)`: Computes forward impact slice.
- `dbg.getDynamicSlice(criterion, frameIndex)`: Computes dynamic slice for current timeline step.
- `dbg.explainBranch({ conditionNodeId, observedValue })`: Explains why a branch was chosen.
- `dbg.explainUnreachable(nodeId)`: Explains why a block has no reachable paths.

---

## 21. Watch Integration
Watches now combine dynamic dataflow changes with static reaching definitions and control dependencies:
- Answers: *"Why did watch variable `result` change from value A to value B?"*
- Connects the runtime assignment event to the static condition that gated its execution.

---

## 22. ObjectInspector Integration
Heap objects inspected in Stage 6 / Stage 12 now connect to:
- Static allocation sites in the CFG.
- Static functions and methods that read or mutate fields.
- Dynamic slices explaining object lifecycle.

---

## 23. Source Highlighting
Analysis queries return unified `SourceLocation` objects with `fileId`, `line`, and `column`:
- Enables editor gutters and line ranges to visually highlight active control paths, slice members, and dominance frontiers.

---

## 24. Serialization Round-Trip
All Stage 13 data structures implement `toJSON()` and static `fromJSON()` methods:
- `ControlFlowGraph` $\longleftrightarrow$ JSON
- `SSAFunction` $\longleftrightarrow$ JSON
- `AnalysisSnapshot` $\longleftrightarrow$ JSON
Enables persistent caching, remote analysis workers, and multi-session historical replay.

---

## 25. Determinism
Every identifier is generated deterministically from semantic coordinates:
- `cfg_node_<func>_<type>_L<line>_<ordinal>`
- `cfg_edge_<from>_<to>_<type>`
- `ssa_<func>_<var>_<version>`
No `Math.random()`, `Date.now()`, or memory-address hashing is used. Identical code produces byte-for-byte identical JSON serialization.

---

## 26. Performance Benchmarks
Benchmarked on modern JS runtime:
- **1,000 CFG Nodes Construction:** 1.7 ms (< 200 ms target)
- **1,000 Nodes Dominator Tree Computation:** 50–60 ms (< 200 ms target)
- **100 Backward Slice Queries:** 55 ms (< 300 ms target)
- **Memory Footprint:** < 5 MB for full CFG/SSA/Dominance graphs on 1,000+ AST nodes.

---

## 27. Limitations & Safe Fallbacks
- **Dynamic Language Dynamic Attributes:** When dynamic attribute access or `getattr()` cannot be statically resolved, conservative fallback dependencies are recorded.
- **Short-circuiting & Exceptions:** Unchecked runtime exceptions use abstract exceptional edges.
- **Code Execution:** No user code is executed during static analysis.

---

## 28. Future Incremental Analysis
Stage 13 snapshot metadata (`AnalysisSnapshot`) is structured to support incremental recomputation:
- File-level and function-level granularity allow invalidating only modified functions while reusing unaffected CFG and SSA subgraphs across workspace edits.
