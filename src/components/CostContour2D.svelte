<script lang="ts">
    import { onMount } from "svelte";
    import MathBlock from "./MathBlock.svelte";

    // Data State
    interface Point {
        x: number;
        y: number;
        id: number;
    }

    let data = $state<Point[]>([
        { x: 1, y: 2, id: 1 },
        { x: 2, y: 3, id: 2 },
        { x: 3, y: 5, id: 3 },
        { x: 4, y: 4, id: 4 },
        { x: 5, y: 6, id: 5 },
    ]);

    // Weight Range
    const w0_min = -2,
        w0_max = 6;
    const w1_min = -2,
        w1_max = 4;

    // Current Weights
    let w0 = $state(0);
    let w1 = $state(1);

    // Canvas & Dimensions
    let canvas: HTMLCanvasElement;
    let width = 300;
    let height = 300;
    let dpr = 1;

    // Data Space Dimensions
    let dataContainer: HTMLDivElement;
    let dataWidth = $state(100);
    let dataHeight = $state(100);

    // Interaction State
    let isDraggingWeights = false;
    let isDraggingLine = false;
    let dragType: "translate" | "rotate" | null = null;
    let lastY = 0;
    let draggingPointId = $state<number | null>(null);

    // Derived Cost
    let currentCost = $derived.by(() => {
        return computeCost(w0, w1);
    });

    // Optimal Weights (OLS)
    let optimalWeights = $derived.by(() => {
        const n = data.length;
        if (n < 2) return { w0: 0, w1: 0 };
        let sumX = 0,
            sumY = 0,
            sumXY = 0,
            sumXX = 0;
        for (const p of data) {
            sumX += p.x;
            sumY += p.y;
            sumXY += p.x * p.y;
            sumXX += p.x * p.x;
        }
        const denom = n * sumXX - sumX * sumX;
        if (denom === 0) return { w0: 0, w1: 0 };
        const m = (n * sumXY - sumX * sumY) / denom;
        const b = (sumY - m * sumX) / n;
        return { w0: b, w1: m };
    });

    function computeCost(b: number, m: number) {
        if (data.length === 0) return 0;
        let sum = 0;
        for (const p of data) {
            sum += Math.pow(p.y - (m * p.x + b), 2);
        }
        return sum / (2 * data.length);
    }

    function draw() {
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Handle High DPI
        const rect = canvas.getBoundingClientRect();
        if (
            canvas.width !== rect.width * dpr ||
            canvas.height !== rect.height * dpr
        ) {
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
        }

        const w = canvas.width;
        const h = canvas.height;
        const imgData = ctx.createImageData(w, h);
        const pixels = imgData.data;

        // Find min/max cost for normalization
        // We scan a coarse grid to find approx min/max for scaling
        let minC = Infinity;
        let maxC = -Infinity;

        // Use optimal cost as anchor for min
        const optC = computeCost(optimalWeights.w0, optimalWeights.w1);
        minC = optC;

        // Sample corners for max
        const corners = [
            computeCost(w0_min, w1_min),
            computeCost(w0_min, w1_max),
            computeCost(w0_max, w1_min),
            computeCost(w0_max, w1_max),
        ];
        maxC = Math.max(...corners);

        for (let py = 0; py < h; py++) {
            for (let px = 0; px < w; px++) {
                const cw0 = w0_min + (px / w) * (w0_max - w0_min);
                const cw1 = w1_max - (py / h) * (w1_max - w1_min);

                const c = computeCost(cw0, cw1);

                // Log scale for better visualization of the bowl
                // Normalized 0..1
                let t =
                    (Math.log(c + 1) - Math.log(minC + 1)) /
                    (Math.log(maxC + 1) - Math.log(minC + 1));
                t = Math.max(0, Math.min(1, t));

                // Color Gradient: White -> Indigo -> Slate
                // 0.0 -> 0.5 -> 1.0
                let r, g, b;
                if (t < 0.5) {
                    // White (255, 255, 255) to Indigo-500 (99, 102, 241)
                    const localT = t * 2;
                    r = 255 + (99 - 255) * localT;
                    g = 255 + (102 - 255) * localT;
                    b = 255 + (241 - 255) * localT;
                } else {
                    // Indigo-500 (99, 102, 241) to Slate-900 (15, 23, 42)
                    const localT = (t - 0.5) * 2;
                    r = 99 + (15 - 99) * localT;
                    g = 102 + (23 - 102) * localT;
                    b = 241 + (42 - 241) * localT;
                }

                const i = (py * w + px) * 4;
                pixels[i] = r;
                pixels[i + 1] = g;
                pixels[i + 2] = b;
                pixels[i + 3] = 255;
            }
        }
        ctx.putImageData(imgData, 0, 0);

        // Draw optimal point
        drawPoint(
            ctx,
            optimalWeights.w0,
            optimalWeights.w1,
            "#ffffff",
            6 * dpr,
            true,
        );
        // Draw current point
        drawPoint(ctx, w0, w1, "#fbbf24", 8 * dpr, false); // Amber-400
    }

    function drawPoint(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        color: string,
        r: number,
        isHollow: boolean,
    ) {
        const w = canvas.width;
        const h = canvas.height;
        const px = ((x - w0_min) / (w0_max - w0_min)) * w;
        const py = h - ((y - w1_min) / (w1_max - w1_min)) * h;

        ctx.beginPath();
        ctx.arc(px, py, r, 0, Math.PI * 2);
        if (isHollow) {
            ctx.strokeStyle = color;
            ctx.lineWidth = 3 * dpr;
            ctx.stroke();
        } else {
            ctx.fillStyle = color;
            ctx.fill();
            ctx.strokeStyle = "white";
            ctx.lineWidth = 3 * dpr;
            ctx.stroke();
        }
    }

    // Weight Space Interaction
    function handleWeightMouseDown(e: MouseEvent) {
        isDraggingWeights = true;
        updateWeightsFromMouse(e);
    }
    function handleWeightMouseMove(e: MouseEvent) {
        if (!isDraggingWeights) return;
        updateWeightsFromMouse(e);
    }
    function handleWeightMouseUp() {
        isDraggingWeights = false;
    }
    function updateWeightsFromMouse(e: MouseEvent) {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        w0 = w0_min + (x / rect.width) * (w0_max - w0_min);
        w1 = w1_max - (y / rect.height) * (w1_max - w1_min);
    }

    // Data Space Interaction (Line Dragging)
    // Similar to GaussianLikelihood logic
    function handleLineDragStart(e: MouseEvent, type: "translate") {
        e.stopPropagation();
        isDraggingLine = true;
        dragType = type;
        lastY = e.clientY;
        window.addEventListener("mousemove", handleLineDrag);
        window.addEventListener("mouseup", handleLineDragEnd);
    }

    function handleLineDrag(e: MouseEvent) {
        if (!isDraggingLine || !dataContainer) return;
        const rect = dataContainer.getBoundingClientRect();

        if (dragType === "translate") {
            const deltaY = lastY - e.clientY; // Pixel delta
            // Convert pixel delta to data delta (y range is 0-8)
            const dataDelta = (deltaY / rect.height) * 8;
            w0 += dataDelta;
            lastY = e.clientY;
        }
    }

    function handleLineDragEnd() {
        isDraggingLine = false;
        dragType = null;
        window.removeEventListener("mousemove", handleLineDrag);
        window.removeEventListener("mouseup", handleLineDragEnd);
    }

    // Data Space Interaction (Points)
    function handlePointDragStart(e: MouseEvent, id: number) {
        e.stopPropagation();
        draggingPointId = id;
        const startX = e.clientX;
        const startY = e.clientY;
        let hasMoved = false;

        const onMove = (moveEvent: MouseEvent) => {
            if (!dataContainer) return;
            const dx = moveEvent.clientX - startX;
            const dy = moveEvent.clientY - startY;
            if (Math.abs(dx) > 3 || Math.abs(dy) > 3) hasMoved = true;

            const rect = dataContainer.getBoundingClientRect();
            let x = ((moveEvent.clientX - rect.left) / rect.width) * 6;
            let y = 8 - ((moveEvent.clientY - rect.top) / rect.height) * 8;

            x = Math.max(0, Math.min(6, x));
            y = Math.max(0, Math.min(8, y));

            data = data.map((p) => (p.id === id ? { ...p, x, y } : p));
        };

        const onUp = () => {
            draggingPointId = null;
            if (!hasMoved) {
                data = data.filter((p) => p.id !== id);
            }
            window.removeEventListener("mousemove", onMove);
            window.removeEventListener("mouseup", onUp);
        };

        window.addEventListener("mousemove", onMove);
        window.addEventListener("mouseup", onUp);
    }

    function onDataContainerClick(e: MouseEvent) {
        if (isDraggingLine || draggingPointId !== null) return;
        const rect = dataContainer.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 6;
        const y = 8 - ((e.clientY - rect.top) / rect.height) * 8;
        data.push({ x, y, id: Date.now() });
    }

    $effect(() => {
        // Redraw when weights or data change
        // We need to depend on data to redraw the contour
        // Just accessing data.length or similar ensures dependency
        const _ = data;
        const __ = w0;
        const ___ = w1;
        draw();
    });

    onMount(() => {
        dpr = window.devicePixelRatio || 1;
        draw();
    });
