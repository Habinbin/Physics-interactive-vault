<script lang="ts">
	import * as d3 from 'd3';
	import { calculateMovingSource } from '$lib/physics/movingSource';
	import katex from 'katex';

	function renderMath(tex: string, displayMode = false) {
		try {
			return katex.renderToString(tex, { throwOnError: false, displayMode });
		} catch {
			return tex;
		}
	}

	// Parameters
	let timeLog = $state(2); // 10^2 = 100 h
	let timeHours = $derived(Math.pow(10, Number(timeLog)));

	let q = $state(40);
	let k = $state(2.0);
	let rhoCp_MJ = $state(2.4);
	let alpha = $derived(Number(k) / (Number(rhoCp_MJ) * 1e6));

	// Groundwater velocity in meters per year
	let U_myr = $state(15);
	let U_angle = $state(0); // Angle in radians
	// Convert m/year to m/s
	let U = $derived(Number(U_myr) / (365.25 * 24 * 3600));
	let Ux = $derived(U * Math.cos(U_angle));
	let Uy = $derived(U * Math.sin(U_angle));

	// Adaptive Resolution State
	let isDragging = $state(false);
	let dragTimeout: ReturnType<typeof setTimeout>;
	function handleInput() {
		isDragging = true;
		clearTimeout(dragTimeout);
		dragTimeout = setTimeout(() => {
			isDragging = false;
		}, 200);
	}

	// Vector Interaction State
	function handlePointerDown(e: PointerEvent) {
		if (!canvasElement) return;
		canvasElement.setPointerCapture(e.pointerId);
		document.body.style.cursor = 'grabbing';
		updateVectorFromEvent(e);
		canvasElement.addEventListener('pointermove', handlePointerMove);
		canvasElement.addEventListener('pointerup', handlePointerUp);
	}

	function handlePointerMove(e: PointerEvent) {
		updateVectorFromEvent(e);
	}

	function handlePointerUp(e: PointerEvent) {
		if (!canvasElement) return;
		canvasElement.releasePointerCapture(e.pointerId);
		document.body.style.cursor = '';
		canvasElement.removeEventListener('pointermove', handlePointerMove);
		canvasElement.removeEventListener('pointerup', handlePointerUp);
	}

	function updateVectorFromEvent(e: MouseEvent | PointerEvent) {
		if (!canvasElement) return;
		const rect = canvasElement.getBoundingClientRect();
		const clientX = e.clientX - rect.left;
		const clientY = e.clientY - rect.top;

		const margin = { top: 30, right: 80, bottom: 50, left: 60 };
		const w = containerWidth || 800;
		const height = 600;
		let innerWidth = w - margin.left - margin.right;
		let innerHeight = height - margin.top - margin.bottom;

		const pxM_x = innerWidth / (X_MAX - X_MIN);
		const pxM_y = innerHeight / (Y_MAX - Y_MIN);
		const pxM = Math.min(pxM_x, pxM_y);
		const mappedWidth = pxM * (X_MAX - X_MIN);
		const mappedHeight = pxM * (Y_MAX - Y_MIN);
		const finalMarginLeft = margin.left + (innerWidth - mappedWidth) / 2;
		const finalMarginTop = margin.top + (innerHeight - mappedHeight) / 2;

		const originX = finalMarginLeft + mappedWidth / 2;
		const originY = finalMarginTop + mappedHeight / 2;

		const dx_px = clientX - originX;
		// y-axis flipped in cartesian compared to canvas
		const dy_px = -(clientY - originY);

		// Angle:
		U_angle = Math.atan2(dy_px, dx_px);

		const maxDragPx = Math.min(mappedWidth, mappedHeight) / 2;
		const distPx = Math.sqrt(dx_px * dx_px + dy_px * dy_px);
		const MAX_U_MYR = 300;
		U_myr = Math.min(MAX_U_MYR, Math.max(0, (distPx / maxDragPx) * MAX_U_MYR));

		handleInput(); // Adaptive resolution during interaction
	}

	let canvasElement: HTMLCanvasElement | null = $state(null);
	let containerWidth = $state(0);

	// Constants for domain (x-y plane)
	const X_MIN = -10.0;
	const X_MAX = 10.0;
	const Y_MIN = -10.0;
	const Y_MAX = 10.0;

	let X_STEPS = $derived(isDragging ? 25 : 100);
	let Y_STEPS = $derived(isDragging ? 25 : 100);

	function drawHeatmap(
		w: number,
		t: number,
		qVal: number,
		kVal: number,
		aVal: number,
		uxVal: number,
		uyVal: number,
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

		const margin = { top: 30, right: 80, bottom: 50, left: 60 };
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
			.range([margin.top + innerHeight, margin.top]); // standard cartesian y points up

		ctx.clearRect(0, 0, w, height);
		ctx.fillStyle = '#ffffff';
		ctx.fillRect(margin.left, margin.top, innerWidth, innerHeight);

		const tSeconds = t * 3600;
		const dx = (X_MAX - X_MIN) / xSteps;
		const dy = (Y_MAX - Y_MIN) / ySteps;

		const cells = [];
		let maxTemp = 0.1;

		for (let iy = 0; iy < ySteps; iy++) {
			for (let ix = 0; ix < xSteps; ix++) {
				const x_center = X_MIN + ix * dx + dx / 2;
				const y_center = Y_MIN + iy * dy + dy / 2;
				const T = Math.max(
					0,
					calculateMovingSource(x_center, y_center, tSeconds, qVal, kVal, aVal, uxVal, uyVal)
				);
				if (T > maxTemp) maxTemp = T;
				cells.push({ xIndex: ix, yIndex: iy, T, x_center, y_center });
			}
		}

		// Inferno Colormap
		const thermalInterpolator = d3.interpolateInferno;
		const colorScale = d3.scaleSequential(thermalInterpolator).domain([0, 10]);

		const cellPixelWidth = innerWidth / xSteps;
		const cellPixelHeight = innerHeight / ySteps;

		for (const cell of cells) {
			ctx.fillStyle = colorScale(cell.T);
			// because yScale maps Y_MAX to margin.top, iy=0 (Y_MIN) is drawn at the bottom
			// to draw rectangles correctly in Canvas:
			const px = margin.left + cell.xIndex * cellPixelWidth;
			const py = margin.top + innerHeight - (cell.yIndex + 1) * cellPixelHeight;
			ctx.fillRect(px, py, cellPixelWidth + 0.5, cellPixelHeight + 0.5);
		}

		// Border (Spine)
		ctx.strokeStyle = '#1f2937'; // gray-800
		ctx.lineWidth = 0.5;
		ctx.strokeRect(margin.left, margin.top, innerWidth, innerHeight);

		// Setup Grid Style
		ctx.strokeStyle = '#6b7280'; // gray-500

		// Axes overlay
		ctx.beginPath();
		ctx.moveTo(margin.left, margin.top + innerHeight / 2); // Origin X-axis line (Y=0)
		ctx.lineTo(margin.left + innerWidth, margin.top + innerHeight / 2);
		ctx.moveTo(xScale(0), margin.top); // Origin Y-axis line (X=0)
		ctx.lineTo(xScale(0), height - margin.bottom);
		ctx.stroke();

		// X Axis ticks
		ctx.fillStyle = '#71717a';
		ctx.font = '14px sans-serif';
		ctx.textAlign = 'center';
		ctx.textBaseline = 'top';
		for (let xNum = X_MIN; xNum <= X_MAX; xNum += 5) {
			const px = xScale(xNum);
			ctx.fillText(xNum.toString(), px, height - margin.bottom + 8);
			ctx.beginPath();
			ctx.moveTo(px, height - margin.bottom);
			ctx.lineTo(px, height - margin.bottom + 5);
			ctx.stroke();

			// Draw vertical grid line
			if (xNum !== 0) {
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
		ctx.fillText('x-coordinate [m]', margin.left + innerWidth / 2, height - margin.bottom + 30);

		// Y Axis ticks
		ctx.textAlign = 'right';
		ctx.textBaseline = 'middle';
		ctx.font = '14px sans-serif';
		for (let yNum = Y_MIN; yNum <= Y_MAX; yNum += 5) {
			const py = yScale(yNum);
			ctx.fillText(yNum.toString(), margin.left - 8, py);
			ctx.beginPath();
			ctx.moveTo(margin.left - 5, py);
			ctx.lineTo(margin.left, py);
			ctx.stroke();

			// Draw horizontal grid line
			if (yNum !== 0) {
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
		ctx.fillText('y-coordinate [m]', 0, 0);
		ctx.restore();

		// Borehole Marker
		const rZeroPixelX = xScale(0.0);
		const rZeroPixelY = yScale(0.0);

		ctx.fillStyle = '#212529';
		ctx.beginPath();
		ctx.arc(rZeroPixelX, rZeroPixelY, 4, 0, 2 * Math.PI);
		ctx.fill();

		// Groundwater Flow Arrow Indicator
		const uMag = Math.sqrt(uxVal * uxVal + uyVal * uyVal);
		if (uMag > 0) {
			ctx.save();
			const originX = margin.left + innerWidth / 2;
			const originY = margin.top + innerHeight / 2;

			const maxDragPx = Math.min(mappedWidth, mappedHeight) / 2;
			const MAX_U_MYR = 300;
			// map uMag back to pixels.
			const uMyr = uMag * (365.25 * 24 * 3600);
			const lengthPx = Math.max(10, (uMyr / MAX_U_MYR) * maxDragPx);
			const angle = Math.atan2(-uyVal, uxVal); // canvas y is down, so -uyVal

			ctx.translate(originX, originY);
			ctx.rotate(angle);

			ctx.strokeStyle = '#ffffff';
			ctx.lineWidth = 2;
			ctx.beginPath();
			ctx.moveTo(0, 0);
			ctx.lineTo(lengthPx, 0);
			ctx.stroke();

			ctx.beginPath();
			ctx.moveTo(lengthPx - 8, -5);
			ctx.lineTo(lengthPx, 0);
			ctx.lineTo(lengthPx - 8, 5);
			ctx.stroke();

			ctx.restore();
		}

		// Draw Thermal Color Legend
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
		ctx.fillText('10.0 K', legendX + legendWidth + 8, legendY);
		ctx.fillText('0 K', legendX + legendWidth + 8, legendY + legendHeight);
		ctx.save();
		ctx.translate(legendX + legendWidth + 40, legendY + legendHeight / 2);
		ctx.rotate(-Math.PI / 2);
		ctx.textAlign = 'center';
		ctx.font = '500 17px sans-serif';
		// Position adjusted for slightly longer text
		ctx.fillText('Temperature difference', 0, 0);
		ctx.restore();
	}

	$effect(() => {
		const w = containerWidth || 800;
		drawHeatmap(w, timeHours, Number(q), Number(k), alpha, Ux, Uy, X_STEPS, Y_STEPS);
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
			<h1 class="mb-4 text-4xl font-bold tracking-tight text-zinc-900">
				Moving Heat-source Method (Advection)
			</h1>
			<p class="max-w-3xl text-lg leading-relaxed font-light text-zinc-500">
				A 2D Planar (x-y) mapping of thermal diffusion distorted by lateral groundwater advection.
				Observe the formation of extended "thermal plumes" that actively suppress localized borehole
				temperature accumulation.
			</p>
		</div>

		<div class="mb-10 rounded-2xl border border-zinc-200 bg-zinc-50 p-6 md:p-8">
			<h2 class="mb-6 text-sm font-semibold tracking-widest text-zinc-900 uppercase">
				Mathematical Formulation (Generalized 2D Advection)
			</h2>
			<p class="mx-auto max-w-3xl text-sm leading-relaxed text-zinc-500">
				While standard texts model flow exclusively along the x-axis, the interactive environment
				generalizes this to any planar direction using velocity vector {@html renderMath(
					'\\vec{U} = (U_x, U_y)'
				)}. The governing equation modifies into:
			</p>
			<div class="group my-4 overflow-x-auto text-center text-lg text-zinc-900">
				{@html renderMath(
					'\\frac{\\partial T}{\\partial t} + U_x \\frac{\\partial T}{\\partial x} + U_y \\frac{\\partial T}{\\partial y} = \\alpha \\left( \\frac{\\partial^2 T}{\\partial x^2} + \\frac{\\partial^2 T}{\\partial y^2} + \\frac{\\partial^2 T}{\\partial z^2} \\right)',
					true
				)}
			</div>

			<p class="mx-auto mt-8 max-w-3xl text-sm leading-relaxed text-zinc-500">
				Consequently, the transient integral solution accommodates the full 2D displacement over
				time:
			</p>
			<div
				class="my-6 overflow-x-auto rounded-xl border border-zinc-200 bg-white py-4 text-center text-xl text-zinc-900 shadow-sm lg:text-2xl"
			>
				{@html renderMath(
					'\\Delta T(x, y, t) = \\frac{q}{4 \\pi k} \\int_{0}^{t} \\frac{1}{\\tau} \\exp\\left( -\\frac{(x - U_x \\tau)^2 + (y - U_y \\tau)^2}{4 \\alpha \\tau} \\right) d\\tau',
					true
				)}
			</div>
			<p class="mx-auto max-w-3xl text-center text-sm leading-relaxed text-zinc-500">
				This integral models the continuous heat emission perceived as moving against the effective
				thermal flow {@html renderMath('\\vec{U}')}. Higher advection directly mitigates long-term
				efficiency degradation.
			</p>
		</div>

		<div class="grid grid-cols-1 gap-10 xl:grid-cols-[380px_1fr]">
			<!-- Controls Panel -->
			<div class="space-y-8 rounded-2xl border border-zinc-200 bg-zinc-50 p-8">
				<h2
					class="mb-6 border-b border-zinc-200 pb-2 text-sm font-semibold tracking-widest text-zinc-900 uppercase"
				>
					Advection Parameters
				</h2>

				<!-- Time -->
				<div class="space-y-3 border-b border-zinc-200 pb-2 pb-6">
					<label class="flex justify-between text-base font-medium text-zinc-700">
						<span>Time ({@html renderMath('t')})</span>
						<span class="font-bold text-zinc-900"
							>{timeHours >= 10 ? Math.round(timeHours) : timeHours.toFixed(1)} h</span
						>
					</label>
					<input
						type="range"
						min="0"
						max="4"
						step="0.05"
						bind:value={timeLog}
						oninput={handleInput}
						class="h-1 w-full cursor-pointer appearance-none rounded-full bg-zinc-200 accent-zinc-900"
					/>
					<div class="flex justify-between font-mono text-sm text-zinc-400">
						<span>1 h</span>
						<span>10,000 h</span>
					</div>
				</div>

				<!-- Heat Flux -->
				<div class="space-y-3 pt-2 pb-2">
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
						oninput={handleInput}
						class="h-1 w-full cursor-pointer appearance-none rounded-full bg-zinc-200 accent-zinc-900"
					/>
				</div>

				<!-- GW velocity -->
				<div class="space-y-3 border-b border-zinc-200 pt-4 pb-2 pb-6">
					<label class="flex justify-between text-base font-medium text-zinc-700">
						<span>Groundwater velocity ({@html renderMath('U')})</span>
						<span class="font-bold text-zinc-900">{U_myr.toFixed(1)} m/yr</span>
					</label>
					<input
						type="range"
						min="0"
						max="300"
						step="1"
						bind:value={U_myr}
						oninput={handleInput}
						class="h-1 w-full cursor-pointer appearance-none rounded-full bg-zinc-200 accent-zinc-900"
					/>
					<div class="mt-1 text-right font-mono text-sm text-zinc-400">
						{@html renderMath(`U = ${(U * 1e7).toFixed(2)} \\times 10^{-7}\\ \\text{m}/\\text{s}`)}
					</div>
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
						oninput={handleInput}
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
						oninput={handleInput}
						class="h-1 w-full cursor-pointer appearance-none rounded-full bg-zinc-200 accent-zinc-900"
					/>
				</div>

				<div
					class="mt-8 rounded-xl border border-zinc-200 bg-white p-5 text-sm leading-relaxed text-zinc-600 shadow-sm"
				>
					<strong class="mb-2 block font-medium text-zinc-900">💡 Physical Insight</strong>
					Notice how the circular conduction ({@html renderMath('U = 0')}) is severely forced into
					an elliptical <b>thermal plume</b> pointing exclusively downstream (+x). A sufficient flow acts
					as a powerful convective cooling mechanism!
				</div>
			</div>

			<!-- Chart Panel -->
			<div
				class="flex flex-col rounded-2xl border border-zinc-200 bg-white shadow-sm"
				bind:clientWidth={containerWidth}
			>
				<div class="flex items-center justify-between p-6 pb-0">
					<h3 class="text-sm font-semibold tracking-widest text-zinc-900 uppercase">
						X-Y Planar Heatmap
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
						onpointerdown={handlePointerDown}
						class="max-w-full cursor-grab touch-none rounded-xl border border-zinc-100 object-contain shadow-inner"
					></canvas>
				</div>
			</div>
		</div>
	</div>
</div>
