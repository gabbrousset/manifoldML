<script lang="ts">
    import katex from 'katex';
    import 'katex/dist/katex.min.css';

    interface Props {
        math: string;
        block?: boolean;
    }

    let { math, block = false }: Props = $props();

    let html = $derived(katex.renderToString(math, {
        displayMode: block,
        throwOnError: false
    }));
</script>

{@html html}
