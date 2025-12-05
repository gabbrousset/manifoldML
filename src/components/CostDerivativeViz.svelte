<script lang="ts">
    import { onMount } from "svelte";
    import MathBlock from "./MathBlock.svelte";
    import InteractiveDataSpace from "./InteractiveDataSpace.svelte";

    // Data: Simple 1D dataset
    let data = $state([
        { x: 1, y: 1.5, id: 1 },
        { x: 2, y: 2.5, id: 2 },
        { x: 3, y: 2.0, id: 3 },
        { x: 4, y: 4.5, id: 4 },
        { x: 4.8, y: 3.5, id: 5 },
    ]);

    // State
    // y = w * x + b
    let w = $state(0.5); // Slope
    let b = $state(0); // Intercept

    // Interaction State (Cost Graph only)
    let isDraggingCost = false;

    // Canvas dimensions
    let width = 300;
    let height = 300;
    let dpr = 1;

    // Cost Function J(w) = (1/2N) * sum( (y - (wx + b))^2 )
    let N = $derived(data.length);
    let sumX = $derived(data.reduce((acc, p) => acc + p.x, 0));
    let sumXX = $derived(data.reduce((acc, p) => acc + p.x * p.x, 0));
    let sumY = $derived(data.reduce((acc, p) => acc + p.y, 0));
    let sumXY = $derived(data.reduce((acc, p) => acc + p.x * p.y, 0));

    let A = $derived(N > 0 ? sumXX / (2 * N) : 0);
    let B = $derived(N > 0 ? -(sumXY - b * sumX) / N : 0);
    let C = $derived(
        N > 0
            ? data.reduce((acc, p) => acc + Math.pow(p.y - b, 2), 0) / (2 * N)
            : 0,
    );

    // Derived values
    let cost = $derived(A * w * w + B * w + C);
    let derivative = $derived(2 * A * w + B);

    // Optimal w for CURRENT b
    let w_opt = $derived(A !== 0 ? -B / (2 * A) : 0);

    // Visualization Ranges
    const w_min = -0.5;
    const w_max = 2.5;
    const cost_max = 4;

    // Canvas Refs
    let costCanvas: HTMLCanvasElement;

    function drawCostGraph() {
        if (!costCanvas) return;
        const ctx = costCanvas.getContext("2d");
        if (!ctx) return;

        // Handle DPI
        const rect = costCanvas.getBoundingClientRect();
        if (
            costCanvas.width !== rect.width * dpr ||
            costCanvas.height !== rect.height * dpr
        ) {
            costCanvas.width = rect.width * dpr;
            costCanvas.height = rect.height * dpr;
        }

        const W = costCanvas.width;
        const H = costCanvas.height;

        ctx.clearRect(0, 0, W, H);

        const mapW = (val: number) => ((val - w_min) / (w_max - w_min)) * W;
        const mapC = (val: number) => H - (val / cost_max) * H;

        // Draw Grid
        ctx.beginPath();
        ctx.strokeStyle = "#e2e8f0";
        ctx.lineWidth = 1 * dpr;
        for (let val = Math.ceil(w_min); val <= Math.floor(w_max); val += 0.5) {
            const x = mapW(val);
            ctx.moveTo(x, 0);
            ctx.lineTo(x, H);
        }
        for (let val = 0; val <= cost_max; val += 0.5) {
            const y = mapC(val);
            ctx.moveTo(0, y);
            ctx.lineTo(W, y);
        }
        ctx.stroke();

        // Draw Parabola
        ctx.beginPath();
        ctx.strokeStyle = "#cbd5e1";
        ctx.lineWidth = 3 * dpr;
        for (let i = 0; i <= W; i += 2) {
            const currentW = w_min + (i / W) * (w_max - w_min);
            const currentC = A * currentW * currentW + B * currentW + C;
            const px = i;
            const py = mapC(currentC);
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.stroke();

        // Draw Tangent
        const tangentLength = 0.6;
        const t_w1 = w - tangentLength / 2;
        const t_w2 = w + tangentLength / 2;
        const t_c1 = derivative * (t_w1 - w) + cost;
        const t_c2 = derivative * (t_w2 - w) + cost;

        ctx.beginPath();
        ctx.strokeStyle = "#ef4444";
        ctx.lineWidth = 2 * dpr;
        ctx.moveTo(mapW(t_w1), mapC(t_c1));
        ctx.lineTo(mapW(t_w2), mapC(t_c2));
        ctx.stroke();

        // Draw Point
        const px = mapW(w);
        const py = mapC(cost);
        ctx.beginPath();
        ctx.arc(px, py, 6 * dpr, 0, Math.PI * 2);
        ctx.fillStyle = "#4f46e5";
        ctx.fill();
        ctx.strokeStyle = "white";
        ctx.lineWidth = 3 * dpr;
        ctx.stroke();

        // Optimal Line
        const optX = mapW(w_opt);
        ctx.beginPath();
        ctx.setLineDash([5 * dpr, 5 * dpr]);
        ctx.strokeStyle = "#94a3b8";
        ctx.lineWidth = 1 * dpr;
        ctx.moveTo(optX, 0);
        ctx.lineTo(optX, H);
        ctx.stroke();
        ctx.setLineDash([]);
    }

    // Interaction - Cost Graph
    function handleMouseDownCost(e: MouseEvent) {
        isDraggingCost = true;
        updateFromMouseCost(e);
        window.addEventListener("mousemove", handleMouseMoveCost);
        window.addEventListener("mouseup", handleMouseUpCost);
    }

    function handleMouseMoveCost(e: MouseEvent) {
        if (!isDraggingCost) return;
        updateFromMouseCost(e);
    }

    function handleMouseUpCost() {
        isDraggingCost = false;
        window.removeEventListener("mousemove", handleMouseMoveCost);
        window.removeEventListener("mouseup", handleMouseUpCost);
    }

    function updateFromMouseCost(e: MouseEvent) {
        const rect = costCanvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        let newW = w_min + (x / rect.width) * (w_max - w_min);
        newW = Math.max(w_min, Math.min(w_max, newW));
        w = newW;
    }

    $effect(() => {
        const _ = w;
        const __ = b;
        const ___ = data;
        drawCostGraph();
    });

    onMount(() => {
        dpr = window.devicePixelRatio || 1;
        drawCostGraph();
    });
</script>

<div
    class="grid grid-cols-1 md:grid-cols-2 gap-8 bg-slate-50 p-6 rounded-xl border border-slate-200"
>
    <!-- Left: Data Space -->
    <div class="space-y-2">
        <h4 class="text-sm font-medium text-slate-900 text-center">
            Data Space (<MathBlock math="y = wx + b" />)
        </h4>
        <div class="aspect-square relative">
            <InteractiveDataSpace
                bind:points={data}
                bind:w
                bind:b
                xDomain={[0, 6]}
                yDomain={[0, 6]}
                handleXs={[1, 5]}
            />

            <!-- Parameters Overlay -->
            <div
                class="absolute top-2 right-2 flex flex-col items-end pointer-events-none"
            >
                <div
                    class="bg-white/90 px-2 py-1 rounded shadow-sm border border-slate-100 mb-1"
                >
                    <span class="text-xs font-mono text-slate-500">w:</span>
                    <span class="text-sm font-mono font-bold text-indigo-600"
                        >{w.toFixed(2)}</span
                    >
                </div>
                <div
                    class="bg-white/90 px-2 py-1 rounded shadow-sm border border-slate-100"
                >
                    <span class="text-xs font-mono text-slate-500">b:</span>
                    <span class="text-sm font-mono font-bold text-indigo-600"
                        >{b.toFixed(2)}</span
                    >
                </div>
            </div>
        </div>
        <p class="text-xs text-slate-500 text-center">
            Changing <MathBlock math="w" /> rotates, changing <MathBlock
                math="b"
            /> moves up/down.
        </p>
    </div>

    <!-- Right: Cost Space -->
    <div class="space-y-2">
        <h4 class="text-sm font-medium text-slate-900 text-center">
            Cost Function (<MathBlock math="J(w)" />)
        </h4>
        <div
            class="relative aspect-square bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden cursor-ew-resize"
        >
            <canvas
                bind:this={costCanvas}
                class="w-full h-full"
                onmousedown={handleMouseDownCost}
            ></canvas>

            <!-- Derivative Indicator -->
            <div
                class="absolute top-2 right-2 flex flex-col items-end pointer-events-none"
            >
                <div
                    class="bg-white/90 px-2 py-1 rounded shadow-sm border border-slate-100 mb-1"
                >
                    <span class="text-xs font-mono text-slate-500"
                        >Cost (MSE):</span
                    >
                    <span class="text-sm font-mono font-bold text-slate-700">
                        {cost.toFixed(2)}
                    </span>
                </div>
                <div
                    class="bg-white/90 px-2 py-1 rounded shadow-sm border border-slate-100"
                >
                    <span class="text-xs font-mono text-slate-500"
                        >Derivative:</span
                    >
                    <span
                        class="text-sm font-mono font-bold {Math.abs(
                            derivative,
                        ) < 0.1
                            ? 'text-green-600'
                            : 'text-red-500'}"
                    >
                        {derivative.toFixed(2)}
                    </span>
                </div>
            </div>
        </div>
        <p class="text-xs text-slate-500 text-center">
            Drag the curve. The <span class="text-red-500 font-bold"
                >red line</span
            >
            is the derivative. <br />
            Minimize cost by finding where derivative = 0.
        </p>
    </div>
</div>