</script>

<div
    class="grid grid-cols-1 md:grid-cols-2 gap-8 bg-slate-50 p-6 rounded-xl border border-slate-200"
>
    <!-- Contour Plot -->
    <div class="space-y-2">
        <h4 class="text-sm font-medium text-slate-900 text-center">
            Weight Space (<MathBlock math="w_0, w_1" />)
        </h4>
        <div
            class="relative aspect-square bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden cursor-move"
        >
            <canvas
                bind:this={canvas}
                class="w-full h-full"
                onmousedown={handleWeightMouseDown}
                onmousemove={handleWeightMouseMove}
                onmouseup={handleWeightMouseUp}
                onmouseleave={handleWeightMouseUp}
            ></canvas>
            <div
                class="absolute bottom-2 left-2 text-xs bg-white/90 px-2 py-1 rounded pointer-events-none shadow-sm border border-slate-100 font-mono text-slate-600"
            >
                Cost: {currentCost.toFixed(2)}
            </div>
        </div>
        <p class="text-xs text-slate-500 text-center">
            Drag the <span class="font-bold text-amber-500">amber dot</span> to
            explore. <br />
            White ring = Optimal solution.
        </p>
    </div>

    <!-- Data Space Preview -->
    <div class="space-y-2">
        <h4 class="text-sm font-medium text-slate-900 text-center">
            Data Space (<MathBlock math="x, y" />)
        </h4>
        <div
            bind:this={dataContainer}
            bind:clientWidth={dataWidth}
            bind:clientHeight={dataHeight}
            class="relative aspect-square bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden cursor-crosshair"
            onclick={onDataContainerClick}
            role="button"
            tabindex="0"
            onkeydown={() => {}}
        >
            <!-- Grid -->
            <div
                class="absolute inset-0 grid grid-cols-6 grid-rows-6 pointer-events-none opacity-20"
            >
                {#each Array(36) as _}
                    <div class="border-r border-b border-slate-400"></div>
                {/each}
            </div>

            <!-- Points -->
            {#each data as p (p.id)}
                <button
                    class="absolute w-4 h-4 bg-red-500 rounded-full shadow-sm border-2 border-white cursor-pointer hover:scale-110 transition-transform z-10"
                    style="left: {(p.x / 6) * 100}%; bottom: {(p.y / 8) *
                        100}%; transform: translate(-50%, 50%);"
                    onmousedown={(e) => handlePointDragStart(e, p.id)}
                    aria-label="Data point"
                ></button>
            {/each}

            <!-- Line -->
            <svg
                class="absolute inset-0 w-full h-full pointer-events-none overflow-visible"
            >
                <!-- x goes 0 to 6, y goes 0 to 8 -->
                <line
                    role="button"
                    tabindex="0"
                    x1="0%"
                    y1={100 - ((w0 + w1 * 0) / 8) * 100 + "%"}
                    x2="100%"
                    y2={100 - ((w0 + w1 * 6) / 8) * 100 + "%"}
                    stroke="#4f46e5"
                    stroke-width="4"
                    class="pointer-events-auto cursor-move hover:stroke-indigo-500 transition-colors"
                    onmousedown={(e) => handleLineDragStart(e, "translate")}
                    onkeydown={() => {}}
                />
            </svg>
        </div>
        <p class="text-xs text-slate-500 text-center">
            Drag the line to adjust <MathBlock math="w_0" />. Click to add
            points.
        </p>
    </div>
</div>
