<script lang="ts">
	import katex from 'katex';
	import 'katex/dist/katex.min.css';

	let { math, block = false } = $props<{ math: string; block?: boolean }>();

	let container = $state<HTMLSpanElement | null>(null);

	$effect(() => {
		if (container) {
			katex.render(math, container, {
				displayMode: block,
				throwOnError: false,
                strict: false
			});
		}
	});
</script>

<span bind:this={container}></span>
