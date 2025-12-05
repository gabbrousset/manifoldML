<script lang="ts">
    interface Props {
        x: string; // Percentage string e.g. "50%"
        y: string; // Percentage string e.g. "50%"
        onmousedown: (e: MouseEvent) => void;
    }

    let { x, y, onmousedown }: Props = $props();
</script>

<button
    class="absolute w-6 h-6 -ml-3 -mt-3 rounded-full cursor-move z-20 group focus:outline-none flex items-center justify-center bg-white border border-indigo-200 shadow-sm hover:scale-110 hover:border-indigo-400"
    style="left: {x}; top: {y};"
    {onmousedown}
    aria-label="Drag Handle"
>
    <!-- Rotate Icon -->
    <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#4f46e5"
        stroke-width="2.5"
        stroke-linecap="round"
        stroke-linejoin="round"
    >
        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
        <path d="M3 3v5h5" />
    </svg>
</button>
