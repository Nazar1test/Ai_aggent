---
name: "GC Log Analysis Report"
date: "2025-07-14"
agent: "GC Log Analyzer"
model: "Anthropic Claude Sonnet 4.5"
input_file: "gc-log-provided-inline"
jvm_version: "Java 17.0.15+6-Ubuntu"
gc_collector: "G1"
confidence: "High"
---

# GC Log Analysis Report

## Executive Summary

The JVM (G1 on Java 17, fixed 1 GB heap) shows **severe and worsening GC pressure**
throughout the 624-second run. Key problems:

| Problem | Severity |
|---|---|
| Heap too small for live-set + allocation rate | 🔴 Critical |
| Frequent pauses >100 ms, several >200 ms | 🔴 Critical |
| 15+ MMU target violations (pause target routinely missed) | 🔴 Critical |
| Only 1 Concurrent GC worker (ConcGCThreads=1) | 🔴 Critical |
| Explicit System.gc() causing full GC at ~6 s | 🟠 High |
| Humongous allocations present and recurring | 🟠 High |
| Old regions growing monotonically between mixed GC rounds | 🟠 High |
| Metaspace growing from 13 MB → 55 MB (class loading pressure) | 🟡 Medium |
| Survivor overflow (all-age-1, threshold=1 repeatedly) | 🟡 Medium |

---

## Environment

| Field | Value |
|---|---|
| JVM | Java 17.0.15+6-Ubuntu-0ubuntu120.04 |
| GC | G1 |
| Heap (min/init/max) | 1 GB / 1 GB / 1 GB |
| Region size | 1 MB |
| CPUs | 4 total, 4 available |
| Host memory | 8 727 MB |
| Parallel GC workers | 4 |
| Concurrent GC workers | **1** ← bottleneck |
| Concurrent Refinement workers | 4 |

---

## Key Metrics (Extracted from Log)

| Metric | Value |
|---|---|
| Total GC events observed | GC(0) – GC(115) = **116 events** |
| Full GC events | **1** (explicit System.gc() at 6.133 s) |
| Concurrent Mark Cycles | ~14 full cycles observed |
| Longest pause | **256.8 ms** — GC(67) Pause Young Normal at 379.394 s |
| Second-longest pause | **226.2 ms** — GC(53) Pause Young Mixed at 325.303 s |
| Third-longest pause | **174.3 ms** — GC(34) Pause Young Normal at 229.644 s |
| Pauses > 100 ms | **≥ 30 events** across the run |
| MMU target violations | **≥ 15 violations** (101 ms window violated) |
| Longest Concurrent Mark Cycle | **781.95 ms** — GC(51) |
| Pause Remark max | **93.0 ms** — GC(51) |
| Max used heap before GC | **~757 MB** (GC(52) before = 756 MB, GC(114) before = 770 MB) |
| Metaspace at start | ~13 MB |
| Metaspace at exit | ~55 MB |
| Humongous regions first seen | GC(8): 3 humongous |
| Humongous regions peak | GC(114): 25 humongous before GC |

---

## GC Pause Timeline (Selected Major Events)

```
Time(s)   GC    Type                          Before→After  Pause(ms)   Notes
------    ---   ----------------------------  -----------   ---------   -----
  3.691   (0)   Young Normal                  51M→12M       54.4
  5.207   (1)   Young ConcStart Metadata      51M→19M       32.6
  6.133   (3)   FULL System.gc()              39M→21M       107.6       ← explicit full GC
  7.772   (5)   Young Normal                  76M→47M       71.8
 82.161  (16)   Young Normal                 353M→109M      83.1
 93.270  (17)   Young Normal                 335M→111M      87.0
122.870  (20)   Young Normal                 408M→136M      99.3
142.318  (22)   Young Normal ⚠ MMU           493M→157M     116.7       ← 1st MMU violation
168.423  (25)   Young Normal ⚠ MMU           537M→184M     127.5
176.772  (26)   Young Normal ⚠ MMU           455M→192M     142.0
229.470  (34)   Young Normal ⚠ MMU           521M→296M     174.3
252.338  (38)   Young Normal ⚠ MMU           591M→347M     134.5
318.406  (50)   Young ConcStart ⚠ MMU        738M→512M     123.9
325.077  (53)   Young Mixed  ⚠ MMU           547M→480M     226.2       ← Evacuate=217.9 ms
379.137  (67)   Young Normal ⚠ MMU           708M→309M     256.8       ← WORST, Evacuate=243.6 ms
318.531  (51)   Concurrent Mark Cycle                       ---         781.9 ms total
```

