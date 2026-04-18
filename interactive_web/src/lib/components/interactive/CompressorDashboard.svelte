<script lang="ts">
	import { fetchCompressionData, fetchSaturationDome, type CompressorResult, type SaturationPoint } from '$lib/api/compressor';
	import FormulaBlock from './FormulaBlock.svelte';
	import ThermodynamicDiagram from './ThermodynamicDiagram.svelte';

	let ref = $state('R134a');
	let tInCelsius = $state(20.0);
	let pIn = $state(300000);
	let pOut = $state(1200000);
	let n = $state(1.15);
	let mDot = $state(0.05);

	let activeTab = $state<'Ph' | 'Th' | 'Ts'>('Ph');

	let result = $state<CompressorResult | null>(null);
	let domeData = $state<SaturationPoint[]>([]);

	$effect(() => {
		const abortController = new AbortController();
		fetchSaturationDome(ref).then((r) => {
			if (!abortController.signal.aborted && r.success) {
				domeData = r.points;
			}
		});
		return () => abortController.abort();
	});

	$effect(() => {
		const abortController = new AbortController();
		fetchCompressionData({
			refrigerant: ref,
			T_cmp_in: tInCelsius + 273.15,
			P_cmp_in: pIn,
			P_cmp_out: pOut,
			n: n,
			m_dot: mDot
		}).then((r) => {
            if(!abortController.signal.aborted){
			    result = r;
            }
		});
        return () => abortController.abort();
	});

	// Derived metrics for UI
	let ratio = $derived(
		result?.success && result.W_closed > 0 ? (result.Q_out / result.W_closed) * 100 : 0
	);
	
	let tColor = $derived(() => {
		if (!result || !result.success) return 'text-zinc-500';
		const deltaT = result.T_cmp_out - (tInCelsius + 273.15);
		if (deltaT > 80) return 'text-red-600';
		if (deltaT > 40) return 'text-orange-500';
		return 'text-sky-600';
	});
</script>

