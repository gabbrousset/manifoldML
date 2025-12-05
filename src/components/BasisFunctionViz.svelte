<script lang="ts">
    import { fade } from "svelte/transition";
    import MathBlock from "./MathBlock.svelte";

    let isLifted = $state(false);

    // Data generation: y = x^2
    // We use a range of x from -2 to 2
    const points = Array.from({ length: 21 }, (_, i) => {
        const x = (i / 20) * 4 - 2; // -2 to 2
        const y = x * x;
        return { x, y, id: i };
    });

    function toggleLift() {
        isLifted = !isLifted;
    }

    // Coordinate mapping
    // Y is always 0 to 4.5
    // X is -2.5 to 2.5 (Input) OR -0.5 to 4.5 (Feature)

    function getX(p: { x: number; y: number }, lifted: boolean) {
        if (!lifted) {
            // Input Space: x is x
            // Map -2.5..2.5 to 0..100
            return ((p.x + 2.5) / 5) * 100;
        } else {
            // Feature Space: x is x^2
            // Map -0.5..4.5 to 0..100
            return ((p.x * p.x + 0.5) / 5) * 100;
        }
    }

    function getY(p: { x: number; y: number }) {
        // Map -0.5..4.5 to 100..0
        return 100 - ((p.y + 0.5) / 5) * 100;
    }
</script>

<div class="bg-slate-50 p-6 rounded-xl border border-slate-200">
    <div
        class="h-[300px] relative bg-white rounded-lg border border-slate-200 overflow-hidden"
    >
        <!-- Grid Lines (Static for simplicity, or we could animate them too) -->
        <div
            class="absolute inset-0 grid grid-cols-10 grid-rows-6 opacity-10 pointer-events-none"
        >
            {#each Array(60) as _}
                <div class="border-r border-b border-slate-400"></div>
            {/each}
        </div>

        <!-- Axis Labels -->
        <div
            class="absolute bottom-2 right-4 text-xs font-mono text-slate-500 transition-all duration-700"
        >
            {isLifted ? "Feature: x²" : "Input: x"}
        </div>
        <div class="absolute top-2 left-2 text-xs font-mono text-slate-500">
            Target: y
        </div>

        <!-- Data Points -->
        {#each points as p (p.id)}
            <div
                class="absolute w-3 h-3 rounded-full shadow-sm border border-white transition-all duration-1000 ease-in-out z-10"
                style="
                    left: {getX(p, isLifted)}%;
                    top: {getY(p)}%;
                    background-color: {isLifted ? '#4f46e5' : '#ef4444'};
                    transform: translate(-50%, -50%);
                "
            ></div>
        {/each}

        <!-- Models -->
        <svg
            class="absolute inset-0 w-full h-full pointer-events-none overflow-visible"
        >
            {#if !isLifted}
                <!-- Linear Model in Input Space (Underfitting) -->
                <!-- Best fit line for parabola y=x^2 on [-2,2] is y = constant (approx) because slope cancels out -->
                <!-- Actually, slope is 0. Intercept is mean(x^2) approx 1.33 -->
                <line
                    x1="0%"
                    y1={100 - ((1.33 + 0.5) / 5) * 100 + "%"}
                    x2="100%"
                    y2={100 - ((1.33 + 0.5) / 5) * 100 + "%"}
                    stroke="#ef4444"
                    stroke-width="2"
                    stroke-dasharray="4 4"
                    opacity="0.5"
                    transition:fade
                />
                <!-- Visualizing the error? Nah, keep it simple. -->
            {:else}
                <!-- Linear Model in Feature Space (Perfect Fit) -->
                <!-- In x^2 space, y = 1 * (x^2) + 0. It's a line with slope 1, intercept 0 -->
                <!-- x_feature goes from 0 to 4 -->
                <!-- p1: (0, 0) -> x_pct = (0.5/5)*100=10%, y_pct = (0.5/5)*100=10% (from bottom) -->
                <!-- p2: (4, 4) -> x_pct = (4.5/5)*100=90%, y_pct = (4.5/5)*100=90% (from bottom) -->
                <line
                    x1={((0 + 0.5) / 5) * 100 + "%"}
                    y1={100 - ((0 + 0.5) / 5) * 100 + "%"}
                    x2={((4 + 0.5) / 5) * 100 + "%"}
                    y2={100 - ((4 + 0.5) / 5) * 100 + "%"}
                    stroke="#4f46e5"
                    stroke-width="3"
                    transition:fade
                />
            {/if}
        </svg>
    </div>

    <div class="mt-6 flex flex-col items-center space-y-4 text-center">
        <p class="text-sm text-slate-600 h-10">
            {#if !isLifted}
                In <strong>Input Space</strong> (<MathBlock math="x" />), the
                data is curved. A linear model (red dashed line) fails to
                capture the pattern.
            {:else}
                In <strong>Feature Space</strong> (<MathBlock
                    math="\phi(x) = x^2"
                />), the data becomes linear! We can now fit a perfect straight
                line.
            {/if}
        </p>
        <button
            onclick={toggleLift}
            class="px-6 py-2 bg-slate-900 text-white rounded-full text-sm font-medium hover:bg-slate-800 transition-colors shadow-lg hover:shadow-xl transform active:scale-95"
        >
            {isLifted ? "Reset to Input Space" : "Transform to Feature Space"}
        </button>
    </div>
</div>
