<script lang="ts">
	import { onMount } from 'svelte';
	import * as d3 from 'd3';
	import katex from 'katex';

	function renderMath(tex: string, displayMode = false) {
		try {
			return katex.renderToString(tex, { throwOnError: false, displayMode });
		} catch {
			return tex;
		}
	}

	// Define our Layer type
	type Layer = { id: number; b: number; k: number };

	let nextLayerId = 4;

	// Vertically Layered Ground (Series of parallel properties along horizontal axis)
	// Actually, vertically layered means layers are stacked next to each other horizontally (vertical geometric bands).
	let verticalLayers = $state<Layer[]>([
		{ id: 1, b: 1.0, k: 2.0 },
		{ id: 2, b: 2.0, k: 1.5 },
		{ id: 3, b: 1.5, k: 3.0 }
	]);

	// Horizontally Layered Ground (Stacked vertically, layers are horizontal bands)
	let horizontalLayers = $state<Layer[]>([
		{ id: 1, b: 1.0, k: 2.0 },
		{ id: 2, b: 2.0, k: 1.5 },
		{ id: 3, b: 1.5, k: 3.0 }
	]);

	function addVerticalLayer() {
		verticalLayers = [...verticalLayers, { id: nextLayerId++, b: 1.0, k: 2.0 }];
	}
	function removeVerticalLayer(id: number) {
		if (verticalLayers.length > 1) {
			verticalLayers = verticalLayers.filter((l) => l.id !== id);
		}
	}

	function addHorizontalLayer() {
		horizontalLayers = [...horizontalLayers, { id: nextLayerId++, b: 1.0, k: 2.0 }];
	}
	function removeHorizontalLayer(id: number) {
		if (horizontalLayers.length > 1) {
			horizontalLayers = horizontalLayers.filter((l) => l.id !== id);
		}
	}

	// Calculations
	let vTotalB = $derived(verticalLayers.reduce((sum, l) => sum + l.b, 0));
	let vSumKb = $derived(verticalLayers.reduce((sum, l) => sum + l.k * l.b, 0));
	let kEqVertical = $derived(vSumKb / vTotalB); // Eq 6.3a

	let hTotalB = $derived(horizontalLayers.reduce((sum, l) => sum + l.b, 0));
	let hSumBk = $derived(horizontalLayers.reduce((sum, l) => sum + l.b / l.k, 0));
	let kEqHorizontal = $derived(hTotalB / hSumBk); // Eq 6.3b

	// Visual scales
	const colorScale = d3.scaleSequential(d3.interpolateOranges).domain([0.5, 4.0]);

	// SVG Dimensions
	let svgWidth = $state(600);
	const svgHeight = 250;
</script>

