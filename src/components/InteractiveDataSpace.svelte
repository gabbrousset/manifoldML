<script lang="ts">
    import DragHandle from "./DragHandle.svelte";
    import { onMount } from "svelte";
    import { polynomialRegression } from "../lib/math";

    interface Point {
        x: number;
        y: number;
        id: number;
    }

    let {
        points = $bindable([]),
        w = $bindable(0),
        b = $bindable(0),
        xDomain = [0, 10],
        yDomain = [0, 10],
        handleXs = [1, 9],
        children,
    } = $props();

    let container: HTMLDivElement;
    let isDraggingLine = false;
    let dragType: "handle-0" | "handle-1" | "translate" | null = null;
    let lastY = 0;
    let draggingPointId: number | null = null;
    let justFinishedDrag = false;

    // Auto-Fit Logic
    function autoFit() {
        if (points.length < 2) return;
        const coeffs = polynomialRegression(points, 1);
        const targetW = coeffs[1];
        const targetB = coeffs[0];

        const startW = w;
        const startB = b;
        const startTime = performance.now();
        const duration = 800;

        function animate(time: number) {
            const elapsed = time - startTime;
            const t = Math.min(elapsed / duration, 1);
            const ease = 1 - Math.pow(1 - t, 3); // Cubic out

            w = startW + (targetW - startW) * ease;
            b = startB + (targetB - startB) * ease;

            if (t < 1) requestAnimationFrame(animate);
        }
        requestAnimationFrame(animate);
    }

    // Helpers
    // We map domain to 0-100 SVG user units
    function toPx(xVal: number, yVal: number) {
        const x = ((xVal - xDomain[0]) / (xDomain[1] - xDomain[0])) * 100;
        const y = 100 - ((yVal - yDomain[0]) / (yDomain[1] - yDomain[0])) * 100;
        return { x, y };
    }

    function fromPx(clientX: number, clientY: number) {
        if (!container) return { x: 0, y: 0 };
        const rect = container.getBoundingClientRect();
        const xPct = (clientX - rect.left) / rect.width;
        const yPct = 1 - (clientY - rect.top) / rect.height;

        const x = xDomain[0] + xPct * (xDomain[1] - xDomain[0]);
        const y = yDomain[0] + yPct * (yDomain[1] - yDomain[0]);
        return { x, y };
    }

    // Interaction - Line
    function handleLineDragStart(
        e: MouseEvent,
        type: "handle-0" | "handle-1" | "translate",
    ) {
        e.stopPropagation();
        isDraggingLine = true;
        dragType = type;
        lastY = e.clientY;
        window.addEventListener("mousemove", handleLineDrag);
        window.addEventListener("mouseup", handleLineDragEnd);
    }

    function handleLineDrag(e: MouseEvent) {
        if (!isDraggingLine || !container) return;

        const mousePos = fromPx(e.clientX, e.clientY);

        if (dragType === "translate") {
            const rect = container.getBoundingClientRect();
            const deltaYPx = lastY - e.clientY; // Up is positive in pixel delta for our math?
            // Wait, clientY increases downwards. lastY - clientY > 0 means moved UP.
            // In data space, y increases upwards. So moving mouse UP should increase b.
            // deltaYData = (deltaYPx / heightPx) * heightData
            const heightData = yDomain[1] - yDomain[0];
            const deltaData = (deltaYPx / rect.height) * heightData;
            b += deltaData;
            lastY = e.clientY;
        } else if (dragType === "handle-0") {
            // Pivot around handle 1
            const x_pivot = handleXs[1];
            const y_pivot = w * x_pivot + b;
            const x_move = handleXs[0];

            // Mouse is at x_move roughly, but we use its Y
            // w = (y_mouse - y_pivot) / (x_move - x_pivot)
            w = (mousePos.y - y_pivot) / (x_move - x_pivot);
            b = y_pivot - w * x_pivot;
        } else if (dragType === "handle-1") {
            // Pivot around handle 0
            const x_pivot = handleXs[0];
            const y_pivot = w * x_pivot + b;
            const x_move = handleXs[1];

            w = (mousePos.y - y_pivot) / (x_move - x_pivot);
            b = y_pivot - w * x_pivot;
        }
    }

    function handleLineDragEnd() {
        isDraggingLine = false;
        dragType = null;
        justFinishedDrag = true;
        setTimeout(() => (justFinishedDrag = false), 50);
        window.removeEventListener("mousemove", handleLineDrag);
        window.removeEventListener("mouseup", handleLineDragEnd);
    }

    // Interaction - Points
    function onContainerClick(e: MouseEvent) {
        if (isDraggingLine || draggingPointId !== null || justFinishedDrag)
            return;

        const pos = fromPx(e.clientX, e.clientY);
        // Clamp
        const x = Math.max(xDomain[0], Math.min(xDomain[1], pos.x));
        const y = Math.max(yDomain[0], Math.min(yDomain[1], pos.y));

        points.push({ x, y, id: Date.now() });
        points = points;
    }

    function handlePointDragStart(e: MouseEvent, id: number) {
        e.stopPropagation();
        draggingPointId = id;

        const onMove = (moveEvent: MouseEvent) => {
            const pos = fromPx(moveEvent.clientX, moveEvent.clientY);
            const x = Math.max(xDomain[0], Math.min(xDomain[1], pos.x));
            const y = Math.max(yDomain[0], Math.min(yDomain[1], pos.y));

            points = points.map((p) => (p.id === id ? { ...p, x, y } : p));
        };

        const onUp = () => {
            draggingPointId = null;
            justFinishedDrag = true;
            setTimeout(() => (justFinishedDrag = false), 50);
            window.removeEventListener("mousemove", onMove);
            window.removeEventListener("mouseup", onUp);
        };

        window.addEventListener("mousemove", onMove);
        window.addEventListener("mouseup", onUp);
    }

    function handlePointContext(e: MouseEvent, id: number) {
        e.preventDefault();
        points = points.filter((p) => p.id !== id);
    }
