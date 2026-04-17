<script lang="ts">
	import * as d3 from 'd3';
	import { calculateILS } from '$lib/physics/ils';
	import katex from 'katex';

	function renderMath(tex: string, displayMode = false) {
		try {
			return katex.renderToString(tex, { throwOnError: false, displayMode });
		} catch {
			return tex;
		}
	}

	let timeLog = $state(1); // 10^1 = 10 h
	let timeHours = $derived(Math.pow(10, Number(timeLog)));

	let q = $state(40);
	let k = $state(2.5);
	let rhoCp_MJ = $state(2.4);
	let alpha = $derived(Number(k) / (Number(rhoCp_MJ) * 1e6));

	let width = $state(0);

	// Layout
	const height = 480;
	const margin = { top: 40, right: 40, bottom: 60, left: 70 };
	let innerWidth = $derived((width || 600) - margin.left - margin.right);
	const innerHeight = height - margin.top - margin.bottom;

	// Scales
	let xScale = $derived(
		d3
			.scaleLinear()
			.domain([0, 6])
			.range([margin.left, margin.left + innerWidth])
	);
	let yScale = $derived(
		d3
			.scaleLinear()
			.domain([0, 50])
			.range([height - margin.bottom, margin.top])
	);

	// Data
	let data = $derived(
		d3.range(0.05, 6.05, 0.05).map((r) => ({
			r,
			T: calculateILS(r, timeHours * 3600, Number(q), Number(k), alpha)
		}))
	);

	// Paths
	let linePath = $derived.by(() => {
		const line = d3
			.line<{ r: number; T: number }>()
			.x((d) => xScale(d.r))
			.y((d) => yScale(d.T))
			.curve(d3.curveMonotoneX);
		return line(data) || '';
	});

	let areaPath = $derived.by(() => {
		const area = d3
			.area<{ r: number; T: number }>()
			.x((d) => xScale(d.r))
			.y0(height - margin.bottom)
			.y1((d) => yScale(d.T))
			.curve(d3.curveMonotoneX);
		return area(data) || '';
	});

	// Ticks
	const xTicks = d3.ticks(0, 6, 6);
	const yTicks = d3.ticks(0, 50, 5);

	// ── Integrand plot ────────────────────────────────────────────────────────
	let r_ref = $state(1.0); // reference radius for u_min
	let uMin = $derived(Math.max(0.001, Math.pow(Number(r_ref), 2) / (4 * alpha * timeHours * 3600)));

	const ih = 380; // integrand chart height
	const im = { top: 30, right: 40, bottom: 55, left: 65 };
	let ihInnerWidth = $derived((width || 600) - im.left - im.right);
	const ihInnerHeight = ih - im.top - im.bottom;

	let ixScale = $derived(
		d3
			.scaleLinear()
			.domain([0, 4])
			.range([im.left, im.left + ihInnerWidth])
	);
	const iyScale = d3
		.scaleLinear()
		.domain([0, 5])
		.range([ih - im.bottom, im.top]);

	// Curve points: f(u) = e^{-u}/u — no clamping, clipPath handles visual bounds
	const integrandPts = d3.range(0.005, 4.01, 0.005).map((u) => ({
		u,
		f: Math.exp(-u) / u
	}));

	let integrandLinePath = $derived.by(() => {
		const line = d3
			.line<{ u: number; f: number }>()
			.x((d) => ixScale(d.u))
			.y((d) => iyScale(d.f))
			.curve(d3.curveCatmullRom);
		return line(integrandPts) || '';
	});

	let shadeAreaPath = $derived.by(() => {
		const clampedMin = Math.min(uMin, 4);
		const pts = integrandPts.filter((d) => d.u >= clampedMin);
		if (!pts.length) return '';
		const area = d3
			.area<{ u: number; f: number }>()
			.x((d) => ixScale(d.u))
			.y0(ih - im.bottom)
			.y1((d) => iyScale(d.f))
			.curve(d3.curveCatmullRom);
		return area(pts) || '';
	});

	const ixTicks = d3.ticks(0, 4, 4);
	const iyTicks = d3.ticks(0, 5, 5);
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
				Infinite Line Source (ILS)
			</h1>
			<p class="max-w-3xl text-lg leading-relaxed font-light text-zinc-500">
				Simulates pure radial heat conduction outside the borehole. Observe how heat penetrates the
				ground over time, mapped by the logarithmic rise curve native to the exponential integral
				form.
			</p>
		</div>

		<div class="mb-10 rounded-2xl border border-zinc-200 bg-zinc-50 p-6 md:p-8">
			<h2 class="mb-6 text-sm font-semibold tracking-widest text-zinc-900 uppercase">
				Mathematical Formulation
			</h2>
			<div
				class="my-8 overflow-x-auto rounded-xl border border-zinc-200 bg-white py-4 text-center text-xl text-zinc-900 shadow-sm"
			>
				{@html renderMath(
					'\\Delta T(r, t) = \\dfrac{q}{4 \\pi k_{s}} \\int_{\\frac{r^{2}}{4 \\alpha t}}^{\\infty} \\dfrac{e^{-u}}{u}\\,du',
					true
				)}
			</div>
			<p class="mx-auto max-w-2xl text-center text-sm leading-relaxed text-zinc-500">
				Where {@html renderMath('\\int_x^{\\infty} \\frac{e^{-u}}{u}\\,du')} is the Exponential Integral.
				Notice how controlling properties like {@html renderMath('k_s')} and {@html renderMath(
					'\\rho c_p'
				)} influences the distinct temporal terms of the equation above.
			</p>
		</div>

		<div class="grid grid-cols-1 gap-10 lg:grid-cols-[380px_1fr]">
			<!-- Controls Panel -->
			<div class="space-y-8 rounded-2xl border border-zinc-200 bg-zinc-50 p-8">
				<h2
					class="mb-6 border-b border-zinc-200 pb-2 text-sm font-semibold tracking-widest text-zinc-900 uppercase"
				>
					Control Variables
				</h2>

				<!-- Time -->
				<div class="space-y-3">
					<label class="flex justify-between text-base font-medium text-zinc-700">
						<span>Time ({@html renderMath('t')})</span>
						<span class="font-bold text-zinc-900"
							>{timeHours >= 10 ? Math.round(timeHours) : timeHours.toFixed(1)} h</span
						>
					</label>
					<input
						type="range"
						min="-1"
						max="4"
						step="0.01"
						bind:value={timeLog}
						class="h-1 w-full cursor-pointer appearance-none rounded-full bg-zinc-200 accent-zinc-900"
					/>
					<div class="flex justify-between font-mono text-sm text-zinc-400">
						<span>0.1 h</span>
						<span>10,000 h</span>
					</div>
				</div>

				<!-- Heat Flux -->
				<div class="space-y-3 pt-4">
					<label class="flex justify-between text-base font-medium text-zinc-700">
						<span>Heat Flux ({@html renderMath('q')})</span>
						<span class="font-bold text-zinc-900">{q} W/m</span>
					</label>
					<input
						type="range"
						min="10"
						max="100"
						step="1"
						bind:value={q}
						class="h-1 w-full cursor-pointer appearance-none rounded-full bg-zinc-200 accent-zinc-900"
					/>
				</div>

				<!-- Conductivity -->
				<div class="space-y-3 pt-4">
					<label class="flex justify-between text-base font-medium text-zinc-700">
						<span>Conductivity ({@html renderMath('k_s')})</span>
						<span class="font-bold text-zinc-900">{Number(k).toFixed(1)} W/mK</span>
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

				<!-- Volumetric Capacity -->
				<div class="space-y-3 pt-4">
					<label class="flex justify-between text-base font-medium text-zinc-700">
						<span>Volumetric Heat Capacity ({@html renderMath('\\rho c_p')})</span>
						<span class="font-bold text-zinc-900">{Number(rhoCp_MJ).toFixed(1)} MJ/m³K</span>
					</label>
					<input
						type="range"
						min="1.0"
						max="3.5"
						step="0.1"
						bind:value={rhoCp_MJ}
						class="h-1 w-full cursor-pointer appearance-none rounded-full bg-zinc-200 accent-zinc-900"
					/>
					<div class="mt-2 text-right font-mono text-sm text-zinc-400">
						{@html renderMath(
							`\\alpha = ${(alpha * 1e6).toFixed(2)} \\times 10^{-6}\\ \\text{m}^2/\\text{s}`
						)}
					</div>
				</div>

				<!-- Reference Radius -->
				<div class="space-y-3 pt-4">
					<label class="flex justify-between text-base font-medium text-zinc-700">
						<span>Reference Radius ({@html renderMath('r_{ref}')})</span>
						<span class="font-bold text-zinc-900">{Number(r_ref).toFixed(2)} m</span>
					</label>
					<input
						type="range"
						min="0.1"
						max="6"
						step="0.05"
						bind:value={r_ref}
						class="h-1 w-full cursor-pointer appearance-none rounded-full bg-zinc-200 accent-rose-500"
					/>
					<div class="mt-1 flex justify-between font-mono text-sm text-zinc-400">
						<span>0.1 m</span>
						<span
							>{@html renderMath(
								`u_{\\min} = ${uMin < 0.001 ? '\\approx 0' : uMin.toFixed(4)}`
							)}</span
						>
						<span>6 m</span>
					</div>
				</div>

				<div
					class="mt-8 rounded-xl border border-zinc-200 bg-white p-5 text-sm leading-relaxed text-zinc-600 shadow-sm"
				>
					<strong class="mb-2 block font-medium text-zinc-900">💡 Physical Insight</strong>
					Move the Time ({@html renderMath('t')}) slider gradually to the right. Observe the steep
					initial temperature rise at lower radii, which cleanly transitions into a
					<strong>logarithmic</strong> smoothing curve, a hallmark of deep thermal penetration.
				</div>
			</div>

			<!-- Chart Panel -->
			<div
				class="flex flex-col rounded-2xl border border-zinc-200 bg-zinc-50 shadow-sm"
				bind:clientWidth={width}
			>
				<div class="p-6 pb-2">
					<h2 class="mb-1 text-lg font-bold tracking-tight text-zinc-900">
						Radial Temperature Profile
					</h2>
					<p class="text-sm font-light text-zinc-500">
						Temperature rise as a function of radial distance from the borehole.
					</p>
				</div>

				<div class="relative flex h-[480px] w-full flex-grow justify-center overflow-hidden">
					<svg width={width || 600} {height} class="absolute inset-0">
						<defs>
							<clipPath id="plot-clip">
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

						<!-- Area Fill -->
						<path d={areaPath} fill="#3b82f6" fill-opacity="0.08" clip-path="url(#plot-clip)" />

						<!-- Line Curve -->
						<path
							d={linePath}
							fill="none"
							stroke="#3b82f6"
							stroke-width="2.5"
							stroke-linecap="round"
							stroke-linejoin="round"
							clip-path="url(#plot-clip)"
						/>

						<!-- r_ref vertical marker -->
						{#if Number(r_ref) >= 0 && Number(r_ref) <= 6}
							{@const rx = xScale(Number(r_ref))}
							{@const ry = yScale(
								calculateILS(Number(r_ref), timeHours * 3600, Number(q), Number(k), alpha)
							)}
							<line
								x1={rx}
								y1={margin.top}
								x2={rx}
								y2={height - margin.bottom}
								stroke="#f43f5e"
								stroke-width="1.5"
								stroke-dasharray="4 3"
								opacity="0.8"
								clip-path="url(#plot-clip)"
							/>
							<circle
								cx={rx}
								cy={ry}
								r="5"
								fill="#f43f5e"
								stroke="#ffffff"
								stroke-width="1.5"
								clip-path="url(#plot-clip)"
							/>
						{/if}

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

						<!-- X-axis tick labels -->
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
						<!-- X-axis title -->
						<text
							x={margin.left + innerWidth / 2}
							y={height - margin.bottom + 48}
							class="fill-zinc-900 text-[15px] font-semibold"
							text-anchor="middle">Radius r [m]</text
						>

						<!-- Y-axis tick labels -->
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
						<!-- Y-axis title -->
						<g
							transform={`translate(${margin.left - 45}, ${margin.top + innerHeight / 2}) rotate(-90)`}
						>
							<text
								x="0"
								y="0"
								text-anchor="middle"
								class="fill-zinc-900 text-[15px] font-semibold"
							>
								Temperature difference [K]
							</text>
						</g>
					</svg>
				</div>

				<!-- ─── Integrand Card ─────────────────────────────────────────────── -->
				<div class="border-t border-zinc-200 p-6 pb-2">
					<h2 class="mb-1 text-lg font-bold tracking-tight text-zinc-900">
						Integrand — {@html renderMath('e^{-u}/u')}
					</h2>
					<p class="text-sm font-light text-zinc-500">
						Shaded area = {@html renderMath('\\int_{u_{\\min}}^{\\infty} \\frac{e^{-u}}{u}\\,du')} ∝ ΔT.
						The pink marker {@html renderMath('u_{\\min} = r_{ref}^2 / 4\\alpha t')} shifts as you adjust
						the sliders.
					</p>
				</div>

				<div
					class="relative flex w-full flex-grow justify-center overflow-hidden"
					style="height:{ih}px"
				>
					<svg width={width || 600} height={ih} class="absolute inset-0">
						<defs>
							<clipPath id="plot-clip-int">
								<rect x={im.left} y={im.top} width={ihInnerWidth} height={ihInnerHeight} />
							</clipPath>
						</defs>

						<!-- Grid Lines -->
						<g stroke-dasharray="2 2" stroke="#6b7280" stroke-width="0.5" opacity="0.5">
							{#each ixTicks as tick}
								<line x1={ixScale(tick)} y1={im.top} x2={ixScale(tick)} y2={ih - im.bottom} />
							{/each}
							{#each iyTicks as tick}
								<line
									x1={im.left}
									y1={iyScale(tick)}
									x2={im.left + ihInnerWidth}
									y2={iyScale(tick)}
								/>
							{/each}
						</g>

						<!-- Shade area (u_min → 4) -->
						<path
							d={shadeAreaPath}
							fill="#0d9488"
							fill-opacity="0.12"
							clip-path="url(#plot-clip-int)"
						/>

						<!-- f(u) curve -->
						<path
							d={integrandLinePath}
							fill="none"
							stroke="#0d9488"
							stroke-width="2.5"
							stroke-linecap="round"
							stroke-linejoin="round"
							clip-path="url(#plot-clip-int)"
						/>

						<!-- u_min vertical dashed line -->
						{#if uMin <= 4}
							<line
								x1={ixScale(uMin)}
								y1={im.top}
								x2={ixScale(uMin)}
								y2={ih - im.bottom}
								stroke="#f43f5e"
								stroke-width="1.5"
								stroke-dasharray="4 3"
								opacity="0.9"
								clip-path="url(#plot-clip-int)"
							/>
						{/if}

						<!-- Major Ticks -->
						<g stroke="#1f2937" stroke-width="0.5">
							{#each ixTicks as tick}
								<line
									x1={ixScale(tick)}
									y1={ih - im.bottom}
									x2={ixScale(tick)}
									y2={ih - im.bottom + 6}
								/>
							{/each}
							{#each iyTicks as tick}
								<line x1={im.left - 6} y1={iyScale(tick)} x2={im.left} y2={iyScale(tick)} />
							{/each}
						</g>

						<!-- Spine -->
						<rect
							x={im.left}
							y={im.top}
							width={ihInnerWidth}
							height={ihInnerHeight}
							fill="none"
							stroke="#1f2937"
							stroke-width="0.5"
						/>

						<!-- X-axis tick labels -->
						{#each ixTicks as tick}
							<text
								x={ixScale(tick)}
								y={ih - im.bottom + 22}
								text-anchor="middle"
								class="fill-zinc-600 text-[14px] font-medium">{tick}</text
							>
						{/each}
						<!-- X-axis title -->
						<text
							x={im.left + ihInnerWidth / 2}
							y={ih - im.bottom + 45}
							text-anchor="middle"
							class="fill-zinc-900 text-[15px] font-semibold">Integration variable u</text
						>

						<!-- Y-axis tick labels -->
						{#each iyTicks as tick}
							<text
								x={im.left - 12}
								y={iyScale(tick) + 1}
								text-anchor="end"
								dominant-baseline="middle"
								class="fill-zinc-600 text-[14px] font-medium">{tick}</text
							>
						{/each}
						<!-- Y-axis title -->
						<g transform={`translate(${im.left - 45}, ${im.top + ihInnerHeight / 2}) rotate(-90)`}>
							<text x="0" y="0" text-anchor="middle" class="fill-zinc-900 text-[15px] font-semibold"
								>Integrand value f(u)</text
							>
						</g>

						<!-- Legend (foreignObject for KaTeX HTML) -->
						<foreignObject x={im.left + ihInnerWidth - 232} y={im.top + 10} width="232" height="58">
							<div
								xmlns="http://www.w3.org/1999/xhtml"
								style="font-family:inherit; font-size:13px; color:#3f3f46; display:flex; flex-direction:column; gap:8px;"
							>
								<div style="display:flex; align-items:center; gap:8px;">
									<svg width="28" height="4" style="flex-shrink:0; overflow:visible;">
										<line
											x1="0"
											y1="2"
											x2="28"
											y2="2"
											stroke="#0d9488"
											stroke-width="2.5"
											stroke-linecap="round"
										/>
									</svg>
									<span>{@html renderMath('f(u) = e^{-u}/u')}</span>
								</div>
								<div style="display:flex; align-items:center; gap:8px;">
									<svg width="28" height="4" style="flex-shrink:0; overflow:visible;">
										<line
											x1="0"
											y1="2"
											x2="28"
											y2="2"
											stroke="#f43f5e"
											stroke-width="1.5"
											stroke-dasharray="4 3"
										/>
									</svg>
									<span>{@html renderMath('u_{\\min} = r_{ref}^2/4\\alpha t')}</span>
								</div>
							</div>
						</foreignObject>
					</svg>
				</div>
			</div>
		</div>
	</div>
</div>
