<script lang="ts">
    import { onMount } from "svelte";
    import { fade } from "svelte/transition";
    import MathBlock from "./MathBlock.svelte";
    import InteractiveDataSpace from "./InteractiveDataSpace.svelte";
    import { polynomialRegression } from "../lib/math";

    interface Point {
        x: number;
        y: number;
        id: number;
    }

    // State
    let points: Point[] = $state([
        { x: 10, y: 20, id: 1 },
        { x: 20, y: 40, id: 2 },
        { x: 40, y: 60, id: 3 },
        { x: 75, y: 60, id: 4 },
    ]);

    // Line parameters: y = w1*x + w0
    let w1 = $state(0.8);
    let w0 = $state(10);

    // Likelihood calculation
    let sigma = $state(10); // Noise parameter

    function gaussian(x: number, mu: number, sigma: number) {
        return (
            (1 / (sigma * Math.sqrt(2 * Math.PI))) *
            Math.exp(-0.5 * Math.pow((x - mu) / sigma, 2))
        );
    }

    let likelihoods = $derived(
        points.map((p) => {
            const y_pred = w1 * p.x + w0;
            return gaussian(p.y, y_pred, sigma);
        }),
    );

    let totalLogLikelihood = $derived(
        likelihoods.reduce((acc, l) => acc + Math.log(l + 1e-10), 0),
    );

    // Derived for visualization
    let maxLikelihood = $derived(Math.max(...likelihoods));

    // Helper to generate Gaussian path
    function getGaussianPath(
        p: Point,
        y_pred: number,
        sigma: number,
        prob: number,
        toPx: any,
    ) {
        // We want to draw a symmetric bell curve centered on the vertical line x = p.x
        // The width of the bell is determined by the probability density at each y
        const steps = 100; // More steps for smoother full-height curve
        let path = "";
        const scale = 300; // Visual scaling factor

        // Draw from y=0 to y=100 (full vertical range)
        // Right side
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const y_val = t * 100; // 0 to 100
            const x_val = p.x + gaussian(y_val, y_pred, sigma) * scale;

            const coords = toPx(x_val, y_val);
            if (i === 0) path += `M ${coords.x} ${coords.y}`;
            else path += ` L ${coords.x} ${coords.y}`;
        }

        // Left side (mirror)
        for (let i = steps; i >= 0; i--) {
            const t = i / steps;
            const y_val = t * 100; // 0 to 100
            const x_val = p.x - gaussian(y_val, y_pred, sigma) * scale;

            const coords = toPx(x_val, y_val);
            path += ` L ${coords.x} ${coords.y}`;
        }

        path += " Z";
        return path;
    }
</script>

<div
    class="w-full max-w-2xl mx-auto bg-white p-6 rounded-xl shadow-sm border border-slate-200"
>
    <div class="flex justify-between items-center mb-6">
        <h3 class="text-lg font-semibold text-slate-900">
            Visualizing Likelihood
        </h3>
        <div class="flex items-center gap-4">
            <!-- Noise Control -->
            <div class="flex items-center gap-2 text-sm text-slate-600">
                <span class="font-mono">σ: {sigma}</span>
                <input
                    type="range"
                    min="1"
                    max="20"
                    bind:value={sigma}
                    class="w-24 accent-indigo-600"
                />
            </div>
        </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- Main Visualization -->
        <div class="md:col-span-2 aspect-square">
            <InteractiveDataSpace
                bind:points
                bind:w={w1}
                bind:b={w0}
                xDomain={[0, 100]}
                yDomain={[0, 100]}
                handleXs={[5, 95]}
            >
                {#snippet children({ toPx })}
                    <!-- Gaussians -->
                    {#each points as p, i}
                        {@const y_pred = w1 * p.x + w0}
                        {@const prob = likelihoods[i]}

                        <!-- Gaussian Curve -->
                        <path
                            d={getGaussianPath(p, y_pred, sigma, prob, toPx)}
                            fill={prob > 0.01 ? "#22c55e" : "#94a3b8"}
                            fill-opacity="0.4"
                            stroke={prob > 0.01 ? "#22c55e" : "#94a3b8"}
                            stroke-width="1.5"
                            vector-effect="non-scaling-stroke"
                        />

                        <!-- Horizontal Line at p.y crossing the distribution -->
                        {@const scale = 300}
                        {@const x_dist = gaussian(p.y, y_pred, sigma) * scale}
                        <line
                            x1={toPx(p.x - x_dist, p.y).x}
                            y1={toPx(p.x - x_dist, p.y).y}
                            x2={toPx(p.x + x_dist, p.y).x}
                            y2={toPx(p.x + x_dist, p.y).y}
                            stroke={prob > 0.01 ? "#22c55e" : "#ef4444"}
                            stroke-width="1.5"
                            vector-effect="non-scaling-stroke"
                        />
                    {/each}
                {/snippet}
            </InteractiveDataSpace>
        </div>

        <!-- Stats Panel -->
        <div class="space-y-4">
            <div class="bg-slate-50 p-4 rounded-lg border border-slate-100">
                <div
                    class="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2"
                >
                    Total Log Likelihood
                </div>
                <div class="text-2xl font-mono font-bold text-slate-900">
                    {totalLogLikelihood.toFixed(2)}
                </div>
                <div
                    class="mt-2 w-full bg-slate-200 rounded-full h-1.5 overflow-hidden"
                >
                    <div
                        class="bg-indigo-600 h-full transition-all duration-300"
                        style="width: {Math.min(
                            100,
                            Math.max(0, (totalLogLikelihood + 50) * 2),
                        )}%"
                    ></div>
                </div>
            </div>

            <div class="space-y-2">
                {#each points as p, i}
                    <div
                        class="flex items-center justify-between text-xs group hover:bg-slate-50 p-1 rounded transition-colors"
                    >
                        <span class="font-mono text-slate-500">P{i + 1}</span>
                        <div
                            class="flex-1 mx-2 h-1 bg-slate-100 rounded-full overflow-hidden"
                        >
                            <div
                                class="h-full bg-green-500 transition-all duration-300"
                                style="width: {likelihoods[i] * 2500}%"
                            ></div>
                        </div>
                        <span class="font-mono font-medium text-slate-700">
                            {(likelihoods[i] * 100).toFixed(1)}%
                        </span>
                    </div>
                {/each}
            </div>

            <div class="text-xs text-slate-400 mt-4 leading-relaxed">
                <strong class="text-slate-600">Goal:</strong> Maximize the total
                log likelihood by adjusting the line. The
                <span class="text-green-600 font-bold">green curves</span> show the
                probability of observing each point given the line and noise level
                σ.
            </div>
        </div>
    </div>
</div>