<div class="mt-12 rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden flex flex-col md:flex-row">
	<!-- Left Panel: Controls -->
	<div class="w-full md:w-[30%] border-r border-zinc-200 bg-zinc-50 p-6 flex flex-col gap-6">
		<h3 class="text-sm font-semibold tracking-widest text-zinc-400 uppercase">Input conditions</h3>

		<div class="space-y-4">
			<div>
				<label class="block text-sm font-medium text-zinc-700 mb-1" for="ref-select">Refrigerant</label>
				<select
					id="ref-select"
					bind:value={ref}
					class="w-full rounded-md border-zinc-300 shadow-sm focus:border-zinc-500 focus:ring-zinc-500 text-sm"
				>
					<option value="R134a">R134a</option>
					<option value="R410A">R410A</option>
					<option value="CarbonDioxide">CO2 (R744)</option>
					<option value="Ammonia">Ammonia (R717)</option>
					<option value="Air">Air</option>
				</select>
			</div>

			<div>
				<label class="block text-sm font-medium text-zinc-700 mb-1 flex justify-between" for="t-in-range"
					><span><FormulaBlock math={String.raw`T_{in}`} /> (ºC)</span> <span>{tInCelsius.toFixed(1)}</span></label
				>
				<input id="t-in-range" type="range" min="-30" max="100" step="1" bind:value={tInCelsius} class="w-full accent-zinc-800" />
			</div>

			<div>
				<label class="block text-sm font-medium text-zinc-700 mb-1 flex justify-between" for="p-in-range"
					><span><FormulaBlock math={String.raw`P_{in}`} /> (kPa)</span> <span>{(pIn / 1000).toFixed(0)}</span></label
				>
				<input id="p-in-range" type="range" min="100000" max="2000000" step="10000" bind:value={pIn} class="w-full accent-zinc-800" />
			</div>

			<div>
				<label class="block text-sm font-medium text-zinc-700 mb-1 flex justify-between" for="p-out-range"
					><span><FormulaBlock math={String.raw`P_{out}`} /> (kPa)</span> <span>{(pOut / 1000).toFixed(0)}</span></label
				>
				<input id="p-out-range" type="range" min="100000" max="5000000" step="10000" bind:value={pOut} class="w-full accent-zinc-800" />
			</div>

			<div>
				<label class="block text-sm font-medium text-zinc-700 mb-1 flex justify-between" for="n-range"
					><span>Polytropic Index <FormulaBlock math={String.raw`n`} /></span> <span>{n.toFixed(3)}</span></label
				>
				<input id="n-range" type="range" min="1.000" max="1.500" step="0.001" bind:value={n} class="w-full accent-zinc-800" />
				<div class="text-xs text-zinc-500 mt-1 flex justify-between">
					<span>Isothermal (1)</span>
					<span>Adiabatic (<FormulaBlock math={String.raw`\gamma`} /> : <strong class="text-zinc-700">{result?.success ? result.gamma.toFixed(3) : '-'}</strong>)</span>
				</div>
			</div>

			<div>
				<label class="block text-sm font-medium text-zinc-700 mb-1 flex justify-between" for="mdot-range"
					><span>Mass Flow <FormulaBlock math={String.raw`\dot{m}`} /> (kg/s)</span> <span>{mDot.toFixed(3)}</span></label
				>
				<input id="mdot-range" type="range" min="0.01" max="0.5" step="0.01" bind:value={mDot} class="w-full accent-zinc-800" />
			</div>
		</div>
	</div>

	<!-- Center Panel: Interactive Schematic -->
	<div class="w-full md:w-[40%] p-6 bg-white flex flex-col">
		<h3 class="text-sm font-semibold tracking-widest text-zinc-400 uppercase mb-4">
			System schematic
		</h3>
		<div class="flex-1 flex items-center justify-center relative border border-zinc-100 rounded-xl overflow-hidden bg-zinc-50/50">
			{#if result && result.success}
				<!-- Simple Animated SVG representation of Compression -->
				<svg class="w-full max-w-md h-auto" viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg">
					<!-- Compressor Body (Inlet wide, Outlet narrow) -->
					<polygon points="150,50 250,100 250,200 150,250" fill="#f4f4f5" stroke="#18181b" stroke-width="3" stroke-linejoin="round" />
					
					<!-- Inlet Arrow -->
					<g class="transition-all duration-500 ease-out">
						<path d="M 50,150 L 140,150" stroke="#3b82f6" stroke-width="8" stroke-linecap="round" stroke-dasharray="8 8">
							<animate attributeName="stroke-dashoffset" from="16" to="0" dur="0.8s" repeatCount="indefinite" />
						</path>
						<!-- Inlet tooltip -->
						<rect x="50" y="110" width="80" height="30" rx="4" fill="white" stroke="#e4e4e7" />
						<text x="90" y="130" font-size="13" fill="#3f3f46" text-anchor="middle" font-family="sans-serif" font-weight="bold">
							{tInCelsius.toFixed(1)} ºC
						</text>
					</g>

					<!-- Outlet Arrow -->
					<g class="transition-all duration-500 ease-out">
						<path d="M 260,150 L 350,150" stroke={result.T_cmp_out - (tInCelsius + 273.15) > 40 ? "#ef4444" : "#f97316"} stroke-width="8" stroke-linecap="round" stroke-dasharray="8 8">
							<animate attributeName="stroke-dashoffset" from="16" to="0" dur="0.5s" repeatCount="indefinite" />
						</path>
						<!-- Outlet tooltip -->
						<rect x="270" y="110" width="80" height="30" rx="4" fill="white" stroke="#e4e4e7" />
						<text x="310" y="130" font-size="13" fill={result.T_cmp_out - (tInCelsius + 273.15) > 40 ? "#ef4444" : "#f97316"} text-anchor="middle" font-family="sans-serif" font-weight="bold">
							{(result.T_cmp_out - 273.15).toFixed(1)} ºC
						</text>
					</g>

					<!-- Heat Loss Arrow -->
					<g class="transition-opacity duration-500" opacity={ratio > 1 ? 1 : 0.2}>
						<path d="M 200,225 L 200,290" stroke="#f43f5e" stroke-width={Math.min(2 + ratio/5, 12)} stroke-linecap="round" stroke-dasharray="4 4" />
						<polyline points="190,280 200,290 210,280" fill="none" stroke="#f43f5e" stroke-width={Math.min(2 + ratio/5, 12)} stroke-linecap="round" stroke-linejoin="round" />
						<text x="210" y="275" font-size="13" fill="#f43f5e" font-family="sans-serif" font-weight="bold">
							Q_out = {(result.Q_out / 1000).toFixed(1)} kW
						</text>
					</g>

					<!-- Shaft Work Input -->
					<path d="M 200,10 L 200,100" stroke="#8b5cf6" stroke-width="6" stroke-linecap="round" />
					<polyline points="190,85 200,100 210,85" fill="none" stroke="#8b5cf6" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" />
					<text x="210" y="55" font-size="13" fill="#8b5cf6" font-weight="bold" font-family="sans-serif">
						W* = {(result.W_shaft / 1000).toFixed(1)} kW
					</text>
				</svg>
			{:else}
				<div class="text-zinc-400 flex flex-col items-center">
					<svg class="animate-spin h-8 w-8 mb-4 border-2 border-zinc-300 border-t-zinc-900 rounded-full" viewBox="0 0 24 24"></svg>
					Calculating physics...
				</div>
			{/if}
		</div>
	</div>

	<!-- Right Panel: Insight Dashboard -->
	<div class="w-full md:w-[30%] border-l border-zinc-200 bg-zinc-50 p-6 flex flex-col gap-6">
		<h3 class="text-sm font-semibold tracking-widest text-zinc-400 uppercase">Insights</h3>

		{#if result && result.success}
			<div class="space-y-6">
				<!-- Power Demands -->
				<div class="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm transition-all duration-300">
					<div class="text-xs text-zinc-500 font-medium mb-1">Shaft power requirement</div>
					<div class="text-2xl font-bold text-violet-600 flex items-baseline gap-2 flex-wrap">
						<FormulaBlock math={String.raw`W^*`} /> = {(result.W_shaft / 1000).toFixed(2)}
						<span class="text-xs font-medium text-zinc-500">kW</span>
					</div>
				</div>

				<div class="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm transition-all duration-300">
					<div class="text-xs text-zinc-500 font-medium mb-1">Thermal heat loss</div>
					<div class="text-2xl font-bold text-rose-500 flex items-baseline gap-2 flex-wrap">
						<FormulaBlock math={String.raw`Q_{out}`} /> = {(result.Q_out / 1000).toFixed(2)}
						<span class="text-xs font-medium text-zinc-500">kW</span>
					</div>
				</div>

				<!-- Heat vs Work Ratio -->
				<div>
					<div class="flex justify-between text-xs text-zinc-500 mb-2">
						<span>Isentropic compression</span>
						<span>Isothermal limit</span>
					</div>
					<div class="h-2 w-full bg-zinc-200 rounded-full overflow-hidden">
						<div class="h-full bg-rose-400 transition-all duration-500" style="width: {Math.min(ratio, 100)}%;"></div>
					</div>
					<p class="text-xs text-zinc-500 mt-2 leading-relaxed">
						Approx <strong class="text-zinc-800">{ratio.toFixed(1)}%</strong> of internal boundary work is lost to heat.
					</p>
				</div>

				<!-- Fluid Core Specs -->
				<div class="pt-4 border-t border-zinc-200">
					<h4 class="text-xs font-semibold text-zinc-800 mb-3 uppercase tracking-wider">Fluid state properties</h4>
					<div class="grid grid-cols-2 gap-4">
						<div>
							<div class="text-xs text-zinc-400">Specific heat capacity <FormulaBlock math={String.raw`c_p`} /></div>
							<div class="text-sm font-medium text-zinc-800">{(result.c_p).toFixed(0)} J/(kg·K)</div>
						</div>
						<div>
							<div class="text-xs text-zinc-400">Ratio <FormulaBlock math={String.raw`\gamma`} /></div>
							<div class="text-sm font-medium text-zinc-800">{result.gamma.toFixed(3)}</div>
						</div>
					</div>
				</div>
			</div>
		{:else}
			<p class="text-sm text-red-500">{result?.error || 'Awaiting connection...'}</p>
		{/if}
	</div>
</div>

<!-- Bottom Panel: Thermodynamic Diagrams -->
<div class="mt-8 bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
	<div class="flex border-b border-zinc-200 bg-zinc-50/50 p-2 gap-2 px-4">
		{#each ['Ph', 'Th', 'Ts'] as tab}
			<button 
				class="px-4 py-2 text-sm font-medium rounded-lg transition-colors {activeTab === tab ? 'bg-white text-zinc-900 shadow-sm border border-zinc-200' : 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100/50'}"
				onclick={() => activeTab = tab as 'Ph' | 'Th' | 'Ts'}
			>
				{tab} Diagram
			</button>
		{/each}
	</div>
	<div class="p-6">
		<ThermodynamicDiagram type={activeTab} {domeData} cycleParams={result} />
	</div>
</div>
