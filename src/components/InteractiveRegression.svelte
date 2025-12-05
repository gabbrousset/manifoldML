<script lang="ts">
    import { fade } from "svelte/transition";

    interface Point {
        x: number;
        y: number;
        id: number;
    }

    let points = $state<Point[]>([
        { x: 10, y: 20, id: 1 },
        { x: 30, y: 40, id: 2 },
        { x: 50, y: 35, id: 3 },
        { x: 70, y: 80, id: 4 },
        { x: 90, y: 75, id: 5 },
    ]);

    let forceIntercept = $state(false);

    function calculateRegression(pts: Point[], forceZero: boolean) {
        const n = pts.length;
        if (n < 2) return { m: 0, b: 0 };

        if (forceZero) {
            // Formula for regression through origin: m = sum(xy) / sum(x^2)
            let sumXY = 0;
            let sumXX = 0;
            for (const p of pts) {
                sumXY += p.x * p.y;
                sumXX += p.x * p.x;
            }
            return { m: sumXY / sumXX, b: 0 };
        }

        let sumX = 0,
            sumY = 0,
            sumXY = 0,
            sumXX = 0;
        for (const p of pts) {
            sumX += p.x;
            sumY += p.y;
            sumXY += p.x * p.y;
            sumXX += p.x * p.x;
        }

        const denominator = n * sumXX - sumX * sumX;
        if (denominator === 0) return { m: 0, b: 0 };

        const m = (n * sumXY - sumX * sumY) / denominator;
        const b = (sumY - m * sumX) / n;

        return { m, b };
    }

    let { m, b } = $derived(calculateRegression(points, forceIntercept));

    // Cost calculation
    let cost = $derived(
        points.reduce((acc, p) => acc + Math.pow(p.y - (m * p.x + b), 2), 0) /
            (2 * points.length),
    );

    let container: HTMLDivElement;
    let width = $state(100);
    let height = $state(100);
    let draggingId = $state<number | null>(null);

    function toPx(x: number, y: number) {
        return {
            x: (x / 100) * width,
            y: height - (y / 100) * height,
        };
    }

    function onContainerClick(e: MouseEvent) {
        if (draggingId !== null) return;
        const rect = container.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = 100 - ((e.clientY - rect.top) / rect.height) * 100;
        points.push({ x, y, id: Date.now() });
    }

    function handleDragStart(e: MouseEvent, id: number) {
        e.stopPropagation();
        draggingId = id;

        const startX = e.clientX;
        const startY = e.clientY;
        let hasMoved = false;

        const onMove = (moveEvent: MouseEvent) => {
            if (!container) return;
            const dx = moveEvent.clientX - startX;
            const dy = moveEvent.clientY - startY;
            if (Math.abs(dx) > 3 || Math.abs(dy) > 3) hasMoved = true;

            const rect = container.getBoundingClientRect();
            let x = ((moveEvent.clientX - rect.left) / rect.width) * 100;
            let y = 100 - ((moveEvent.clientY - rect.top) / rect.height) * 100;

            x = Math.max(0, Math.min(100, x));
            y = Math.max(0, Math.min(100, y));

            points = points.map((p) => (p.id === id ? { ...p, x, y } : p));
        };

        const onUp = (upEvent: MouseEvent) => {
            draggingId = null;
            window.removeEventListener("mousemove", onMove);
            window.removeEventListener("mouseup", onUp);

            // If we didn't move significantly, treat as click to remove
            if (!hasMoved) {
                points = points.filter((p) => p.id !== id);
            }
        };

        window.addEventListener("mousemove", onMove);
        window.addEventListener("mouseup", onUp);
    }
</script>

<div
    class="w-full max-w-2xl mx-auto bg-white p-6 rounded-xl shadow-sm border border-slate-200"
>
    <h3 class="text-lg font-semibold mb-4">Interactive Demo</h3>

    <!-- Container -->
    <div
        bind:this={container}
        bind:clientWidth={width}
        bind:clientHeight={height}
        class="relative aspect-video bg-slate-50 rounded-lg border border-slate-200 overflow-hidden cursor-crosshair"
        onclick={onContainerClick}
        role="button"
        tabindex="0"
        onkeydown={(e) => {}}
    >
        <!-- Grid Lines -->
        <div
            class="absolute inset-0 grid grid-cols-10 grid-rows-10 pointer-events-none"
        >
            {#each Array(100) as _, i}
                <div
                    class="border-r border-b border-slate-200 opacity-50"
                ></div>
            {/each}
        </div>

        <!-- Regression Line -->
        <svg
            class="absolute inset-0 w-full h-full pointer-events-none"
            viewBox="0 0 {width} {height}"
        >
            <line
                x1={toPx(0, b).x}
                y1={toPx(0, b).y}
                x2={toPx(100, m * 100 + b).x}
                y2={toPx(100, m * 100 + b).y}
                stroke="#4f46e5"
                stroke-width="4"
                stroke-linecap="round"
            />
        </svg>

        <!-- Residuals -->
        {#each points as p (p.id)}
            {@const predictedY = m * p.x + b}
            {@const pt = toPx(p.x, p.y)}
            {@const predPt = toPx(p.x, predictedY)}

            <!-- Draw residual as SVG line for better control -->
            <svg
                class="absolute inset-0 w-full h-full pointer-events-none"
                viewBox="0 0 {width} {height}"
            >
                <line
                    x1={pt.x}
                    y1={pt.y}
                    x2={predPt.x}
                    y2={predPt.y}
                    stroke="#ef4444"
                    stroke-width="2"
                    stroke-dasharray="4 4"
                    opacity="0.5"
                />
            </svg>
        {/each}

        <!-- Points -->
        {#each points as p (p.id)}
            <button
                class="absolute w-4 h-4 bg-indigo-600 rounded-full shadow-md border-2 border-white cursor-pointer hover:scale-125 transition-transform z-10"
                style="
                    left: {p.x}%;
                    bottom: {p.y}%;
                    margin-left: -8px;
                    margin-bottom: -8px;
                "
                onmousedown={(e) => handleDragStart(e, p.id)}
                aria-label="Data point"
            ></button>
        {/each}
    </div>

    <div class="mt-4 flex justify-between items-center text-sm text-slate-600">
        <div class="flex items-center gap-4">
            <span>Click to add points.</span>
            <label
                class="flex items-center gap-2 cursor-pointer hover:text-slate-900"
            >
                <input
                    type="checkbox"
                    bind:checked={forceIntercept}
                    class="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span>Force Intercept = 0</span>
            </label>
        </div>
        <div class="flex gap-4">
            <div class="font-mono bg-slate-100 px-2 py-1 rounded text-xs">
                J(w) = {cost.toFixed(2)}
            </div>
            <div class="font-mono bg-slate-100 px-2 py-1 rounded text-xs">
                y = {m.toFixed(2)}x + {b.toFixed(2)}
            </div>
        </div>
    </div>
</div>
