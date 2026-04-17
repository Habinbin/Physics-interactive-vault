<script lang="ts">
	import { onMount } from 'svelte';
	import * as d3 from 'd3';
	import {
		calculateRadialHeatSpread,
		calculateCylindricalResistance
	} from '$lib/physics/cylindrical';
	import katex from 'katex';

	function renderMath(tex: string, displayMode = false) {
		try {
			return katex.renderToString(tex, { throwOnError: false, displayMode });
		} catch {
			return tex;
		}
	}

	// Variables
	let timeLog = $state(2); // 100h
	let timeHours = $derived(Math.pow(10, Number(timeLog)));

	let k = $state(2.0);
	let rhoCp_MJ = $state(2.4);
	let alpha = $derived(Number(k) / (Number(rhoCp_MJ) * 1e6));

	let ql = $state(30);

	// 1st Figure: Heat Spread
	let heatPlotWidth = $state(400);

	let heatSpreadInfo = $derived.by(() => {
		const points = [];
		const r_start = 0.05;
		const r_max = 5.0; // match R_MAX
		const steps = 200;
		for (let i = 0; i <= steps; i++) {
			const r = r_start + ((r_max - r_start) * i) / steps;
			const T = calculateRadialHeatSpread(r, timeHours * 3600, ql, k, alpha);
			points.push([r, T]);
		}

		const innerWidth = Math.max(100, heatPlotWidth - 120);
		const yMax = 10;
		const xScale = d3.scaleLinear().domain([0, r_max]).range([0, innerWidth]);
		const yScale = d3.scaleLinear().domain([0, yMax]).range([300, 0]);

		const line = d3
			.line()
			.x((d) => xScale(d[0]))
			.y((d) => yScale(d[1]));

		return {
			path: line(points as [number, number][]) || '',
			yMax,
			xScale,
			yScale
		};
	});
	let xScaleHeat = $derived(heatSpreadInfo.xScale as any);
	let yScaleHeat = $derived(heatSpreadInfo.yScale as any);

	// Domain Config
	const R_MAX = 5.0; // Outer boundary for view
	const X_MIN = -R_MAX;
	const X_MAX = R_MAX;
	const Y_MIN = -R_MAX;
	const Y_MAX = R_MAX;
	const X_STEPS = 100;
	const Y_STEPS = 100;

	// Resistance Chart
	let res_L = $state(1.0);
	let res_k = $state(2.0);
	let res_r1 = $state(0.05);
	let res_r2 = $state(0.25);

	// Ensure r1 and r2 do not cross boundaries
	$effect(() => {
		if (res_r2 <= res_r1) {
			res_r2 = res_r1 + 0.01;
		}
	});

	// Changed points range to track up to 0.5m
	const r2Points = Array.from({ length: 50 }, (_, i) => res_r1 + ((0.5 - res_r1) * i) / 49);
	const yPlotMaxStatic = 1.0;
	let resPlotWidth = $state(400);

	let resistancePlotData = $derived.by(() => {
		const points = r2Points
			.filter((r2) => r2 >= res_r1)
			.map((r2) => {
				const R = calculateCylindricalResistance(res_r1, r2, res_k, res_L);
				return [r2, R];
			});

		const innerWidth = Math.max(100, resPlotWidth - 120);
		const currentR =
			res_r2 > res_r1 ? calculateCylindricalResistance(res_r1, res_r2, res_k, res_L) : 0;

		const xScale = d3.scaleLinear().domain([0, 0.5]).range([0, innerWidth]);
		const yScale = d3.scaleLinear().domain([0, yPlotMaxStatic]).range([300, 0]);

		const line = d3
			.line()
			.x((d) => xScale(d[0]))
			.y((d) => yScale(d[1]))
			.curve(d3.curveMonotoneX);

		return {
			path: line(points as [number, number][]) || '',
			xScale,
			yScale,
			currentR
		};
	});
	let xScaleRes = $derived(resistancePlotData.xScale as any);

	// --- 3rd Figure: Multi-Layer Cylindrical Model ---
	let r_pin = $state(0.016);
	let r_pout = $state(0.02);
	let r_b = $state(0.075);
	let kp = $state(0.4);
	let kg = $state(1.5);

	$effect(() => {
		if (r_pin >= r_pout) r_pin = r_pout - 0.001;
		if (r_pout >= r_b) r_pout = r_b - 0.001;
	});

	let T_f = $state(30);
	let h_f = $state(1000);
	let T_b = $state(15);

	let Rw = $derived(1 / (2 * Math.PI * r_pin * h_f));
	let Rp = $derived(calculateCylindricalResistance(r_pin, r_pout, kp, 1));
	let Rg = $derived(calculateCylindricalResistance(r_pout, r_b, kg, 1));

	let q_layer = $derived((T_f - T_b) / (Rw + Rp + Rg));

	let layerPlotWidth = $state(400);

	let layerProfileInfo = $derived.by(() => {
		const points = [];
		const r_step = 0.001;
		if (r_b <= 0 || r_pin <= 0) return { path: '', yMax: 40 };

		for (let r = 0; r <= r_b; r += r_step) {
			let T = T_b;
			if (r < r_pin) {
				const T_wall_inner = T_f - q_layer * Rw;
				T = T_f - (T_f - T_wall_inner) * (r / r_pin);
			} else if (r <= r_pout) {
				const r_res_partial = calculateCylindricalResistance(r, r_pout, kp, 1);
				T = T_b + q_layer * (Rg + r_res_partial);
			} else {
				const r_res_partial = calculateCylindricalResistance(r, r_b, kg, 1);
				T = T_b + q_layer * r_res_partial;
			}
			points.push([r, T]);
		}
		points.push([r_b, T_b]);
		if (r_b < 0.15) {
			points.push([0.15, T_b]);
		}

		const innerWidth = Math.max(100, layerPlotWidth - 120);
		const xScale = d3.scaleLinear().domain([0, 0.15]).range([0, innerWidth]);
		const yMax = 40;
		const yScale = d3.scaleLinear().domain([0, yMax]).range([250, 0]);

		const line = d3
			.line()
			.x((d) => xScale(d[0]))
			.y((d) => yScale(d[1]));

		return {
			path: line(points as [number, number][]) || '',
			yMax,
			xScale,
			yScale,
			innerWidth
		};
	});
	let xScaleL2 = $derived(layerProfileInfo.xScale as any);
	let yScaleL2 = $derived(layerProfileInfo.yScale as any);