<div class="min-h-screen bg-white font-sans text-zinc-900 selection:bg-zinc-200">
	<div class="mx-auto max-w-7xl px-6 py-12 lg:px-8">
		<div class="mb-12">
			<a
				href="/"
				class="mb-4 inline-block text-sm font-semibold tracking-widest text-zinc-500 uppercase transition-colors hover:text-zinc-900"
				>← Dashboard</a
			>
			<h1 class="mb-4 text-4xl font-bold tracking-tight text-zinc-900">
				Equivalent Thermal Conductivity
			</h1>
			<p class="mb-8 max-w-3xl text-lg leading-relaxed font-light text-zinc-500">
				Analyze and configure anisotropic ground formations. Calculate the equivalent thermal
				conductivity when the medium varies either vertically or horizontally.
			</p>
		</div>

		<!-- Vertically Layered Section (Equation 6.3a) -->
		<div class="mb-16 grid grid-cols-1 gap-8 lg:grid-cols-2">
			<!-- Visual & Math Block -->
			<div class="flex flex-col gap-6">
				<div class="flex flex-col rounded-2xl border border-zinc-200 bg-zinc-50 p-6">
					<h2
						class="mb-4 border-b border-zinc-200 pb-2 text-sm font-semibold tracking-widest text-zinc-900 uppercase"
					>
						Vertically Layered Ground Medium
					</h2>
					<div class="overflow-x-auto py-2 text-center text-lg">
						{@html renderMath(
							'k_{s,e} = \\frac{1}{\\sum_{i=1}^N b_i} \\sum_{i=1}^N k_{s,i} b_i',
							true
						)}
					</div>
					<div
						class="mt-6 flex w-full justify-center overflow-hidden rounded border border-zinc-300"
						bind:clientWidth={svgWidth}
					>
						<svg width="100%" height={svgHeight}>
							{#each verticalLayers as layer, i}
								{@const previousB = verticalLayers.slice(0, i).reduce((sum, l) => sum + l.b, 0)}
								{@const xPos = (previousB / vTotalB) * 100}
								{@const width = (layer.b / vTotalB) * 100}
								<rect
									x="{xPos}%"
									y="0"
									width="{width}%"
									height="100%"
									fill={colorScale(layer.k)}
									stroke="#3f3f46"
									stroke-width="1"
								/>
								{#if width > 10}
									<text
										x="{xPos + width / 2}%"
										y="50%"
										text-anchor="middle"
										dominant-baseline="middle"
										class="fill-black text-sm font-bold"
									>
										k={layer.k.toFixed(1)}
									</text>
								{/if}
							{/each}
						</svg>
					</div>

					<!-- Calculation Result -->
					<div class="mt-8 flex items-end justify-between border-t border-zinc-200 pt-6">
						<div>
							<p class="text-sm font-medium text-zinc-500">
								Effective Thermal Conductivity ({@html renderMath('k_{s,e}')})
							</p>
						</div>
						<div class="text-3xl font-bold text-zinc-900">
							{kEqVertical.toFixed(3)} <span class="text-lg font-normal text-zinc-500">W/mK</span>
						</div>
					</div>
				</div>
			</div>

			<!-- Control Boxes -->
			<div class="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-6 shadow-sm">
				<div class="flex items-center justify-between border-b border-zinc-200 pb-4">
					<h3 class="text-sm font-semibold tracking-widest text-zinc-900 uppercase">
						Layer Configuration
					</h3>
					<button
						class="rounded-md bg-zinc-800 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-zinc-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
						onclick={addVerticalLayer}
					>
						+ Add Layer
					</button>
				</div>
				<div class="max-h-[500px] space-y-4 overflow-y-auto pr-2">
					{#each verticalLayers as layer (layer.id)}
						<div class="group relative rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
							{#if verticalLayers.length > 1}
								<button
									class="absolute top-2 right-2 text-zinc-400 transition-colors hover:text-red-500"
									onclick={() => removeVerticalLayer(layer.id)}
									aria-label="Remove layer"
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										class="h-4 w-4"
										viewBox="0 0 20 20"
										fill="currentColor"
									>
										<path
											fill-rule="evenodd"
											d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
											clip-rule="evenodd"
										/>
									</svg>
								</button>
							{/if}
							<h4 class="mb-4 text-xs font-bold text-zinc-500 uppercase">Layer {layer.id}</h4>
							<div class="grid grid-cols-2 gap-4">
								<div class="space-y-2">
									<label
										for="v-layer-b-{layer.id}"
										class="flex justify-between text-sm font-medium text-zinc-700"
									>
										<span class="truncate pr-2">Width ({@html renderMath('b_i')})</span>
										<span class="shrink-0 font-bold text-zinc-900">{layer.b.toFixed(1)} m</span>
									</label>
									<input
										id="v-layer-b-{layer.id}"
										type="range"
										min="0.1"
										max="5.0"
										step="0.1"
										bind:value={layer.b}
										class="h-1 w-full cursor-pointer appearance-none rounded-full bg-zinc-200 accent-zinc-900"
									/>
								</div>
								<div class="space-y-2">
									<label
										for="v-layer-k-{layer.id}"
										class="flex justify-between text-sm font-medium text-zinc-700"
									>
										<span class="truncate pr-2" title="Thermal Conductivity"
											>Cond. ({@html renderMath('k_{s,i}')})</span
										>
										<span class="shrink-0 font-bold text-zinc-900">{layer.k.toFixed(1)} W/mK</span>
									</label>
									<input
										id="v-layer-k-{layer.id}"
										type="range"
										min="0.5"
										max="4.0"
										step="0.1"
										bind:value={layer.k}
										class="h-1 w-full cursor-pointer appearance-none rounded-full bg-zinc-200 accent-zinc-900"
									/>
								</div>
							</div>
						</div>
					{/each}
				</div>
			</div>
		</div>

		<!-- Horizontally Layered Section (Equation 6.3b) -->
		<div class="grid grid-cols-1 gap-8 lg:grid-cols-2">
			<!-- Visual & Math Block -->
			<div class="flex flex-col gap-6">
				<div class="flex flex-col rounded-2xl border border-zinc-200 bg-zinc-50 p-6">
					<h2
						class="mb-4 border-b border-zinc-200 pb-2 text-sm font-semibold tracking-widest text-zinc-900 uppercase"
					>
						Horizontally Layered Ground Medium
					</h2>
					<div class="overflow-x-auto py-2 text-center text-lg">
						{@html renderMath(
							'\\frac{1}{k_{s,e}} = \\frac{1}{\\sum_{i=1}^N b_i} \\sum_{i=1}^N \\frac{b_i}{k_{s,i}}',
							true
						)}
					</div>
					<div
						class="relative mt-6 flex w-full flex-col overflow-hidden rounded border border-zinc-300"
						style="height: {svgHeight}px;"
					>
						<svg width="100%" height="100%">
							{#each horizontalLayers as layer, i}
								{@const previousB = horizontalLayers.slice(0, i).reduce((sum, l) => sum + l.b, 0)}
								{@const yPos = (previousB / hTotalB) * 100}
								{@const height = (layer.b / hTotalB) * 100}
								<rect
									x="0"
									y="{yPos}%"
									width="100%"
									height="{height}%"
									fill={colorScale(layer.k)}
									stroke="#3f3f46"
									stroke-width="1"
								/>
								{#if height > 15}
									<text
										x="50%"
										y="{yPos + height / 2}%"
										text-anchor="middle"
										dominant-baseline="middle"
										class="fill-black text-sm font-bold"
									>
										k={layer.k.toFixed(1)}
									</text>
								{/if}
							{/each}
						</svg>
					</div>

					<!-- Calculation Result -->
					<div class="mt-8 flex items-end justify-between border-t border-zinc-200 pt-6">
						<div>
							<p class="text-sm font-medium text-zinc-500">
								Effective Thermal Conductivity ({@html renderMath('k_{s,e}')})
							</p>
						</div>
						<div class="text-3xl font-bold text-zinc-900">
							{kEqHorizontal.toFixed(3)} <span class="text-lg font-normal text-zinc-500">W/mK</span>
						</div>
					</div>
				</div>
			</div>

			<!-- Control Boxes -->
			<div class="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-6 shadow-sm">
				<div class="flex items-center justify-between border-b border-zinc-200 pb-4">
					<h3 class="text-sm font-semibold tracking-widest text-zinc-900 uppercase">
						Layer Configuration
					</h3>
					<button
						class="rounded-md bg-zinc-800 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-zinc-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
						onclick={addHorizontalLayer}
					>
						+ Add Layer
					</button>
				</div>
				<div class="max-h-[500px] space-y-4 overflow-y-auto pr-2">
					{#each horizontalLayers as layer (layer.id)}
						<div class="group relative rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
							{#if horizontalLayers.length > 1}
								<button
									class="absolute top-2 right-2 text-zinc-400 transition-colors hover:text-red-500"
									onclick={() => removeHorizontalLayer(layer.id)}
									aria-label="Remove layer"
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										class="h-4 w-4"
										viewBox="0 0 20 20"
										fill="currentColor"
									>
										<path
											fill-rule="evenodd"
											d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
											clip-rule="evenodd"
										/>
									</svg>
								</button>
							{/if}
							<h4 class="mb-4 text-xs font-bold text-zinc-500 uppercase">Layer {layer.id}</h4>
							<div class="grid grid-cols-2 gap-4">
								<div class="space-y-2">
									<label
										for="h-layer-b-{layer.id}"
										class="flex justify-between text-sm font-medium text-zinc-700"
									>
										<span class="truncate pr-2">Depth ({@html renderMath('b_i')})</span>
										<span class="shrink-0 font-bold text-zinc-900">{layer.b.toFixed(1)} m</span>
									</label>
									<input
										id="h-layer-b-{layer.id}"
										type="range"
										min="0.1"
										max="5.0"
										step="0.1"
										bind:value={layer.b}
										class="h-1 w-full cursor-pointer appearance-none rounded-full bg-zinc-200 accent-zinc-900"
									/>
								</div>
								<div class="space-y-2">
									<label
										for="h-layer-k-{layer.id}"
										class="flex justify-between text-sm font-medium text-zinc-700"
									>
										<span class="truncate pr-2" title="Thermal Conductivity"
											>Cond. ({@html renderMath('k_{s,i}')})</span
										>
										<span class="shrink-0 font-bold text-zinc-900">{layer.k.toFixed(1)} W/mK</span>
									</label>
									<input
										id="h-layer-k-{layer.id}"
										type="range"
										min="0.5"
										max="4.0"
										step="0.1"
										bind:value={layer.k}
										class="h-1 w-full cursor-pointer appearance-none rounded-full bg-zinc-200 accent-zinc-900"
									/>
								</div>
							</div>
						</div>
					{/each}
				</div>
			</div>
		</div>
	</div>
</div>
