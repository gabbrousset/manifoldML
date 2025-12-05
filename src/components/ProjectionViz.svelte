<script lang="ts">
    import { onMount } from "svelte";
    import MathBlock from "./MathBlock.svelte";

    // 2D Projection Visualization
    // We show a subspace (line through origin) and a target vector y.
    // We project y onto the line to get y_hat.

    // State
    let angle = $state(-30); // Angle of the subspace line (degrees)
    let yVec = $state({ x: 150, y: -100 }); // Target vector relative to origin

    let isDraggingY = false;
    let isDraggingLine = false;

    // Canvas/SVG center
    const cx = 200;
    const cy = 200;

    // Derived vectors
    // Subspace unit vector u
    let rad = $derived((angle * Math.PI) / 180);
    let u = $derived({ x: Math.cos(rad), y: Math.sin(rad) });

    // Projection of y onto u: proj = (y . u) * u
    let dot = $derived(yVec.x * u.x + yVec.y * u.y);
    let yHat = $derived({ x: dot * u.x, y: dot * u.y });

    // Residual e = y - yHat
    let eVec = $derived({ x: yVec.x - yHat.x, y: yVec.y - yHat.y });

    // Interaction
    function handleMouseDownY(e: MouseEvent) {
        e.stopPropagation();
        isDraggingY = true;
        window.addEventListener("mousemove", handleMouseMoveY);
        window.addEventListener("mouseup", handleMouseUpY);
    }

    function handleMouseMoveY(e: MouseEvent) {
        if (!isDraggingY) return;
        // Update yVec relative to center
        // We need to get mouse pos relative to SVG
        // Simplified: assume SVG is roughly at mouse pos or use movement
        // Better: use movementX/Y
        yVec.x += e.movementX;
        yVec.y += e.movementY;
    }

    function handleMouseUpY() {
        isDraggingY = false;
        window.removeEventListener("mousemove", handleMouseMoveY);
        window.removeEventListener("mouseup", handleMouseUpY);
    }

    // Rotate Line
    function handleMouseDownLine(e: MouseEvent) {
        e.stopPropagation();
        isDraggingLine = true;
        window.addEventListener("mousemove", handleMouseMoveLine);
        window.addEventListener("mouseup", handleMouseUpLine);
    }

    function handleMouseMoveLine(e: MouseEvent) {
        if (!isDraggingLine) return;
        angle += e.movementY * 0.5; // Drag up/down to rotate
    }

    function handleMouseUpLine() {
        isDraggingLine = false;
        window.removeEventListener("mousemove", handleMouseMoveLine);
        window.removeEventListener("mouseup", handleMouseUpLine);
    }
</script>

