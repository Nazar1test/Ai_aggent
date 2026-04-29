---
name: "JVM Tuning Before/After Comparison"
date: "2025-07-14"
agent: "GC Log Analyzer"
source_log: "gc-log-provided-inline"
---

# JVM Tuning: Before vs After

## Flag Comparison

| JVM Flag | Before (observed) | After (recommended) | Why changed |
|---|---|---|---|
| `-Xms` / `-Xmx` | `1g` / `1g` | `3g` / `3g` | Live-set 450–540 MB; 1 GB too small |
| `-XX:MaxGCPauseMillis` | ~100 ms (inferred) | `150` | 100 ms never met; 15+ MMU violations |
| `-XX:ConcGCThreads` | `1` | `2` | Single thread caused 782 ms mark cycles |
| `-XX:ParallelGCThreads` | `4` | `4` | Already at CPU count, keep |
| `-XX:InitiatingHeapOccupancyPercent` | `45` (default) | `30` | Old-gen grew unchecked; earlier marking needed |
| `-XX:G1HeapRegionSize` | `1m` (auto) | `4m` | Reduces humongous classification; fits 3 GB heap |
| `-XX:MaxMetaspaceSize` | not set | `256m` | 2 Metadata-GC triggers; unbounded growth risk |
| `-XX:MaxTenuringThreshold` | `15` (default) | `6` | Survivor age-1 overflow; de-facto immediate promotion |
| `-XX:+DisableExplicitGC` | not set | `true` | System.gc() at 6.133 s caused 107 ms full GC |

## Expected Outcome After Tuning

| Metric | Before | Expected After |
|---|---|---|
| Max pause | 256.8 ms | < 150 ms |
| MMU violations (per 10 min) | 15+ | 0–2 |
| Concurrent Mark Cycle duration | up to 782 ms | ~350–450 ms |
| Full GC events | 1 (explicit) | 0 |
| Humongous regions observed | Up to 25 | < 5 |
| GC events per minute | ~10–12 | ~5–7 |
| Pause Remark max | 93 ms | < 40 ms |

## Flags NOT changed and rationale

| Flag | Value | Rationale |
|---|---|---|
| `-XX:+UseG1GC` | G1 | Appropriate for this workload; no reason to switch |
| `-XX:ConcRefinementThreads` | 4 | Already at CPU count |
| `-XX:+UseCompressedOops` | enabled | Heap < 32 GB; keep for pointer compression |

## Next Steps

1. Deploy recommended flags to **staging** environment
2. Run identical load test for ≥ 10 minutes
3. Collect new GC log and compare pause histogram
4. If P99 pause still > 150 ms, profile allocation hotspots with async-profiler or JFR
5. Investigate humongous allocation sources (objects > 2 MB after region resize)
6. Review any remaining `System.gc()` calls in application code and third-party libraries
