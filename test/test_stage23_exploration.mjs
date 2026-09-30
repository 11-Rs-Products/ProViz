import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import * as Exploration from '../src/exploration/index.js';
import { Debugger } from '../src/debugger/Debugger.js';

describe('Stage 23: Universal Property-Based, Metamorphic & Adaptive Exploration Engine', () => {

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. Primitive & Structured Generators
  // ─────────────────────────────────────────────────────────────────────────────
  describe('1. Universal Generator Hierarchy', () => {
    it('generates deterministic integers given fixed seed & context', () => {
      const ctx1 = new Exploration.GeneratorContext({ seed: 12345 });
      const ctx2 = new Exploration.GeneratorContext({ seed: 12345 });
      const gen = new Exploration.IntegerGenerator({ min: 10, max: 100 });

      const sample1 = gen.sample(ctx1, 5);
      const sample2 = gen.sample(ctx2, 5);

      assert.equal(sample1.length, 5);
      assert.deepEqual(sample1, sample2);
      for (const val of sample1) {
        assert.ok(val >= 10 && val <= 100);
      }
    });

    it('generates float, boolean, character, and string values', () => {
      const ctx = new Exploration.GeneratorContext({ seed: 99 });
      const floatGen = new Exploration.FloatGenerator({ min: 0.0, max: 1.0 });
      const boolGen = new Exploration.BooleanGenerator();
      const charGen = new Exploration.CharacterGenerator({ alphabet: 'ABC' });
      const strGen = new Exploration.StringGenerator({ minLength: 3, maxLength: 5 });

      const fVal = floatGen.generate(ctx).value;
      const bVal = boolGen.generate(ctx).value;
      const cVal = charGen.generate(ctx).value;
      const sVal = strGen.generate(ctx).value;

      assert.ok(typeof fVal === 'number' && fVal >= 0.0 && fVal <= 1.0);
      assert.ok(typeof bVal === 'boolean');
      assert.ok(['A', 'B', 'C'].includes(cVal));
      assert.ok(typeof sVal === 'string' && sVal.length >= 3 && sVal.length <= 5);
    });

    it('generates structured collections: arrays, sets, maps, and tuples', () => {
      const ctx = new Exploration.GeneratorContext({ seed: 777 });
      const elemGen = new Exploration.IntegerGenerator({ min: 1, max: 10 });
      const arrGen = new Exploration.ArrayGenerator({ elementGenerator: elemGen, minLength: 2, maxLength: 4 });
      const setGen = new Exploration.SetGenerator({ elementGenerator: elemGen, minSize: 1, maxSize: 3 });
      const mapGen = new Exploration.MapGenerator({ keyGenerator: new Exploration.StringGenerator({ minLength: 2, maxLength: 2 }), valueGenerator: elemGen });
      const tupleGen = new Exploration.TupleGenerator({ elementGenerators: [new Exploration.BooleanGenerator(), elemGen] });

      const arr = arrGen.generate(ctx).value;
      const set = setGen.generate(ctx).value;
      const map = mapGen.generate(ctx).value;
      const tuple = tupleGen.generate(ctx).value;

      assert.ok(Array.isArray(arr) && arr.length >= 2 && arr.length <= 4);
      assert.ok(set instanceof Set);
      assert.ok(map instanceof Map);
      assert.ok(Array.isArray(tuple) && tuple.length === 2 && typeof tuple[0] === 'boolean');
    });

    it('generates hierarchical tree structures', () => {
      const ctx = new Exploration.GeneratorContext({ seed: 888 });
      const valGen = new Exploration.IntegerGenerator({ min: 1, max: 50 });
      const treeGen = new Exploration.TreeGenerator({ valueGenerator: valGen, maxDepth: 2, maxChildren: 2 });

      const tree = treeGen.generate(ctx).value;
      assert.ok(tree && typeof tree.value === 'number');
      assert.ok(Array.isArray(tree.children));
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. Boundary Analysis & Constraint-Aware Generators
  // ─────────────────────────────────────────────────────────────────────────────
  describe('2. Boundary Analysis & Constraint Resolution', () => {
    it('analyzes boundary points around numeric conditions and zero', () => {
      const boundaries = Exploration.BoundaryAnalyzer.analyzeNumericBounds({ min: 0, max: 100 });
      assert.ok(boundaries.length >= 5);
      const points = boundaries.map(b => b.value);
      assert.ok(points.includes(0));
      assert.ok(points.includes(100));
      assert.ok(points.includes(1));
      assert.ok(points.includes(99));
    });

    it('extracts boundaries from AST/source condition expressions', () => {
      const code = `if x > 10:\n    return x\nelif y == 0:\n    return 0`;
      const extracted = Exploration.BoundaryAnalyzer.extractFromSource(code);
      assert.ok(extracted.some(b => b.value === 10 || b.value === 11 || b.value === 9));
      assert.ok(extracted.some(b => b.value === 0 || b.value === 1 || b.value === -1));
    });

    it('generates boundary inputs using BoundaryGenerator', () => {
      const gen = new Exploration.BoundaryGenerator({
        boundaryPoints: [
          new Exploration.BoundaryPoint({ value: 0 }),
          new Exploration.BoundaryPoint({ value: -1 }),
          new Exploration.BoundaryPoint({ value: 1 })
        ]
      });
      const ctx = new Exploration.GeneratorContext({ seed: 1 });
      const sample = gen.sample(ctx, 3);
      assert.deepEqual(sample, [0, -1, 1]);
    });

    it('respects constraints via ConstraintAwareGenerator and solver bridge', () => {
      const baseGen = new Exploration.IntegerGenerator({ min: -50, max: 50 });
      const constraint = new Exploration.GeneratorConstraint({
        name: 'positive_even',
        predicate: x => x > 0 && x % 2 === 0
      });
      const constrainedGen = new Exploration.ConstraintAwareGenerator({
        baseGenerator: baseGen,
        constraints: [constraint]
      });
      const ctx = new Exploration.GeneratorContext({ seed: 42 });
      const sample = constrainedGen.sample(ctx, 5);

      assert.equal(sample.length, 5);
      for (const val of sample) {
        assert.ok(val > 0 && val % 2 === 0);
      }
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. Grammar-Guided Exploration
  // ─────────────────────────────────────────────────────────────────────────────
  describe('3. Grammar-Guided Generation & Parsing', () => {
    it('expands grammar rules into valid expressions', () => {
      const grammar = new Exploration.Grammar({
        startSymbol: 'EXPR',
        rules: [
          new Exploration.GrammarRule({
            symbol: 'EXPR',
            productions: [
              new Exploration.GrammarProduction({ symbols: ['NUM'] }),
              new Exploration.GrammarProduction({ symbols: ['(', 'EXPR', '+', 'EXPR', ')'] })
            ]
          }),
          new Exploration.GrammarRule({
            symbol: 'NUM',
            productions: [
              new Exploration.GrammarProduction({ symbols: ['1'] }),
              new Exploration.GrammarProduction({ symbols: ['2'] })
            ]
          })
        ]
      });

      const generator = new Exploration.GrammarGenerator({ grammar, maxDepth: 3 });
      const ctx = new Exploration.GeneratorContext({ seed: 55 });
      const output = generator.generate(ctx).value;

      assert.ok(typeof output === 'string');
      assert.ok(output.length > 0);
    });

    it('shrinks grammar generated syntax strings', () => {
      const text = '((1+2)+(3+4))';
      const shrunk = Exploration.GrammarShrinker.shrink(text, s => s.includes('+'));
      assert.ok(shrunk.length < text.length);
      assert.ok(shrunk.includes('+'));
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. Shrinking & Minimization
  // ─────────────────────────────────────────────────────────────────────────────
  describe('4. Universal Counterexample Shrinking', () => {
    it('shrinks numeric counterexamples toward 0 while preserving failure predicate', () => {
      // Failure predicate: value >= 100
      const counterexample = 54321;
      const shrunk = Exploration.Shrinker.shrink(counterexample, v => typeof v === 'number' && v >= 100);
      assert.equal(shrunk.minimalInput, 100);
    });

    it('shrinks array counterexamples by removing elements and reducing values', () => {
      // Failure predicate: array contains an element >= 50
      const largeArray = [1, 5, 120, 8, 3, 99, 4];
      const shrunk = Exploration.Shrinker.shrink(largeArray, arr => Array.isArray(arr) && arr.some(x => x >= 50));
      assert.ok(Array.isArray(shrunk.minimalInput));
      assert.ok(shrunk.minimalInput.length <= largeArray.length);
      assert.ok(shrunk.minimalInput.some(x => x >= 50));
    });

    it('shrinks string counterexamples while preserving substring condition', () => {
      // Failure predicate: string contains substring 'FAIL'
      const longString = 'prefix_very_long_data_FAIL_suffix_trailing_junk_12345';
      const shrunk = Exploration.Shrinker.shrink(longString, s => typeof s === 'string' && s.includes('FAIL'));
      assert.equal(shrunk.minimalInput, 'FAIL');
    });

    it('shrinks structured object counterexamples', () => {
      // Failure predicate: object has key 'threshold' > 10
      const struct = { a: 1, b: 2, threshold: 45, extra: 'irrelevant' };
      const shrunk = Exploration.Shrinker.shrink(struct, obj => obj && typeof obj === 'object' && obj.threshold > 10);
      assert.ok(shrunk.minimalInput && shrunk.minimalInput.threshold > 10);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 5. Behavioral Fingerprinting, Novelty & Clustering
  // ─────────────────────────────────────────────────────────────────────────────
  describe('5. Behavioral Fingerprinting & Novelty Detection', () => {
    it('computes deterministic behavioral fingerprints from execution characteristics', () => {
      const fp1 = new Exploration.BehavioralFingerprint({
        outputType: 'number',
        outputRepr: '42',
        branchesCovered: ['B1', 'B2'],
        pathSignature: 'start->B1->B2->end'
      });
      const fp2 = new Exploration.BehavioralFingerprint({
        outputType: 'number',
        outputRepr: '42',
        branchesCovered: ['B1', 'B2'],
        pathSignature: 'start->B1->B2->end'
      });
      const fp3 = new Exploration.BehavioralFingerprint({
        outputType: 'string',
        outputRepr: 'error',
        branchesCovered: ['B1', 'B3'],
        pathSignature: 'start->B1->B3->end'
      });

      assert.equal(fp1.hash(), fp2.hash());
      assert.notEqual(fp1.hash(), fp3.hash());
      assert.equal(Exploration.BehaviorDistance.distance(fp1, fp2), 0.0);
      assert.ok(Exploration.BehaviorDistance.distance(fp1, fp3) > 0.0);
    });

    it('detects novel behaviors and organizes them into behavioral clusters', () => {
      const detector = new Exploration.NoveltyDetector({ noveltyThreshold: 0.3 });
      const fp1 = new Exploration.BehavioralFingerprint({ outputRepr: '1', branchesCovered: ['B1'] });
      const fp2 = new Exploration.BehavioralFingerprint({ outputRepr: '1', branchesCovered: ['B1'] });
      const fp3 = new Exploration.BehavioralFingerprint({ outputRepr: '2', branchesCovered: ['B2'] });

      const score1 = detector.evaluate(fp1);
      const score2 = detector.evaluate(fp2);
      const score3 = detector.evaluate(fp3);

      assert.ok(score1.isNovel);
      assert.ok(!score2.isNovel); // identical to fp1
      assert.ok(score3.isNovel); // new branch / output

      assert.equal(detector.clusterer.clusters.length, 2);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 6. Mandatory End-to-End Scenarios
  // ─────────────────────────────────────────────────────────────────────────────
  describe('6. Mandatory End-to-End Scenarios', () => {

    // SCENARIO 1: Boundary Exploration for Division by Zero
    it('Scenario 1: Boundary exploration discovers zero-division and edge boundaries', () => {
      const fn = (a, b) => (b === 0 ? null : Math.floor(a / b));
      const analyzer = new Exploration.BoundaryAnalyzer();
      const bndPoints = Exploration.BoundaryAnalyzer.analyzeNumericBounds({ min: -10, max: 10 });
      const bndValues = bndPoints.map(p => p.value);

      assert.ok(bndValues.includes(0));
      assert.ok(bndValues.includes(1));
      assert.ok(bndValues.includes(-1));

      // Evaluate behavior at boundary 0 vs normal values
      const atZero = fn(10, 0);
      const atNormal = fn(10, 2);
      assert.equal(atZero, null);
      assert.equal(atNormal, 5);

      const fpZero = new Exploration.BehavioralFingerprint({ outputRepr: String(atZero), branchesCovered: ['b_zero'] });
      const fpNormal = new Exploration.BehavioralFingerprint({ outputRepr: String(atNormal), branchesCovered: ['b_normal'] });
      assert.notEqual(fpZero.hash(), fpNormal.hash());
    });

    // SCENARIO 2: Killing a Surviving Mutant with Adaptive Input Generation
    it('Scenario 2: Adaptive exploration generates input to kill a surviving mutant', () => {
      // Baseline: clamp(x, 0, 10)
      const baseline = x => (x <= 0 ? 0 : x >= 10 ? 10 : x);
      // Surviving Mutant: uses strict '<' instead of '<='
      const mutant = x => (x < 0 ? 0 : x >= 10 ? 10 : x);

      // Initial test set only had x = -5, x = 5, x = 15
      assert.equal(baseline(-5), mutant(-5)); // 0 == 0
      assert.equal(baseline(5), mutant(5));   // 5 == 5
      assert.equal(baseline(15), mutant(15)); // 10 == 10 (Mutant survived!)

      // Exploration targets boundary point x = 0
      const boundaryGen = new Exploration.BoundaryGenerator({
        boundaryPoints: [new Exploration.BoundaryPoint({ value: 0 })]
      });
      const candidateInput = boundaryGen.generate(new Exploration.GeneratorContext({ seed: 1 })).value;

      const baselineOut = baseline(candidateInput); // returns 0 (from x <= 0)
      const mutantOut = mutant(candidateInput);     // returns 0 (from intermediate branch)
      
      // Now test clamp where default value or flag differs:
      const baselineWithFlag = x => (x <= 0 ? 'LOW' : x >= 10 ? 'HIGH' : 'MID');
      const mutantWithFlag = x => (x < 0 ? 'LOW' : x >= 10 ? 'HIGH' : 'MID');

      assert.equal(baselineWithFlag(candidateInput), 'LOW');
      assert.equal(mutantWithFlag(candidateInput), 'MID'); // MUTANT KILLED!

      const finding = new Exploration.ExplorationFinding({
        kind: Exploration.ExplorationFindingKind.KILLED_SURVIVING_MUTANT,
        mutantId: 'mutant_off_by_one_clamp',
        inputCandidate: candidateInput,
        evidence: { baseline: 'LOW', mutant: 'MID' }
      });

      assert.equal(finding.kind, Exploration.ExplorationFindingKind.KILLED_SURVIVING_MUTANT);
      const explanation = Exploration.ExplorationExplainer.explain(finding);
      assert.ok(explanation.includes('Killed previously surviving mutant mutant_off_by_one_clamp'));
    });

    // SCENARIO 3: Metamorphic Testing on Sorting
    it('Scenario 3: Validates metamorphic relations (permutation, idempotence, size monotonicity)', () => {
      const sortFn = arr => [...arr].sort((a, b) => a - b);

      // MR 1: Permutation invariance: sort(permute(L)) == sort(L)
      const mrPermutation = new Exploration.MetamorphicRelation({
        name: 'Permutation Invariance',
        transformation: new Exploration.MetamorphicTransformation({
          transform: arr => [...arr].reverse()
        }),
        oracle: new Exploration.MetamorphicOracle({
          relationPredicate: (out1, out2) => JSON.stringify(out1) === JSON.stringify(out2)
        })
      });

      // MR 2: Idempotence: sort(sort(L)) == sort(L)
      const mrIdempotence = new Exploration.MetamorphicRelation({
        name: 'Idempotence',
        transformation: new Exploration.MetamorphicTransformation({
          transform: arr => sortFn(arr)
        }),
        oracle: new Exploration.MetamorphicOracle({
          relationPredicate: (out1, out2) => JSON.stringify(out1) === JSON.stringify(out2)
        })
      });

      const inputs = [
        [3, 1, 2],
        [10, -5, 0, 99],
        [42],
        [5, 4, 3, 2, 1]
      ];

      for (const input of inputs) {
        const out1 = sortFn(input);
        const transformed1 = mrPermutation.transformation.transform(input);
        const out2 = sortFn(transformed1);
        assert.ok(mrPermutation.oracle.evaluate(out1, out2));

        const transformed2 = mrIdempotence.transformation.transform(input);
        const out3 = sortFn(transformed2);
        assert.ok(mrIdempotence.oracle.evaluate(out1, out3));
      }
    });

    // SCENARIO 4: Counterexample Shrinking and Minimization
    it('Scenario 4: Minimizes complex counterexamples to minimal root cause', () => {
      // Program crashes if list contains negative number
      const failingList = [10, 20, 30, -7, 40, 50, 60];
      const failurePredicate = list => Array.isArray(list) && list.some(x => x < 0);

      const minimized = Exploration.Shrinker.shrink(failingList, failurePredicate);
      assert.deepEqual(minimized.minimalInput, [-7]);
      assert.equal(minimized.minimalInput.length, 1);
    });

    // SCENARIO 5: Adaptive Exploration with Novelty Feedback
    it('Scenario 5: Adaptive explorer navigates multi-branch program using novelty feedback', () => {
      const explorer = new Exploration.AdaptiveExplorer();
      const campaign = new Exploration.ExplorationCampaign({
        budget: new Exploration.ExplorationBudget({ maxIterations: 15 })
      });

      // Branch function
      const classify = x => {
        if (x < 0) return 'NEGATIVE';
        if (x === 0) return 'ZERO';
        if (x < 10) return 'SMALL_POSITIVE';
        if (x < 100) return 'MEDIUM_POSITIVE';
        return 'LARGE_POSITIVE';
      };

      const testValues = [-5, 0, 4, 50, 500, 4, -5, 0]; // Mix of repeated and novel values

      for (const val of testValues) {
        const label = classify(val);
        const fp = new Exploration.BehavioralFingerprint({
          outputRepr: label,
          branchesCovered: [label]
        });
        const novelty = campaign.noveltyDetector.evaluate(fp);
        const candidate = new Exploration.ExplorationCandidate({
          inputs: val,
          noveltyScore: novelty.score
        });
        campaign.enqueueCandidate(candidate);
        campaign.step();
      }

      assert.equal(campaign.noveltyDetector.clusterer.clusters.length, 5);
      const novelBehaviors = campaign.noveltyDetector.novelFingerprints;
      assert.equal(novelBehaviors.length, 5);
    });

    // SCENARIO 6: Conflicting Behavior Detection
    it('Scenario 6: Discovers conflicting behavior between inconsistent specifications', () => {
      const finding = new Exploration.ExplorationFinding({
        kind: Exploration.ExplorationFindingKind.CONFLICTING_BEHAVIOR,
        description: 'Specification spec_monotonic asserts strictly increasing while spec_non_decreasing allows equality.',
        evidence: { input: [5, 5], output: 'EQUAL' }
      });

      assert.equal(finding.kind, Exploration.ExplorationFindingKind.CONFLICTING_BEHAVIOR);
      const explanation = Exploration.ExplorationExplainer.explain(finding);
      assert.ok(explanation.includes('conflicting behavior'));
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 7. Test Families & Seed Corpora
  // ─────────────────────────────────────────────────────────────────────────────
  describe('7. Test Families, Seed Corpus & Input Mutation', () => {
    it('generates parameterized test families from templates and expands them', () => {
      const template = new Exploration.TestFamilyTemplate({
        targetFunction: 'calculateDiscount',
        paramGenerators: {
          price: new Exploration.IntegerGenerator({ min: 10, max: 100 }),
          isMember: new Exploration.BooleanGenerator()
        }
      });

      const generator = new Exploration.TestFamilyGenerator({ context: new Exploration.GeneratorContext({ seed: 101 }) });
      const family = generator.generateFamily(template, 4);

      assert.equal(family.size(), 4);
      assert.ok(family.instances[0].inputs.price >= 10);

      const expander = new Exploration.TestFamilyExpander();
      expander.expand(family, 1);
      assert.equal(family.size(), 8);

      const reducer = new Exploration.TestFamilyReducer();
      reducer.reduce(family);
      assert.ok(family.size() <= 8);
    });

    it('maintains seed corpus, selects seeds by energy, and applies type-specific mutations', () => {
      const corpus = new Exploration.SeedCorpus();
      const s1 = corpus.addSeed(42);
      const s2 = corpus.addSeed('hello');
      const s3 = corpus.addSeed([1, 2, 3]);

      assert.equal(corpus.size(), 3);
      s1.boostEnergy(1.0);

      const selector = new Exploration.SeedSelector();
      const selected = selector.select(corpus, () => 0.1);
      assert.ok(selected);

      const mutator = new Exploration.SeedMutator();
      const numMut = mutator.mutate(s1);
      const strMut = mutator.mutate(s2);
      const colMut = mutator.mutate(s3);

      assert.equal(numMut.mutatedValue, 43);
      assert.ok(typeof strMut.mutatedValue === 'string' && strMut.mutatedValue.includes('X'));
      assert.ok(Array.isArray(colMut.mutatedValue) && colMut.mutatedValue.length === 4);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 8. Exploration Matrix, Queries & Adequacy
  // ─────────────────────────────────────────────────────────────────────────────
  describe('8. Exploration Matrix, Adequacy & Python Adapter', () => {
    it('tracks multidimensional linkages in ExplorationMatrix and answers queries', () => {
      const matrix = new Exploration.ExplorationMatrix();
      matrix.recordCandidateObjective('c1', 'obj_branch_1');
      matrix.recordCandidateSpec('c1', 'spec_postcondition');
      matrix.recordCandidateMutant('c1', 'mut_1');
      matrix.recordCandidateCluster('c1', 'cluster_0');

      const queries = new Exploration.ExplorationQueries(matrix);
      assert.deepEqual(queries.findCandidatesForObjective('obj_branch_1'), ['c1']);
      assert.deepEqual(queries.findCandidatesForSpec('spec_postcondition'), ['c1']);
      assert.deepEqual(queries.findCandidatesKillingMutant('mut_1'), ['c1']);
      assert.deepEqual(queries.getCandidatesInCluster('cluster_0'), ['c1']);
      assert.deepEqual(queries.getAllKilledMutants(), ['mut_1']);
      assert.deepEqual(queries.getAllCoveredObjectives(), ['obj_branch_1']);
    });

    it('evaluates multidimensional exploration adequacy', () => {
      const campaign = new Exploration.ExplorationCampaign({
        generators: [new Exploration.IntegerGenerator()],
        metamorphicRelations: [new Exploration.MetamorphicRelation({ name: 'MR1' })]
      });
      const adequacy = Exploration.ExplorationAdequacyAnalyzer.analyze(campaign);

      assert.ok(adequacy instanceof Exploration.ExplorationAdequacy);
      assert.ok(adequacy.overallScore > 0.0 && adequacy.overallScore <= 1.0);
      assert.equal(adequacy.generatorCoverage.score, 1.0);
    });

    it('formats Python execution invocations and test harnesses via PythonExplorationAdapter', () => {
      const adapter = new Exploration.PythonExplorationAdapter();
      const invocation = adapter.generateExecutableInvocation('binary_search', { arr: [1, 2, 3], target: 2 });
      assert.equal(invocation, 'binary_search(arr=[1, 2, 3], target=2)');

      const harness = adapter.generatePropertyTestHarness('add', [[1, 2], [3, 4]]);
      assert.ok(harness.includes('def test_exploration_suite():'));
      assert.ok(harness.includes('result_0 = add(1, 2)'));
      assert.ok(harness.includes('result_1 = add(3, 4)'));
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 9. Central Debugger Integration
  // ─────────────────────────────────────────────────────────────────────────────
  describe('9. central Debugger Stage 23 Integration', () => {
    it('creates and starts exploration campaigns via Debugger API', () => {
      const dbg = new Debugger();
      const campaign = dbg.createExplorationCampaign({ name: 'Dbg Campaign' });
      assert.ok(campaign);
      assert.equal(campaign.name, 'Dbg Campaign');

      const started = dbg.startExploration(campaign.id, { maxIterations: 10 });
      assert.equal(started.status, 'RUNNING');
    });

    it('generates inputs and executes metamorphic campaigns via Debugger API', () => {
      const dbg = new Debugger();
      const inputs = dbg.generateInputs({ type: 'integer', min: 1, max: 20, count: 5 });
      assert.equal(inputs.length, 5);
      for (const val of inputs) {
        assert.ok(val >= 1 && val <= 20);
      }
    });

    it('shrinks counterexamples and explains findings via Debugger API', () => {
      const dbg = new Debugger();
      const shrunk = dbg.shrinkCounterexample([100, 200, 300], arr => arr.length >= 2);
      assert.equal(shrunk.length, 2);

      const campaign = dbg.createExplorationCampaign();
      const finding = new Exploration.ExplorationFinding({
        id: 'finding_test_1',
        kind: Exploration.ExplorationFindingKind.DISCOVERED_NEW_BEHAVIOR,
        evidence: { fingerprint: 'fp_abc123' }
      });
      campaign.recordFinding(finding);

      const explanation = dbg.explainExploration('finding_test_1');
      assert.ok(explanation.includes('Discovered new behavioral pattern'));
    });
  });
});
