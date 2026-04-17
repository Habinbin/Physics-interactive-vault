<script lang="ts">
	import katex from 'katex';
	import RoomDiagram from './RoomDiagram.svelte';
	import ExergyChart from './ExergyChart.svelte';

	function renderMath(tex: string, displayMode = false) {
		try {
			return katex.renderToString(tex, { throwOnError: false, displayMode });
		} catch {
			return tex;
		}
	}

	// Environment state
	let T0 = $state(20.0); // °C

	// Flow state
	let T_a_iu_in = $state(25.0); // °C
	let T_a_iu_out = $state(35.0); // °C

	// Base params
	let V_dot_a = $state(1.0); // m³/s
	let rho_a = $state(1.2); // kg/m³
	let c_a = $state(1.006); // kJ/(kg K)

	// Computed Exergy variables
	let T0_K = $derived(T0 + 273.15);

	let T_a_iu_in_K = $derived(T_a_iu_in + 273.15);
	let T_a_iu_out_K = $derived(T_a_iu_out + 273.15);

	// Exergy Rate Calculation [kW]
	let X_in = $derived(
		c_a *
			rho_a *
			V_dot_a *
			((T_a_iu_in - T0) - T0_K * Math.log(T_a_iu_in_K / T0_K))
	);

	let X_out = $derived(
		c_a *
			rho_a *
			V_dot_a *
			((T_a_iu_out - T0) - T0_K * Math.log(T_a_iu_out_K / T0_K))
	);

	// Heat removal and Exergy Demand
	let Q_r_iu = $derived(
		c_a * rho_a * V_dot_a * (T_a_iu_out - T_a_iu_in)
	); // kW (will be negative for cooling)

	let X_demand = $derived(
		(1 - T0_K / T_a_iu_in_K) * (-Q_r_iu)
	); // kW
</script>

