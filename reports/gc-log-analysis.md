---
name: "GC Log Analysis Report – test-gc-log.txt"
date: "2026-04-29"
agent: "GC Log Analyzer"
model: "Anthropic Claude Sonnet 4.6"
input_file: "test-gc-log.txt"
jvm_version: "17.0.15+6-Ubuntu-0ubuntu120.04"
gc_algorithm: "G1"
heap_size: "1G (fixed)"
total_gc_events: 116
full_gc_events: 1
mmu_violations: 18
max_pause_ms: 256.802
confidence: "High"
---

# GC Log Analysis Report

## Executive Summary

The JVM (G1 GC, Java 17.0.15) is running with a **fixed 1G heap** (`-Xms1g -Xmx1g`).
The log covers ~624 seconds (~10.4 minutes) of runtime and records **116 GC events** (GC(0)–GC(115)).

Key problems observed:

- **Frequent long pauses** — dozens of young/mixed GC pauses exceed 100 ms; the worst reaches **256.8 ms** (GC(67)).
- **Repeated MMU target violations** — the collector missed its 100 ms pause goal 18 times.
- **One explicit Full GC** — triggered by `System.gc()` at ~6 s, pausing for 107 ms.
- **Long Concurrent Mark cycles** — up to **781.9 ms** (GC(51)), indicating heavy marking load on only 1 concurrent worker thread.
- **Growing Old-gen regions** — old-region count climbs from 0 → 500+ before mixed GC relief cycles.
- **Humongous allocations** — sporadically appear (e.g., 8, 15, 23, 25 humongous regions), indicating large objects allocated on heap.
- **Metaspace growth** — grows from ~13 MB at start to ~55 MB at JVM exit; two Metadata GC Threshold events trigger early concurrent mark cycles.

**Confidence: High** — all findings are directly traceable to log lines cited below.

---

## Environment

| Property | Value |
|---|---|
| JVM version | `17.0.15+6-Ubuntu-0ubuntu120.04` |
| GC algorithm | G1 |
| Heap (min/initial/max) | 1 GB / 1 GB / 1 GB (fixed) |
| Region size | 1 MB |
| System RAM | 8727 MB |
| CPUs | 4 total / 4 available |
| Parallel GC workers | 4 |
| Concurrent GC workers | **1** |
| Concurrent refinement workers | 4 |
| Compressed Oops | Enabled (32-bit) |
| NUMA | Disabled |
| Large Pages | Disabled |

---

## Key Metrics

| Metric | Value |
|---|---|
| Total GC events | 116 (GC(0)–GC(115)) |
| Full GC events | 1 (GC(3) – `System.gc()`) |
| Concurrent Mark Cycles | 12 (GC(2), GC(11), GC(51), GC(62), GC(71), GC(78), GC(83), GC(89), GC(95), GC(101), GC(107), GC(113)) |
| MMU target violations (>100 ms) | 18 |
| Max single pause | **256.802 ms** — GC(67) Pause Young (Normal) |
| 2nd highest pause | **226.165 ms** — GC(53) Pause Young (Mixed) |
| Max Concurrent Mark Cycle | **781.951 ms** — GC(51) |
| Max Evacuate Collection Set phase | **243.6 ms** — GC(67) |
| Max Post Evacuate phase | **38.6 ms** — GC(22) |
| Peak heap used before GC | **~770 MB** — GC(114) |
| Metaspace at exit | **55 MB used / 55.7 MB committed** |
| Humongous regions (max seen) | 25 — GC(114) |

---

## Selected Log Evidence

### Fixed 1 GB heap

```
[0.017s][debug][gc,heap] Minimum heap 1073741824  Initial heap 1073741824  Maximum heap 1073741824
[0.027s][info ][gc,init] Heap Min Capacity: 1G
[0.027s][info ][gc,init] Heap Max Capacity: 1G
[0.027s][info ][gc,init] Concurrent Workers: 1
```

### Explicit System.gc() Full GC

