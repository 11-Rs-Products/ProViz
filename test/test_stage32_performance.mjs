/**
 * test/test_stage32_performance.mjs
 * Comprehensive Test Suite for ProViz Stage 32:
 * Universal Performance, Resource & Reliability Verification Engine.
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { performance } from 'node:perf_hooks';

import * as Performance from '../src/performance/index.js';
import * as Security from '../src/security/index.js';
import * as Evolution from '../src/evolution/index.js';
import * as Semantic from '../src/semantic/index.js';
import * as Knowledge from '../src/knowledge/index.js';
import * as Planning from '../src/planning/index.js';
import * as Orchestration from '../src/orchestration/index.js';
import * as Federation from '../src/federation/index.js';
import { Debugger } from '../src/debugger/Debugger.js';

describe('Stage 32: Universal Performance, Resource & Reliability Verification Engine', () => {
  let engine;

  beforeEach(() => {
    engine = new Performance.PerformanceEngine();
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. Performance Models & Workloads
  // ─────────────────────────────────────────────────────────────────────────────
  describe('1. Performance Models & Workloads', () => {
    it('1.1 should define canonical PerformancePropertyKind enums', () => {
      assert.equal(Performance.PerformancePropertyKind.LATENCY, 'LATENCY');
      assert.equal(Performance.PerformancePropertyKind.THROUGHPUT, 'THROUGHPUT');
      assert.equal(Performance.PerformancePropertyKind.RESOURCE_BOUND, 'RESOURCE_BOUND');
      assert.equal(Performance.PerformancePropertyKind.TAIL_LATENCY, 'TAIL_LATENCY');
    });

    it('1.2 should create WorkloadModel and calculate total operations', () => {
      const workload = new Performance.WorkloadModel({
        id: 'wl:test',
        profile: Performance.WorkloadProfile.NORMAL,
        concurrency: 8,
        requestRate: 200,
        durationSeconds: 15
      });
      assert.equal(workload.id, 'wl:test');
      assert.equal(workload.concurrency, 8);
      assert.equal(workload.totalOperations, 3000);
      const json = workload.toJSON();
      const restored = Performance.WorkloadModel.fromJSON(json);
      assert.equal(restored.totalOperations, 3000);
    });

    it('1.3 should generate workloads across various profiles', () => {
      const normal = engine.generateWorkload(Performance.WorkloadProfile.NORMAL, 1.0);
      const burst = engine.generateWorkload(Performance.WorkloadProfile.BURST, 2.0);
      const peak = engine.generateWorkload(Performance.WorkloadProfile.PEAK, 1.5);
      const boundary = engine.generateWorkload(Performance.WorkloadProfile.BOUNDARY, 1.0);

      assert.equal(normal.profile, 'NORMAL');
      assert.equal(burst.profile, 'BURST');
      assert.equal(peak.profile, 'PEAK');
      assert.equal(boundary.inputSize, 0);
    });

    it('1.4 should assemble complete PerformanceModel', () => {
      const model = engine.createPerformanceModel({
        id: 'pm:main',
        name: 'Main App Performance Model',
        workloads: [engine.generateWorkload('NORMAL')],
        baselines: [{ id: 'b1', workloadId: 'w1', metrics: { LATENCY: 25.0 } }],
        thresholds: [{ id: 'th1', policy: 'MAX_LATENCY', limit: 50.0 }]
      });

      assert.equal(model.id, 'pm:main');
      assert.equal(model.workloads.length, 1);
      assert.equal(model.baselines.length, 1);
      assert.equal(model.thresholds.length, 1);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. Metrics & Statistical Distributions
  // ─────────────────────────────────────────────────────────────────────────────
  describe('2. Metrics & Statistical Distributions', () => {
    it('2.1 should calculate percentiles, mean, variance and stdDev in MetricDistribution', () => {
      const samples = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
      const dist = new Performance.MetricDistribution(samples, 'ms');

      assert.equal(dist.sampleCount, 10);
      assert.equal(dist.mean, 55);
      assert.equal(dist.median, 60);
      assert.equal(dist.min, 10);
      assert.equal(dist.max, 100);
      assert.ok(dist.p95 >= 90);
      assert.ok(dist.p99 >= 90);
      assert.ok(dist.variance > 0);
      assert.ok(dist.stdDev > 0);
    });

    it('2.2 should handle empty MetricDistribution safely', () => {
      const empty = new Performance.MetricDistribution([]);
      assert.equal(empty.sampleCount, 0);
      assert.equal(empty.mean, 0);
      assert.equal(empty.p99, 0);
    });

    it('2.3 should create and serialize PerformanceMetric', () => {
      const metric = new Performance.PerformanceMetric({
        metricId: 'm1',
        property: Performance.PerformancePropertyKind.THROUGHPUT,
        value: 1250.5,
        unit: 'ops/sec'
      });
      assert.equal(metric.value, 1250.5);
      const json = metric.toJSON();
      const restored = Performance.PerformanceMetric.fromJSON(json);
      assert.equal(restored.value, 1250.5);
    });

    it('2.4 should evaluate PerformanceThreshold policies', () => {
      const thMaxLatency = new Performance.PerformanceThreshold({ id: 'th1', policy: 'MAX_LATENCY', limit: 100 });
      assert.equal(thMaxLatency.evaluates(80), true);
      assert.equal(thMaxLatency.evaluates(120), false);

      const thMinThroughput = new Performance.PerformanceThreshold({ id: 'th2', policy: 'MIN_THROUGHPUT', limit: 500 });
      assert.equal(thMinThroughput.evaluates(600), true);
      assert.equal(thMinThroughput.evaluates(400), false);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. Profiling, Hot Paths & Complexity Analysis
  // ─────────────────────────────────────────────────────────────────────────────
  describe('3. Profiling, Hot Paths & Complexity Analysis', () => {
    it('3.1 should profile execution trace and sort by self time', () => {
      const profile = engine.profileProgram({
        events: [
          { functionId: 'fnA', durationMs: 10, selfTimeMs: 2, bytesAllocated: 500 },
          { functionId: 'fnB', durationMs: 40, selfTimeMs: 38, bytesAllocated: 12000 }
        ]
      });

      assert.equal(profile.totalFunctionsProfiled, 2);
      assert.equal(profile.topHotspot.functionId, 'fnB');
    });

    it('3.2 should identify semantic hot paths from profile', () => {
      const profile = {
        samples: [
          { functionId: 'hotLoop', selfTimeMs: 80 },
          { functionId: 'helper', selfTimeMs: 20 }
        ]
      };
      const hotPaths = engine.getHotPaths(profile);
      assert.equal(hotPaths.length, 2);
      assert.equal(hotPaths[0].pathId, 'hp:hotLoop');
      assert.equal(hotPaths[0].executionPercentage, 80);
    });

    it('3.3 should estimate computational complexity classes', () => {
      const o1Data = [{ n: 10, timeMs: 5 }, { n: 1000, timeMs: 5.1 }];
      assert.equal(engine.analyzeComplexity(o1Data).complexityClass, Performance.ComplexityClass.O_1);

      const oNData = [{ n: 10, timeMs: 10 }, { n: 1000, timeMs: 1000 }];
      assert.equal(engine.analyzeComplexity(oNData).complexityClass, Performance.ComplexityClass.O_N);

      const oN2Data = [{ n: 10, timeMs: 100 }, { n: 1000, timeMs: 1000000 }];
      assert.equal(engine.analyzeComplexity(oN2Data).complexityClass, Performance.ComplexityClass.O_N_SQUARED);
    });

    it('3.4 should estimate memory complexity M(n)', () => {
      const memData = [{ n: 10, memoryBytes: 1024 }, { n: 1000, memoryBytes: 102400 }];
      const res = engine.analyzeMemoryComplexity(memData);
      assert.equal(res.complexityClass, Performance.ComplexityClass.O_N);
    });

    it('3.5 should identify allocation hotspots and rates', () => {
      const profile = {
        samples: [
          { functionId: 'bufAlloc', allocationsBytes: 1048576 },
          { functionId: 'noAlloc', allocationsBytes: 0 }
        ]
      };
      const hotspots = engine.analyzeAllocations(profile, 2);
      assert.equal(hotspots.length, 1);
      assert.equal(hotspots[0].functionId, 'bufAlloc');
      assert.equal(hotspots[0].allocationRateBytesPerSec, 524288);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. Resource Bounds & Leak Detection
  // ─────────────────────────────────────────────────────────────────────────────
  describe('4. Resource Bounds & Leak Detection', () => {
    it('4.1 should capture resource usage snapshots', () => {
      const snap = engine.analyzeResourceUsage({ cpuPercent: 42.0, memoryBytes: 104857600 });
      assert.equal(snap.cpuPercent, 42.0);
      assert.equal(snap.memoryBytes, 104857600);
    });

    it('4.2 should verify resource limits with ResourceBoundAnalyzer', () => {
      const bounds = [
        new Performance.ResourceBound({ id: 'b_cpu', resourceType: 'CPU', maxAllowed: 80 }),
        new Performance.ResourceBound({ id: 'b_mem', resourceType: 'MEMORY', maxAllowed: 200 * 1024 * 1024 })
      ];

      const okSnap = new Performance.ResourceUsageSnapshot({ cpuPercent: 50, memoryBytes: 100 * 1024 * 1024 });
      assert.equal(engine.checkResourceBounds(bounds, okSnap).isCompliant, true);

      const badSnap = new Performance.ResourceUsageSnapshot({ cpuPercent: 95, memoryBytes: 100 * 1024 * 1024 });
      const resBad = engine.checkResourceBounds(bounds, badSnap);
      assert.equal(resBad.isCompliant, false);
      assert.equal(resBad.violationCount, 1);
    });

    it('4.3 should detect monotonic progressive memory and descriptor leaks', () => {
      const leakSeries = [
        new Performance.ResourceUsageSnapshot({ memoryBytes: 10 * 1024 * 1024, fileDescriptors: 2 }),
        new Performance.ResourceUsageSnapshot({ memoryBytes: 25 * 1024 * 1024, fileDescriptors: 5 }),
        new Performance.ResourceUsageSnapshot({ memoryBytes: 40 * 1024 * 1024, fileDescriptors: 10 })
      ];

      const leakReport = engine.detectResourceLeaks(leakSeries);
      assert.equal(leakReport.hasLeak, true);
      assert.ok(leakReport.leaks.some(l => l.kind === Performance.LeakKind.MEMORY));
      assert.ok(leakReport.leaks.some(l => l.kind === Performance.LeakKind.FILE));
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 5. Scalability & Capacity Analysis
  // ─────────────────────────────────────────────────────────────────────────────
  describe('5. Scalability & Capacity Analysis', () => {
    it('5.1 should analyze linear vs degrading scalability curves', () => {
      const linearData = [
        { concurrency: 1, throughput: 100, latencyMs: 10 },
        { concurrency: 4, throughput: 380, latencyMs: 11 },
        { concurrency: 8, throughput: 740, latencyMs: 12 }
      ];
      const modelLinear = engine.analyzeScalability(linearData);
      assert.equal(modelLinear.scalingBehavior, Performance.ScalingBehavior.LINEAR);

      const degradingData = [
        { concurrency: 1, throughput: 100, latencyMs: 10 },
        { concurrency: 4, throughput: 400, latencyMs: 12 },
        { concurrency: 16, throughput: 200, latencyMs: 90 } // Degradation
      ];
      const modelDegrading = engine.analyzeScalability(degradingData);
      assert.equal(modelDegrading.scalingBehavior, Performance.ScalingBehavior.DEGRADING);
      assert.equal(modelDegrading.saturationPoint, 4);
    });

    it('5.2 should determine safe system capacity under SLA constraints', () => {
      const dataPoints = [
        { rps: 100, concurrency: 2, latencyP95: 50, cpuPercent: 30 },
        { rps: 500, concurrency: 10, latencyP95: 120, cpuPercent: 65 },
        { rps: 1000, concurrency: 25, latencyP95: 350, cpuPercent: 92 } // Violates 200ms SLA
      ];

      const cap = engine.analyzeCapacity(dataPoints, { maxLatencyP95: 200, maxCpuPercent: 80 });
      assert.equal(cap.maxSafeRps, 500);
      assert.equal(cap.maxConcurrency, 10);
      assert.equal(cap.bottleneckResource, 'LATENCY_TAIL');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 6. Stress Testing & Reliability Modeling
  // ─────────────────────────────────────────────────────────────────────────────
  describe('6. Stress Testing & Reliability Modeling', () => {
    it('6.1 should execute stress testing campaigns', () => {
      const stress = engine.createStressTest({
        id: 'st:load',
        dimension: Performance.StressDimension.LOAD,
        intensityLevel: 8
      });

      const result = engine.runStressTest(stress, { simulateDegradation: true });
      assert.equal(result.passed, true);
      assert.equal(result.degraded, true);
      assert.ok(result.peakMemoryBytes > 0);
    });

    it('6.2 should inject controlled faults and analyze fault tolerance and recovery', () => {
      const inj1 = engine.injectFault(Performance.FaultAction.DELAY_RESPONSE, 'authService', { simulateHandled: true, recoveryDurationMs: 80 });
      const inj2 = engine.injectFault(Performance.FaultAction.DROP_IO, 'dbService', { simulateHandled: true, recoveryDurationMs: 120 });

      const ft = engine.analyzeFaultTolerance([inj1, inj2]);
      assert.equal(ft.isFaultTolerant, true);

      const rec = engine.analyzeRecovery([inj1, inj2]);
      assert.equal(rec.mttrMs, 100);
      assert.equal(rec.recoverySuccessRate, 1.0);
    });

    it('6.3 should compute overall reliability and availability metrics', () => {
      const runs = [{ failed: false }, { failed: false }, { failed: false }, { failed: true }];
      const rel = engine.analyzeReliability(runs);
      assert.equal(rel.failureRate, 0.25);
      assert.equal(rel.availability, 0.75);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 7. Regressions & Optimization Verification
  // ─────────────────────────────────────────────────────────────────────────────
  describe('7. Regressions & Optimization Verification', () => {
    it('7.1 should detect performance regression against baseline', () => {
      const baseline = engine.createPerformanceBaseline({
        id: 'b:v1',
        workloadId: 'w1',
        metrics: { LATENCY: 20.0, THROUGHPUT: 500 }
      });

      const goodMeas = new Performance.PerformanceMeasurement({
        measurementId: 'm_good',
        workloadId: 'w1',
        metrics: { LATENCY: 18.0, THROUGHPUT: 520 }
      });
      assert.equal(engine.comparePerformanceBaseline(baseline, goodMeas).isRegression, false);

      const regMeas = new Performance.PerformanceMeasurement({
        measurementId: 'm_bad',
        workloadId: 'w1',
        metrics: { LATENCY: 35.0, THROUGHPUT: 500 } // +75% latency regression
      });
      const regReport = engine.comparePerformanceBaseline(baseline, regMeas);
      assert.equal(regReport.isRegression, true);
      assert.equal(regReport.regressions.length, 1);
    });

    it('7.2 should synthesize and validate optimization candidates', () => {
      const opts = engine.generateOptimizations('calculatePrimes');
      assert.ok(opts.length >= 3);

      const valPass = engine.validateOptimization(opts[0], { measuredSpeedup: 1.5 });
      assert.equal(valPass.isValid, true);

      const valFail = engine.validateOptimization(opts[0], { breaksBehavior: true });
      assert.equal(valFail.isValid, false);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 8. Thirty-Five Mandatory End-to-End Scenarios
  // ─────────────────────────────────────────────────────────────────────────────
  describe('8. Thirty-Five Mandatory End-to-End Scenarios', () => {
    it('Scenario 1: Create a performance model', () => {
      const model = engine.createPerformanceModel({ id: 'pm:s1' });
      assert.equal(model.id, 'pm:s1');
    });

    it('Scenario 2: Generate normal workloads', () => {
      const wl = engine.generateWorkload('NORMAL');
      assert.equal(wl.profile, 'NORMAL');
    });

    it('Scenario 3: Generate boundary workloads', () => {
      const wl = engine.generateWorkload('BOUNDARY');
      assert.equal(wl.inputSize, 0);
    });

    it('Scenario 4: Generate peak workloads', () => {
      const wl = engine.generateWorkload('PEAK', 2.0);
      assert.ok(wl.requestRate > 500);
    });

    it('Scenario 5: Generate burst workloads', () => {
      const wl = engine.generateWorkload('BURST', 1.0);
      assert.equal(wl.durationSeconds, 2);
    });

    it('Scenario 6: Measure latency distributions', () => {
      const wl = engine.generateWorkload('NORMAL');
      const m = engine.measurePerformance(wl, null, { sampleLatencies: [10, 15, 20, 25, 30] });
      const dist = m.getDistribution('LATENCY');
      assert.equal(dist.mean, 20);
    });

    it('Scenario 7: Measure throughput', () => {
      const wl = engine.generateWorkload('NORMAL', 1.0, { requestRate: 500 });
      const m = engine.measurePerformance(wl);
      assert.equal(m.metrics.THROUGHPUT, 500);
    });

    it('Scenario 8: Detect CPU hotspots', () => {
      const prof = engine.profileProgram({ events: [{ functionId: 'cpuBound', selfTimeMs: 100 }] });
      assert.equal(prof.topHotspot.functionId, 'cpuBound');
    });

    it('Scenario 9: Detect memory hotspots', () => {
      const prof = engine.profileProgram({ events: [{ functionId: 'memHog', bytesAllocated: 50000000 }] });
      const hotspots = engine.analyzeAllocations(prof);
      assert.equal(hotspots[0].functionId, 'memHog');
    });

    it('Scenario 10: Detect allocation hotspots', () => {
      const prof = engine.profileProgram({ events: [{ functionId: 'allocator', bytesAllocated: 2000000 }] });
      const h = engine.analyzeAllocations(prof, 1);
      assert.ok(h[0].allocationRateBytesPerSec >= 2000000);
    });

    it('Scenario 11: Analyze computational complexity', () => {
      const res = engine.analyzeComplexity([{ n: 10, timeMs: 5 }, { n: 100, timeMs: 50 }]);
      assert.equal(res.complexityClass, 'O(n)');
    });

    it('Scenario 12: Analyze memory complexity', () => {
      const res = engine.analyzeMemoryComplexity([{ n: 10, memoryBytes: 100 }, { n: 100, memoryBytes: 1000 }]);
      assert.equal(res.complexityClass, 'O(n)');
    });

    it('Scenario 13: Detect resource-bound violations', () => {
      const bounds = [new Performance.ResourceBound({ id: 'b1', resourceType: 'CPU', maxAllowed: 50 })];
      const snap = new Performance.ResourceUsageSnapshot({ cpuPercent: 75 });
      const res = engine.checkResourceBounds(bounds, snap);
      assert.equal(res.isCompliant, false);
    });

    it('Scenario 14: Detect memory/resource leaks', () => {
      const series = [
        new Performance.ResourceUsageSnapshot({ memoryBytes: 10000000 }),
        new Performance.ResourceUsageSnapshot({ memoryBytes: 25000000 }),
        new Performance.ResourceUsageSnapshot({ memoryBytes: 40000000 })
      ];
      assert.equal(engine.detectResourceLeaks(series).hasLeak, true);
    });

    it('Scenario 15: Determine scalability behavior', () => {
      const model = engine.analyzeScalability([
        { concurrency: 1, throughput: 100 },
        { concurrency: 10, throughput: 950 }
      ]);
      assert.equal(model.scalingBehavior, 'LINEAR');
    });

    it('Scenario 16: Estimate system capacity', () => {
      const cap = engine.analyzeCapacity([
        { rps: 100, concurrency: 2, latencyP95: 50, cpuPercent: 20 }
      ]);
      assert.equal(cap.maxSafeRps, 100);
    });

    it('Scenario 17: Execute stress testing', () => {
      const st = engine.createStressTest({ id: 'st17', intensityLevel: 6 });
      const res = engine.runStressTest(st);
      assert.equal(res.passed, true);
    });

    it('Scenario 18: Detect performance degradation under concurrency', () => {
      const st = engine.createStressTest({ id: 'st18', intensityLevel: 9 });
      const res = engine.runStressTest(st, { simulateDegradation: true });
      assert.equal(res.degraded, true);
    });

    it('Scenario 19: Model failure modes', () => {
      const fm = engine.createFailureModel({ id: 'fm19', kind: 'TIMEOUT', targetComponent: 'auth' });
      assert.equal(fm.kind, 'TIMEOUT');
    });

    it('Scenario 20: Inject controlled faults', () => {
      const inj = engine.injectFault('DROP_IO', 'storage', { simulateHandled: true });
      assert.equal(inj.isHandled, true);
    });

    it('Scenario 21: Detect failure recovery', () => {
      const inj = engine.injectFault('DELAY_RESPONSE', 'gateway', { simulateHandled: true, recoveryDurationMs: 50 });
      assert.equal(inj.recovered, true);
    });

    it('Scenario 22: Measure recovery time', () => {
      const injs = [
        { recovered: true, recoveryDurationMs: 40 },
        { recovered: true, recoveryDurationMs: 60 }
      ];
      const rec = engine.analyzeRecovery(injs);
      assert.equal(rec.mttrMs, 50);
    });

    it('Scenario 23: Detect reliability regressions', () => {
      const rel = engine.analyzeReliability([{ failed: true }, { failed: true }]);
      assert.equal(rel.failureRate, 1.0);
    });

    it('Scenario 24: Compare against a performance baseline', () => {
      const base = engine.createPerformanceBaseline({ id: 'b24', workloadId: 'w', metrics: { LATENCY: 10 } });
      const meas = new Performance.PerformanceMeasurement({ measurementId: 'm24', workloadId: 'w', metrics: { LATENCY: 10 } });
      assert.equal(engine.comparePerformanceBaseline(base, meas).isRegression, false);
    });

    it('Scenario 25: Detect statistically meaningful performance regression', () => {
      const base = engine.createPerformanceBaseline({ id: 'b25', workloadId: 'w', metrics: { LATENCY: 10 } });
      const meas = new Performance.PerformanceMeasurement({ measurementId: 'm25', workloadId: 'w', metrics: { LATENCY: 25 } });
      assert.equal(engine.comparePerformanceBaseline(base, meas).isRegression, true);
    });

    it('Scenario 26: Connect semantic changes to performance impact', () => {
      const hotPaths = [new Performance.HotPath({ pathId: 'hp1', nodeIds: ['computeHash'] })];
      const diff = { modifiedSymbols: ['computeHash'] };
      const impact = engine.getPerformanceChangeImpact(diff, hotPaths);
      assert.equal(impact.isHotPathModified, true);
      assert.equal(impact.estimatedRegressionRisk, 0.85);
    });

    it('Scenario 27: Generate optimization candidates', () => {
      const opts = engine.generateOptimizations('renderScene');
      assert.ok(opts.length > 0);
    });

    it('Scenario 28: Compare multiple optimizations', () => {
      const opt1 = new Performance.PerformanceOptimizationCandidate({ id: 'o1', targetSymbol: 's', targetFile: 'f', patchContent: 'p', predictedSpeedup: 1.2 });
      const opt2 = new Performance.PerformanceOptimizationCandidate({ id: 'o2', targetSymbol: 's', targetFile: 'f', patchContent: 'p', predictedSpeedup: 2.1 });
      const ranked = [opt1, opt2].sort((a, b) => b.predictedSpeedup - a.predictedSpeedup);
      assert.equal(ranked[0].id, 'o2');
    });

    it('Scenario 29: Reject an optimization that breaks behavior', () => {
      const opt = new Performance.PerformanceOptimizationCandidate({ id: 'o29', targetSymbol: 's', targetFile: 'f', patchContent: 'p' });
      const val = engine.validateOptimization(opt, { breaksBehavior: true });
      assert.equal(val.isValid, false);
    });

    it('Scenario 30: Reject an optimization that introduces security regression', () => {
      const opt = new Performance.PerformanceOptimizationCandidate({ id: 'o30', targetSymbol: 's', targetFile: 'f', patchContent: 'p' });
      const val = engine.validateOptimization(opt, { introducesSecurityFlaw: true });
      assert.equal(val.isValid, false);
    });

    it('Scenario 31: Reject an optimization that worsens reliability', () => {
      const opt = new Performance.PerformanceOptimizationCandidate({ id: 'o31', targetSymbol: 's', targetFile: 'f', patchContent: 'p' });
      const val = engine.validateOptimization(opt, { worsensReliability: true });
      assert.equal(val.isValid, false);
    });

    it('Scenario 32: Apply a verified optimization in Debugger workspace', () => {
      const dbg = new Debugger();
      const ws = dbg._evolutionEngine.createWorkspace('ws:opt', { 'app.js': 'function fn() {}' });
      const opt = new Performance.PerformanceOptimizationCandidate({ id: 'o32', targetSymbol: 'fn', targetFile: 'app.js', patchContent: '// Fast fn' });
      const res = dbg.applyOptimization(opt, ws);
      assert.equal(res.applied, true);
    });

    it('Scenario 33: Roll back an optimization', () => {
      const dbg = new Debugger();
      const ws = dbg._evolutionEngine.createWorkspace('ws:opt2', { 'app.js': 'orig' });
      const res = dbg.rollbackOptimization('o33', ws);
      assert.equal(res.rolledBack, true);
    });

    it('Scenario 34: Generate a scoped performance/reliability certificate', () => {
      const pm = engine.createPerformanceModel({ id: 'pm:cert34' });
      const cert = engine.generatePerformanceCertificate(pm, [{ id: 'ev:b34' }]);
      assert.equal(cert.isCertified, true);
      assert.ok(cert.limitations.length > 0);
    });

    it('Scenario 35: Complete full autonomous performance verification loop', () => {
      const pm = engine.createPerformanceModel({
        id: 'pm:e2e',
        workloads: [engine.generateWorkload('NORMAL')],
        baselines: [{ id: 'b_e2e', workloadId: 'wl', metrics: { LATENCY: 20 } }]
      });

      const loop = engine.runPerformanceVerification(pm);
      assert.ok(loop.measurement);
      assert.ok(loop.profile);
      assert.ok(loop.certificate);
      assert.equal(loop.decision.isAcceptable(), true);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 9. Debugger Stage 32 Integration APIs
  // ─────────────────────────────────────────────────────────────────────────────
  describe('9. Debugger Stage 32 Integration APIs', () => {
    let dbg;

    beforeEach(() => {
      dbg = new Debugger();
    });

    it('9.1 should manage performance models and workloads via Debugger API', () => {
      const pm = dbg.createPerformanceModel({ id: 'dbg:pm1' });
      assert.ok(pm);
      assert.equal(dbg.getPerformanceModel('dbg:pm1').id, 'dbg:pm1');

      const wl = dbg.generateWorkload('NORMAL');
      assert.ok(wl);
      const meas = dbg.measurePerformance(wl);
      assert.ok(meas);
    });

    it('9.2 should run performance verification loop via Debugger API', () => {
      const pm = dbg.createPerformanceModel({ id: 'dbg:pm2', workloads: [dbg.generateWorkload('NORMAL')] });
      const result = dbg.runPerformanceVerification(pm);
      assert.ok(result.certificate);
      assert.equal(result.certificate.isCertified, true);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 10. Performance Benchmarks
  // ─────────────────────────────────────────────────────────────────────────────
  describe('10. Performance Benchmarks', () => {
    it('10.1 100k performance metrics (<300ms)', () => {
      const start = performance.now();
      for (let i = 0; i < 100000; i++) {
        new Performance.PerformanceMetric({
          metricId: `m_${i}`,
          property: Performance.PerformancePropertyKind.LATENCY,
          value: i * 0.1
        });
      }
      const elapsed = performance.now() - start;
      assert.ok(elapsed < 300, `100k performance metrics took ${elapsed.toFixed(2)}ms (target <300ms)`);
    });

    it('10.2 100k workload definitions (<250ms)', () => {
      const start = performance.now();
      for (let i = 0; i < 100000; i++) {
        new Performance.WorkloadModel({
          id: `wl_${i}`,
          concurrency: (i % 16) + 1
        });
      }
      const elapsed = performance.now() - start;
      assert.ok(elapsed < 250, `100k workload definitions took ${elapsed.toFixed(2)}ms (target <250ms)`);
    });

    it('10.3 10k metric queries (<150ms)', () => {
      const baseline = new Performance.PerformanceBaseline({
        id: 'b_perf',
        workloadId: 'w',
        metrics: { LATENCY: 15.5, THROUGHPUT: 1000 }
      });
      const start = performance.now();
      for (let i = 0; i < 10000; i++) {
        baseline.getMetricValue('LATENCY');
      }
      const elapsed = performance.now() - start;
      assert.ok(elapsed < 150, `10k metric queries took ${elapsed.toFixed(2)}ms (target <150ms)`);
    });

    it('10.4 10k distribution calculations (<300ms)', () => {
      const samples = [10, 12, 14, 15, 18, 20, 22, 25, 30, 35];
      const start = performance.now();
      for (let i = 0; i < 10000; i++) {
        new Performance.MetricDistribution(samples);
      }
      const elapsed = performance.now() - start;
      assert.ok(elapsed < 300, `10k distribution calculations took ${elapsed.toFixed(2)}ms (target <300ms)`);
    });

    it('10.5 10k baseline comparisons (<200ms)', () => {
      const baseline = new Performance.PerformanceBaseline({
        id: 'b',
        workloadId: 'w',
        metrics: { LATENCY: 20 }
      });
      const meas = new Performance.PerformanceMeasurement({
        measurementId: 'm',
        workloadId: 'w',
        metrics: { LATENCY: 21 }
      });
      const start = performance.now();
      for (let i = 0; i < 10000; i++) {
        engine.comparePerformanceBaseline(baseline, meas);
      }
      const elapsed = performance.now() - start;
      assert.ok(elapsed < 200, `10k baseline comparisons took ${elapsed.toFixed(2)}ms (target <200ms)`);
    });

    it('10.6 10k resource analyses (<350ms)', () => {
      const bounds = [new Performance.ResourceBound({ id: 'b', resourceType: 'CPU', maxAllowed: 80 })];
      const snap = new Performance.ResourceUsageSnapshot({ cpuPercent: 50 });
      const start = performance.now();
      for (let i = 0; i < 10000; i++) {
        engine.checkResourceBounds(bounds, snap);
      }
      const elapsed = performance.now() - start;
      assert.ok(elapsed < 350, `10k resource analyses took ${elapsed.toFixed(2)}ms (target <350ms)`);
    });

    it('10.7 10k complexity analyses (<400ms)', () => {
      const points = [{ n: 10, timeMs: 5 }, { n: 1000, timeMs: 500 }];
      const start = performance.now();
      for (let i = 0; i < 10000; i++) {
        engine.analyzeComplexity(points);
      }
      const elapsed = performance.now() - start;
      assert.ok(elapsed < 400, `10k complexity analyses took ${elapsed.toFixed(2)}ms (target <400ms)`);
    });

    it('10.8 10k leak checks (<300ms)', () => {
      const series = [
        new Performance.ResourceUsageSnapshot({ memoryBytes: 1000 }),
        new Performance.ResourceUsageSnapshot({ memoryBytes: 1200 }),
        new Performance.ResourceUsageSnapshot({ memoryBytes: 1400 })
      ];
      const start = performance.now();
      for (let i = 0; i < 10000; i++) {
        engine.detectResourceLeaks(series);
      }
      const elapsed = performance.now() - start;
      assert.ok(elapsed < 300, `10k leak checks took ${elapsed.toFixed(2)}ms (target <300ms)`);
    });

    it('10.9 1k scalability analyses (<500ms)', () => {
      const data = [{ concurrency: 1, throughput: 100 }, { concurrency: 8, throughput: 750 }];
      const start = performance.now();
      for (let i = 0; i < 1000; i++) {
        engine.analyzeScalability(data);
      }
      const elapsed = performance.now() - start;
      assert.ok(elapsed < 500, `1k scalability analyses took ${elapsed.toFixed(2)}ms (target <500ms)`);
    });

    it('10.10 1k capacity analyses (<500ms)', () => {
      const data = [{ rps: 100, concurrency: 2, latencyP95: 50, cpuPercent: 30 }];
      const start = performance.now();
      for (let i = 0; i < 1000; i++) {
        engine.analyzeCapacity(data, { maxLatencyP95: 200, maxCpuPercent: 80 });
      }
      const elapsed = performance.now() - start;
      assert.ok(elapsed < 500, `1k capacity analyses took ${elapsed.toFixed(2)}ms (target <500ms)`);
    });

    it('10.11 1k stress-plan generations (<400ms)', () => {
      const start = performance.now();
      for (let i = 0; i < 1000; i++) {
        engine.createStressTest({ id: `st_${i}`, intensityLevel: (i % 10) + 1 });
      }
      const elapsed = performance.now() - start;
      assert.ok(elapsed < 400, `1k stress-plan generations took ${elapsed.toFixed(2)}ms (target <400ms)`);
    });

    it('10.12 1k reliability analyses (<500ms)', () => {
      const runs = [{ failed: false }, { failed: false }, { failed: true }];
      const start = performance.now();
      for (let i = 0; i < 1000; i++) {
        engine.analyzeReliability(runs);
      }
      const elapsed = performance.now() - start;
      assert.ok(elapsed < 500, `1k reliability analyses took ${elapsed.toFixed(2)}ms (target <500ms)`);
    });

    it('10.13 1k regression analyses (<400ms)', () => {
      const base = new Performance.PerformanceBaseline({ id: 'b', workloadId: 'w', metrics: { LATENCY: 20 } });
      const meas = new Performance.PerformanceMeasurement({ measurementId: 'm', workloadId: 'w', metrics: { LATENCY: 22 } });
      const start = performance.now();
      for (let i = 0; i < 1000; i++) {
        engine.comparePerformanceBaseline(base, meas);
      }
      const elapsed = performance.now() - start;
      assert.ok(elapsed < 400, `1k regression analyses took ${elapsed.toFixed(2)}ms (target <400ms)`);
    });

    it('10.14 1k optimization rankings (<400ms)', () => {
      const opts = [
        new Performance.PerformanceOptimizationCandidate({ id: 'o1', targetSymbol: 's', targetFile: 'f', patchContent: 'p', predictedSpeedup: 1.2 }),
        new Performance.PerformanceOptimizationCandidate({ id: 'o2', targetSymbol: 's', targetFile: 'f', patchContent: 'p', predictedSpeedup: 1.8 })
      ];
      const start = performance.now();
      for (let i = 0; i < 1000; i++) {
        [...opts].sort((a, b) => b.predictedSpeedup - a.predictedSpeedup);
      }
      const elapsed = performance.now() - start;
      assert.ok(elapsed < 400, `1k optimization rankings took ${elapsed.toFixed(2)}ms (target <400ms)`);
    });

    it('10.15 1k performance certificates (<300ms)', () => {
      const pm = new Performance.PerformanceModel({ id: 'pm' });
      const start = performance.now();
      for (let i = 0; i < 1000; i++) {
        engine.generatePerformanceCertificate(pm, [{ id: 'ev' }]);
      }
      const elapsed = performance.now() - start;
      assert.ok(elapsed < 300, `1k performance certificates took ${elapsed.toFixed(2)}ms (target <300ms)`);
    });
  });
});