---

## Root-Cause Analysis

### 1. Heap Too Small (Critical)
The heap is fixed at 1 GB while the live-set regularly reaches 450–540 MB before mixed GC
rounds reclaim it. With such a high live-set ratio (45–55 % of heap = live), young-gen is
squeezed, eden regions fill up quickly, and each GC must evacuate hundreds of regions,
causing long Evacuate Collection Set phases.

**Evidence:**
```
[312.389s] GC(49) Heap before: 733M used, 266 young + 31 survivors
[318.406s] GC(50) Heap before: 754M used — 738M→512M in 123.9 ms
[379.137s] GC(67) Heap before: 724M used, 445 young — 708M→309M in 256.8 ms
```

### 2. Only 1 Concurrent Worker (Critical)
`ConcGCThreads=1` means the concurrent marking phase runs on a single thread even though 4
cores are available. This directly causes the long concurrent mark durations (144–307 ms for
"Concurrent Mark From Roots") and long total cycle times (up to 781 ms).

**Evidence:**
```
[318.577s] GC(51) Using 1 workers of 1 for marking
[318.884s] GC(51) Concurrent Mark From Roots 307.736ms  ← single-thread bottleneck
[319.313s] GC(51) Concurrent Mark Cycle 781.951ms
```

### 3. Repeated MMU Target Violations (Critical)
The GC is configured with a ~100 ms pause goal. The log records violations when actual pauses
exceed this. The Evacuate Collection Set phase repeatedly takes 95–243 ms by itself.

**Evidence:**
```
[325.302s] GC(53) MMU target violated: 101.0ms (100.0ms/101.0ms)
           Evacuate Collection Set: 217.9ms
[379.393s] GC(67) MMU target violated: 101.0ms (100.0ms/101.0ms)
           Evacuate Collection Set: 243.6ms
```

### 4. Explicit System.gc() (High)
At ~6.13 s a full compacting GC is triggered by `System.gc()` from application code or a
library. This adds a 107 ms stop-the-world pause unnecessarily.

**Evidence:**
```
[6.133s] GC(3) Pause Full (System.gc()) 39M->21M(1024M) 107.563ms
```

### 5. Humongous Allocations (High)
Humongous objects (> 512 KB each for 1 MB regions) appear intermittently and spike: up to
25 humongous regions before GC(114). These bypass normal allocation paths, cause concurrent
mark triggers, and increase fragmentation.

**Evidence:**
```
[455.220s] GC(82) Pause Young (Concurrent Start) (G1 Humongous Allocation)
[616.410s] GC(106) Pause Young (Concurrent Start) (G1 Humongous Allocation)
[621.778s] GC(114) Heap before: humongous regions: 25
```

### 6. Survivor Overflow / Age-1 Dominance (Medium)
The survivor threshold repeatedly collapses to 1, meaning objects are being promoted to old-gen
immediately after surviving one collection. This accelerates old-gen growth and forces more
frequent concurrent mark cycles.

**Evidence:**
```
[5.208s]  GC(1) Desired survivor size 3670016 bytes, new threshold 1 (max threshold 15)
[168.424s] GC(25) new threshold 1 — age 1: 30MB total survivors
```

### 7. Metaspace Pressure (Medium)
Metaspace grows from 13 MB to 55 MB over the run without any reclamation. Two GCs were
triggered specifically by "Metadata GC Threshold". No MaxMetaspaceSize is configured,
which risks unbounded growth in long-running services.

**Evidence:**
```
[5.207s]  GC(1) Pause Young (Concurrent Start) (Metadata GC Threshold)
[24.068s] GC(10) Pause Young (Concurrent Start) (Metadata GC Threshold)
[624.562s] Metaspace used 55190K at exit (started at 13280K)
```

---

## Recommendations

### Priority 1 — Immediate (apply before next production run)

#### R1: Increase heap to 3–4 GB
The machine has 8.7 GB; the fixed 1 GB heap is the primary bottleneck.