<div class="min-h-screen bg-white font-sans text-zinc-900 selection:bg-zinc-200">
	<div class="mx-auto max-w-7xl px-6 py-12 lg:px-8">
		<div class="mb-12">
			<a
				href="/"
				class="mb-4 inline-block text-sm font-semibold tracking-widest text-zinc-500 uppercase transition-colors hover:text-zinc-900"
				>← Dashboard</a
			>
			<h1 class="mb-4 text-4xl font-bold tracking-tight text-zinc-900">Air Exergy Flow</h1>
			<p class="mb-8 max-w-3xl text-lg leading-relaxed font-light text-zinc-500">
				Visualize and analyze the thermodynamic exergy embedded in air streams interacting with a room's indoor unit.
			</p>

			<div class="rounded-2xl border border-zinc-200 bg-zinc-50 p-6">
				<h2
					class="mb-4 border-b border-zinc-200 pb-2 text-sm font-semibold tracking-widest text-zinc-900 uppercase"
				>
					Exergy Rate of Air Flow
				</h2>
				<div class="overflow-x-auto py-4 text-center text-lg">
					{@html renderMath(
						'\\dot{X}_{a} = c_a \\cdot \\rho_a \\cdot \\dot{V}_a \\left[ (T_a - T_0) - T_{0,K} \\ln \\left( \\frac{T_{a,K}}{T_{0,K}} \\right) \\right]',
						true
					)}
				</div>
                <p class="mt-4 text-center text-sm leading-relaxed font-light text-zinc-600">
					Where {@html renderMath('T_{0,K}')} and {@html renderMath('T_{a,K}')} must be in absolute temperature (Kelvin), while {@html renderMath('(T_a - T_0)')} can be in Celsius.
				</p>
			</div>
		</div>

		<div class="mb-12 flex flex-col gap-8">
			<div class="grid grid-cols-1 gap-8 lg:grid-cols-2 items-start">
				
				<!-- Left Column: Diagram & Chart -->
				<div class="flex flex-col gap-8 h-full">
					<!-- Diagram View -->
					<div class="rounded-2xl border border-zinc-200 bg-zinc-50 p-6 shadow-sm">
						<h2 class="mb-6 text-sm font-semibold tracking-widest text-zinc-900 uppercase">
							Room & Indoor Unit SVG Diagram
						</h2>
						<div class="flex justify-center border border-zinc-200 rounded-xl bg-white overflow-hidden p-4">
							<RoomDiagram {T_a_iu_in} {T_a_iu_out} {X_in} {X_out} {Q_r_iu} {X_demand} />
						</div>
					</div>

					<!-- Chart View -->
					<div class="rounded-2xl border border-zinc-200 bg-zinc-50 p-6 shadow-sm h-full">
						<h2 class="mb-6 text-sm font-semibold tracking-widest text-zinc-900 uppercase">
							Exergy Potential Curve
						</h2>
						<div class="flex h-[400px] w-full justify-center">
							<ExergyChart {T0} {T_a_iu_in} {T_a_iu_out} {X_in} {X_out} {V_dot_a} {rho_a} {c_a} />
						</div>
					</div>
				</div>

				<!-- Right Column: Controls Panel -->
				<div class="h-fit space-y-8 rounded-2xl border border-zinc-200 bg-zinc-50 p-6 shadow-sm">
				<h2
					class="border-b border-zinc-200 pb-2 text-sm font-semibold tracking-widest text-zinc-900 uppercase"
				>
					System Parameters
				</h2>

				<!-- Environment controls -->
				<div class="space-y-4 border-b border-zinc-200 pb-6">
                    <h3 class="text-sm font-medium tracking-tight text-zinc-500 uppercase">Environment</h3>
					<div class="space-y-3">
						<label class="flex justify-between text-base font-medium text-zinc-700">
							<span>Outdoor Temp ({@html renderMath('T_0')})</span>
							<span class="font-bold text-zinc-900">{T0.toFixed(1)} °C</span>
						</label>
						<input
							type="range"
							min="-20"
							max="40"
							step="0.5"
							bind:value={T0}
							class="h-1 w-full cursor-pointer appearance-none rounded-full bg-zinc-200 accent-zinc-900"
						/>
					</div>
				</div>

				<!-- Temperatures -->
				<div class="space-y-4 border-b border-zinc-200 pb-6">
                    <h3 class="text-sm font-medium tracking-tight text-zinc-500 uppercase">Flow Temperatures</h3>
					<div class="space-y-3">
						<label class="flex justify-between text-base font-medium text-zinc-700">
							<span>Intake Temp ({@html renderMath('T_{a,iu\\_in}')})</span>
							<span class="font-bold text-zinc-900">{T_a_iu_in.toFixed(1)} °C</span>
						</label>
						<input
							type="range"
							min="0"
							max="50"
							step="0.5"
							bind:value={T_a_iu_in}
							class="h-1 w-full cursor-pointer appearance-none rounded-full bg-zinc-200 accent-blue-600"
						/>
					</div>
					<div class="space-y-3">
						<label class="flex justify-between text-base font-medium text-zinc-700">
							<span>Exhaust Temp ({@html renderMath('T_{a,iu\\_out}')})</span>
							<span class="font-bold text-zinc-900">{T_a_iu_out.toFixed(1)} °C</span>
						</label>
						<input
							type="range"
							min="0"
							max="50"
							step="0.5"
							bind:value={T_a_iu_out}
							class="h-1 w-full cursor-pointer appearance-none rounded-full bg-zinc-200 accent-red-500"
						/>
					</div>
				</div>

				<!-- Air Properties -->
				<div class="space-y-4">
                    <h3 class="text-sm font-medium tracking-tight text-zinc-500 uppercase">Air Properties</h3>
					<div class="space-y-3">
						<label class="flex justify-between text-base font-medium text-zinc-700">
							<span>Vol. Flow Rate ({@html renderMath('\\dot{V}_a')})</span>
							<span class="font-bold text-zinc-900">{V_dot_a.toFixed(2)} m³/s</span>
						</label>
						<input
							type="range"
							min="0.1"
							max="5.0"
							step="0.1"
							bind:value={V_dot_a}
							class="h-1 w-full cursor-pointer appearance-none rounded-full bg-zinc-200 accent-zinc-900"
						/>
					</div>
					<div class="space-y-3">
						<label class="flex justify-between text-base font-medium text-zinc-700">
							<span>Air Density ({@html renderMath('\\rho_a')})</span>
							<span class="font-bold text-zinc-900">{rho_a.toFixed(2)} kg/m³</span>
						</label>
						<input
							type="range"
							min="1.0"
							max="1.4"
							step="0.05"
							bind:value={rho_a}
							class="h-1 w-full cursor-pointer appearance-none rounded-full bg-zinc-200 accent-zinc-900"
						/>
					</div>
					<div class="space-y-3">
						<label class="flex justify-between text-base font-medium text-zinc-700">
							<span>Specific Heat ({@html renderMath('c_a')})</span>
							<span class="font-bold text-zinc-900">{c_a.toFixed(3)} kJ/(kg·K)</span>
						</label>
						<input
							type="range"
							min="1.0"
							max="1.1"
							step="0.001"
							bind:value={c_a}
							class="h-1 w-full cursor-pointer appearance-none rounded-full bg-zinc-200 accent-zinc-900"
						/>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
</div>
