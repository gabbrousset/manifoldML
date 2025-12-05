<script lang="ts">
    import { fade } from "svelte/transition";
    import { polynomialRegression } from "../lib/math";

    interface Point {
        x: number;
        y: number;
        id: number;
    }

    let points = $state<Point[]>([
        { x: 10, y: 80, id: 1 },
        { x: 30, y: 40, id: 2 },
        { x: 50, y: 20, id: 3 },
        { x: 70, y: 40, id: 4 },
        { x: 90, y: 80, id: 5 },
    ]);

    let degree = $state(1);
    let maxDegree = 10;

    let weights = $derived(polynomialRegression(points, degree));

    function evaluatePolynomial(w: number[], x: number): number {
        let y = 0;
        for (let i = 0; i < w.length; i++) {
            y += w[i] * Math.pow(x, i);
        }
        return y;
    }

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

    let pathData = $derived.by(() => {
        let d = "";
        // Iterate in pixel steps or data steps?
        // Data steps (0-100) is fine, but we need to map to pixels.
        for (let x = 0; x <= 100; x += 1) {
            const y = evaluatePolynomial(weights, x);
            const pt = toPx(x, y);

            if (x === 0) {
                d += `M ${pt.x} ${pt.y}`;
            } else {
                d += ` L ${pt.x} ${pt.y}`;
            }
        }
        return d;
    });

    // Cost calculation
    let cost = $derived(
        points.reduce(
            (acc, p) =>
                acc + Math.pow(p.y - evaluatePolynomial(weights, p.x), 2),
            0,
        ) /
            (2 * points.length),
    );

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
    <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-semibold">Polynomial Regression</h3>
        <div class="flex items-center space-x-2">
            <span class="text-sm text-slate-600">Degree: {degree}</span>
            <input
                type="range"
                min="1"
                max="10"
                bind:value={degree}
                class="w-24 accent-indigo-600"
            />
        </div>
    </div>

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

        <!-- Regression Curve -->
        <svg
            class="absolute inset-0 w-full h-full pointer-events-none"
            viewBox="0 0 {width} {height}"
        >
            <path
                d={pathData}
                fill="none"
                stroke="#4f46e5"
                stroke-width="4"
                stroke-linecap="round"
                stroke-linejoin="round"
            />
        </svg>

        <!-- Residuals -->
        {#each points as p (p.id)}
            {@const predictedY = evaluatePolynomial(weights, p.x)}
            {@const pt = toPx(p.x, p.y)}
            {@const predPt = toPx(p.x, predictedY)}

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
        <div>Click to add points, click point to remove.</div>
        <div class="font-mono bg-slate-100 px-2 py-1 rounded text-xs">
            J(w) = {cost.toFixed(2)}
        </div>
    </div>
</div>