```
[6.133s][info ][gc,start    ] GC(3) Pause Full (System.gc())
[6.240s][info ][gc          ] GC(3) Pause Full (System.gc()) 39M->21M(1024M) 107.563ms
```

### Worst pause — 256 ms

```
[379.393s][info ][gc,mmu    ] GC(67) MMU target violated: 101.0ms (100.0ms/101.0ms)
[379.393s][info ][gc,phases ] GC(67)   Evacuate Collection Set: 243.6ms
[379.394s][info ][gc        ] GC(67) Pause Young (Normal) (G1 Evacuation Pause) 708M->309M(1024M) 256.802ms
```

### Longest Concurrent Mark Cycle — 781 ms

```
[318.531s][info ][gc        ] GC(51) Concurrent Mark Cycle
[318.884s][info ][gc,marking] GC(51) Concurrent Mark From Roots 307.736ms
[318.983s][info ][gc        ] GC(51) Pause Remark 529M->529M(1024M) 93.013ms
[319.313s][info ][gc        ] GC(51) Concurrent Mark Cycle 781.951ms
```

### MMU violations (sample)

```
[142.435s] GC(22) MMU target violated: 101.0ms (100.0ms/101.0ms)  → 116.697ms total pause
[168.551s] GC(25) MMU target violated: 101.0ms (100.0ms/101.0ms)  → 127.542ms total pause
[229.644s] GC(34) MMU target violated: 101.0ms (100.0ms/101.0ms)  → 174.318ms total pause
[325.302s] GC(53) MMU target violated: 101.0ms (100.0ms/101.0ms)  → 226.165ms total pause
[379.393s] GC(67) MMU target violated: 101.0ms (100.0ms/101.0ms)  → 256.802ms total pause
```

### Growing Old-gen (memory pressure)

```
GC(4)  Old regions:  23->27
GC(7)  Old regions:  56->64
GC(29) Old regions: 191->203
GC(50) Old regions: 465->480   ← ~480 MB in Old gen before mixed GC relief
```

### Humongous allocations

```
[455.220s] GC(82) Pause Young (Concurrent Start) (G1 Humongous Allocation)
[616.410s] GC(106) Pause Young (Concurrent Start) (G1 Humongous Allocation)
[620.070s] GC(112) Pause Young (Concurrent Start) (G1 Humongous Allocation)
[621.806s] GC(114) Humongous regions: 25->10
```

---

## Findings and Recommendations

### Finding 1 — Heap too small for workload (High confidence)

**Problem:** With a fixed 1 GB heap, the application fills 70–75% of heap before most young GCs, forcing G1 to evacuate hundreds of regions per pause. This is the root cause of long evacuation phases.

**Evidence:** Pre-GC heap usage frequently reaches 700–770 MB on a 1024 MB heap.

**Fix:**

```bash
# Increase heap — start with 2G, profile and adjust upward
-Xms2g -Xmx2g
```

**Expected impact:** Fewer and shorter GC pauses; more headroom between GCs.

---

### Finding 2 — Explicit System.gc() causes unnecessary Full GC (High confidence)

**Problem:** A `System.gc()` call at ~6 s triggered a 107 ms Full GC that compacted the entire heap unnecessarily.

**Evidence:**
```
[6.133s] GC(3) Pause Full (System.gc()) 39M->21M(1024M) 107.563ms
```

**Fix:**

```bash
# Disable explicit GC calls
-XX:+DisableExplicitGC
```

Also audit the codebase / third-party libraries for calls to `System.gc()` and remove or guard them.

---

### Finding 3 — Only 1 concurrent GC worker (High confidence)

**Problem:** G1 runs concurrent marking with only 1 worker thread (`Concurrent Workers: 1`). With 4 CPUs available, this severely limits the throughput of concurrent marking, leading to long mark cycles (up to 781 ms).

**Evidence:**
```
[0.027s][info ][gc,init] Concurrent Workers: 1
[318.577s] GC(51) Using 1 workers of 1 for marking
[318.884s] GC(51) Concurrent Mark From Roots 307.736ms
```

**Fix:**

