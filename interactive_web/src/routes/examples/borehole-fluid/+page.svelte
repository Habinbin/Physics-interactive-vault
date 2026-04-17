<script lang="ts">
	import * as d3 from 'd3';
	import { calculateFluidTemperatures } from '$lib/physics/boreholeFluid';
	import katex from 'katex';

	function renderMath(tex: string, displayMode = false) {
		try {
			return katex.renderToString(tex, { throwOnError: false, displayMode });
		} catch {
			return tex;
		}
	}

	// Properties
	let ql = $state(40); // W/m
	let H = $state(150); // m
	let Tf_base = $state(15); // °C
	let rho = 1000; // Water approx
	let cp = 4184; // J/kgK approx

	let Vf_lpm = $state(15); // Liters per minute
	let Vf_m3s = $derived(Vf_lpm / 60000);

	// Single point calculation for the UI display
	let temps = $derived(calculateFluidTemperatures(Tf_base, Number(ql), Number(H), rho, cp, Vf_m3s));

	// Range of flow rates for drawing the curve: 1 to 40 LPM (with smaller steps for smoothness)
	const vfScalePoints = Array.from({ length: 160 }, (_, i) => (i + 1) * 0.25); // 0.25 to 40 LPM

	// Layout and scales
	let containerWidth = $state(600);
	const height = 500;
	const margin = { top: 40, right: 40, bottom: 60, left: 70 };
	let innerWidth = $derived((containerWidth || 600) - margin.left - margin.right);
	let innerHeight = height - margin.top - margin.bottom;

	let xScale = $derived(
		d3
			.scaleLinear()
			.domain([0, 40])
			.range([margin.left, margin.left + innerWidth])
	);
	// Fixed y-axis at 20 limit
	let yScale = d3
		.scaleLinear()
		.domain([0, 20])
		.range([height - margin.bottom, margin.top]);

	// Derive SVG path for delta T
	let linePath = $derived.by(() => {
		const points = vfScalePoints.map((lpm) => {
			const v_m3s = lpm / 60000;
			const res = calculateFluidTemperatures(Tf_base, Number(ql), Number(H), rho, cp, v_m3s);
			return [lpm, res.deltaT];
		});

		const line = d3
			.line()
			.x((d) => xScale(d[0]))
			.y((d) => yScale(d[1]))
			.curve(d3.curveMonotoneX);

		return line(points as [number, number][]) || '';
	});

	// Ticks
	const xTicks = d3.ticks(0, 40, 8); // [0, 5, 10, ... 40]
	const minorXTicks = d3.ticks(0, 40, 40); // every 1 LPM
	const yTicks = d3.ticks(0, 20, 4); // [0, 5, 10, 15, 20]
	const minorYTicks = d3.ticks(0, 20, 20); // every 1 K
</script>

