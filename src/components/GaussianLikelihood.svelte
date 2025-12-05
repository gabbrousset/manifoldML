<script lang="ts">
    import { fade } from "svelte/transition";
    import MathBlock from "./MathBlock.svelte";
    import { polynomialRegression } from "../lib/math";

    interface Point {
        x: number;
        y: number;
        id: number;
    }

    let points = $state<Point[]>([
        { x: 15, y: 20, id: 1 },
        { x: 35, y: 45, id: 2 },
        { x: 55, y: 40, id: 3 },
        { x: 75, y: 70, id: 4 },
        { x: 90, y: 85, id: 5 },
    ]);

    // Manual line control
    let m = $state(0.8);
    let b = $state(10);
    let showBestFit = $state(false);

    // Best fit calculation (MLE for Gaussian noise is OLS)
    let bestFitParams = $derived(polynomialRegression(points, 1)); // returns [b, m]
    let bestB = $derived(bestFitParams[0]);
    let bestM = $derived(bestFitParams[1]);

    let container: HTMLDivElement;
    let width = $state(100);
    let height = $state(100);

    let isDraggingLine = false;
    let dragType: "rotate" | "translate" | null = null;
    let lastY = 0;
    let draggingPointId = $state<number | null>(null);

    function gaussian(x: number, mu: number, sigma: number): number {
        return (
            (1 / (sigma * Math.sqrt(2 * Math.PI))) *
            Math.exp(-0.5 * Math.pow((x - mu) / sigma, 2))
        );
    }

    const SIGMA = 15;

    function handleLineDragStart(e: MouseEvent, type: "rotate" | "translate") {
        e.stopPropagation();
        isDraggingLine = true;
        dragType = type;
        lastY = e.clientY;

        window.addEventListener("mousemove", handleLineDrag);
        window.addEventListener("mouseup", handleLineDragEnd);
    }

    function handleLineDrag(e: MouseEvent) {
        if (!isDraggingLine) return;

        const deltaY = lastY - e.clientY; // Positive = up
        lastY = e.clientY;

        // Sensitivity
        const sensitivity = 0.5;

        if (dragType === "translate") {
            b += deltaY * sensitivity * 0.2;
        } else if (dragType === "rotate") {
            m += deltaY * sensitivity * 0.005;
        }
    }

    let justFinishedDrag = false;

    function handleLineDragEnd() {
        isDraggingLine = false;
        dragType = null;
        justFinishedDrag = true;
        setTimeout(() => (justFinishedDrag = false), 50);
        window.removeEventListener("mousemove", handleLineDrag);
        window.removeEventListener("mouseup", handleLineDragEnd);
    }

    // Point Dragging Logic
    function handlePointDragStart(e: MouseEvent, id: number) {
        e.stopPropagation();
        draggingPointId = id;

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
            draggingPointId = null;
            if (hasMoved) {
                justFinishedDrag = true;
                setTimeout(() => (justFinishedDrag = false), 50);
            }
            window.removeEventListener("mousemove", onMove);
            window.removeEventListener("mouseup", onUp);

            if (!hasMoved) {
                points = points.filter((p) => p.id !== id);
            }
        };

        window.addEventListener("mousemove", onMove);
        window.addEventListener("mouseup", onUp);
    }

    function onContainerClick(e: MouseEvent) {
        if (isDraggingLine || draggingPointId !== null || justFinishedDrag)
            return;
        // Don't add point if clicking on line handles (handled by stopPropagation, but good to be safe)

        const rect = container.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = 100 - ((e.clientY - rect.top) / rect.height) * 100;
        points.push({ x, y, id: Date.now() });
    }

    // Helper to map data coordinates (0-100) to pixels
    function toPx(x: number, y: number) {
        return {
            x: (x / 100) * width,
            y: height - (y / 100) * height,
        };
    }
</script>

<div
    class="w-full max-w-2xl mx-auto bg-white p-6 rounded-xl shadow-sm border border-slate-200"
