import { resolve } from "node:path";
import { performance } from "node:perf_hooks";
import {
  createLog,
  environment,
  inspectCaches,
  inspectOutput,
  loadConfig,
  parseArgs,
  rotate,
  runCommand,
  safeCleanup,
  saveJson,
  validateCommonInputs,
  variantMetadata,
} from "./lib.mjs";

const args = parseArgs();
if (args.help) {
  console.log(
    "node benchmark/measure-builds.mjs [--config config.mjs] [--variants next,tanstack,rshono] [--repetitions 3] [--output dir] [--next-root dir] [--tanstack-root dir] [--rshono-root dir] [--dry-run]",
  );
  process.exit(0);
}
const config = await loadConfig(args);
const plan = [];
for (const mode of ["cold", "warm"])
  for (let round = 0; round < config.buildRepetitions; round++) {
    for (const variant of rotate(config.variants, round))
      plan.push({ variant, mode, repetition: round + 1 });
  }
if (args["dry-run"]) {
  console.log(
    JSON.stringify(
      plan.map(({ variant, mode, repetition }) => ({
        id: variant.id,
        mode,
        repetition,
        root: variant.root,
        commands: variant.commands,
        remove: [
          ...variant.outputCleanup,
          ...(mode === "cold" ? variant.cacheCleanup : []),
        ],
      })),
      null,
      2,
    ),
  );
  process.exit(0);
}
const result = {
  environment: environment(),
  config,
  variants: [],
  samples: [],
  complete: false,
};
for (const variant of config.variants)
  result.variants.push(await variantMetadata(variant));
validateCommonInputs(result.variants);
const resultPath = resolve(config.outputDirectory, "builds.json");
await saveJson(resultPath, result);
for (const { variant, mode, repetition } of plan) {
  console.log(
    `[build] ${variant.id} ${mode} ${repetition}/${config.buildRepetitions}`,
  );
  await safeCleanup(variant, [
    ...variant.outputCleanup,
    ...(mode === "cold" ? variant.cacheCleanup : []),
  ]);
  const cacheBefore = await inspectCaches(variant);
  const logPath = resolve(
    config.outputDirectory,
    "logs",
    `build-${variant.id}-${mode}-${repetition}.log`,
  );
  const log = await createLog(logPath);
  const sample = {
    variant: variant.id,
    mode,
    repetition,
    startedAt: new Date().toISOString(),
    logPath,
    cacheBefore,
    commands: [],
  };
  const start = performance.now();
  try {
    for (const command of variant.commands) {
      const execution = await runCommand(
        command,
        variant.root,
        log,
        config.buildTimeoutMs,
      );
      sample.commands.push(execution);
      if (execution.exitCode !== 0)
        throw new Error(
          `Command failed with code ${execution.exitCode}: ${command.join(" ")}`,
        );
    }
    sample.elapsedMs = performance.now() - start;
    sample.cacheAfter = await inspectCaches(variant);
    sample.output = await inspectOutput(variant);
    sample.success = true;
  } catch (error) {
    sample.elapsedMs = performance.now() - start;
    sample.success = false;
    sample.error = String(error.stack ?? error);
  } finally {
    await new Promise((resolveLog) => log.end(resolveLog));
    result.samples.push(sample);
    await saveJson(resultPath, result);
  }
  if (!sample.success)
    throw new Error(
      `Build failed; saved partial results and raw log at ${logPath}`,
    );
}
result.complete = true;
await saveJson(resultPath, result);
console.log(`Saved ${result.samples.length} build samples to ${resultPath}`);