<div class="min-h-screen bg-white font-sans text-zinc-900 selection:bg-zinc-200">
	<div class="mx-auto max-w-7xl px-6 py-12 lg:px-8">
		<div class="mb-12">
			<a
				href="/"
				class="mb-4 inline-block text-sm font-semibold tracking-widest text-zinc-500 uppercase transition-colors hover:text-zinc-900"
				>← Dashboard</a
			>
			<h1 class="mb-4 text-4xl font-bold tracking-tight text-zinc-900">Borehole Fluid Balance</h1>
			<p class="mb-8 max-w-3xl text-lg leading-relaxed font-light text-zinc-500">
				Examine the fluid energy balance. Observe the inversely proportional relationship between
				flow rate and the required temperature difference.
			</p>

			<div class="mb-10 rounded-2xl border border-zinc-200 bg-zinc-50 p-6 md:p-8">
				<h2 class="mb-6 text-sm font-semibold tracking-widest text-zinc-900 uppercase">
					Mathematical Formulation
				</h2>
				<div
					class="my-8 overflow-x-auto rounded-xl border border-zinc-200 bg-white py-4 text-center text-xl text-zinc-900 shadow-sm"
				>
					{@html renderMath('q_l H = \\rho_f c_f V_f |T_{f,in} - T_{f,out}|', true)}
				</div>
				<p class="mx-auto max-w-2xl text-center text-sm leading-relaxed text-zinc-500">
					Observe the inversely proportional relationship between flow rate and the required
					temperature difference.
				</p>
			</div>
		</div>

		<div class="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
			<!-- Graph Section -->
			<div
				class="flex flex-col rounded-2xl border border-zinc-200 bg-zinc-50 shadow-sm"
				bind:clientWidth={containerWidth}
			>
				<div class="p-6 pb-2">
					<h2 class="mb-1 text-lg font-bold tracking-tight text-zinc-900">
						Temperature Diff vs Flow Rate
					</h2>
					<p class="text-sm font-light text-zinc-500">
						The inverse curve highlights how higher flow rates rapidly decrease the temperature
						split.
					</p>
				</div>

				<div class="relative flex h-[500px] w-full flex-grow justify-center overflow-hidden">
					<svg width={containerWidth || 600} {height} class="absolute inset-0">
						<defs>
							<clipPath id="plot-area">
								<rect x={margin.left} y={margin.top} width={innerWidth} height={innerHeight} />
							</clipPath>
						</defs>

						<!-- Grid Lines -->
						<g stroke-dasharray="2 2" stroke="#6b7280" stroke-width="0.5" opacity="0.5">
							{#each xTicks as tick}
								<line
									x1={xScale(tick)}
									y1={margin.top}
									x2={xScale(tick)}
									y2={height - margin.bottom}
								/>
							{/each}
							{#each yTicks as tick}
								<line
									x1={margin.left}
									y1={yScale(tick)}
									x2={margin.left + innerWidth}
									y2={yScale(tick)}
								/>
							{/each}
						</g>

						<!-- Line Curve (Clipped to domain) -->
						<path
							d={linePath}
							fill="none"
							stroke="#3b82f6"
							stroke-width="2.5"
							stroke-linecap="round"
							stroke-linejoin="round"
							clip-path="url(#plot-area)"
						/>

						<!-- Current Value Marker -->
						{#key [ql, H, Tf_base, Vf_lpm]}
							<!-- Bound the marker so it doesn't float outside the SVG box if it exceeds 20 -->
							{#if temps.deltaT <= 20}
								{@const cx = xScale(Vf_lpm)}
								{@const cy = yScale(temps.deltaT)}
								<circle {cx} {cy} r="5" fill="#3b82f6" stroke="#ffffff" stroke-width="1.5" />
								<text
									x={cx + 10}
									y={cy - 10}
									class="border border-zinc-200 fill-zinc-900 text-[14px] font-semibold"
								>
									|T<tspan dy="2" font-size="11">f,in</tspan><tspan dy="-2"></tspan> - T<tspan
										dy="2"
										font-size="11">f,out</tspan
									><tspan dy="-2"></tspan>|: {temps.deltaT.toFixed(1)} K
								</text>
							{/if}
						{/key}

						<!-- Sub-Spine Minor Ticks Removed -->

						<!-- Major Ticks -->
						<g stroke="#1f2937" stroke-width="0.5">
							{#each xTicks as tick}
								<line
									x1={xScale(tick)}
									y1={height - margin.bottom}
									x2={xScale(tick)}
									y2={height - margin.bottom + 6}
								/>
							{/each}
							{#each yTicks as tick}
								<line x1={margin.left - 6} y1={yScale(tick)} x2={margin.left} y2={yScale(tick)} />
							{/each}
						</g>

						<!-- Spine borders (dartwork-mpl) -->
						<rect
							x={margin.left}
							y={margin.top}
							width={innerWidth}
							height={innerHeight}
							fill="none"
							stroke="#1f2937"
							stroke-width="0.5"
						/>

						<!-- Labels -->
						<!-- X-axis Text -->
						{#each xTicks as tick}
							<text
								x={xScale(tick)}
								y={height - margin.bottom + 25}
								text-anchor="middle"
								class="fill-zinc-600 text-[14px] font-medium"
							>
								{tick}
							</text>
						{/each}
						<text
							x={margin.left + innerWidth / 2}
							y={height - margin.bottom + 48}
							class="fill-zinc-900 text-[15px] font-semibold"
							text-anchor="middle">Flow Rate [L/min]</text
						>

						<!-- Y-axis Text -->
						{#each yTicks as tick}
							<text
								x={margin.left - 12}
								y={yScale(tick) + 1}
								text-anchor="end"
								dominant-baseline="middle"
								class="fill-zinc-600 text-[14px] font-medium"
							>
								{tick}
							</text>
						{/each}

						<g
							transform={`translate(${margin.left - 45}, ${margin.top + innerHeight / 2}) rotate(-90)`}
						>
							<text
								x="0"
								y="0"
								text-anchor="middle"
								class="fill-zinc-900 text-[15px] font-semibold"
							>
								Fluid inlet outlet temperature difference [K]
							</text>
						</g>
					</svg>
				</div>
			</div>

			<!-- Controls & Real-time Readout -->
			<div class="space-y-6">
				<!-- Metrics (Monochrome dartwork-style) -->
				<div class="rounded-2xl border border-zinc-200 bg-white p-6 text-zinc-900 shadow-sm">
					<h3
						class="mb-4 border-b border-zinc-100 pb-2 text-xs font-bold tracking-widest text-zinc-500"
					>
						Current Conditions
					</h3>

					<div class="mb-4 grid grid-cols-2 gap-4">
						<div class="space-y-1">
							<span class="block text-[11px] font-medium tracking-wider text-zinc-500"
								>Inlet {@html renderMath('T_{f,in}')}</span
							>
							<span class="font-mono text-xl font-bold text-zinc-900"
								>{temps.Tf_in.toFixed(1)} °C</span
							>
						</div>
						<div class="space-y-1">
							<span class="block text-[11px] font-medium tracking-wider text-zinc-500"
								>Outlet {@html renderMath('T_{f,out}')}</span
							>
							<span class="font-mono text-xl font-bold text-zinc-900"
								>{temps.Tf_out.toFixed(1)} °C</span
							>
						</div>
					</div>
					<div
						class="-mx-6 -mb-6 space-y-1 rounded-b-2xl border-t border-zinc-100 bg-zinc-50/50 p-6 pt-4"
					>
						<span class="block text-[11px] font-medium tracking-wider text-zinc-500"
							>Temp Diff {@html renderMath('|T_{f,in} - T_{f,out}|')}</span
						>
						<span class="font-mono text-2xl font-bold text-zinc-900"
							>{temps.deltaT.toFixed(1)} K</span
						>
					</div>
				</div>

				<!-- Sliders -->
				<div class="space-y-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
					<div class="space-y-2">
						<label class="flex justify-between text-sm font-medium text-zinc-700">
							<span>Flow Rate ({@html renderMath('V_f')})</span>
							<span class="font-bold text-zinc-900">{Number(Vf_lpm).toFixed(1)} L/min</span>
						</label>
						<input
							type="range"
							min="1"
							max="40"
							step="0.5"
							bind:value={Vf_lpm}
							class="h-1 w-full cursor-pointer appearance-none rounded-full bg-zinc-200 accent-zinc-900"
						/>
					</div>

					<div class="space-y-2">
						<label class="flex justify-between text-sm font-medium text-zinc-700">
							<span>Heat Transfer ({@html renderMath('q_l')})</span>
							<span class="font-bold text-zinc-900">{Number(ql).toFixed(0)} W/m</span>
						</label>
						<input
							type="range"
							min="10"
							max="100"
							step="5"
							bind:value={ql}
							class="h-1 w-full cursor-pointer appearance-none rounded-full bg-zinc-200 accent-zinc-900"
						/>
					</div>

					<div class="space-y-2">
						<label class="flex justify-between text-sm font-medium text-zinc-700">
							<span>Borehole Length ({@html renderMath('H')})</span>
							<span class="font-bold text-zinc-900">{Number(H).toFixed(0)} m</span>
						</label>
						<input
							type="range"
							min="50"
							max="300"
							step="10"
							bind:value={H}
							class="h-1 w-full cursor-pointer appearance-none rounded-full bg-zinc-200 accent-zinc-900"
						/>
					</div>

					<div class="space-y-2">
						<label class="flex justify-between text-sm font-medium text-zinc-700">
							<span>Ground Temp ({@html renderMath('T_f')})</span>
							<span class="font-bold text-zinc-900">{Number(Tf_base).toFixed(1)} °C</span>
						</label>
						<input
							type="range"
							min="5"
							max="30"
							step="1"
							bind:value={Tf_base}
							class="h-1 w-full cursor-pointer appearance-none rounded-full bg-zinc-200 accent-zinc-900"
						/>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