```bash
# Increase concurrent GC threads (safe on 4-CPU machine)
-XX:ConcGCThreads=2
```

> Note: Do not set this higher than `ParallelGCThreads / 4` unless benchmarked — concurrent threads compete with application threads.

---

### Finding 4 — G1 initiating occupancy threshold too high (High confidence)

**Problem:** Mixed GCs start very late (heap ~70–75% full), leading to large old-gen regions that require expensive evacuation. Lowering `InitiatingHeapOccupancyPercent` (IHOP) triggers concurrent marking earlier.

**Evidence:** Old-gen grows from 23 → 495 regions before GC(52) starts the first mixed cycle in the second half of the run.

**Fix:**

```bash
# Start concurrent marking earlier (default is 45)
-XX:InitiatingHeapOccupancyPercent=30
```

---

### Finding 5 — Humongous allocations causing fragmentation and extra GC cycles (Medium confidence)

**Problem:** Large objects (> 512 KB with 1 MB region size) are allocated as humongous regions, bypassing normal young-gen allocation. This fragments the heap and triggers extra `Concurrent Start` GCs.

**Evidence:**
```
[455.220s] GC(82) Pause Young (Concurrent Start) (G1 Humongous Allocation)
[621.806s] GC(114) Humongous regions: 25->10
```

**Fix options:**
- Increase region size if objects > 512 KB are common: `-XX:G1HeapRegionSize=4M` (requires larger heap — 4 MB regions on ≥ 2 GB heap)
- Profile and refactor application to avoid allocating large temporary buffers; use pooled `ByteBuffer`s where possible.

---

### Finding 6 — No structured GC logging or observability (Medium confidence)

**Problem:** Logs are already detailed, but no file rotation, no metric export. In production, log files can grow unbounded.

**Fix:**

```bash
# Structured rolling GC log
-Xlog:gc*:file=/var/log/app/gc.log:time,level,tags:filecount=5,filesize=20M

# Optional: JFR for deeper profiling during load tests
-XX:StartFlightRecording=duration=5m,filename=app.jfr,settings=profile
```

---

## Consolidated JVM Command (Short-Term)

```bash
java \
  -Xms2g -Xmx2g \
  -XX:+DisableExplicitGC \
  -XX:MaxGCPauseMillis=200 \
  -XX:InitiatingHeapOccupancyPercent=30 \
  -XX:ConcGCThreads=2 \
  -Xlog:gc*:file=/var/log/app/gc.log:time,level,tags:filecount=5,filesize=20M \
  -jar yourapp.jar
```

---

## Remediation Priority

| Priority | Action | Flag / Change |
|---|---|---|
| 1 | Increase heap | `-Xms2g -Xmx2g` |
| 2 | Disable explicit GC | `-XX:+DisableExplicitGC` |
| 3 | Add concurrent marking thread | `-XX:ConcGCThreads=2` |
| 4 | Lower IHOP | `-XX:InitiatingHeapOccupancyPercent=30` |
| 5 | Set pause target | `-XX:MaxGCPauseMillis=200` |
| 6 | Enable rolling GC log | `-Xlog:gc*:file=...` |
| 7 | Investigate humongous allocations | Profiler / JFR |

---

## Tuning Matrix (Expected Effect)

| Heap size | IHOP | ConcGCThreads | Expected max pause | Expected Concurrent Mark time |
|---|---|---|---|---|
| 1 GB (current) | 45 (default) | 1 (current) | 250+ ms | 700–800 ms |
| 2 GB | 45 | 1 | ~150 ms | ~500 ms |
| 2 GB | 30 | 2 | ~80–120 ms | ~250 ms |
| 4 GB | 30 | 2 | ~40–80 ms | ~150 ms |

*All estimates are approximations; validate against load test results.*

---

## Additional Data Required for Deeper Analysis

- CPU utilization time-series during long pauses (to distinguish GC-bound vs. I/O-bound stalls)
- Application allocation profile (async-profiler / JFR allocation profiler) to identify humongous-allocation call sites
- Heap histogram at peak usage to quantify live-set and object retention