>
    <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-semibold">Visualizing Likelihood</h3>
        <div class="flex items-center space-x-2">
            <label
                class="flex items-center space-x-2 text-sm text-slate-600 cursor-pointer select-none"
            >
                <input
                    type="checkbox"
                    bind:checked={showBestFit}
                    class="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span>Show Best Fit (MLE)</span>
            </label>
        </div>
    </div>

    <p class="text-sm text-slate-600 mb-4">
        Drag the <span class="text-indigo-600 font-bold">blue line</span> to
        move it, or the <span class="text-indigo-600 font-bold">handles</span>
        to rotate. The
        <span class="text-emerald-600 font-bold">green curves</span> show the
        probability distribution of <MathBlock math="y" /> given <MathBlock
            math="x"
        />. Notice how the likelihood (the height of the curve at the dot) is
        maximized when the line passes close to the point. Click background to
        add points, click points to remove.
    </p>

    <!-- Container -->
    <div
        bind:this={container}
        bind:clientWidth={width}
        bind:clientHeight={height}
        class="relative aspect-video bg-slate-50 rounded-lg border border-slate-200 overflow-hidden select-none cursor-crosshair"
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

        <!-- SVG Layer -->
        <svg
            class="absolute inset-0 w-full h-full pointer-events-none overflow-visible"
            viewBox="0 0 {width} {height}"
        >
            <!-- Best Fit Line -->
            {#if showBestFit}
                <line
                    x1={toPx(0, bestB).x}
                    y1={toPx(0, bestB).y}
                    x2={toPx(100, bestM * 100 + bestB).x}
                    y2={toPx(100, bestM * 100 + bestB).y}
                    stroke="#10b981"
                    stroke-width="3"
                    stroke-dasharray="6 4"
                    stroke-linecap="round"
                    opacity="0.7"
                />
            {/if}

            <!-- Regression Line -->
            <line
                role="button"
                tabindex="0"
                x1={toPx(0, b).x}
                y1={toPx(0, b).y}
                x2={toPx(100, m * 100 + b).x}
                y2={toPx(100, m * 100 + b).y}
                stroke="#4f46e5"
                stroke-width="4"
                stroke-linecap="round"
                class="pointer-events-auto cursor-move hover:stroke-indigo-500 transition-colors"
                onmousedown={(e) => handleLineDragStart(e, "translate")}
                onkeydown={(e) => {}}
            />

            <!-- Rotation Handles -->
            <circle
                role="button"
                tabindex="0"
                cx={toPx(5, m * 5 + b).x}
                cy={toPx(5, m * 5 + b).y}
                r="6"
                fill="transparent"
                class="pointer-events-auto cursor-ns-resize"
                onmousedown={(e) => handleLineDragStart(e, "rotate")}
                onkeydown={(e) => {}}
            />
            <circle
                role="button"
                tabindex="0"
                cx={toPx(95, m * 95 + b).x}
                cy={toPx(95, m * 95 + b).y}
                r="6"
                fill="transparent"
                class="pointer-events-auto cursor-ns-resize"
                onmousedown={(e) => handleLineDragStart(e, "rotate")}
                onkeydown={(e) => {}}
            />

            <!-- Gaussians -->
            {#each points as p}
                {@const predictedY = m * p.x + b}
                {@const center = toPx(p.x, predictedY)}

                <!-- 
                   Draw bell curve vertically centered at 'center'.
                   The 'height' of the bell curve extends horizontally.
                   We iterate 'y' in data space, convert to pixels, and calculate x-offset in pixels.
                -->

                <!-- Right side -->
                <path
                    d={(() => {
                        let d = "";
                        for (let yOffset = -30; yOffset <= 30; yOffset += 1) {
                            const yVal = predictedY + yOffset;
                            const pdf = gaussian(yVal, predictedY, 10);
                            const xOffsetPx = pdf * 1000;
                            const pt = toPx(p.x, yVal);
                            if (yOffset === -30) d = `M ${pt.x} ${pt.y}`;
                            else d += ` L ${pt.x + xOffsetPx} ${pt.y}`;
                        }
                        return d;
                    })()}
                    fill="none"
                    stroke="#10b981"
                    stroke-width="1.5"
                    opacity="0.6"
                />
                <!-- Left side -->
                <path
                    d={(() => {
                        let d = "";
                        for (let yOffset = -30; yOffset <= 30; yOffset += 1) {
                            const yVal = predictedY + yOffset;
                            const pdf = gaussian(yVal, predictedY, 10);
                            const xOffsetPx = pdf * 1000;
                            const pt = toPx(p.x, yVal);
                            if (yOffset === -30) d = `M ${pt.x} ${pt.y}`;
                            else d += ` L ${pt.x - xOffsetPx} ${pt.y}`;
                        }
                        return d;
                    })()}
                    fill="none"
                    stroke="#10b981"
                    stroke-width="1.5"
                    opacity="0.6"
                />

                <!-- Likelihood Bar -->
                {@const likelihood = gaussian(p.y, predictedY, 10)}
                {@const barLen = likelihood * 1000}
                {@const ptData = toPx(p.x, p.y)}

                <line
                    x1={ptData.x - barLen}
                    y1={ptData.y}
                    x2={ptData.x + barLen}
                    y2={ptData.y}
                    stroke="#059669"
                    stroke-width="2"
                />
            {/each}
        </svg>

        <!-- Points -->
        {#each points as p (p.id)}
            <button
                class="absolute w-3 h-3 bg-slate-900 rounded-full shadow-sm border border-white z-10 hover:scale-125 transition-transform cursor-pointer"
                style="
                    left: {p.x}%;
                    bottom: {p.y}%;
                    margin-left: -6px;
                    margin-bottom: -6px;
                "
                onmousedown={(e) => handlePointDragStart(e, p.id)}
                aria-label="Data point"
            ></button>
        {/each}
    </div>
</div>
