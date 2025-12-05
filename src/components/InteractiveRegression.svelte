<script lang="ts">
    import { fade } from 'svelte/transition';

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

    function calculateRegression(pts: Point[]) {
        const n = pts.length;
        if (n < 2) return { m: 0, b: 0 };

        let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
        for (const p of pts) {
            sumX += p.x;
            sumY += p.y;
            sumXY += p.x * p.y;
            sumXX += p.x * p.x;
        }

        const denominator = (n * sumXX - sumX * sumX);
        if (denominator === 0) return { m: 0, b: 0 };

        const m = (n * sumXY - sumX * sumY) / denominator;
        const b = (sumY - m * sumX) / n;

        return { m, b };
    }

    let { m, b } = $derived(calculateRegression(points));
    
    // Cost calculation
    let cost = $derived(
        points.reduce((acc, p) => acc + Math.pow(p.y - (m * p.x + b), 2), 0) / (2 * points.length)
    );

    let container: HTMLDivElement;
    let draggingId = $state<number | null>(null);

    function onContainerClick(e: MouseEvent) {
        if (draggingId !== null) return; 
        const rect = container.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = 100 - ((e.clientY - rect.top) / rect.height) * 100;
        points.push({ x, y, id: Date.now() });
    }

    function removePoint(e: MouseEvent, id: number) {
        e.stopPropagation();
        // Only remove if not dragging (click event fires after mouseup)
        // But we handle drag separately. 
        // If we just finished dragging, we shouldn't remove.
        // We can check if we moved.
        points = points.filter(p => p.id !== id);
    }

    function handleDragStart(e: MouseEvent, id: number) {
        e.stopPropagation(); 
        draggingId = id;
        
        const startX = e.clientX;
        const startY = e.clientY;
        let hasMoved = false;

        const onMove = (moveEvent: MouseEvent) => {
            if (!container) return;
            hasMoved = true;
            const rect = container.getBoundingClientRect();
            let x = ((moveEvent.clientX - rect.left) / rect.width) * 100;
            let y = 100 - ((moveEvent.clientY - rect.top) / rect.height) * 100;
            
            x = Math.max(0, Math.min(100, x));
            y = Math.max(0, Math.min(100, y));
            
            points = points.map(p => p.id === id ? { ...p, x, y } : p);
        };
        
        const onUp = (upEvent: MouseEvent) => {
            draggingId = null;
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
            
            // If we didn't move, it's a click, so we remove the point
            if (!hasMoved) {
                 points = points.filter(p => p.id !== id);
            }
        };
        
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
    }

</script>

<div class="w-full max-w-2xl mx-auto bg-white p-6 rounded-xl shadow-sm border border-slate-200">
    <h3 class="text-lg font-semibold mb-4">Interactive Demo</h3>
    
    <!-- Container -->
    <div 
        bind:this={container}
        class="relative aspect-video bg-slate-50 rounded-lg border border-slate-200 overflow-hidden cursor-crosshair"
        onclick={onContainerClick}
        role="button"
        tabindex="0"
        onkeydown={(e) => {}}
    >
        <!-- Grid Lines -->
        <div class="absolute inset-0 grid grid-cols-10 grid-rows-10 pointer-events-none">
            {#each Array(10) as _, i}
                <div class="border-r border-slate-200 h-full w-full border-b last:border-0"></div>
            {/each}
        </div>

        <!-- Regression Line -->
        <svg class="absolute inset-0 w-full h-full pointer-events-none">
            <line
                x1="0%"
                y1="{100 - b}%"
                x2="100%"
                y2="{100 - (m * 100 + b)}%"
                stroke="#4f46e5"
                stroke-width="4"
                stroke-linecap="round"
            />
        </svg>

        <!-- Residuals -->
        {#each points as p (p.id)}
            {@const predictedY = m * p.x + b}
            <div
                transition:fade={{ duration: 200 }}
                class="absolute pointer-events-none border-l-2 border-dashed border-red-500 opacity-50"
                style="
                    left: {p.x}%;
                    bottom: {Math.min(p.y, predictedY)}%;
                    height: {Math.abs(p.y - predictedY)}%;
                    width: 2px;
                    transform: translateX(-1px);
                "
            ></div>
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
        <div>
            Click to add points, click point to remove.
        </div>
        <div class="font-mono bg-slate-100 px-2 py-1 rounded text-xs">
            J(w) = {cost.toFixed(2)}
        </div>
        <div class="font-mono bg-slate-100 px-2 py-1 rounded text-xs">
            y = {m.toFixed(2)}x + {b.toFixed(2)}
        </div>
    </div>
</div>
