<script lang="ts">
    import { onMount } from "svelte";
    import { fade } from "svelte/transition";
    import MathBlock from "./MathBlock.svelte";

    // 2D Projection Visualization
    // We show a subspace (line through origin) and a target vector y.
    // We project y onto the line to get y_hat.

    // State
    let angle = $state(0); // Angle of the subspace line (degrees)
    let yVec = $state({ x: 100, y: -120 }); // Target vector relative to origin
    let p = $state(2); // Error norm (1, 2, 3)

    let isDraggingY = false;
    let isDraggingLine = false;

    // Canvas/SVG dimensions
    let width = $state(400); // Default, updates via binding
    const height = 400;

    let cx = $derived(width / 2);
    let cy = height / 2;

    // Line length for drawing
    let lineLen = $derived(Math.max(width, height));

    // Derived vectors
    // Subspace unit vector u
    let rad = $derived((angle * Math.PI) / 180);
    let u = $derived({ x: Math.cos(rad), y: Math.sin(rad) });

    // Optimal t calculation based on p
    function getOptimalT(
        y: { x: number; y: number },
        u: { x: number; y: number },
        pVal: number,
    ) {
        if (Math.abs(u.x) < 1e-6 && Math.abs(u.y) < 1e-6) return 0;

        if (pVal === 2) {
            // L2: Orthogonal projection
            return y.x * u.x + y.y * u.y;
        } else if (pVal === 1) {
            // L1: Median (Weighted)
            // Candidates are intersections with axes: t = yx/ux, t = yy/uy
            const candidates = [];
            if (Math.abs(u.x) > 1e-6) candidates.push(y.x / u.x);
            if (Math.abs(u.y) > 1e-6) candidates.push(y.y / u.y);

            if (candidates.length === 0) return 0;

            // Find candidate that minimizes sum of absolute errors
            let bestT = candidates[0];
            let minErr = Infinity;

            for (const t of candidates) {
                const err = Math.abs(y.x - t * u.x) + Math.abs(y.y - t * u.y);
                if (err < minErr) {
                    minErr = err;
                    bestT = t;
                }
            }
            return bestT;
        } else {
            // L3: Numerical optimization (Golden Section Search)
            // f(t) = |yx - t*ux|^3 + |yy - t*uy|^3
            const f = (t: number) =>
                Math.pow(Math.abs(y.x - t * u.x), 3) +
                Math.pow(Math.abs(y.y - t * u.y), 3);

            // Bracket: L2 solution is a good starting point guess
            const t2 = y.x * u.x + y.y * u.y;
            let a = t2 - 200;
            let b = t2 + 200;

            const gr = (Math.sqrt(5) + 1) / 2;
            let c = b - (b - a) / gr;
            let d = a + (b - a) / gr;

            for (let i = 0; i < 20; i++) {
                if (f(c) < f(d)) {
                    b = d;
                    d = c;
                    c = b - (b - a) / gr;
                } else {
                    a = c;
                    c = d;
                    d = a + (b - a) / gr;
                }
            }
            return (b + a) / 2;
        }
    }

    let t_opt = $derived(getOptimalT(yVec, u, p));
    let yHat = $derived({ x: t_opt * u.x, y: t_opt * u.y });

    // Residual e = y - yHat
    let eVec = $derived({ x: yVec.x - yHat.x, y: yVec.y - yHat.y });

    // Error Radius for Visualization
    let errorDist = $derived(
        p === 1
            ? Math.abs(eVec.x) + Math.abs(eVec.y)
            : p === 2
              ? Math.sqrt(eVec.x ** 2 + eVec.y ** 2)
              : Math.pow(Math.abs(eVec.x) ** 3 + Math.abs(eVec.y) ** 3, 1 / 3),
    );

    // Generate path for the Unit Ball scaled by errorDist
    function getContourPath(r: number, pVal: number) {
        if (r < 1) return "";

        if (pVal === 2) {
            // Circle
            return `M ${r},0 A ${r},${r} 0 1,1 -${r},0 A ${r},${r} 0 1,1 ${r},0`;
        } else if (pVal === 1) {
            // Diamond
            return `M ${r},0 L 0,${r} L -${r},0 L 0,-${r} Z`;
        } else {
            // L3 Squircle (sampled)
            let d = "";
            const steps = 60;
            for (let i = 0; i <= steps; i++) {
                const theta = (i / steps) * 2 * Math.PI;
                const c = Math.cos(theta);
                const s = Math.sin(theta);
                const x = r * Math.sign(c) * Math.pow(Math.abs(c), 2 / pVal);
                const y = r * Math.sign(s) * Math.pow(Math.abs(s), 2 / pVal);
                d += (i === 0 ? "M " : "L ") + `${x},${y} `;
            }
            return d + "Z";
        }
    }

    let contourPath = $derived(getContourPath(errorDist, p));

    // Interaction
    function handleMouseDownY(e: MouseEvent) {
        e.stopPropagation();
        isDraggingY = true;
        window.addEventListener("mousemove", handleMouseMoveY);
        window.addEventListener("mouseup", handleMouseUpY);
    }

    function handleMouseMoveY(e: MouseEvent) {
        if (!isDraggingY) return;
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

    // Progressive Disclosure State
    let showAdvanced = $state(false);

    function toggleAdvanced() {
        showAdvanced = !showAdvanced;
        if (!showAdvanced) {
            p = 2; // Reset to L2 when closing advanced mode
        }
    }
</script>

<div class="bg-slate-50 p-6 rounded-xl border border-slate-200">
    <div
        class="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4"
    >
        <div class="text-sm font-semibold text-slate-700">
            Vector Space Projection
        </div>

        <div class="flex items-center gap-4">
            {#if showAdvanced}
                <div
                    class="flex gap-4 p-1 bg-white rounded-lg border border-slate-200 shadow-sm"
                    transition:fade
                >
                    <label
                        class="flex items-center gap-2 text-sm cursor-pointer px-2 hover:bg-slate-50 rounded"
                    >
                        <input
                            type="radio"
                            name="norm"
                            value={1}
                            bind:group={p}
                            class="accent-indigo-600"
                        />
                        <span>L1 (Absolute)</span>
                    </label>
                    <label
                        class="flex items-center gap-2 text-sm cursor-pointer px-2 hover:bg-slate-50 rounded"
                    >
                        <input
                            type="radio"
                            name="norm"
                            value={2}
                            bind:group={p}
                            class="accent-indigo-600"
                        />
                        <span class="font-bold text-indigo-700"
                            >L2 (Squared)</span
                        >
                    </label>
                    <label
                        class="flex items-center gap-2 text-sm cursor-pointer px-2 hover:bg-slate-50 rounded"
                    >
                        <input
                            type="radio"
                            name="norm"
                            value={3}
                            bind:group={p}
                            class="accent-indigo-600"
                        />
                        <span>L3 (Cubed)</span>
                    </label>
                </div>
            {/if}

            <button
                onclick={toggleAdvanced}
                class="text-xs font-medium text-slate-500 hover:text-indigo-600 underline decoration-dotted underline-offset-4 transition-colors"
                aria-pressed={showAdvanced}
            >
                {showAdvanced ? "Hide Advanced Options" : "Explore other Norms"}
            </button>
        </div>
    </div>

    <div
        class="relative h-[400px] bg-white rounded-lg border border-slate-200 overflow-hidden"
        bind:clientWidth={width}
    >
        <!-- Badge -->
        <div
            class="absolute top-2 left-2 px-2 py-1 bg-white/90 backdrop-blur-sm border border-slate-200 rounded text-xs font-medium text-slate-500 z-20 pointer-events-none"
        >
            Vector Space (<MathBlock math={String.raw`\mathbb{R}^N`} />)
        </div>

        <svg
            class="w-full h-full pointer-events-auto"
            viewBox={`0 0 ${width} 400`}
            preserveAspectRatio="xMidYMid meet"
        >
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
            {#each Array.from({ length: 9 }) as _, i}
                <line
                    x1="0"
                    y1={cy - 200 + i * 50}
                    x2={width}
                    y2={cy - 200 + i * 50}
                    stroke={i * 50 === 200 ? "#94a3b8" : "#f1f5f9"}
                    stroke-width={i * 50 === 200 ? "2" : "1"}
                />
                <line
                    x1={cx - 200 + i * 50}
                    y1="0"
                    x2={cx - 200 + i * 50}
                    y2={height}
                    stroke={i * 50 === 200 ? "#94a3b8" : "#f1f5f9"}
                    stroke-width={i * 50 === 200 ? "2" : "1"}
                />
            {/each}

            <!-- Iso-Error Contour (centered at y) -->
            <path
                transform="translate({cx + yVec.x}, {cy + yVec.y})"
                d={contourPath}
                fill="none"
                stroke="#ef4444"
                stroke-width="1"
                stroke-opacity="0.3"
                stroke-dasharray="2 2"
            />

            <!-- Subspace Line (Col Space) -->
            <!-- Hit Area (Invisible, Thick) -->
            <line
                role="button"
                tabindex="0"
                x1={cx - u.x * lineLen}
                y1={cy - u.y * lineLen}
                x2={cx + u.x * lineLen}
                y2={cy + u.y * lineLen}
                stroke="transparent"
                stroke-width="40"
                class="cursor-move"
                onmousedown={handleMouseDownLine}
                onkeydown={() => {}}
            />
            <!-- Visual Line (Visible, Dashed) -->
            <line
                class="pointer-events-none"
                x1={cx - u.x * lineLen}
                y1={cy - u.y * lineLen}
                x2={cx + u.x * lineLen}
                y2={cy + u.y * lineLen}
                stroke="#94a3b8"
                stroke-width="2"
                stroke-dasharray="5 5"
            />
            <text
                x={cx + u.x * 180}
                y={cy + u.y * 180}
                dy="-10"
                class="text-xs fill-slate-500 font-mono select-none pointer-events-none"
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
                class="pointer-events-none"
            />
            <text
                x={cx + yHat.x / 2}
                y={cy + yHat.y / 2}
                dy="20"
                dx="10"
                class="text-sm font-bold fill-indigo-600 select-none pointer-events-none"
                >ŷ</text
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
                class="pointer-events-none"
            />
            <text
                x={cx + yHat.x + eVec.x / 2 + 10}
                y={cy + yHat.y + eVec.y / 2}
                class="text-xs font-bold fill-red-500 select-none pointer-events-none"
                >e</text
            >

            <!-- Target Vector y -->
            <!-- Hit Area (Invisible, Thick) -->
            <line
                role="button"
                tabindex="0"
                x1={cx}
                y1={cy}
                x2={cx + yVec.x}
                y2={cy + yVec.y}
                stroke="transparent"
                stroke-width="30"
                class="cursor-move"
                onmousedown={handleMouseDownY}
                onkeydown={() => {}}
            />
            <!-- Visual Line -->
            <line
                class="pointer-events-none"
                x1={cx}
                y1={cy}
                x2={cx + yVec.x}
                y2={cy + yVec.y}
                stroke="#0f172a"
                stroke-width="3"
                marker-end="url(#arrow-black)"
            />
            <!-- Hit Area Circle (larger) -->
            <circle
                role="button"
                tabindex="0"
                cx={cx + yVec.x}
                cy={cy + yVec.y}
                r="20"
                fill="transparent"
                class="cursor-move"
                onmousedown={handleMouseDownY}
                onkeydown={() => {}}
            />
            <text
                x={cx + yVec.x}
                y={cy + yVec.y}
                dy="-15"
                class="text-sm font-bold fill-slate-900 select-none pointer-events-none"
                >y</text
            >
        </svg>

        <div
            class="absolute bottom-2 left-2 text-xs text-slate-400 pointer-events-none"
        >
            Drag <strong>y</strong> (black) or the <strong>dashed line</strong>
        </div>
    </div>

    <div
        class="mt-6 space-y-4 text-sm text-slate-600 bg-slate-100 p-4 rounded-lg text-left"
    >
        <div>
            <h4 class="font-semibold text-slate-800 mb-2">
                Interactive Legend
            </h4>
            <ul class="list-disc list-inside space-y-1 ml-1 text-xs sm:text-sm">
                <li>
                    <strong>Moving <MathBlock math="y" /> (Black Vector)</strong
                    >: Represents changing your <em>observed data</em>.
                </li>
                <li>
                    <strong>Moving the Dashed Line (Subspace)</strong>:
                    Represents changing your <em>features</em> (or input data <MathBlock
                        math="X"
                    />).
                </li>
            </ul>
        </div>

        {#if showAdvanced}
            <div class="border-t border-slate-200 pt-3" transition:fade>
                <h4 class="font-semibold text-slate-800 mb-2">
                    Error Norm Analysis
                </h4>
                {#if p === 2}
                    <p>
                        <strong>Squared Error (L2)</strong>: Minimizes the
                        <span class="text-indigo-600 font-medium"
                            >Euclidean distance</span
                        > (straight line).
                    </p>
                    <div
                        class="mt-2 text-slate-800 bg-white p-2 rounded border border-indigo-100 shadow-sm"
                    >
                        ✨ <strong>Key Insight:</strong> This is the
                        <em>only</em>
                        norm that creates an <strong>orthogonal</strong> (perpendicular)
                        projection. This orthogonality simplifies the math (Linear
                        Algebra) and aligns with the assumption of Gaussian noise.
                    </div>
                {:else if p === 1}
                    <p>
                        <strong>Absolute Error (L1)</strong>: Minimizes the
                        <span class="text-indigo-600 font-medium"
                            >Manhattan distance</span
                        > (sum of absolute grid steps).
                    </p>
                    <div
                        class="mt-2 text-slate-800 bg-white p-2 rounded border border-indigo-100 shadow-sm"
                    >
                        🚧 <strong>Observation:</strong> Notice how the solution
                        "jumps" to corners or axes? This sparsity makes L1 robust
                        to outliers but mathematically "jumpy" (non-differentiable).
                    </div>
                {:else}
                    <p>
                        <strong>Cubed Error (L3)</strong>: Penalizes large
                        errors
                        <em>extremely</em>
                        heavily.
                    </p>
                    <div
                        class="mt-2 text-slate-800 bg-white p-2 rounded border border-indigo-100 shadow-sm"
                    >
                        ⚠️ <strong>Effect:</strong> The solution shifts to avoid
                        even a single large coordinate difference in the error vector,
                        breaking orthogonality.
                    </div>
                {/if}
            </div>
        {/if}
    </div>
</div>
