<script lang="ts">
	let { T_a_iu_in, T_a_iu_out, X_in, X_out, Q_r_iu, X_demand } = $props<{
		T_a_iu_in: number;
		T_a_iu_out: number;
		X_in: number;
		X_out: number;
		Q_r_iu: number;
		X_demand: number;
	}>();
</script>

<svg width="100%" height="300" viewBox="0 0 500 300" class="overflow-visible" preserveAspectRatio="xMidYMid meet">
	<!-- Room Box (The "Q" area in sketch) -->
	<rect x="50" y="50" width="400" height="200" fill="#f8fafc" stroke="#94a3b8" stroke-width="2" />
	<text x="250" y="150" class="fill-zinc-400 text-6xl font-bold font-serif opacity-10" text-anchor="middle" dominant-baseline="middle">Q</text>
	
	<!-- Room Stats Display -->
	<rect x="70" y="70" width="160" height="70" fill="white" fill-opacity="0.9" rx="6" stroke="#e2e8f0" stroke-width="1.5" />
	<text x="80" y="95" class="fill-zinc-800 text-sm font-semibold">
		Q_r,iu : {Q_r_iu.toFixed(3)} kW
	</text>
	<text x="80" y="125" class="fill-zinc-800 text-sm font-semibold">
		X_demand : {X_demand.toFixed(3)} kW
	</text>

	<!-- Indoor Unit (Wall-mounted shape) on the right wall -->
	<g transform="translate(380, 80)">
		<!-- AC Body -->
		<rect x="0" y="0" width="60" height="100" fill="#e2e8f0" stroke="#64748b" stroke-width="2" rx="4" />
		<!-- Condenser coil/fan lines abstraction 'S' -->
		<path d="M 20 20 Q 30 10 40 20 T 20 50 T 40 80" fill="none" stroke="#94a3b8" stroke-width="2" />
	</g>

	<!-- Intake Flow Arrow (from room into AC unit) -->
	<g transform="translate(320, 100)">
		<!-- Arrow shape pointing Right -->
		<path d="M -80 0 L 0 0 L -10 -10 M 0 0 L -10 10" fill="none" stroke="#2563eb" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
		<!-- Flow Label (Intake) -->
		<rect x="-85" y="-30" width="80" height="24" fill="white" fill-opacity="0.8" rx="4" />
		<text x="-45" y="-12" class="fill-blue-700 text-xs font-semibold" text-anchor="middle" dominant-baseline="middle">
			T = {T_a_iu_in.toFixed(1)}°C
		</text>
		<rect x="-85" y="6" width="80" height="24" fill="white" fill-opacity="0.8" rx="4" />
		<text x="-45" y="18" class="fill-blue-700 text-xs font-semibold" text-anchor="middle" dominant-baseline="middle">
			X = {X_in.toFixed(3)} kW
		</text>
	</g>

	<!-- Exhaust Flow Arrow (from AC unit back into room) -->
	<g transform="translate(320, 160)">
		<!-- Arrow shape pointing Left -->
		<path d="M 60 0 L -40 0 L -30 -10 M -40 0 L -30 10" fill="none" stroke="#ef4444" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
		<!-- Flow Label (Exhaust) -->
		<rect x="-35" y="-40" width="84" height="24" fill="white" fill-opacity="0.8" rx="4" />
		<text x="7" y="-22" class="fill-red-600 text-xs font-semibold" text-anchor="middle" dominant-baseline="middle">
			T = {T_a_iu_out.toFixed(1)}°C
		</text>
		<rect x="-35" y="12" width="84" height="24" fill="white" fill-opacity="0.8" rx="4" />
		<text x="7" y="24" class="fill-red-600 text-xs font-semibold" text-anchor="middle" dominant-baseline="middle">
			X = {X_out.toFixed(3)} kW
		</text>
	</g>

	<!-- Labels for Room -->
	<text x="60" y="40" class="fill-zinc-600 text-sm font-semibold">Room Interior</text>
	<text x="400" y="70" class="fill-zinc-600 text-sm font-semibold" text-anchor="middle">Indoor Unit</text>
</svg>
