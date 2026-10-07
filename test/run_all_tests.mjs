/**
 * run_all_tests.mjs
 * Runs all test files sequentially to prevent test worker resource contention during benchmark measurements.
 */

import { readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';

const testDir = new URL('.', import.meta.url).pathname;
const testFiles = readdirSync(testDir)
  .filter(f => f.startsWith('test_') && f.endsWith('.mjs'))
  .sort();

console.log(`Found ${testFiles.length} test files. Running sequentially...`);

let totalPassed = 0;
let totalFailed = 0;
let totalFilesPassed = 0;
let totalFilesFailed = 0;

for (const file of testFiles) {
  const filePath = join(testDir, file);
  const result = spawnSync('node', ['--test', filePath], {
    encoding: 'utf8',
    stdio: 'pipe'
  });

  const output = result.stdout + result.stderr;
  const passMatch = output.match(/ℹ pass (\d+)/);
  const failMatch = output.match(/ℹ fail (\d+)/);

  const filePass = passMatch ? parseInt(passMatch[1], 10) : 0;
  const fileFail = failMatch ? parseInt(failMatch[1], 10) : 0;

  totalPassed += filePass;
  totalFailed += fileFail;

  if (result.status === 0 && fileFail === 0) {
    totalFilesPassed++;
    console.log(`✔ ${file} (Passed: ${filePass})`);
  } else {
    totalFilesFailed++;
    console.error(`✖ ${file} (Failed: ${fileFail}, Status: ${result.status})`);
    console.error(output);
  }
}

console.log('\n========================================');
console.log(`All Test Files Completed: ${totalFilesPassed}/${testFiles.length} passed.`);
console.log(`Total Subtests/Assertions: ${totalPassed} passed, ${totalFailed} failed.`);
console.log('========================================');

if (totalFilesFailed > 0 || totalFailed > 0) {
  process.exit(1);
}