</script>

<div
    bind:this={container}
    class="relative w-full h-full bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden cursor-crosshair select-none"
    onmousedown={onContainerClick}
    role="button"
    tabindex="0"
>
    <!-- Grid -->
    <div
        class="absolute inset-0 grid pointer-events-none opacity-20"
        style="grid-template-columns: repeat(6, 1fr); grid-template-rows: repeat(6, 1fr);"
    >
        {#each Array(36) as _}
            <div class="border-r border-b border-slate-400"></div>
        {/each}
    </div>

    <!-- SVG Layer -->
    <svg
        class="absolute inset-0 w-full h-full overflow-visible"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
    >
        <!-- Children (e.g. Gaussians) -->
        {@render children?.({ toPx })}

        <!-- Line Body -->
        <line
            x1={toPx(xDomain[0], w * xDomain[0] + b).x}
            y1={toPx(xDomain[0], w * xDomain[0] + b).y}
            x2={toPx(xDomain[1], w * xDomain[1] + b).x}
            y2={toPx(xDomain[1], w * xDomain[1] + b).y}
            stroke="#4f46e5"
            stroke-width="3"
            vector-effect="non-scaling-stroke"
            class="pointer-events-auto cursor-move hover:stroke-indigo-500 transition-colors"
            onmousedown={(e) => handleLineDragStart(e, "translate")}
            role="button"
            tabindex="0"
        />
    </svg>

    <!-- Handle 0 -->
    <DragHandle
        x={toPx(handleXs[0], w * handleXs[0] + b).x + "%"}
        y={toPx(handleXs[0], w * handleXs[0] + b).y + "%"}
        onmousedown={(e) => handleLineDragStart(e, "handle-0")}
    />

    <!-- Handle 1 -->
    <DragHandle
        x={toPx(handleXs[1], w * handleXs[1] + b).x + "%"}
        y={toPx(handleXs[1], w * handleXs[1] + b).y + "%"}
        onmousedown={(e) => handleLineDragStart(e, "handle-1")}
    />

    <!-- Points (DOM elements for easier interaction/styling?) 
         Actually, let's put points in SVG too for consistency with coordinates?
         Or keep as absolute divs.
         If we keep as absolute divs, we need to use % for left/top.
         toPx returns numbers 0-100. So we can just append "%".
    -->
    {#each points as p (p.id)}
        <button
            class="absolute w-3 h-3 bg-slate-900 rounded-full shadow-sm border border-white z-10 hover:scale-125 transition-transform cursor-pointer"
            style="left: {toPx(p.x, p.y).x}%; top: {toPx(p.x, p.y)
                .y}%; margin-left: -6px; margin-top: -6px;"
            onmousedown={(e) => handlePointDragStart(e, p.id)}
            oncontextmenu={(e) => handlePointContext(e, p.id)}
            aria-label="Data point"
        ></button>
    {/each}

    <div
        class="absolute top-2 left-2 text-xs text-slate-400 pointer-events-none"
    >
        Click to add points. Right-click to remove. <br />
        Drag line to move, handles to rotate.
    </div>
</div>

<!-- Controls outside the graph -->
<div class="flex justify-end mt-2">
    <button
        onclick={(e) => {
            e.stopPropagation();
            autoFit();
        }}
        onmousedown={(e) => e.stopPropagation()}
        class="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-medium rounded-md border border-indigo-200 transition-colors"
        title="Automatically fit line to points (Least Squares)"
    >
        Auto-Fit Line
    </button>
</div>
