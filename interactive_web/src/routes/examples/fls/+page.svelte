<script lang="ts">
	import * as d3 from 'd3';
	import { calculateFLS, erfc } from '$lib/physics/fls';
	import katex from 'katex';

	function renderMath(tex: string, displayMode = false) {
		try {
			return katex.renderToString(tex, { throwOnError: false, displayMode });
		} catch {
			return tex;
		}
	}

	function toSuperscript(num: number) {
		const chars = {
			'-': '⁻',
			'0': '⁰',
			'1': '¹',
			'2': '²',
			'3': '³',
			'4': '⁴',
			'5': '⁵',
			'6': '⁶',
			'7': '⁷',
			'8': '⁸',
			'9': '⁹'
		};
		return num
			.toString()
			.split('')
			.map((c) => chars[c as keyof typeof chars] || c)
			.join('');
	}

	// FLS Parameters
	let timeLog = $state(1); // 10^1 = 10 h
	let timeHours = $derived(Math.pow(10, Number(timeLog)));

	let q = $state(40);
	let k = $state(2.5);
	let rhoCp_MJ = $state(2.4);
	let alpha = $derived(Number(k) / (Number(rhoCp_MJ) * 1e6));

	let H = $state(50); // Borehole depth
	let D = $state(5); // Buried depth
	let panelBWidth = $state(420);

	// Adaptive Resolution State (DISABLED — always full resolution)
	// let isDragging = $state(false);
	// let dragTimeout: NodeJS.Timeout;
	// function handleInput() {
	// 	isDragging = true;
	// 	clearTimeout(dragTimeout);
	// 	dragTimeout = setTimeout(() => {
	// 		isDragging = false;
	// 	}, 200);
	// }

	let canvasElement: HTMLCanvasElement | null = $state(null);
	let containerWidth = $state(0);

	// Constants for domain
	const R_MAX = 5.0; // meters radially
	const R_STEPS = 100; // was: $derived(isDragging ? 25 : 100)
	const Z_MAX = 70.0; // meters deep
	const Z_STEPS = 100; // was: $derived(isDragging ? 25 : 100)

	function drawHeatmap(
		w: number,
		t: number,
		qVal: number,
		kVal: number,
		aVal: number,
		hVal: number,
		dVal: number,
		rSteps: number,
		zSteps: number
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

		const margin = { top: 30, right: 80, bottom: 50, left: 60 };
		const innerWidth = w - margin.left - margin.right;
		const innerHeight = height - margin.top - margin.bottom;

		const xScale = d3
			.scaleLinear()
			.domain([0, R_MAX])
			.range([margin.left, margin.left + innerWidth]);
		const yScale = d3
			.scaleLinear()
			.domain([0, Z_MAX])
			.range([margin.top, margin.top + innerHeight]);

		ctx.clearRect(0, 0, w, height);
		ctx.fillStyle = '#ffffff';
		ctx.fillRect(margin.left, margin.top, innerWidth, innerHeight);

		const tSeconds = t * 3600;
		const dr = R_MAX / rSteps;
		const dz = Z_MAX / zSteps;

		const cells = [];
		let maxTemp = 0.1;
		for (let iz = 0; iz < zSteps; iz++) {
			for (let ir = 0; ir < rSteps; ir++) {
				const r_center = ir * dr + dr / 2;
				const z_center = iz * dz + dz / 2;
				const T = Math.max(
					0,
					calculateFLS(r_center, z_center, tSeconds, qVal, kVal, aVal, hVal, dVal)
				);
				if (T > maxTemp) maxTemp = T;
				cells.push({ rIndex: ir, zIndex: iz, T });
			}
		}

		// Inferno Colormap
		const thermalInterpolator = d3.interpolateInferno;
		const colorScale = d3.scaleSequential(thermalInterpolator).domain([0, 30]);

		const cellPixelWidth = innerWidth / rSteps;
		const cellPixelHeight = innerHeight / zSteps;

		for (const cell of cells) {
			ctx.fillStyle = colorScale(cell.T);
			const px = margin.left + cell.rIndex * cellPixelWidth;
			const py = margin.top + cell.zIndex * cellPixelHeight;
			ctx.fillRect(px, py, cellPixelWidth + 0.5, cellPixelHeight + 0.5);
		}

		// Draw Axes Overlay (Spine)
		ctx.strokeStyle = '#1f2937'; // gray-800
		ctx.lineWidth = 0.5;
		ctx.strokeRect(margin.left, margin.top, innerWidth, innerHeight);

		// Setup Grid Style
		ctx.strokeStyle = '#6b7280'; // gray-500

		ctx.fillStyle = '#71717a'; // zinc-500
		ctx.font = '14px sans-serif';
		ctx.textAlign = 'center';
		ctx.textBaseline = 'top';

		for (let r = 0; r <= R_MAX; r += 1) {
			const px = xScale(r);
			ctx.fillText(r.toString(), px, height - margin.bottom + 8);
			ctx.beginPath();
			ctx.moveTo(px, height - margin.bottom);
			ctx.lineTo(px, height - margin.bottom + 5);
			ctx.stroke();

			// Draw vertical grid line
			if (r > 0) {
				ctx.save();
				ctx.setLineDash([2, 2]);
				ctx.beginPath();
				ctx.moveTo(px, margin.top);
				ctx.lineTo(px, height - margin.bottom);
				ctx.stroke();
				ctx.restore();
			}
		}
		ctx.font = '500 17px sans-serif';
		ctx.fillText(
			'Radial Distance r [m]',
			margin.left + innerWidth / 2,
			height - margin.bottom + 30
		);

		ctx.textAlign = 'right';
		ctx.textBaseline = 'middle';
		ctx.font = '14px sans-serif';
		for (let z = 0; z <= Z_MAX; z += 10) {
			const py = yScale(z);
			ctx.fillText(z.toString(), margin.left - 8, py);
			ctx.beginPath();
			ctx.moveTo(margin.left - 5, py);
			ctx.lineTo(margin.left, py);
			ctx.stroke();

			// Draw horizontal grid line
			if (z > 0) {
				ctx.save();
				ctx.setLineDash([2, 2]);
				ctx.beginPath();
				ctx.moveTo(margin.left, py);
				ctx.lineTo(margin.left + innerWidth, py);
				ctx.stroke();
				ctx.restore();
			}
		}
		ctx.save();
		ctx.translate(margin.left - 35, margin.top + innerHeight / 2);
		ctx.rotate(-Math.PI / 2);
		ctx.textAlign = 'center';
		ctx.font = '500 17px sans-serif';
		ctx.fillText('Depth z [m]', 0, 0);
		ctx.restore();

		// Draw B&W Color Legend
		const legendX = margin.left + innerWidth + 15;
		const legendY = margin.top;
		const legendHeight = innerHeight;
		const legendWidth = 15;

		const legendSteps = 50;
		for (let i = 0; i < legendSteps; i++) {
			const val = i / legendSteps;
			ctx.fillStyle = thermalInterpolator(1 - val);
			ctx.fillRect(
				legendX,
				legendY + i * (legendHeight / legendSteps),
				legendWidth,
				Math.ceil(legendHeight / legendSteps)
			);
		}

		ctx.strokeStyle = '#1f2937';
		ctx.lineWidth = 0.5;
		ctx.strokeRect(legendX, legendY, legendWidth, legendHeight);

		ctx.fillStyle = '#52525b';
		ctx.textAlign = 'left';
		ctx.textBaseline = 'middle';
		ctx.font = '14px sans-serif';
		ctx.fillText('30.0 K', legendX + legendWidth + 8, legendY);
		ctx.fillText('0.0 K', legendX + legendWidth + 8, legendY + legendHeight);
		ctx.save();
		ctx.translate(legendX + legendWidth + 40, legendY + legendHeight / 2);
		ctx.rotate(-Math.PI / 2);
		ctx.textAlign = 'center';
		ctx.font = '500 17px sans-serif';
		ctx.fillText('Temperature difference [K]', 0, 0);
		ctx.restore();
	}

	$effect(() => {
		const w = containerWidth || 800;
		drawHeatmap(w, timeHours, Number(q), Number(k), alpha, Number(H), Number(D), R_STEPS, Z_STEPS);
	});

	// ── Mirror-Source Insight ─────────────────────────────────────────────────
	let r_obs = $state(2.0);
	let z_obs = $state(20);
	let h_probe = $state(15); // integration position marker (D ~ D+H)
	let t_insight_log = $state(2); // hours
	let t_insight = $derived(Math.pow(10, t_insight_log));
	let H_insight = $state(30);
	let D_insight = $state(5);
	let k_insight = $state(2.5);
	let rhoCp_MJ_insight = $state(2.4);
	let alpha_insight = $derived(Number(k_insight) / (Number(rhoCp_MJ_insight) * 1e6));
	let insightWidth = $state(0);

	// Profile data for h = D..D+H
	const H_STEPS = 200;
	let hProfilePts = $derived.by(() => {
		const Hv = Number(H_insight);
		const Dv = Number(D_insight);
		const r = Number(r_obs);
		const z = Number(z_obs);
		const sqrtAt2 = 2 * Math.sqrt(alpha_insight * t_insight * 3600);
		return Array.from({ length: H_STEPS + 1 }, (_, i) => {
			const h = Dv + (i / H_STEPS) * Hv;
			const safeR = Math.max(r, 0.01);
			const d1 = Math.sqrt(safeR ** 2 + (z - h) ** 2);
			const d2 = Math.sqrt(safeR ** 2 + (z + h) ** 2);
			const real = erfc(d1 / sqrtAt2) / d1;
			const mirror = erfc(d2 / sqrtAt2) / d2;
			return { h, real, mirror, net: real - mirror };
		});
	});

	// y-domain for profile chart (cap at 95th percentile to avoid singularity blow-up)
	let profileYMax = $derived.by(() => {
		const vals = hProfilePts
			.map((p) => p.real)
			.filter(isFinite)
			.sort((a, b) => a - b);
		if (!vals.length) return 1;
		const pMax = vals[Math.floor(vals.length * 0.97)] * 1.15;
		return Math.max(1e-4, pMax); // d3 scale 도메인 [0,0]에 의한 NaN/렌더링 에러 방지
	});

	let yExp = $derived.by(() => {
		if (profileYMax <= 1e-4) return 0;
		const e = Math.floor(Math.log10(profileYMax));
		return e < 0 ? e : 0;
	});
	let yMult = $derived(Math.pow(10, -yExp));

	// Current probe values for geometry arrows
	let probeVals = $derived.by(() => {
		const h = Math.max(
			Number(D_insight),
			Math.min(Number(D_insight) + Number(H_insight), Number(h_probe))
		);
		const r = Math.max(Number(r_obs), 0.01);
		const z = Number(z_obs);
		const sqrtAt2 = 2 * Math.sqrt(alpha_insight * t_insight * 3600);
		const d1 = Math.sqrt(r ** 2 + (z - h) ** 2);
		const d2 = Math.sqrt(r ** 2 + (z + h) ** 2);
		return {
			h,
			d1: d1.toFixed(1),
			d2: d2.toFixed(1),
			real: (erfc(d1 / sqrtAt2) / d1).toFixed(4),
			mirror: (erfc(d2 / sqrtAt2) / d2).toFixed(4),
			net: (erfc(d1 / sqrtAt2) / d1 - erfc(d2 / sqrtAt2) / d2).toFixed(4)
		};
	});
