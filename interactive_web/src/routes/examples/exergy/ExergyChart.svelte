<script lang="ts">
	import * as d3 from 'd3';

	let { T0, T_a_iu_in, T_a_iu_out, X_in, X_out, V_dot_a, rho_a, c_a } = $props<{
		T0: number;
		T_a_iu_in: number;
		T_a_iu_out: number;
		X_in: number;
		X_out: number;
		V_dot_a: number;
		rho_a: number;
		c_a: number;
	}>();

	let width = $state(400);
	const height = 300;
	const margin = { top: 20, right: 30, bottom: 40, left: 60 };

	let innerWidth = $derived(Math.max(100, width - margin.left - margin.right));
	let innerHeight = height - margin.top - margin.bottom;

	let chartData = $derived.by(() => {
		// Define X range dynamically around T0
		const xDomain = [T0 - 25, T0 + 25];
		const T0_K = T0 + 273.15;

		const points: [number, number][] = [];
		const steps = 100;

		let maxY = 0;

		for (let i = 0; i <= steps; i++) {
			const t_C = xDomain[0] + (xDomain[1] - xDomain[0]) * (i / steps);
			const t_K = t_C + 273.15;

			const x_val = c_a * rho_a * V_dot_a * ((t_C - T0) - T0_K * Math.log(t_K / T0_K));
			
			points.push([t_C, x_val]);
			if (isNaN(x_val)) continue;
			if (x_val > maxY) maxY = x_val;
		}

		// Calculate the max for Y-axis (Ensure some minimal height)
		const yMax = maxY > 0.1 ? maxY * 1.2 : 5;

		const xScale = d3.scaleLinear().domain(xDomain).range([0, innerWidth]);
		const yScale = d3.scaleLinear().domain([0, yMax]).range([innerHeight, 0]);

		const line = d3
			.line()
			.x((d) => xScale(d[0]))
			.y((d) => yScale(d[1]));

		return {
			path: line(points) || '',
			xScale,
			yScale,
			xDomain,
			yMax
		};
	});

	let xScale = $derived(chartData.xScale as any);
	let yScale = $derived(chartData.yScale as any);
</script>

<div class="h-full w-full" bind:clientWidth={width}>
	<svg {width} {height} class="overflow-visible">
		<g transform="translate({margin.left}, {margin.top})">
			<!-- Spine -->
			<rect
				x="0"
				y="0"
				width={innerWidth}
				height={innerHeight}
				fill="none"
				stroke="#1f2937"
				stroke-width="0.5"
			/>

			<!-- Reference Line at T0 -->
			<line
				x1={xScale(T0)}
				y1="0"
				x2={xScale(T0)}
				y2={innerHeight}
				stroke="#9ca3af"
				stroke-width="1"
				stroke-dasharray="4 4"
			/>
			<text
				x={xScale(T0) + 5}
				y="10"
				class="fill-zinc-500 text-xs font-semibold"
			>
				T₀ = {T0.toFixed(1)}°C
			</text>

			<!-- Curve Path -->
			<path
				d={chartData.path}
				fill="none"
				stroke="#64748b"
				stroke-width="2.5"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>

			<!-- Intake Point -->
			<circle
				cx={xScale(T_a_iu_in)}
				cy={yScale(X_in)}
				r="5"
				fill="#2563eb"
				stroke="#ffffff"
				stroke-width="1.5"
			/>
			<text
				x={xScale(T_a_iu_in)}
				y={yScale(X_in) - 10}
				class="fill-blue-700 text-xs font-bold"
				text-anchor="middle"
			>
				In: {X_in.toFixed(3)}
			</text>

			<!-- Exhaust Point -->
			<circle
				cx={xScale(T_a_iu_out)}
				cy={yScale(X_out)}
				r="5"
				fill="#ef4444"
				stroke="#ffffff"
				stroke-width="1.5"
			/>
			<text
				x={xScale(T_a_iu_out)}
				y={yScale(X_out) - 10}
				class="fill-red-600 text-xs font-bold"
				text-anchor="middle"
			>
				Out: {X_out.toFixed(3)}
			</text>

			<!-- X Axis Label -->
			<text
				x={innerWidth / 2}
				y={innerHeight + 35}
				class="fill-zinc-900 text-sm font-semibold"
				text-anchor="middle"
			>
				Temperature T [°C]
			</text>

			<!-- Y Axis Label -->
			<g transform="translate(-45, {innerHeight / 2}) rotate(-90)">
				<text
					x="0"
					y="0"
					class="fill-zinc-900 text-sm font-semibold"
					text-anchor="middle"
				>
					Exergy Rate X_rate [kW]
				</text>
			</g>

			<!-- Generate X Ticks dynamically -->
			<g stroke="#1f2937" stroke-width="0.5">
				{#each xScale.ticks(5) as tick}
					<line
						x1={xScale(tick)}
						y1={innerHeight}
						x2={xScale(tick)}
						y2={innerHeight + 6}
					/>
					<text
						x={xScale(tick)}
						y={innerHeight + 20}
						class="fill-zinc-600 text-xs font-medium"
						stroke="none"
						text-anchor="middle"
					>
						{tick}
					</text>
				{/each}

				<!-- Generate Y Ticks -->
				{#each yScale.ticks(5) as tick}
					<line
						x1="-6"
						y1={yScale(tick)}
						x2="0"
						y2={yScale(tick)}
					/>
					<text
						x="-10"
						y={yScale(tick)}
						class="fill-zinc-600 text-xs font-medium"
						stroke="none"
						dominant-baseline="middle"
						text-anchor="end"
					>
						{tick}
					</text>
				{/each}
			</g>
		</g>
	</svg>
</div>