<div class="bg-slate-50 p-6 rounded-xl border border-slate-200">
    <div
        class="relative h-[400px] bg-white rounded-lg border border-slate-200 overflow-hidden"
    >
        <svg class="w-full h-full pointer-events-auto">
            <defs>
                <marker
                    id="arrow-slate"
                    markerWidth="10"
                    markerHeight="10"
                    refX="9"
                    refY="3"
                    orient="auto"
                    markerUnits="strokeWidth"
                >
                    <path d="M0,0 L0,6 L9,3 z" fill="#64748b" />
                </marker>
                <marker
                    id="arrow-indigo"
                    markerWidth="10"
                    markerHeight="10"
                    refX="9"
                    refY="3"
                    orient="auto"
                    markerUnits="strokeWidth"
                >
                    <path d="M0,0 L0,6 L9,3 z" fill="#4f46e5" />
                </marker>
                <marker
                    id="arrow-red"
                    markerWidth="10"
                    markerHeight="10"
                    refX="9"
                    refY="3"
                    orient="auto"
                    markerUnits="strokeWidth"
                >
                    <path d="M0,0 L0,6 L9,3 z" fill="#ef4444" />
                </marker>
                <marker
                    id="arrow-black"
                    markerWidth="10"
                    markerHeight="10"
                    refX="9"
                    refY="3"
                    orient="auto"
                    markerUnits="strokeWidth"
                >
                    <path d="M0,0 L0,6 L9,3 z" fill="#0f172a" />
                </marker>
            </defs>

            <!-- Grid/Axes -->
            <line
                x1="0"
                y1={cy}
                x2="400"
                y2={cy}
                stroke="#e2e8f0"
                stroke-width="1"
            />
            <line
                x1={cx}
                y1="0"
                x2={cx}
                y2="400"
                stroke="#e2e8f0"
                stroke-width="1"
            />

            <!-- Subspace Line (Col Space) -->
            <!-- Draw a long line through origin along angle -->
            <line
                role="button"
                tabindex="0"
                x1={cx - u.x * 300}
                y1={cy - u.y * 300}
                x2={cx + u.x * 300}
                y2={cy + u.y * 300}
                stroke="#94a3b8"
                stroke-width="2"
                stroke-dasharray="5 5"
                class="cursor-ns-resize hover:stroke-slate-600"
                onmousedown={handleMouseDownLine}
                onkeydown={() => {}}
            />
            <text
                x={cx + u.x * 180}
                y={cy + u.y * 180}
                dy="-10"
                class="text-xs fill-slate-500 font-mono select-none"
                >Col(X)</text
            >

            <!-- Origin -->
            <circle {cx} {cy} r="3" fill="#64748b" />

            <!-- Projection yHat -->
            <line
                x1={cx}
                y1={cy}
                x2={cx + yHat.x}
                y2={cy + yHat.y}
                stroke="#4f46e5"
                stroke-width="4"
                marker-end="url(#arrow-indigo)"
            />
            <text
                x={cx + yHat.x / 2}
                y={cy + yHat.y / 2}
                dy="20"
                dx="10"
                class="text-sm font-bold fill-indigo-600 select-none">ŷ</text
            >

            <!-- Residual e -->
            <line
                x1={cx + yHat.x}
                y1={cy + yHat.y}
                x2={cx + yVec.x}
                y2={cy + yVec.y}
                stroke="#ef4444"
                stroke-width="2"
                stroke-dasharray="4 4"
            />
            <text
                x={cx + yHat.x + eVec.x / 2 + 10}
                y={cy + yHat.y + eVec.y / 2}
                class="text-xs font-bold fill-red-500 select-none">e</text
            >

            <!-- Right Angle Marker -->
            <!-- We need a small square at yHat aligned with u and e -->
            <!-- Too complex to draw perfectly in SVG without math, let's skip or approximate -->

            <!-- Target Vector y -->
            <line
                role="button"
                tabindex="0"
                x1={cx}
                y1={cy}
                x2={cx + yVec.x}
                y2={cy + yVec.y}
                stroke="#0f172a"
                stroke-width="3"
                marker-end="url(#arrow-black)"
                class="cursor-move hover:stroke-slate-700"
                onmousedown={handleMouseDownY}
                onkeydown={() => {}}
            />
            <circle
                role="button"
                tabindex="0"
                cx={cx + yVec.x}
                cy={cy + yVec.y}
                r="8"
                fill="transparent"
                class="cursor-move"
                onmousedown={handleMouseDownY}
                onkeydown={() => {}}
            />
            <text
                x={cx + yVec.x}
                y={cy + yVec.y}
                dy="-15"
                class="text-sm font-bold fill-slate-900 select-none">y</text
            >
        </svg>

        <div
            class="absolute bottom-2 left-2 text-xs text-slate-400 pointer-events-none"
        >
            Drag <strong>y</strong> (black) or the <strong>dashed line</strong>
        </div>
    </div>

    <div class="mt-4 text-center text-sm text-slate-600">
        <p>
            <MathBlock math={String.raw`\hat{y}`} /> (indigo) is the shadow of <MathBlock
                math="y"
            /> (black) on the line.
            <br />
            The error <MathBlock math="e" /> (red) is shortest when it is
            <strong>perpendicular</strong> (orthogonal) to the line.
        </p>
    </div>
</div>