```bash
-Xms3g -Xmx3g
```

> With a 3 GB heap, old-gen has breathing room, mixed GCs reclaim more per cycle, and
> young-gen can be larger (fewer but faster collections).

#### R2: Disable explicit GC
```bash
-XX:+DisableExplicitGC
```

> Eliminates the System.gc()-triggered full GC and any library-originated calls.

#### R3: Increase Concurrent GC threads
```bash
-XX:ConcGCThreads=2
```

> On 4 cores, 2 concurrent threads halves marking time while leaving 2 cores for
> application threads. Expected: concurrent mark cycles drop from ~780 ms to ~350–400 ms.

---

### Priority 2 — Short-term (within one sprint)

#### R4: Tune initiating heap occupancy
```bash
-XX:InitiatingHeapOccupancyPercent=30
```

> Default is 45 %. Starting concurrent marking earlier (at 30 % heap occupancy) gives
> the marker more time to finish before mixed GCs are needed, reducing evacuation pressure.

#### R5: Set pause target
```bash
-XX:MaxGCPauseMillis=150
```

> Relax from the apparent 100 ms target (which is never met) to a realistic 150 ms.
> G1 will widen young-gen to reduce frequency and shorten evacuation sets.

#### R6: Cap Metaspace
```bash
-XX:MaxMetaspaceSize=256m
```

> Prevents unbounded metaspace growth and triggers earlier class unloading if needed.

#### R7: Tune region size for humongous objects
```bash
-XX:G1HeapRegionSize=4m
```

> With 3 GB heap, 4 MB regions are appropriate (G1 supports 1–32 MB regions; sweet spot
> is heap_size / 2048 ≈ 1.5 MB → round up to 2 MB or 4 MB).
> Humongous threshold becomes 2 MB (>= half region), reducing the number of objects
> classified as humongous.

---

### Priority 3 — Medium-term (profiling required)

#### R8: Find and reduce humongous allocations
- Enable `-XX:+G1PrintHeapRegions` (debug builds) or use JFR/async-profiler
- Profile allocation sites producing objects > 512 KB (byte arrays, off-heap buffers, large
  collections)
- Introduce buffer pooling, streaming, or chunking

#### R9: Investigate survivor overflow
- Check if the ~30 MB age-1 survivor data represents a memory leak or expected working set
- Consider `-XX:TargetSurvivorRatio=50` (default 50 %) and `-XX:MaxTenuringThreshold=6`
  to allow multi-age survival before promotion

#### R10: Add GC observability
```bash
-Xlog:gc*:file=/var/log/app/gc-%t.log:time,level,tags:filecount=5,filesize=20m
-XX:StartFlightRecording=duration=10m,filename=/tmp/app.jfr,settings=profile
```

---

## Recommended JVM Command (Production Candidate)

```bash
java \
  -Xms3g -Xmx3g \
  -XX:+UseG1GC \
  -XX:MaxGCPauseMillis=150 \
  -XX:InitiatingHeapOccupancyPercent=30 \
  -XX:ConcGCThreads=2 \
  -XX:ParallelGCThreads=4 \
  -XX:G1HeapRegionSize=4m \
  -XX:MaxMetaspaceSize=256m \
  -XX:+DisableExplicitGC \
  -Xlog:gc*:file=/var/log/app/gc.log:time,level,tags:filecount=5,filesize=20m \
  -jar yourapp.jar
```

---

## Expected Impact After Tuning

| Metric | Current | Expected After Tuning |
|---|---|---|
| Max pause | ~257 ms | < 150 ms |
| MMU violations | 15+ | 0–2 |
| Concurrent Mark Cycle | up to 782 ms | ~350–450 ms |
| Full GC events | 1 (explicit) | 0 |
| GC frequency (per minute) | ~10–12 | ~5–7 |
| Humongous allocations | Recurring | Reduced (larger region size) |

---

## Appendix: GC Event Count by Type

| Type | Count |
|---|---|
| Pause Young Normal | ~70 |
| Pause Young Mixed | ~20 |
| Pause Young Prepare Mixed | ~12 |
| Pause Young Concurrent Start | ~14 |
| Pause Full | 1 |
| Pause Remark | ~14 |
| Pause Cleanup | ~14 |
| Concurrent Mark Cycles | ~14 |