</script>

<div class="min-h-screen bg-white font-sans text-zinc-900 selection:bg-zinc-200">
	<div class="mx-auto max-w-7xl px-6 py-12 lg:px-8">
		<div class="mb-12">
			<a
				href="/"
				class="mb-4 inline-block text-sm font-semibold tracking-widest text-zinc-500 uppercase transition-colors hover:text-zinc-900"
				>← Dashboard</a
			>
			<h1 class="mb-4 text-4xl font-bold tracking-tight text-zinc-900">Cylindrical Coordinates</h1>
			<p class="mb-8 max-w-3xl text-lg leading-relaxed font-light text-zinc-500">
				Analyze 1D radial heat conduction around a cylindrical source and evaluate the equivalent
				thermal resistance.
			</p>

			<div class="rounded-2xl border border-zinc-200 bg-zinc-50 p-6">
				<h2
					class="mb-4 border-b border-zinc-200 pb-2 text-sm font-semibold tracking-widest text-zinc-900 uppercase"
				>
					1D Radial Transient Heat Conduction
				</h2>
				<div class="overflow-x-auto py-4 text-center text-lg">
					{@html renderMath(
						'\\frac{\\partial T}{\\partial t} = \\alpha \\left( \\frac{\\partial^2 T}{\\partial r^2} + \\frac{1}{r} \\frac{\\partial T}{\\partial r} \\right)',
						true
					)}
				</div>
				<p class="mt-4 text-center text-sm leading-relaxed font-light text-zinc-600">
					The temperature rise {@html renderMath('\\Delta T(r,t)')} can be approximated using the exponential
					integral solution {@html renderMath('E_1')} for an infinite medium:
				</p>
				<div class="overflow-x-auto py-2 text-center text-lg">
					{@html renderMath(
						'\\Delta T(r,t) \\approx \\frac{q_l}{4\\pi k} E_1\\left(\\frac{r^2}{4\\alpha t}\\right)',
						true
					)}
				</div>
			</div>
		</div>

		<div class="mb-12 grid grid-cols-1 gap-8 xl:grid-cols-[1fr_380px]">
			<!-- Heat Spread Display -->
			<div
				class="flex flex-col rounded-2xl border border-zinc-200 bg-zinc-50 pb-6 shadow-sm"
				bind:clientWidth={heatPlotWidth}
			>
				<div class="flex items-center justify-between p-6 pb-2">
					<div>
						<h3 class="mb-1 text-sm font-semibold tracking-widest text-zinc-900 uppercase">
							Radial Heat Spread
						</h3>
						<p class="text-xs text-zinc-500">Temperature rise profile from line source</p>
					</div>
				</div>
				<div class="relative flex flex-grow justify-center px-6">
					<svg width={Math.max(200, heatPlotWidth - 48)} height="400" class="overflow-visible">
						<defs>
							<clipPath id="heatClip">
								<rect x="0" y="0" width={Math.max(100, heatPlotWidth - 120)} height="300" />
							</clipPath>
						</defs>
						<g transform="translate(70, 10)">
							<!-- dartwork-mpl Spine -->
							<rect
								x="0"
								y="0"
								width={Math.max(100, heatPlotWidth - 120)}
								height="300"
								fill="none"
								stroke="#1f2937"
								stroke-width="0.5"
							/>

							<!-- Grid Lines -->
							<g stroke-dasharray="2 2" stroke="#6b7280" stroke-width="0.5" opacity="0.5">
								{#each [0, 1.0, 2.0, 3.0, 4.0, 5.0] as xTick}
									<line x1={xScaleHeat(xTick)} y1="0" x2={xScaleHeat(xTick)} y2="300" />
								{/each}
								{#each [0, 2, 4, 6, 8, 10] as yTick}
									<line
										x1="0"
										y1={300 - yTick * 30}
										x2={Math.max(100, heatPlotWidth - 120)}
										y2={300 - yTick * 30}
									/>
								{/each}
							</g>

							<!-- Data Line -->
							<path
								d={heatSpreadInfo.path}
								fill="none"
								stroke="#ef4444"
								stroke-width="2.5"
								stroke-linecap="round"
								stroke-linejoin="round"
								clip-path="url(#heatClip)"
							/>

							<!-- Labels -->
							<text
								x={Math.max(100, heatPlotWidth - 120) / 2}
								y="338"
								class="fill-zinc-900 text-[15px] font-semibold"
								text-anchor="middle">Radius r [m]</text
							>
							<g transform="translate(-50, 150) rotate(-90)">
								<text
									x="0"
									y="0"
									class="fill-zinc-900 text-[15px] font-semibold"
									text-anchor="middle">Temperature difference [K]</text
								>
							</g>

							<!-- Major Ticks -->
							<g stroke="#1f2937" stroke-width="0.5">
								{#each [0, 1.0, 2.0, 3.0, 4.0, 5.0] as xTick}
									<line x1={xScaleHeat(xTick)} y1="300" x2={xScaleHeat(xTick)} y2="306" />
									<text
										x={xScaleHeat(xTick)}
										y="322"
										class="fill-zinc-600 text-[14px] font-medium"
										stroke="none"
										text-anchor="middle">{xTick.toFixed(1)}</text
									>
								{/each}

								{#each [0, 2, 4, 6, 8, 10] as yTick}
									<line x1="-6" y1={300 - yTick * 30} x2="0" y2={300 - yTick * 30} />
									<text
										x="-12"
										y={300 - yTick * 30 + 4}
										class="fill-zinc-600 text-[14px] font-medium"
										stroke="none"
										dominant-baseline="middle"
										text-anchor="end">{yTick}</text
									>
								{/each}
							</g>
						</g>
					</svg>
				</div>
			</div>

			<!-- Controls Panel -->
			<div class="space-y-8 rounded-2xl border border-zinc-200 bg-zinc-50 p-6 shadow-sm">
				<h2
					class="border-b border-zinc-200 pb-2 text-sm font-semibold tracking-widest text-zinc-900 uppercase"
				>
					Global Environment
				</h2>

				<div class="space-y-3 border-b border-zinc-200 pb-6">
					<label class="flex justify-between text-base font-medium text-zinc-700">
						<span>Time ({@html renderMath('t')})</span>
						<span class="font-bold text-zinc-900"
							>{timeHours >= 10 ? Math.round(timeHours).toLocaleString() : timeHours.toFixed(1)} h</span
						>
					</label>
					<input
						type="range"
						min="0"
						max="4"
						step="0.05"
						bind:value={timeLog}
						class="h-1 w-full cursor-pointer appearance-none rounded-full bg-zinc-200 accent-zinc-900"
					/>
				</div>

				<div class="space-y-4 border-b border-zinc-200 pb-6">
					<div class="space-y-2">
						<label class="flex justify-between text-sm font-medium text-zinc-700">
							<span>Heat Flux ({@html renderMath('q_l')})</span>
							<span class="font-bold text-zinc-900">{Number(ql).toFixed(1)} W/m</span>
						</label>
						<input
							type="range"
							min="10"
							max="100"
							step="1"
							bind:value={ql}
							class="h-1 w-full cursor-pointer appearance-none rounded-full bg-zinc-200 accent-zinc-900"
						/>
					</div>
					<!-- r1 slider removed -->
				</div>

				<div class="space-y-4">
					<div class="space-y-2">
						<label class="flex justify-between text-sm font-medium text-zinc-700">
							<span>Thermal conductivity ({@html renderMath('k')})</span>
							<span class="font-bold text-zinc-900">{Number(k).toFixed(1)}</span>
						</label>
						<input
							type="range"
							min="1.0"
							max="4.0"
							step="0.1"
							bind:value={k}
							class="h-1 w-full cursor-pointer appearance-none rounded-full bg-zinc-200 accent-zinc-900"
						/>
					</div>

					<div class="space-y-1">
						<label class="flex justify-between text-sm font-medium text-zinc-700">
							<span>Volumetric heat capacity ({@html renderMath('\\rho c_p')})</span>
							<span class="font-bold text-zinc-900"
								>{Number(rhoCp_MJ).toFixed(1)}
								<span class="font-normal text-zinc-500">MJ/m³K</span></span
							>
						</label>
						<p class="pb-1 text-[12px] text-zinc-500">
							{@html renderMath('\\alpha')} = {(alpha * 1e6).toFixed(2)} × 10⁻⁶ m²/s
						</p>
						<input
							type="range"
							min="1.0"
							max="3.5"
							step="0.1"
							bind:value={rhoCp_MJ}
							class="h-1 w-full cursor-pointer appearance-none rounded-full bg-zinc-200 accent-zinc-900"
						/>
					</div>
				</div>
			</div>
		</div>

		<!-- Resistance Equation Block -->
		<div class="mb-12">
			<div class="rounded-2xl border border-zinc-200 bg-zinc-50 p-6">
				<h2
					class="mb-4 border-b border-zinc-200 pb-2 text-sm font-semibold tracking-widest text-zinc-900 uppercase"
				>
					Cylindrical Thermal Resistance
				</h2>
				<p class="mb-4 text-center text-sm leading-relaxed font-light text-zinc-600">
					The equivalent steady-state thermal resistance between inner radius {@html renderMath(
						'r_1'
					)} and outer radius {@html renderMath('r_2')} is calculated as:
				</p>
				<div class="overflow-x-auto py-4 text-center text-lg">
					{@html renderMath('R = \\frac{\\ln(r_2/r_1)}{2\\pi k L}', true)}
				</div>
			</div>
		</div>

		<!-- Resistance View -->
		<div class="mb-12">
			<div class="mb-12 rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
				<h2 class="mb-2 flex items-center gap-3 text-xl font-bold tracking-tight text-zinc-900">
					Thermal Resistance Profile
				</h2>
				<p class="mb-8 max-w-3xl text-sm font-light text-zinc-500">
					The chart displays the thermal resistance as a function of the outer boundary radius {@html renderMath(
						'r_2'
					)}.
				</p>

				<div class="grid grid-cols-1 items-start gap-8 lg:grid-cols-[1fr_360px]">
					<!-- Visualization Column -->
					<div class="flex min-w-0 flex-col gap-8">
						<!-- Geometry Cross Section -->
						<div
							class="flex flex-col items-center rounded-xl border border-zinc-200 bg-zinc-50 p-6"
						>
							<h3 class="mb-4 text-sm font-semibold tracking-widest text-zinc-900 uppercase">
								Geometry Cross-Section
							</h3>
							<svg width="200" height="200" viewBox="-100 -100 200 200" class="overflow-visible">
								<!-- Grid / Guides -->
								<line
									x1="-100"
									y1="0"
									x2="100"
									y2="0"
									stroke="#e4e4e7"
									stroke-width="1"
									stroke-dasharray="2,2"
								/>
								<line
									x1="0"
									y1="-100"
									x2="0"
									y2="100"
									stroke="#e4e4e7"
									stroke-width="1"
									stroke-dasharray="2,2"
								/>

								<defs>
									<mask id="hollowPipeMask">
										<rect x="-100" y="-100" width="200" height="200" fill="white" />
										<circle cx="0" cy="0" r={Math.max(0.1, res_r1 * (100 / 0.5))} fill="black" />
									</mask>
								</defs>

								<!-- Shell Fill -->
								<circle
									cx="0"
									cy="0"
									r={Math.max(0.1, res_r2 * (100 / 0.5))}
									fill="#e2e8f0"
									mask="url(#hollowPipeMask)"
								/>

								<!-- Shell Outer Stroke -->
								<circle
									cx="0"
									cy="0"
									r={Math.max(0.1, res_r2 * (100 / 0.5))}
									fill="none"
									stroke="#94a3b8"
									stroke-width="2"
								/>
								<!-- Shell Inner Boundary Stroke -->
								<circle
									cx="0"
									cy="0"
									r={Math.max(0.1, res_r1 * (100 / 0.5))}
									fill="none"
									stroke="#94a3b8"
									stroke-width="2"
								/>

								<!-- Origin dot -->
								<circle cx="0" cy="0" r="2" fill="#0f172a" />
							</svg>
							<div class="mt-4 flex gap-4 font-mono text-xs text-zinc-500">
								<span class="flex items-center gap-1"
									><div class="h-3 w-3 rounded-full border-2 border-slate-400 bg-white"></div>
									Inner boundary ({@html renderMath('r_1')})</span
								>
								<span class="flex items-center gap-1"
									><div class="h-3 w-3 rounded-full border-2 border-slate-400 bg-slate-200"></div>
									Outer boundary ({@html renderMath('r_2')})</span
								>
							</div>
						</div>

						<div
							class="flex w-full flex-col items-center overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50 p-6"
							bind:clientWidth={resPlotWidth}
						>
							<h3 class="mb-6 text-sm font-semibold tracking-widest text-zinc-900 uppercase">
								Resistance Curve
							</h3>

							<div class="relative flex w-full justify-center pb-2 pl-4">
								<svg width={Math.max(200, resPlotWidth - 48)} height="400" class="overflow-visible">
									<defs>
										<clipPath id="resClip">
											<rect x="0" y="0" width={Math.max(100, resPlotWidth - 120)} height="300" />
										</clipPath>
									</defs>
									<g transform="translate(70, 10)">
										<!-- dartwork-mpl Spine -->
										<rect
											x="0"
											y="0"
											width={Math.max(100, resPlotWidth - 120)}
											height="300"
											fill="none"
											stroke="#1f2937"
											stroke-width="0.5"
										/>

										<!-- Grid Lines -->
										<g stroke-dasharray="2 2" stroke="#6b7280" stroke-width="0.5" opacity="0.5">
											{#each [0, 0.1, 0.2, 0.3, 0.4, 0.5] as xTick}
												<line x1={xScaleRes(xTick)} y1="0" x2={xScaleRes(xTick)} y2="300" />
											{/each}
											{#each [0, 0.25, 0.5, 0.75, 1.0] as yTick}
												<line
													x1="0"
													y1={300 - yTick * 300}
													x2={Math.max(100, resPlotWidth - 120)}
													y2={300 - yTick * 300}
												/>
											{/each}
										</g>

										<!-- Data Line -->
										<path
											d={resistancePlotData.path}
											fill="none"
											stroke="#3b82f6"
											stroke-width="2.5"
											stroke-linecap="round"
											stroke-linejoin="round"
											clip-path="url(#resClip)"
										/>

										<!-- Current Value Marker -->
										{#if res_r2 >= 0 && res_r2 <= 0.5 && resistancePlotData.currentR <= 1.0}
											{@const cx = xScaleRes(res_r2)}
											{@const cy = resistancePlotData.yScale(resistancePlotData.currentR)}
											<circle {cx} {cy} r="5" fill="#3b82f6" stroke="#ffffff" stroke-width="1.5" />
											<text
												x={cx}
												y={cy - 12}
												text-anchor="middle"
												class="fill-zinc-900 text-[14px] font-semibold"
											>
												R: {resistancePlotData.currentR.toFixed(2)} K/W
											</text>
										{/if}

										<!-- Labels -->
										<text
											x={Math.max(100, resPlotWidth - 120) / 2}
											y="338"
											class="fill-zinc-900 text-[15px] font-semibold"
											text-anchor="middle">Outer Radius r₂ [m]</text
										>
										<g transform="translate(-60, 150) rotate(-90)">
											<text
												x="0"
												y="0"
												class="fill-zinc-900 text-[15px] font-semibold"
												text-anchor="middle">Resistance R [K/W]</text
											>
										</g>

										<!-- Major Ticks -->
										<g stroke="#1f2937" stroke-width="0.5">
											{#each [0, 0.1, 0.2, 0.3, 0.4, 0.5] as xTick}
												<line x1={xScaleRes(xTick)} y1="300" x2={xScaleRes(xTick)} y2="306" />
												<text
													x={xScaleRes(xTick)}
													y="322"
													class="fill-zinc-600 text-[14px] font-medium"
													stroke="none"
													text-anchor="middle">{xTick.toFixed(1)}</text
												>
											{/each}

											{#each [0, 0.25, 0.5, 0.75, 1.0] as yTick}
												<line x1="-6" y1={300 - yTick * 300} x2="0" y2={300 - yTick * 300} />
												<text
													x="-12"
													y={300 - yTick * 300 + 4}
													class="fill-zinc-600 text-[14px] font-medium"
													stroke="none"
													dominant-baseline="middle"
													text-anchor="end">{yTick.toFixed(2)}</text
												>
											{/each}
										</g>
									</g>
								</svg>
							</div>
						</div>
					</div>

					<!-- Controls Column -->
					<div class="h-full space-y-8 rounded-2xl border border-zinc-200 bg-zinc-50 p-6 shadow-sm">
						<h2
							class="border-b border-zinc-200 pb-2 text-sm font-semibold tracking-widest text-zinc-900 uppercase"
						>
							Resistance Factors
						</h2>

						<div class="space-y-4 border-b border-zinc-200 pb-6">
							<div class="space-y-2">
								<label class="flex justify-between text-sm font-medium text-zinc-700">
									<span>Inner Radius ({@html renderMath('r_1')})</span>
									<span class="font-bold text-zinc-900">{res_r1.toFixed(2)} m</span>
								</label>
								<input
									type="range"
									min="0.01"
									max={Math.max(0.01, res_r2 - 0.01)}
									step="0.01"
									bind:value={res_r1}
									class="h-1 w-full cursor-pointer appearance-none rounded-full bg-zinc-200 accent-zinc-900"
								/>
							</div>

							<div class="space-y-2">
								<label class="flex justify-between text-sm font-medium text-zinc-700">
									<span>Thermal Conductivity ({@html renderMath('k')})</span>
									<span class="font-bold text-zinc-900">{res_k.toFixed(1)} W/mK</span>
								</label>
								<input
									type="range"
									min="1.0"
									max="4.0"
									step="0.1"
									bind:value={res_k}
									class="h-1 w-full cursor-pointer appearance-none rounded-full bg-zinc-200 accent-zinc-900"
								/>
							</div>

							<div class="space-y-2">
								<label class="flex justify-between text-sm font-medium text-zinc-700">
									<span>Length ({@html renderMath('L')})</span>
									<span class="font-bold text-zinc-900">{res_L.toFixed(1)} m</span>
								</label>
								<input
									type="range"
									min="0.5"
									max="5.0"
									step="0.5"
									bind:value={res_L}
									class="h-1 w-full cursor-pointer appearance-none rounded-full bg-zinc-200 accent-zinc-900"
								/>
							</div>
						</div>

						<div class="space-y-4 border-b border-zinc-200 pb-6">
							<div class="space-y-2">
								<label class="flex justify-between text-sm font-medium text-zinc-700">
									<span>Outer radius ({@html renderMath('r_2')})</span>
									<span class="font-bold text-blue-600">{res_r2.toFixed(2)} m</span>
								</label>
								<input
									type="range"
									min={res_r1 + 0.01}
									max="0.5"
									step="0.01"
									bind:value={res_r2}
									class="h-1 w-full cursor-pointer appearance-none rounded-full bg-zinc-200 accent-blue-600"
								/>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- 3rd Figure: 2-Layer Cylindrical Resistance -->
		<div class="mb-12">
			<div class="mb-12 rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
				<h2 class="mb-2 flex items-center gap-3 text-xl font-bold tracking-tight text-zinc-900">
					Multi-Layer Cylindrical Profile (Pipe + Grout)
				</h2>
				<p class="mb-8 max-w-3xl text-sm font-light text-zinc-500">
					Visualizing the temperature profile across a two-layer composite cylinder consisting of a
					pipe and surrounding grout. This model evaluates the standalone thermal resistances {@html renderMath(
						'R_p'
					)} and {@html renderMath('R_g')} assuming a boundary condition of {@html renderMath(
						'T(r_b) = 0'
					)} at the outermost boundary.
				</p>

				<div class="grid grid-cols-1 items-start gap-8 lg:grid-cols-2">
					<!-- Visualization Column -->
					<div class="flex min-w-0 flex-col gap-8">
						<!-- Geometry Cross Section -->
						<div
							class="flex flex-col items-center rounded-xl border border-zinc-200 bg-zinc-50 p-6"
						>
							<h3 class="mb-4 text-sm font-semibold tracking-widest text-zinc-900 uppercase">
								Geometry Cross-Section
							</h3>
							<svg width="200" height="200" viewBox="-100 -100 200 200" class="overflow-visible">
								<!-- Grid / Guides -->
								<line
									x1="-100"
									y1="0"
									x2="100"
									y2="0"
									stroke="#e4e4e7"
									stroke-width="1"
									stroke-dasharray="2,2"
								/>
								<line
									x1="0"
									y1="-100"
									x2="0"
									y2="100"
									stroke="#e4e4e7"
									stroke-width="1"
									stroke-dasharray="2,2"
								/>

								<!-- Borehole -->
								<circle
									cx="0"
									cy="0"
									r={Math.max(0.1, r_b * (100 / 0.15))}
									fill="#f1f5f9"
									stroke="#64748b"
									stroke-width="1.5"
									stroke-dasharray="4,4"
								/>
								<!-- Pipe Outer -->
								<circle
									cx="0"
									cy="0"
									r={Math.max(0.1, r_pout * (100 / 0.15))}
									fill="#e2e8f0"
									stroke="#94a3b8"
									stroke-width="2"
								/>
								<!-- Pipe Inner (Fluid or hollow) -->
								<circle
									cx="0"
									cy="0"
									r={Math.max(0.1, r_pin * (100 / 0.15))}
									fill="#dbeafe"
									stroke="#3b82f6"
									stroke-width="2"
								/>

								<!-- Origin dot -->
								<circle cx="0" cy="0" r="2" fill="#0f172a" />
							</svg>
							<div class="mt-4 flex gap-4 font-mono text-xs text-zinc-500">
								<span class="flex items-center gap-1"
									><div class="h-3 w-3 rounded-full border-2 border-blue-500 bg-blue-100"></div>
									Water outer/pipe inner</span
								>
								<span class="flex items-center gap-1"
									><div class="h-3 w-3 rounded-full border-2 border-slate-400 bg-slate-200"></div>
									Pipe outer/grout inner</span
								>
								<span class="flex items-center gap-1"
									><div
										class="h-3 w-3 rounded-full border border-dashed border-slate-500 bg-slate-100"
									></div>
									Grout outer</span
								>
							</div>
						</div>

						<!-- Temperature Profile Plot -->
						<div
							class="flex w-full flex-col items-center overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50 p-6"
							bind:clientWidth={layerPlotWidth}
						>
							<h3 class="mb-6 text-sm font-semibold tracking-widest text-zinc-900 uppercase">
								Radial Temperature Profile
							</h3>
							<div class="relative flex w-full justify-center pb-2 pl-4">
								<svg
									width={Math.max(200, layerPlotWidth - 48)}
									height="330"
									class="overflow-visible"
								>
									<g transform="translate(70, 10)">
										<!-- dartwork-mpl Spine -->
										<rect
											x="0"
											y="0"
											width={Math.max(100, layerPlotWidth - 120)}
											height="250"
											fill="none"
											stroke="#1f2937"
											stroke-width="0.5"
										/>

										<defs>
											<clipPath id="multiLayerClip">
												<rect
													x="0"
													y="0"
													width={Math.max(100, layerPlotWidth - 120)}
													height="250"
												/>
											</clipPath>
										</defs>

										<!-- Grid Lines -->
										<g stroke-dasharray="2 2" stroke="#6b7280" stroke-width="0.5" opacity="0.5">
											{#each [0, 0.05, 0.1, 0.15] as xTick}
												<line x1={xScaleL2(xTick)} y1="0" x2={xScaleL2(xTick)} y2="250" />
											{/each}
											{#each [0, 10, 20, 30, 40] as yVal}
												<line
													x1="0"
													y1={yScaleL2(yVal)}
													x2={Math.max(100, layerPlotWidth - 120)}
													y2={yScaleL2(yVal)}
												/>
											{/each}
										</g>

										<!-- Data Line -->
										<path
											d={layerProfileInfo.path}
											fill="none"
											stroke="#ef4444"
											stroke-width="2.5"
											stroke-linecap="round"
											stroke-linejoin="round"
											clip-path="url(#multiLayerClip)"
										/>

										<!-- Labels -->
										<text
											x={Math.max(100, layerPlotWidth - 120) / 2}
											y="288"
											class="fill-zinc-900 text-[15px] font-semibold"
											text-anchor="middle">Radius r [m]</text
										>
										<g transform="translate(-50, 125) rotate(-90)">
											<text
												x="0"
												y="0"
												class="fill-zinc-900 text-[15px] font-semibold"
												text-anchor="middle">Temperature [°C]</text
											>
										</g>

										<!-- Major Ticks -->
										<g stroke="#1f2937" stroke-width="0.5">
											{#each [0, 0.05, 0.1, 0.15] as xTick}
												<line x1={xScaleL2(xTick)} y1="250" x2={xScaleL2(xTick)} y2="256" />
												<text
													x={xScaleL2(xTick)}
													y="272"
													class="fill-zinc-600 text-[14px] font-medium"
													stroke="none"
													text-anchor="middle">{xTick.toFixed(2)}</text
												>
											{/each}

											{#each [0, 10, 20, 30, 40] as yVal}
												<line x1="-6" y1={yScaleL2(yVal)} x2="0" y2={yScaleL2(yVal)} />
												<text
													x="-12"
													y={yScaleL2(yVal) + 4}
													class="fill-zinc-600 text-[14px] font-medium"
													stroke="none"
													dominant-baseline="middle"
													text-anchor="end">{yVal}</text
												>
											{/each}
										</g>

										<!-- Dotted lines for layer boundaries -->
										{#if r_pin <= 0.15}
											<line
												x1={xScaleL2(r_pin)}
												y1="0"
												x2={xScaleL2(r_pin)}
												y2="250"
												stroke="#3b82f6"
												stroke-width="1"
												stroke-dasharray="2,2"
											/>
										{/if}
										{#if r_pout <= 0.15}
											<line
												x1={xScaleL2(r_pout)}
												y1="0"
												x2={xScaleL2(r_pout)}
												y2="250"
												stroke="#94a3b8"
												stroke-width="1"
												stroke-dasharray="2,2"
											/>
										{/if}
										{#if r_b <= 0.15}
											<line
												x1={xScaleL2(r_b)}
												y1="0"
												x2={xScaleL2(r_b)}
												y2="250"
												stroke="#64748b"
												stroke-width="1"
												stroke-dasharray="2,2"
											/>
										{/if}
									</g>
								</svg>
							</div>
						</div>
					</div>

					<!-- Controls Column -->
					<div class="h-full space-y-8 rounded-2xl border border-zinc-200 bg-zinc-50 p-6 shadow-sm">
						<h2
							class="border-b border-zinc-200 pb-2 text-sm font-semibold tracking-widest text-zinc-900 uppercase"
						>
							Layer Configuration
						</h2>

						<div class="space-y-4 border-b border-zinc-200 pb-6">
							<div class="space-y-2">
								<label class="flex justify-between text-base font-medium text-zinc-700">
									<span>Water Temperature ({@html renderMath('T_f')})</span>
									<span class="font-bold text-zinc-900">{T_f.toFixed(1)} °C</span>
								</label>
								<input
									type="range"
									min="10"
									max="40"
									step="1"
									bind:value={T_f}
									class="h-1 w-full cursor-pointer appearance-none rounded-full bg-zinc-200 accent-blue-600"
								/>
							</div>

							<div class="space-y-2">
								<label class="flex justify-between text-base font-medium text-zinc-700">
									<span>Borehole Surf Temp ({@html renderMath('T_b')})</span>
									<span class="font-bold text-zinc-900">{T_b.toFixed(1)} °C</span>
								</label>
								<input
									type="range"
									min="0"
									max="30"
									step="1"
									bind:value={T_b}
									class="h-1 w-full cursor-pointer appearance-none rounded-full bg-zinc-200 accent-slate-500"
								/>
							</div>

							<div class="space-y-2">
								<label class="flex justify-between text-base font-medium text-zinc-700">
									<span>Water Conv. Coef. ({@html renderMath('h_f')})</span>
									<span class="font-bold text-zinc-900">{h_f} W/m²K</span>
								</label>
								<input
									type="range"
									min="100"
									max="4000"
									step="100"
									bind:value={h_f}
									class="h-1 w-full cursor-pointer appearance-none rounded-full bg-zinc-200 accent-blue-400"
								/>
							</div>
						</div>

						<div class="space-y-4 border-b border-zinc-200 pb-6">
							<div class="space-y-2">
								<label class="flex justify-between text-sm font-medium text-zinc-700">
									<span>Pipe Inner Radius ({@html renderMath('r_{p,in}')})</span>
									<span class="font-bold text-zinc-900">{r_pin.toFixed(3)} m</span>
								</label>
								<input
									type="range"
									min="0.005"
									max={Math.max(0.005, r_pout - 0.001)}
									step="0.001"
									bind:value={r_pin}
									class="h-1 w-full cursor-pointer appearance-none rounded-full bg-zinc-200 accent-blue-600"
								/>
							</div>

							<div class="space-y-2">
								<label class="flex justify-between text-sm font-medium text-zinc-700">
									<span>Pipe Outer Radius ({@html renderMath('r_{p,out}')})</span>
									<span class="font-bold text-zinc-900">{r_pout.toFixed(3)} m</span>
								</label>
								<input
									type="range"
									min={r_pin + 0.001}
									max={Math.max(r_pin + 0.001, r_b - 0.001)}
									step="0.001"
									bind:value={r_pout}
									class="h-1 w-full cursor-pointer appearance-none rounded-full bg-zinc-200 accent-slate-500"
								/>
							</div>

							<div class="space-y-2">
								<label class="flex justify-between text-sm font-medium text-zinc-700">
									<span>Borehole Radius ({@html renderMath('r_b')})</span>
									<span class="font-bold text-zinc-900">{r_b.toFixed(3)} m</span>
								</label>
								<input
									type="range"
									min={Math.max(0.05, r_pout + 0.001)}
									max="0.15"
									step="0.001"
									bind:value={r_b}
									class="h-1 w-full cursor-pointer appearance-none rounded-full bg-zinc-200 accent-slate-400"
								/>
							</div>
						</div>

						<div class="space-y-4 border-b border-zinc-200 pb-6">
							<div class="space-y-2">
								<label class="flex justify-between text-sm font-medium text-zinc-700">
									<span>Pipe Conductivity ({@html renderMath('k_p')})</span>
									<span class="font-bold text-zinc-900">{kp.toFixed(2)} W/mK</span>
								</label>
								<input
									type="range"
									min="0.1"
									max="1.0"
									step="0.05"
									bind:value={kp}
									class="h-1 w-full cursor-pointer appearance-none rounded-full bg-zinc-200 accent-slate-500"
								/>
							</div>

							<div class="space-y-2">
								<label class="flex justify-between text-sm font-medium text-zinc-700">
									<span>Grout Conductivity ({@html renderMath('k_g')})</span>
									<span class="font-bold text-zinc-900">{kg.toFixed(2)} W/mK</span>
								</label>
								<input
									type="range"
									min="0.5"
									max="3.0"
									step="0.1"
									bind:value={kg}
									class="h-1 w-full cursor-pointer appearance-none rounded-full bg-zinc-200 accent-slate-400"
								/>
							</div>
						</div>

						<div class="pt-2">
							<div class="mb-4 grid grid-cols-3 gap-2 border-b border-zinc-100 pb-4">
								<div
									class="flex flex-col items-center rounded-xl border border-zinc-200 bg-white p-2 shadow-sm"
								>
									<span
										class="mb-1 w-full border-b border-zinc-100 pb-1 text-center font-mono text-xs text-zinc-500"
										>{@html renderMath('R_{w}')}</span
									>
									<span class="text-sm font-bold text-slate-700">{Rw.toFixed(3)} K/W</span>
								</div>
								<div
									class="flex flex-col items-center rounded-xl border border-zinc-200 bg-white p-2 shadow-sm"
								>
									<span
										class="mb-1 w-full border-b border-zinc-100 pb-1 text-center font-mono text-xs text-zinc-500"
										>{@html renderMath('R_{pipe}')}</span
									>
									<span class="text-sm font-bold text-slate-700">{Rp.toFixed(3)} K/W</span>
								</div>
								<div
									class="flex flex-col items-center rounded-xl border border-zinc-200 bg-white p-2 shadow-sm"
								>
									<span
										class="mb-1 w-full border-b border-zinc-100 pb-1 text-center font-mono text-xs text-zinc-500"
										>{@html renderMath('R_{grout}')}</span
									>
									<span class="text-sm font-bold text-slate-700">{Rg.toFixed(3)} K/W</span>
								</div>
							</div>
							<div
								class="mt-4 flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-4 shadow-sm"
							>
								<span class="text-sm font-medium text-zinc-600"
									>Total Heat Flow ({@html renderMath('q_l')})</span
								>
								<span class="text-lg font-bold text-slate-800"
									>{q_layer.toFixed(1)}
									<span class="text-sm font-normal text-slate-500">W/m</span></span
								>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