</script>

<div class="min-h-screen bg-white font-sans text-zinc-900 selection:bg-zinc-200">
	<div class="mx-auto max-w-7xl px-6 py-12 lg:px-8">
		<div class="mb-12">
			<a
				href="/"
				class="mb-4 inline-block text-sm font-semibold tracking-widest text-zinc-500 uppercase transition-colors hover:text-zinc-900"
				>← Dashboard</a
			>
			<h1 class="mb-4 text-4xl font-bold tracking-tight text-zinc-900">Finite Line Source (FLS)</h1>
			<p class="max-w-3xl text-lg leading-relaxed font-light text-zinc-500">
				A 2D radial-axial thermal map representing realistic ground thermal behavior. Observe the
				"end effects" at the boundaries and the transition towards steady-state limits over
				extensive operations.
			</p>
		</div>

		<div class="mb-10 rounded-2xl border border-zinc-200 bg-zinc-50 p-6 md:p-8">
			<h2 class="mb-6 text-sm font-semibold tracking-widest text-zinc-900 uppercase">
				Mathematical Formulation (Mirror-Source Method)
			</h2>
			<div
				class="my-8 overflow-x-auto rounded-xl border border-zinc-200 bg-white py-4 text-center text-xl text-zinc-900 shadow-sm lg:text-2xl"
			>
				{@html renderMath(
					'T(r, z, t) = T_g + \\frac{q}{4 \\pi k^*} \\int_{D}^{D+H} \\left( \\frac{\\text{erfc}\\left(\\frac{\\sqrt{r^2 + (z-h)^2}}{2\\sqrt{\\alpha t}}\\right)}{\\sqrt{r^2+(z-h)^2}} - \\frac{\\text{erfc}\\left(\\frac{\\sqrt{r^2 + (z+h)^2}}{2\\sqrt{\\alpha t}}\\right)}{\\sqrt{r^2+(z+h)^2}} \\right) dh',
					true
				)}
			</div>
			<p class="mx-auto max-w-3xl text-center text-sm leading-relaxed text-zinc-500">
				This mathematical formulation calculates absolute temperature {@html renderMath('T')}. The
				interactive visualizer below automatically drops {@html renderMath('T_g')} to map the relative
				temperature rise {@html renderMath('\\Delta T')}. The model utilizes the imaginary
				mirror-source technique across the ground surface boundary (Z=0). As time {@html renderMath(
					't'
				)} approaches long-term decades, {@html renderMath('\\text{erfc}(\\dots) \\to 1')}, leading
				perfectly into the <strong>steady-state limit</strong>.
			</p>
		</div>

		<div class="grid grid-cols-1 gap-10 xl:grid-cols-[380px_1fr]">
			<!-- Controls Panel -->
			<div class="space-y-8 rounded-2xl border border-zinc-200 bg-zinc-50 p-8">
				<h2
					class="mb-6 border-b border-zinc-200 pb-2 text-sm font-semibold tracking-widest text-zinc-900 uppercase"
				>
					Geometry & Time
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
						min="0"
						max="6"
						step="0.05"
						bind:value={timeLog}
						class="h-1 w-full cursor-pointer appearance-none rounded-full bg-zinc-200 accent-zinc-900"
					/>
					<div class="flex justify-between font-mono text-sm text-zinc-400">
						<span>1 h</span>
						<span>1,000,000 h (114 yr)</span>
					</div>
				</div>

				<!-- Length H -->
				<div class="space-y-3 pt-4">
					<label class="flex justify-between text-base font-medium text-zinc-700">
						<span>Active borehole length ({@html renderMath('H')})</span>
						<span class="font-bold text-zinc-900">{H} m</span>
					</label>
					<input
						type="range"
						min="10"
						max="100"
						step="5"
						bind:value={H}
						class="h-1 w-full cursor-pointer appearance-none rounded-full bg-zinc-200 accent-zinc-900"
					/>
				</div>

				<!-- Buried Depth D -->
				<div class="space-y-3 border-b border-zinc-200 pt-4 pb-6">
					<label class="flex justify-between text-base font-medium text-zinc-700">
						<span>Buried depth ({@html renderMath('D')})</span>
						<span class="font-bold text-zinc-900">{D} m</span>
					</label>
					<input
						type="range"
						min="0"
						max="20"
						step="1"
						bind:value={D}
						class="h-1 w-full cursor-pointer appearance-none rounded-full bg-zinc-200 accent-zinc-900"
					/>
				</div>

				<!-- Heat Injection Rate q -->
				<div class="space-y-3 pt-2">
					<label class="flex justify-between text-base font-medium text-zinc-700">
						<span>Heat injection rate ({@html renderMath('q')})</span>
						<span class="font-bold text-zinc-900">{Number(q).toFixed(1)} W/m</span>
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

				<!-- Soil Thermal Conductivity k -->
				<div class="space-y-3 pt-4">
					<label class="flex justify-between text-base font-medium text-zinc-700">
						<span>Soil thermal conductivity ({@html renderMath('k')})</span>
						<span class="font-bold text-zinc-900">{Number(k).toFixed(2)} W/mK</span>
					</label>
					<input
						type="range"
						min="0.5"
						max="5.0"
						step="0.1"
						bind:value={k}
						class="h-1 w-full cursor-pointer appearance-none rounded-full bg-zinc-200 accent-zinc-900"
					/>
				</div>

				<!-- Volumetric Capacity -->
				<div class="space-y-3 pt-4">
					<label class="flex justify-between text-base font-medium text-zinc-700">
						<span>Volumetric heat capacity ({@html renderMath('\\rho c_p')})</span>
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
					<div class="mt-2 text-right font-mono text-sm text-zinc-500">
						{@html renderMath('\\alpha')} = {(alpha * 1e6).toFixed(2)} × 10⁻⁶ m²/s
					</div>
				</div>

				<div
					class="mt-8 rounded-xl border border-zinc-200 bg-white p-5 text-sm leading-relaxed text-zinc-600 shadow-sm"
				>
					<strong class="mb-2 block font-medium text-zinc-900">💡 Physical Insight</strong>
					Unlike the ILS model where temperatures diverge infinitely over time, advancing the simulation
					to <b>&gt; 100,000 h</b> causes the thermal plume to geometrically stabilize. The mirror-source
					enforces zero temperature rise at the surface.
				</div>
			</div>

			<!-- Chart Panel -->
			<div
				class="flex flex-col rounded-2xl border border-zinc-200 bg-white shadow-sm"
				bind:clientWidth={containerWidth}
			>
				<div class="flex items-center justify-between p-6 pb-0">
					<h3 class="text-sm font-semibold tracking-widest text-zinc-900 uppercase">
						Z-R Plane Heatmap
					</h3>
					<span
						class="flex items-center gap-2 rounded-md border border-zinc-200 bg-zinc-100 px-2.5 py-1 font-mono text-xs text-zinc-500"
					>
						<span>HTML5 Canvas</span>
						<span class="h-2 w-2 rounded-full bg-green-500"></span>
					</span>
				</div>
				<div class="relative flex h-[600px] w-full flex-grow justify-center p-6 pt-4">
					<canvas
						bind:this={canvasElement}
						class="max-w-full rounded-xl border border-zinc-100 object-contain"
					></canvas>
				</div>
			</div>
		</div>

		<!-- ═══════════════════════════════════════════════════════════════════
		     Mirror-Source Insight Section
		════════════════════════════════════════════════════════════════════ -->
		<div class="mt-14">
			<div class="mb-6">
				<h2 class="text-2xl font-bold tracking-tight text-zinc-900">
					Why does temperature vary with depth?
				</h2>
				<p class="mt-2 max-w-3xl text-sm leading-relaxed font-light text-zinc-500">
					Each real heat source element at depth {@html renderMath('h')} has a mirror image at {@html renderMath(
						'-h'
					)}. Move the sliders to see how the two integrand terms nearly cancel near the surface,
					explaining why the ground surface boundary stays cool.
				</p>
			</div>

			<!-- Sliders Grouped -->
			<div class="mb-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
				<!-- Time Domain -->
				<div class="h-full rounded-xl border border-zinc-200 bg-zinc-50 p-5">
					<h3 class="mb-4 text-xs font-bold tracking-widest text-zinc-500 uppercase">
						Time Domain
					</h3>
					<!-- t_insight_log -->
					<div class="space-y-2">
						<label class="flex justify-between text-sm font-medium text-zinc-700">
							<span>Time {@html renderMath('t')}</span>
							<span class="font-bold text-zinc-900"
								>{Number(t_insight) >= 1000
									? (Number(t_insight) / 1000).toFixed(0) + 'k'
									: Number(t_insight).toFixed(0)} h</span
							>
						</label>
						<input
							type="range"
							min="0"
							max="5"
							step="0.1"
							bind:value={t_insight_log}
							class="h-1 w-full cursor-pointer appearance-none rounded-full bg-zinc-200 accent-zinc-900"
						/>
					</div>
				</div>

				<!-- Soil Thermal Properties -->
				<div class="h-full rounded-xl border border-zinc-200 bg-zinc-50 p-5">
					<h3 class="mb-4 text-xs font-bold tracking-widest text-zinc-500 uppercase">
						Soil Thermal Properties
					</h3>
					<div class="grid grid-cols-2 gap-6">
						<!-- k_insight -->
						<div class="space-y-2">
							<label class="flex justify-between text-sm font-medium text-zinc-700">
								<span>Cond. {@html renderMath('k')}</span>
								<span class="font-bold text-zinc-900">{Number(k_insight).toFixed(1)} W/mK</span>
							</label>
							<input
								type="range"
								min="0.5"
								max="5.0"
								step="0.1"
								bind:value={k_insight}
								class="h-1 w-full cursor-pointer appearance-none rounded-full bg-zinc-200 accent-zinc-900"
							/>
						</div>
						<!-- rhoCp_insight -->
						<div class="space-y-2">
							<label class="flex justify-between text-sm font-medium text-zinc-700">
								<span>Vol. capacity {@html renderMath('\\rho c_p')}</span>
								<span class="font-bold text-zinc-900"
									>{Number(rhoCp_MJ_insight).toFixed(1)} MJ/m³K</span
								>
							</label>
							<input
								type="range"
								min="1.0"
								max="3.5"
								step="0.1"
								bind:value={rhoCp_MJ_insight}
								class="h-1 w-full cursor-pointer appearance-none rounded-full bg-zinc-200 accent-zinc-900"
							/>
						</div>
					</div>
				</div>

				<!-- Observation Point -->
				<div class="h-full rounded-xl border border-zinc-200 bg-zinc-50 p-5">
					<h3 class="mb-4 text-xs font-bold tracking-widest text-zinc-500 uppercase">
						Observation Point
					</h3>
					<div class="grid grid-cols-2 gap-6">
						<!-- r_obs -->
						<div class="space-y-2">
							<label class="flex justify-between text-sm font-medium text-zinc-700">
								<span>Radial {@html renderMath('r')}</span>
								<span class="font-bold text-zinc-900">{Number(r_obs).toFixed(1)} m</span>
							</label>
							<input
								type="range"
								min="0"
								max="80"
								step="0.5"
								bind:value={r_obs}
								class="h-1 w-full cursor-pointer appearance-none rounded-full bg-zinc-200 accent-zinc-900"
							/>
						</div>
						<!-- z_obs -->
						<div class="space-y-2">
							<label class="flex justify-between text-sm font-medium text-zinc-700">
								<span>Depth {@html renderMath('z')}</span>
								<span class="font-bold text-zinc-900">{Number(z_obs).toFixed(1)} m</span>
							</label>
							<input
								type="range"
								min="0"
								max="50"
								step="0.5"
								bind:value={z_obs}
								class="h-1 w-full cursor-pointer appearance-none rounded-full bg-zinc-200 accent-zinc-900"
							/>
						</div>
					</div>
				</div>

				<!-- Borehole Source Geometry -->
				<div class="h-full rounded-xl border border-zinc-200 bg-zinc-50 p-5">
					<h3 class="mb-4 text-xs font-bold tracking-widest text-zinc-500 uppercase">
						Borehole Source Geometry
					</h3>
					<div class="grid grid-cols-1 gap-6 md:grid-cols-3">
						<!-- h_probe -->
						<div class="space-y-2">
							<label class="flex justify-between text-sm font-medium text-zinc-700">
								<span>Source {@html renderMath('h')}</span>
								<span class="font-bold text-zinc-900">{Number(h_probe).toFixed(1)} m</span>
							</label>
							<input
								type="range"
								min="0"
								max="50"
								step="0.5"
								bind:value={h_probe}
								class="h-1 w-full cursor-pointer appearance-none rounded-full bg-zinc-200 accent-zinc-900"
							/>
						</div>
						<!-- H_insight -->
						<div class="space-y-2">
							<label class="flex justify-between text-sm font-medium text-zinc-700">
								<span>Length {@html renderMath('H')}</span>
								<span class="font-bold text-zinc-900">{Number(H_insight)} m</span>
							</label>
							<input
								type="range"
								min="10"
								max="30"
								step="1"
								bind:value={H_insight}
								class="h-1 w-full cursor-pointer appearance-none rounded-full bg-zinc-200 accent-zinc-900"
							/>
						</div>
						<!-- D_insight -->
						<div class="space-y-2">
							<label class="flex justify-between text-sm font-medium text-zinc-700">
								<span>Buried {@html renderMath('D')}</span>
								<span class="font-bold text-zinc-900">{Number(D_insight)} m</span>
							</label>
							<input
								type="range"
								min="0"
								max="10"
								step="0.5"
								bind:value={D_insight}
								class="h-1 w-full cursor-pointer appearance-none rounded-full bg-zinc-200 accent-zinc-900"
							/>
						</div>
					</div>
				</div>
			</div>

			<!-- Two-panel chart row -->
			<div class="grid grid-cols-1 gap-8 lg:grid-cols-2">
				<!-- ── Panel A: Geometry Diagram ──────────────────────────── -->
				{#snippet geomDiagram()}
					{@const gW = 420}
					{@const gH = 500}
					{@const gM = { top: 30, right: 30, bottom: 40, left: 55 }}
					{@const zDomain = [-50, 50]}
					{@const gInW = gW - gM.left - gM.right}
					{@const gInH = gH - gM.top - gM.bottom}
					{@const rDomainSpan = gInW / (gInH / (zDomain[1] - zDomain[0]))}
					{@const rDomain = [-2, rDomainSpan - 2]}
					{@const gxSc = d3
						.scaleLinear()
						.domain(rDomain)
						.range([gM.left, gM.left + gInW])}
					{@const gySc = d3
						.scaleLinear()
						.domain(zDomain)
						.range([gM.top, gM.top + gInH])}
					{@const hClamped = Math.max(
						Number(D_insight),
						Math.min(Number(D_insight) + Number(H_insight), Number(h_probe))
					)}
					{@const rObs = Number(r_obs)}
					{@const zObs = Number(z_obs)}
					{@const px_r = gxSc(Math.max(rDomain[0], Math.min(rObs, rDomain[1])))}
					{@const py_z = gySc(Math.max(zDomain[0], Math.min(zObs, zDomain[1])))}
					{@const py_h = gySc(hClamped)}
					{@const py_mh = gySc(-hClamped)}
					{@const py_D = gySc(Number(D_insight))}
					{@const py_DH = gySc(Number(D_insight) + Number(H_insight))}
					{@const py_mD = gySc(-Number(D_insight))}
					{@const py_mDH = gySc(-(Number(D_insight) + Number(H_insight)))}
					{@const px_r0 = gxSc(0)}
					<svg width={gW} height={gH} class="w-full touch-none overflow-visible select-none">
						<defs>
							<clipPath id="geom-clip">
								<rect x={gM.left} y={0} width={gInW} height={gH} />
							</clipPath>
							<marker
								id="arr-blue"
								markerWidth="8"
								markerHeight="8"
								refX="6"
								refY="3"
								orient="auto"
							>
								<path d="M0,0 L0,6 L8,3 z" fill="#3b82f6" />
							</marker>
							<marker
								id="arr-rose"
								markerWidth="8"
								markerHeight="8"
								refX="6"
								refY="3"
								orient="auto"
							>
								<path d="M0,0 L0,6 L8,3 z" fill="#f43f5e" />
							</marker>
							<!-- Hatching for surface -->
							<pattern
								id="hatch"
								width="8"
								height="8"
								patternUnits="userSpaceOnUse"
								patternTransform="rotate(45)"
							>
								<line x1="0" y1="0" x2="0" y2="8" stroke="#a1a1aa" stroke-width="2" />
							</pattern>
						</defs>

						<!-- Ground surface line -->
						<line
							x1={gM.left}
							y1={gySc(0)}
							x2={gM.left + gInW}
							y2={gySc(0)}
							stroke="#1f2937"
							stroke-width="0.5"
							stroke-dasharray="4 2"
						/>
						<!-- Hatching above surface (mirror region) -->
						<rect
							x={gM.left}
							y={0}
							width={gInW}
							height={gySc(0)}
							fill="url(#hatch)"
							opacity="0.2"
						/>
						<!-- Mirror zone label -->
						<text
							x={gM.left + 8}
							y={gySc(0) - 6}
							class="fill-zinc-400 text-[11px]"
							font-style="italic">Mirror region (imaginary)</text
						>

						<!-- Y axis -->
						<line
							x1={gM.left}
							y1={gM.top}
							x2={gM.left}
							y2={gM.top + gInH}
							stroke="#1f2937"
							stroke-width="0.5"
						/>
						<!-- Y ticks -->
						{#each d3.ticks(zDomain[0], zDomain[1], 10) as zt}
							<line
								x1={gM.left - 5}
								y1={gySc(zt)}
								x2={gM.left}
								y2={gySc(zt)}
								stroke="#1f2937"
								stroke-width="0.5"
							/>
							<text
								x={gM.left - 8}
								y={gySc(zt) + 1}
								text-anchor="end"
								dominant-baseline="middle"
								class="fill-zinc-500 text-[12px]">{zt}</text
							>
						{/each}
						<!-- Y label -->
						<g transform={`translate(${gM.left - 42},${gM.top + gInH / 2}) rotate(-90)`}>
							<text text-anchor="middle" class="fill-zinc-700 text-[13px] font-semibold"
								>Depth z [m]</text
							>
						</g>
						<!-- X axis -->
						<line
							x1={gM.left}
							y1={gM.top + gInH}
							x2={gM.left + gInW}
							y2={gM.top + gInH}
							stroke="#1f2937"
							stroke-width="0.5"
						/>
						{#each d3.ticks(rDomain[0], rDomain[1], 6) as rt}
							<line
								x1={gxSc(rt)}
								y1={gM.top + gInH}
								x2={gxSc(rt)}
								y2={gM.top + gInH + 5}
								stroke="#1f2937"
								stroke-width="0.5"
							/>
							<text
								x={gxSc(rt)}
								y={gM.top + gInH + 18}
								text-anchor="middle"
								class="fill-zinc-500 text-[12px]">{rt}</text
							>
						{/each}
						<text
							x={gM.left + gInW / 2}
							y={gH - 4}
							text-anchor="middle"
							class="fill-zinc-700 text-[13px] font-semibold">Radial distance r [m]</text
						>

						<!-- Real borehole bar -->
						<line
							x1={px_r0}
							y1={py_D}
							x2={px_r0}
							y2={py_DH}
							stroke="#ef4444"
							stroke-width="6"
							stroke-linecap="round"
							clip-path="url(#geom-clip)"
						/>
						<text
							x={px_r0 + 6}
							y={py_DH + 2}
							dominant-baseline="hanging"
							class="fill-red-600 text-[11px] font-semibold">Real BH</text
						>

						<!-- Mirror borehole bar (above surface) -->
						<line
							x1={px_r0}
							y1={py_mDH}
							x2={px_r0}
							y2={py_mD}
							stroke="#f43f5e"
							stroke-width="4"
							stroke-linecap="round"
							stroke-dasharray="5 3"
							clip-path="url(#geom-clip)"
							opacity="0.6"
						/>
						<text
							x={px_r0 + 6}
							y={py_mDH - 2}
							dominant-baseline="baseline"
							class="fill-rose-400 text-[11px]"
							font-style="italic">Mirror BH</text
						>

						<!-- h probe dot on real borehole -->
						<circle
							cx={px_r0}
							cy={py_h}
							r="6"
							fill="#3b82f6"
							stroke="white"
							stroke-width="1.5"
							clip-path="url(#geom-clip)"
							style="cursor: ns-resize"
							role="slider"
							tabindex="0"
							aria-valuenow={h_probe}
							onpointerdown={(e) => {
								const el = e.currentTarget;
								el.setPointerCapture(e.pointerId);
								const svg = el.closest('svg');
								if (!svg) return;
								const pt = new DOMPoint();
								const move = (ev: PointerEvent) => {
									pt.x = ev.clientX;
									pt.y = ev.clientY;
									const svgP = pt.matrixTransform(svg.getScreenCTM()!.inverse());
									h_probe = gySc.invert(svgP.y);
								};
								const up = (ev: PointerEvent) => {
									el.releasePointerCapture(ev.pointerId);
									el.removeEventListener('pointermove', move);
									el.removeEventListener('pointerup', up);
								};
								el.addEventListener('pointermove', move);
								el.addEventListener('pointerup', up);
							}}
						/>
						<!-- -h probe dot on mirror borehole -->
						<circle
							cx={px_r0}
							cy={py_mh}
							r="6"
							fill="#f43f5e"
							stroke="white"
							stroke-width="1.5"
							clip-path="url(#geom-clip)"
							opacity="0.75"
						/>

						<!-- Observation point -->
						<circle
							cx={px_r}
							cy={py_z}
							r="6"
							fill="#0d9488"
							stroke="white"
							stroke-width="1.5"
							clip-path="url(#geom-clip)"
							style="cursor: move"
							role="button"
							tabindex="0"
							onpointerdown={(e) => {
								const el = e.currentTarget;
								el.setPointerCapture(e.pointerId);
								const svg = el.closest('svg');
								if (!svg) return;
								const pt = new DOMPoint();
								const move = (ev: PointerEvent) => {
									pt.x = ev.clientX;
									pt.y = ev.clientY;
									const svgP = pt.matrixTransform(svg.getScreenCTM()!.inverse());
									r_obs = Math.max(0, gxSc.invert(svgP.x));
									z_obs = Math.max(0, gySc.invert(svgP.y));
								};
								const up = (ev: PointerEvent) => {
									el.releasePointerCapture(ev.pointerId);
									el.removeEventListener('pointermove', move);
									el.removeEventListener('pointerup', up);
								};
								el.addEventListener('pointermove', move);
								el.addEventListener('pointerup', up);
							}}
						/>
						<text
							x={px_r + 12}
							y={py_z + 1}
							dominant-baseline="middle"
							class="pointer-events-none fill-teal-700 text-[13px] font-semibold select-none"
							>({Number(r_obs).toFixed(1)}, {Number(z_obs).toFixed(1)})</text
						>

						<!-- Real distance arrow: h → (r,z) -->
						<line
							x1={px_r0}
							y1={py_h}
							x2={px_r}
							y2={py_z}
							stroke="#3b82f6"
							stroke-width="1.5"
							stroke-dasharray="none"
							marker-end="url(#arr-blue)"
							clip-path="url(#geom-clip)"
						/>
						<!-- Mirror distance arrow: -h → (r,z) -->
						<line
							x1={px_r0}
							y1={py_mh}
							x2={px_r}
							y2={py_z}
							stroke="#f43f5e"
							stroke-width="1.5"
							stroke-dasharray="5 3"
							marker-end="url(#arr-rose)"
							clip-path="url(#geom-clip)"
						/>

						<!-- Distance labels -->
						<text
							x={(px_r0 + px_r) / 2}
							y={(py_h + py_z) / 2 - 8}
							text-anchor="middle"
							dominant-baseline="middle"
							stroke="white"
							stroke-width="3"
							paint-order="stroke"
							stroke-linejoin="round"
							class="fill-black text-[12px] font-bold">d₁ = {probeVals.d1} m</text
						>
						<text
							x={(px_r0 + px_r) / 2}
							y={(py_mh + py_z) / 2 - 8}
							text-anchor="middle"
							dominant-baseline="middle"
							stroke="white"
							stroke-width="3"
							paint-order="stroke"
							stroke-linejoin="round"
							class="fill-black text-[12px] font-bold">d₂ = {probeVals.d2} m</text
						>
					</svg>
				{/snippet}

				<div class="flex flex-col rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
					<div class="mb-3 flex items-center justify-between px-2">
						<h3 class="text-sm font-semibold tracking-widest text-zinc-900 uppercase">
							Geometry Diagram
						</h3>
						<div class="flex gap-4 text-xs text-zinc-500">
							<span class="flex items-center gap-1"
								><span class="inline-block h-2 w-5 rounded bg-blue-500"></span>Real source</span
							>
							<span class="flex items-center gap-1"
								><span class="inline-block h-2 w-5 rounded bg-rose-400"></span>Mirror source</span
							>
							<span class="flex items-center gap-1"
								><span class="inline-block h-3 w-3 rounded-full bg-teal-500"></span>Obs. point</span
							>
						</div>
					</div>
					<div class="flex justify-center">{@render geomDiagram()}</div>
				</div>

				<!-- ── Panel B: Integrand Profile ─────────────────────────── -->
				{#snippet profileChart(pW: number)}
					{@const pH = 500}
					{@const effectiveW = Math.max(300, pW)}
					{@const pM = { top: 30, right: 20, bottom: 55, left: 65 }}
					{@const pIW = effectiveW - pM.left - pM.right}
					{@const pIH = pH - pM.top - pM.bottom}
					{@const pxSc = d3
						.scaleLinear()
						.domain([Number(D_insight), Number(D_insight) + Number(H_insight)])
						.range([pM.left, pM.left + pIW])}
					{@const pySc = d3
						.scaleLinear()
						.domain([0, profileYMax])
						.range([pH - pM.bottom, pM.top])}
					{@const realLine =
						d3
							.line<{ h: number; real: number }>()
							.x((p) => pxSc(p.h))
							.y((p) => pySc(Math.min(p.real, profileYMax)))
							.curve(d3.curveCatmullRom)(hProfilePts) ?? ''}
					{@const mirrorLine =
						d3
							.line<{ h: number; mirror: number }>()
							.x((p) => pxSc(p.h))
							.y((p) => pySc(Math.min(p.mirror, profileYMax)))
							.curve(d3.curveCatmullRom)(hProfilePts) ?? ''}
					{@const netArea =
						d3
							.area<{ h: number; net: number }>()
							.x((p) => pxSc(p.h))
							.y0(pH - pM.bottom)
							.y1((p) => pySc(Math.max(0, Math.min(p.net, profileYMax))))
							.curve(d3.curveCatmullRom)(hProfilePts) ?? ''}
					{@const hPx = pxSc(
						Math.max(
							Number(D_insight),
							Math.min(Number(D_insight) + Number(H_insight), Number(h_probe))
						)
					)}
					{@const pxTicks = d3.ticks(Number(D_insight), Number(D_insight) + Number(H_insight), 6)}
					{@const pyTicks = d3.ticks(0, profileYMax, 5)}
					<svg width={effectiveW} height={pH} class="w-full overflow-visible">
						<defs>
							<clipPath id="prof-clip">
								<rect x={pM.left} y={pM.top} width={pIW} height={pIH} />
							</clipPath>
						</defs>
						<!-- Grid -->
						<g stroke="#6b7280" stroke-width="0.4" stroke-dasharray="2 2" opacity="0.5">
							{#each pxTicks as t}
								<line x1={pxSc(t)} y1={pM.top} x2={pxSc(t)} y2={pH - pM.bottom} />
							{/each}
							{#each pyTicks as t}
								<line x1={pM.left} y1={pySc(t)} x2={pM.left + pIW} y2={pySc(t)} />
							{/each}
						</g>
						<!-- Net area (teal fill) -->
						<path d={netArea} fill="#0d9488" fill-opacity="0.15" clip-path="url(#prof-clip)" />
						<!-- Mirror term (pink dashed) -->
						<path
							d={mirrorLine}
							fill="none"
							stroke="#f43f5e"
							stroke-width="2"
							stroke-dasharray="5 3"
							stroke-linecap="round"
							clip-path="url(#prof-clip)"
						/>
						<!-- Real term (blue solid) -->
						<path
							d={realLine}
							fill="none"
							stroke="#3b82f6"
							stroke-width="2.5"
							stroke-linecap="round"
							clip-path="url(#prof-clip)"
						/>
						<!-- h probe vertical line -->
						<line
							x1={hPx}
							y1={pM.top}
							x2={hPx}
							y2={pH - pM.bottom}
							stroke="#6b7280"
							stroke-width="1.5"
							stroke-dasharray="4 3"
							clip-path="url(#prof-clip)"
						/>
						<!-- Spine -->
						<rect
							x={pM.left}
							y={pM.top}
							width={pIW}
							height={pIH}
							fill="none"
							stroke="#1f2937"
							stroke-width="0.5"
						/>
						<!-- X ticks + labels -->
						<g stroke="#1f2937" stroke-width="0.5">
							{#each pxTicks as t}
								<line x1={pxSc(t)} y1={pH - pM.bottom} x2={pxSc(t)} y2={pH - pM.bottom + 5} />
								<text
									x={pxSc(t)}
									y={pH - pM.bottom + 18}
									text-anchor="middle"
									class="fill-zinc-500 text-[12px]">{t}</text
								>
							{/each}
						</g>
						<text
							x={pM.left + pIW / 2}
							y={pH - pM.bottom + 38}
							text-anchor="middle"
							class="fill-zinc-800 text-[13px] font-semibold">Integration variable h [m]</text
						>
						<!-- Y ticks + labels -->
						<g stroke="#1f2937" stroke-width="0.5">
							{#each pyTicks as t}
								<line x1={pM.left - 5} y1={pySc(t)} x2={pM.left} y2={pySc(t)} />
								<text
									x={pM.left - 9}
									y={pySc(t) + 1}
									text-anchor="end"
									dominant-baseline="middle"
									class="fill-zinc-500 text-[12px]">{Number((t * yMult).toFixed(2))}</text
								>
							{/each}
						</g>
						<g transform={`translate(${pM.left - 42},${pM.top + pIH / 2}) rotate(-90)`}>
							<text text-anchor="middle" class="fill-zinc-800 text-[13px] font-semibold"
								>Integrand {yExp < 0 ? `[×10${toSuperscript(yExp)} m⁻¹]` : `[m⁻¹]`}</text
							>
						</g>
						<!-- Legend -->
						<foreignObject x={pM.left + 10} y={pM.top + 8} width={pIW - 20} height="50">
							<div
								xmlns="http://www.w3.org/1999/xhtml"
								class="px-3 py-2"
								style="font-family:inherit;font-size:11px;color:#3f3f46;display:flex;flex-direction:row;flex-wrap:wrap;justify-content:flex-end;gap:16px;width:max-content;margin-left:auto;"
							>
								<div style="display:flex;align-items:center;gap:6px">
									<svg width="22" height="4" style="flex-shrink:0;overflow:visible"
										><line
											x1="0"
											y1="2"
											x2="22"
											y2="2"
											stroke="#3b82f6"
											stroke-width="2.5"
											stroke-linecap="round"
										/></svg
									>
									<span
										>{@html renderMath(
											'f_{\\text{real}} = \\frac{\\text{erfc}(d_1 / (2\\sqrt{\\alpha t}))}{d_1}'
										)}</span
									>
								</div>
								<div style="display:flex;align-items:center;gap:6px">
									<svg width="22" height="4" style="flex-shrink:0;overflow:visible"
										><line
											x1="0"
											y1="2"
											x2="22"
											y2="2"
											stroke="#f43f5e"
											stroke-width="2"
											stroke-dasharray="5 3"
											stroke-linecap="round"
										/></svg
									>
									<span
										>{@html renderMath(
											'f_{\\text{mirror}} = \\frac{\\text{erfc}(d_2 / (2\\sqrt{\\alpha t}))}{d_2}'
										)}</span
									>
								</div>
								<div style="display:flex;align-items:center;gap:6px">
									<svg width="22" height="10" style="flex-shrink:0;overflow:visible"
										><rect width="22" height="10" fill="#0d9488" opacity="0.3" /></svg
									>
									<span>Integrand area</span>
								</div>
							</div>
						</foreignObject>
					</svg>
				{/snippet}

				<div class="flex flex-col rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
					<div class="mb-3 flex items-center justify-between px-2">
						<h3 class="text-sm font-semibold tracking-widest text-zinc-900 uppercase">
							Integrand Profile vs h
						</h3>
					</div>
					<div class="flex w-full flex-1 justify-center" bind:clientWidth={panelBWidth}>
						<!-- Only render when clientWidth is resolved -->
						{#if panelBWidth > 0}
							{@render profileChart(panelBWidth)}
						{/if}
					</div>
					<!-- Insight readout -->
					<div
						class="mx-4 mb-3 grid grid-cols-3 gap-2 rounded-xl border border-zinc-100 bg-zinc-50 p-3 font-mono text-xs"
					>
						<div class="text-center">
							<div class="text-zinc-400">Real @ h={probeVals.h.toFixed(1)}</div>
							<div class="font-bold text-blue-600">{probeVals.real}</div>
						</div>
						<div class="text-center">
							<div class="text-zinc-400">Mirror @ h={probeVals.h.toFixed(1)}</div>
							<div class="font-bold text-rose-500">{probeVals.mirror}</div>
						</div>
						<div class="text-center">
							<div class="text-zinc-400">Net contribution</div>
							<div class="font-bold text-teal-600">{probeVals.net}</div>
						</div>
					</div>
				</div>
			</div>
			<!-- grid -->
		</div>
		<!-- mirror insight -->
	</div>
</div>
