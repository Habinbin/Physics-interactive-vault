<script lang="ts">
	import { onMount } from 'svelte';
	import * as d3 from 'd3';
	import {
		calculateSpatialTemporalSuperposition,
		type BoreholeInstance
	} from '$lib/physics/superposition';
	import katex from 'katex';

	function renderMath(tex: string, displayMode = false) {
		try {
			return katex.renderToString(tex, { throwOnError: false, displayMode });
		} catch {
			return tex;
		}
	}

	// Global Parameters
	let timeLog = $state(3); // 10^3 = 1000 h
	let timeHours = $derived(Math.pow(10, Number(timeLog)));

	let k = $state(2.0);
	let rhoCp_MJ = $state(2.4);
	let alpha = $derived(Number(k) / (Number(rhoCp_MJ) * 1e6));

	// Domain Config
	const X_MIN = -10.0;
	const X_MAX = 10.0;
	const Y_MIN = -10.0;
	const Y_MAX = 10.0;

	// Adaptive Resolution State
	let isDragging = $state(false);

	let X_STEPS = $derived(isDragging ? 25 : 100);
	let Y_STEPS = $derived(isDragging ? 25 : 100);

	let dragTimeout: ReturnType<typeof setTimeout>;
	function handleInput() {
		isDragging = true;
		clearTimeout(dragTimeout);
		dragTimeout = setTimeout(() => {
			isDragging = false;
		}, 200);
	}

	// Reactivity State
	let boreholes: BoreholeInstance[] = $state([]);
	let canvasElement: HTMLCanvasElement | null = $state(null);
	let containerWidth = $state(0);

	const markerColors = ['#1098ad', '#845ef7', '#1864ab', '#d9480f', '#2b8a3e', '#e67700'];

	// Add initial borehole
	onMount(() => {
		boreholes.push({
			id: crypto.randomUUID(),
			x: 0,
			y: 0,
			color: markerColors[0],
			segments: [{ startTime: 0, endTime: 5000, q: 40 }] // Initial segment: 0~5000h, 40 W/m heating
		});
	});

	function handleCanvasClick(event: MouseEvent) {
		if (!canvasElement || containerWidth <= 0) return;

		// Reverse coordinate mapping from click pixels
		const rect = canvasElement.getBoundingClientRect();
		const px = event.clientX - rect.left;
		const py = event.clientY - rect.top;

		const dpr = window.devicePixelRatio || 1;
		// Mirror the exact aspect-ratio square math from drawHeatmap
		const height = 600;
		let computedLeft = 100;
		let computedTop = 40;
		const right = 140;
		const bottom = 80;

		let innerWidth = containerWidth - computedLeft - right;
		let innerHeight = height - computedTop - bottom;

		const pxM_x = innerWidth / (X_MAX - X_MIN);
		const pxM_y = innerHeight / (Y_MAX - Y_MIN);
		const pxM = Math.min(pxM_x, pxM_y);

		const mappedWidth = pxM * (X_MAX - X_MIN);
		const mappedHeight = pxM * (Y_MAX - Y_MIN);

		computedLeft += (innerWidth - mappedWidth) / 2;
		computedTop += (innerHeight - mappedHeight) / 2;
		innerWidth = mappedWidth;
		innerHeight = mappedHeight;

		const xScale = d3
			.scaleLinear()
			.domain([X_MIN, X_MAX])
			.range([computedLeft, computedLeft + innerWidth]);
		const yScale = d3
			.scaleLinear()
			.domain([Y_MIN, Y_MAX])
			.range([computedTop + innerHeight, computedTop]);

		// Check if clicked inside drawing area
		if (
			px < computedLeft ||
			px > computedLeft + innerWidth ||
			py < computedTop ||
			py > computedTop + innerHeight
		)
			return;

		const clickX = xScale.invert(px);
		const clickY = yScale.invert(py);

		boreholes = [
			...boreholes,
			{
				id: crypto.randomUUID(),
				x: parseFloat(clickX.toFixed(1)),
				y: parseFloat(clickY.toFixed(1)),
				color: markerColors[boreholes.length % markerColors.length],
				segments: [{ startTime: 0, endTime: 10000, q: 30 }] // default positive load
			}
		];
	}

	function drawHeatmap(
		w: number,
		t: number,
		bhList: BoreholeInstance[],
		kVal: number,
		capVal: number,
		xSteps: number,
		ySteps: number
	) {
		if (!canvasElement || w <= 0) return;
		const height = 600;

		const dpr = window.devicePixelRatio || 1;
		canvasElement.width = w * dpr;
		canvasElement.height = height * dpr;
		canvasElement.style.width = `${w}px`;
		canvasElement.style.height = `${height}px`;

		const ctx = canvasElement.getContext('2d');
		if (!ctx) return;
		ctx.scale(dpr, dpr);

		// Tight right margin (cbar 15px width + 15px distance = ~60-80 depending on preference. Allow width stretch)
		const margin = { top: 40, right: 140, bottom: 80, left: 100 };
		let innerWidth = w - margin.left - margin.right;
		let innerHeight = height - margin.top - margin.bottom;

		const pxM_x = innerWidth / (X_MAX - X_MIN);
		const pxM_y = innerHeight / (Y_MAX - Y_MIN);
		const pxM = Math.min(pxM_x, pxM_y);

		const mappedWidth = pxM * (X_MAX - X_MIN);
		const mappedHeight = pxM * (Y_MAX - Y_MIN);

		margin.left += (innerWidth - mappedWidth) / 2;
		margin.top += (innerHeight - mappedHeight) / 2;
		innerWidth = mappedWidth;
		innerHeight = mappedHeight;

		const xScale = d3
			.scaleLinear()
			.domain([X_MIN, X_MAX])
			.range([margin.left, margin.left + innerWidth]);
		const yScale = d3
			.scaleLinear()
			.domain([Y_MIN, Y_MAX])
			.range([margin.top + innerHeight, margin.top]);

		ctx.clearRect(0, 0, w, height);
		ctx.fillStyle = '#ffffff';
		ctx.fillRect(margin.left, margin.top, innerWidth, innerHeight);

		const dx = (X_MAX - X_MIN) / xSteps;
		const dy = (Y_MAX - Y_MIN) / ySteps;

		const alpha = kVal / (capVal * 1e6);

		const cells = [];
		let maxAbsTemp = 0.1;

		for (let iy = 0; iy < ySteps; iy++) {
			for (let ix = 0; ix < xSteps; ix++) {
				const x_center = X_MIN + ix * dx + dx / 2;
				const y_center = Y_MIN + iy * dy + dy / 2;

				// Use the unified superposition logic!
				const T = calculateSpatialTemporalSuperposition(x_center, y_center, t, bhList, kVal, alpha);

				if (Math.abs(T) > maxAbsTemp) maxAbsTemp = Math.abs(T);
				cells.push({ xIndex: ix, yIndex: iy, T });
			}
		}

		// Divergent Thermal Palette
		const dynamicLimit = 5; // ±5 limit
		const colorScale = d3
			.scaleLinear<string>()
			.domain([-dynamicLimit, -dynamicLimit / 2, 0, dynamicLimit / 2, dynamicLimit])
			.range(['#228be6', '#d0ebff', '#ffffff', '#ffc9c9', '#fa5252'])
			.clamp(true);

		const cellPixelWidth = innerWidth / xSteps;
		const cellPixelHeight = innerHeight / ySteps;

		for (const cell of cells) {
			ctx.fillStyle = colorScale(cell.T);
			const px = margin.left + cell.xIndex * cellPixelWidth;
			const py = margin.top + innerHeight - (cell.yIndex + 1) * cellPixelHeight;
			ctx.fillRect(px, py, cellPixelWidth + 0.5, cellPixelHeight + 0.5);
		}

		// Axes and Borders Overlays
		ctx.strokeStyle = '#1f2937'; // dartwork-mpl spine
		ctx.lineWidth = 0.5;
		ctx.strokeRect(margin.left, margin.top, innerWidth, innerHeight);

		// Ticks extending OUTSIDE the spine by 6px
		ctx.beginPath();
		for (let xNum = X_MIN; xNum <= X_MAX; xNum += 5) {
			const px = xScale(xNum);
			ctx.moveTo(px, margin.top + innerHeight);
			ctx.lineTo(px, margin.top + innerHeight + 6);
		}
		for (let yNum = Y_MIN; yNum <= Y_MAX; yNum += 5) {
			const py = yScale(yNum);
			ctx.moveTo(margin.left - 6, py);
			ctx.lineTo(margin.left, py);
		}
		ctx.stroke();

		// Tick Text styling (matches borehole-fluid zinc-600)
		ctx.fillStyle = '#52525b';
		ctx.font = '500 14px sans-serif';
		ctx.textAlign = 'center';
		ctx.textBaseline = 'top';
		for (let xNum = X_MIN; xNum <= X_MAX; xNum += 5) {
			ctx.fillText(xNum.toString(), xScale(xNum), height - margin.bottom + 12);
		}

		ctx.textAlign = 'right';
		ctx.textBaseline = 'middle';
		for (let yNum = Y_MIN; yNum <= Y_MAX; yNum += 5) {
			ctx.fillText(yNum.toString(), margin.left - 12, yScale(yNum));
		}

		// Axis Labels styling (matches borehole-fluid zinc-900 semibold)
		ctx.fillStyle = '#18181b';
		ctx.font = '600 15px sans-serif';
		ctx.textAlign = 'center';
		ctx.textBaseline = 'top';
		ctx.fillText('X Position [m]', margin.left + innerWidth / 2, height - margin.bottom + 35);

		ctx.save();
		ctx.translate(margin.left - 55, margin.top + innerHeight / 2);
		ctx.rotate(-Math.PI / 2);
		ctx.textAlign = 'center';
		ctx.textBaseline = 'bottom';
		ctx.fillText('Y Position [m]', 0, 0);
		ctx.restore();

		// Borehole Markers
		let bhIndex = 1;
		for (const bh of bhList) {
			const px = xScale(bh.x);
			const py = yScale(bh.y);

			ctx.fillStyle = '#ffffff';
			ctx.beginPath();
			ctx.arc(px, py, 6, 0, 2 * Math.PI);
			ctx.fill();

			ctx.fillStyle = bh.color;
			ctx.beginPath();
			ctx.arc(px, py, 4, 0, 2 * Math.PI);
			ctx.fill();

			ctx.fillStyle = '#1f2937';
			ctx.font = '500 12px sans-serif';
			ctx.textAlign = 'right';
			ctx.textBaseline = 'middle';
			ctx.fillText(bhIndex.toString(), px - 8, py);
			bhIndex++;
		}

		// Draw Thermal Color Legend exactly 15px right of the ax
		const legendWidth = 15;
		const legendX = margin.left + innerWidth + 15;
		const legendY = margin.top;
		const legendHeight = innerHeight;

		const legendSteps = 60;
		for (let i = 0; i < legendSteps; i++) {
			const val = dynamicLimit - 2 * dynamicLimit * (i / legendSteps);
			ctx.fillStyle = colorScale(val);
			ctx.fillRect(
				legendX,
				legendY + i * (legendHeight / legendSteps),
				legendWidth,
				Math.ceil(legendHeight / legendSteps) + 0.5
			);
		}

		ctx.strokeStyle = '#1f2937';
		ctx.lineWidth = 0.5;
		ctx.strokeRect(legendX, legendY, legendWidth, legendHeight);

		// Rotated Cbar Label
		ctx.save();
		ctx.translate(legendX + legendWidth + 45, legendY + legendHeight / 2);
		ctx.rotate(-Math.PI / 2);
		ctx.textAlign = 'center';
		ctx.textBaseline = 'bottom';
		ctx.font = '600 15px sans-serif';
		ctx.fillStyle = '#18181b';
		ctx.fillText('Temperature difference [K]', 0, 0);
		ctx.restore();

		ctx.fillStyle = '#52525b';
		ctx.textAlign = 'left';
		ctx.textBaseline = 'middle';
		ctx.font = '14px sans-serif';
		ctx.fillText(`+${dynamicLimit.toFixed(1)}`, legendX + legendWidth + 8, legendY);
		ctx.fillText('0', legendX + legendWidth + 8, legendY + legendHeight / 2);
		ctx.fillText(`-${dynamicLimit.toFixed(1)}`, legendX + legendWidth + 8, legendY + legendHeight);
	}

	$effect(() => {
		// Cap local boreholes segments to global time
		for (const bh of boreholes) {
			if (bh.segments[0].endTime > timeHours) bh.segments[0].endTime = timeHours;
			if (bh.segments[0].startTime > timeHours) bh.segments[0].startTime = timeHours;
		}
	});

	$effect(() => {
		const w = containerWidth || 800;
		drawHeatmap(w, timeHours, boreholes, Number(k), Number(rhoCp_MJ), X_STEPS, Y_STEPS);
	});

	// Removed segment logic since we only use segments[0] now

	function removeBorehole(id: string) {
		boreholes = boreholes.filter((b) => b.id !== id);
	}
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
				Duhamel's Superposition Method
			</h1>
			<p class="max-w-3xl text-lg leading-relaxed font-light text-zinc-500">
				A complete framework exploring <b>Spatial Thermal Interference</b> alongside
				<b>Temporal Step Load Superposition</b>. Click anywhere on the map to place boreholes and
				design complex load schedules simulating actual building energy behavior.
			</p>
		</div>

		<!-- Equation 6.7 Block -->
		<div class="mb-12 rounded-2xl border border-zinc-200 bg-zinc-50 p-6 shadow-sm md:p-8">
			<h2 class="mb-6 text-sm font-semibold tracking-widest text-zinc-900 uppercase">
				Mathematical Formulation
			</h2>
			<p class="mb-4 text-[15px] leading-relaxed font-medium text-zinc-800">
				<strong>Equation 6.7</strong> According to Duhamel's theorem, the problems of time-varying loads
				can easily be tackled by using the solution to the problem for a unit-step load (Carslaw and Jaeger,
				1959; Ozisik, 1993):
			</p>
			<div
				class="my-8 overflow-x-auto rounded-xl border border-zinc-200 bg-white py-6 text-center text-xl text-zinc-900 shadow-sm"
			>
				{@html renderMath(
					`T_1(\\mathbf{x}, t) = T_{s,0} + \\int_0^t q_l(\\tau) \\frac{\\partial G(\\mathbf{x}, t - \\tau)}{\\partial t} d\\tau`,
					true
				)}
			</div>
		</div>

		<div class="mb-12 grid grid-cols-1 gap-8 xl:grid-cols-[1fr_320px]">
			<!-- Heatmap Display -->
			<!-- Heatmap Display -->
			<div class="flex flex-col rounded-2xl border border-zinc-200 bg-zinc-50 pb-6 shadow-sm">
				<div class="flex items-center justify-between p-6 pb-2">
					<div>
						<h3 class="mb-1 text-sm font-semibold tracking-widest text-zinc-900">
							Interactive Thermal Field
						</h3>
						<p class="text-xs text-zinc-500">Tap anywhere on the grid to deploy a new borehole</p>
					</div>
					<span
						class="pointer-events-none flex items-center gap-2 rounded-md border border-zinc-200 bg-white px-2.5 py-1 font-mono text-xs text-zinc-500 shadow-sm"
					>
						Canvas 2D Divergent
					</span>
				</div>
				<div class="relative flex h-[600px] w-full flex-grow justify-center px-6">
					<div
						class="h-full w-full cursor-crosshair overflow-hidden rounded-xl border border-zinc-100 shadow-inner"
						bind:clientWidth={containerWidth}
						onpointerdown={handleCanvasClick}
					>
						<canvas bind:this={canvasElement} class="bg-white"></canvas>
					</div>
				</div>
			</div>

			<!-- Global Controls Panel -->
			<div class="space-y-8 rounded-2xl border border-zinc-200 bg-zinc-50 p-6 shadow-sm">
				<h2
					class="border-b border-zinc-200 pb-2 text-sm font-semibold tracking-widest text-zinc-900"
				>
					Global Environment
				</h2>

				<!-- Time -->
				<div class="space-y-3 border-b border-zinc-200 pb-6">
					<label class="flex justify-between text-base font-medium text-zinc-700">
						<span>Global Time ({@html renderMath('t')})</span>
						<span class="font-bold text-zinc-900"
							>{timeHours >= 10 ? Math.round(timeHours).toLocaleString() : timeHours.toFixed(1)} h</span
						>
					</label>
					<input
						type="range"
						min="0"
						max="5.2"
						step="0.02"
						bind:value={timeLog}
						oninput={handleInput}
						class="h-1 w-full cursor-pointer appearance-none rounded-full bg-zinc-200 accent-zinc-900"
					/>
					<div class="flex justify-between font-mono text-sm text-zinc-400">
						<span>1 h</span>
						<span>~18 Years</span>
					</div>
				</div>

				<!-- Thermal Properties -->
				<div class="space-y-6">
					<div class="space-y-3">
						<label class="flex justify-between text-base font-medium text-zinc-700">
							<span>Thermal conductivity ({@html renderMath('k_s')})</span>
							<span class="font-bold text-zinc-900">{Number(k).toFixed(1)}</span>
						</label>
						<input
							type="range"
							min="1.0"
							max="4.0"
							step="0.1"
							bind:value={k}
							oninput={handleInput}
							class="h-1 w-full cursor-pointer appearance-none rounded-full bg-zinc-200 accent-zinc-900"
						/>
					</div>

					<div class="space-y-3">
						<label class="flex justify-between text-base font-medium text-zinc-700">
							<span>Volumetric heat capacity ({@html renderMath('\\rho c_p')})</span>
							<span class="font-bold text-zinc-900">{Number(rhoCp_MJ).toFixed(1)}</span>
						</label>
						<input
							type="range"
							min="1.0"
							max="3.5"
							step="0.1"
							bind:value={rhoCp_MJ}
							oninput={handleInput}
							class="h-1 w-full cursor-pointer appearance-none rounded-full bg-zinc-200 accent-zinc-900"
						/>
					</div>
				</div>
			</div>
		</div>

		<!-- Multi-instance Borehole Schedulers -->
		<h2 class="mb-6 flex items-center gap-3 text-xl font-bold tracking-tight text-zinc-900">
			Borehole Load Schedulers
			<span
				class="rounded-full border border-zinc-200 bg-zinc-100 px-3 py-1 text-sm font-normal text-zinc-600"
				>{boreholes.length} Active</span
			>
		</h2>

		{#if boreholes.length === 0}
			<div class="rounded-2xl border-2 border-dashed border-zinc-200 p-12 text-center">
				<p class="text-zinc-500">
					No boreholes active. Click on the thermal grid above to strategically place a borehole.
				</p>
			</div>
		{:else}
			<div class="grid grid-cols-1 gap-6 lg:grid-cols-2 2xl:grid-cols-3">
				{#each boreholes as bh, index}
					<div
						class="flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm"
					>
						<!-- Header -->
						<div
							class="flex items-center justify-between border-b border-zinc-100 bg-zinc-50/50 px-5 py-4"
						>
							<div class="flex items-center gap-3">
								<span
									class="h-4 w-4 rounded-full shadow-inner"
									style="background-color: {bh.color};"
								></span>
								<h3 class="font-semibold text-zinc-900">Borehole {index + 1}</h3>
								<span
									class="rounded border border-zinc-200 bg-white px-2 py-0.5 font-mono text-xs text-zinc-500"
								>
									x: {bh.x}, y: {bh.y}
								</span>
							</div>
							<button
								onclick={() => removeBorehole(bh.id)}
								class="rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-500"
								title="Remove Borehole"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-4 w-4"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"
									></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg
								>
							</button>
						</div>

						<!-- Single Schedule Segment -->
						<div class="flex-grow space-y-6 p-5">
							<div class="space-y-4">
								<div class="flex items-center justify-between">
									<label class="text-[10px] font-bold tracking-widest text-zinc-500">
										Timeline [h]
									</label>
									<span class="font-mono text-xs font-bold text-zinc-900">
										{Math.round(bh.segments[0].startTime).toLocaleString()} - {Math.round(
											bh.segments[0].endTime
										).toLocaleString()}
									</span>
								</div>

								<!-- Dual thumb strategy overlay -->
								<div class="relative h-1.5 w-full rounded-full bg-zinc-200">
									<!-- Active highlight track -->
									<div
										class="absolute top-0 h-full rounded-full bg-zinc-600"
										style="left: {(bh.segments[0].startTime / timeHours) * 100}%; right: {100 -
											(bh.segments[0].endTime / timeHours) * 100}%;"
									></div>

									<input
										type="range"
										min="0"
										max={timeHours}
										step="any"
										bind:value={bh.segments[0].startTime}
										oninput={(e) => {
											handleInput();
											if (bh.segments[0].startTime > bh.segments[0].endTime)
												bh.segments[0].startTime = bh.segments[0].endTime;
										}}
										class="dual-range absolute -top-1 w-full appearance-none bg-transparent"
									/>

									<input
										type="range"
										min="0"
										max={timeHours}
										step="any"
										bind:value={bh.segments[0].endTime}
										oninput={(e) => {
											handleInput();
											if (bh.segments[0].endTime < bh.segments[0].startTime)
												bh.segments[0].endTime = bh.segments[0].startTime;
										}}
										class="dual-range absolute -top-1 w-full appearance-none bg-transparent"
									/>
								</div>
							</div>

							<div class="space-y-3">
								<label
									class="flex justify-between text-[11px] font-bold tracking-widest text-zinc-500"
								>
									<span>Heat Load ({@html renderMath('q')}) [W/m]</span>
									<span
										class="font-mono font-bold"
										class:text-red-500={bh.segments[0].q > 0}
										class:text-blue-500={bh.segments[0].q < 0}
										class:text-zinc-500={bh.segments[0].q === 0}
									>
										{bh.segments[0].q > 0 ? '+' : ''}{bh.segments[0].q}
									</span>
								</label>
								<input
									type="range"
									min="-100"
									max="100"
									step="5"
									bind:value={bh.segments[0].q}
									oninput={handleInput}
									class="h-1 w-full cursor-pointer appearance-none rounded-full bg-zinc-200 accent-zinc-900"
								/>
								<div
									class="flex justify-between text-[10px] font-medium tracking-wide text-zinc-400"
								>
									<span class="text-blue-400">Extraction (-)</span>
									<span class="text-red-400">Injection (+)</span>
								</div>
							</div>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>

<style>
	.dual-range {
		pointer-events: none;
	}
	.dual-range::-webkit-slider-thumb {
		pointer-events: auto;
		-webkit-appearance: none;
		appearance: none;
		width: 14px;
		height: 14px;
		background: #18181b;
		border-radius: 50%;
		cursor: pointer;
		position: relative;
		z-index: 10;
	}
	.dual-range::-moz-range-thumb {
		pointer-events: auto;
		width: 14px;
		height: 14px;
		background: #18181b;
		border-radius: 50%;
		cursor: pointer;
		border: none;
		position: relative;
		z-index: 10;
	}
</style>
