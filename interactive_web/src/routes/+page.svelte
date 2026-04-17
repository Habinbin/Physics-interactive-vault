<script lang="ts">
	// Dashboard minimalist page
</script>

<div class="min-h-screen bg-white font-sans text-zinc-900 selection:bg-zinc-200">
	<div class="mx-auto max-w-5xl px-6 py-20 lg:px-8">
		<header class="mt-12 mb-24">
			<h1 class="mb-6 text-5xl font-extrabold tracking-tight text-zinc-900 sm:text-6xl">
				Ground Energy Systems
			</h1>
			<p class="max-w-3xl text-xl leading-relaxed font-light text-zinc-500">
				An interactive, physics-based educational platform exploring analytical heat conduction
				models. Adjust physical variables in real-time to build deep physical insights into borehole
				thermodynamics.
			</p>
		</header>

		<div class="space-y-4">
			<h2 class="mb-8 text-sm font-semibold tracking-widest text-zinc-400 uppercase">
				Analytical Models
			</h2>

			<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
				<!-- Cylindrical Coordinates Card -->
				<a
					href="/examples/cylindrical"
					class="group block rounded-2xl border border-zinc-200 bg-zinc-50 p-8 transition-all duration-300 hover:border-zinc-900"
				>
					<div class="mb-6 flex items-center justify-between">
						<h3 class="text-2xl font-bold text-zinc-900 transition-colors">
							Cylindrical Shell Resistance
						</h3>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-6 w-6 text-zinc-300 transition-colors group-hover:text-zinc-900"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="1.5"
							stroke-linecap="round"
							stroke-linejoin="round"
							><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"
							></polyline></svg
						>
					</div>
					<p class="text-sm leading-relaxed text-zinc-500">
						Analyze 1D radial heat conduction around a cylindrical source. Visualize dynamic heat
						spreading and evaluate the steady-state thermal resistance limit of the pipe wall.
					</p>
					<div class="mt-8 flex gap-2">
						<span
							class="inline-flex items-center rounded-md bg-zinc-200 px-2.5 py-0.5 text-xs font-medium text-zinc-800"
							>Radia Heatmap</span
						>
						<span
							class="inline-flex items-center rounded-md border border-zinc-200 bg-white px-2.5 py-0.5 text-xs font-medium text-zinc-600"
							>Thermal Resistance</span
						>
					</div>
				</a>

				<!-- Borehole Fluid Balance Card -->
				<a
					href="/examples/borehole-fluid"
					class="group block rounded-2xl border border-zinc-200 bg-zinc-50 p-8 transition-all duration-300 hover:border-zinc-900"
				>
					<div class="mb-6 flex items-center justify-between">
						<h3 class="text-2xl font-bold text-zinc-900 transition-colors">
							Borehole Fluid Balance
						</h3>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-6 w-6 text-zinc-300 transition-colors group-hover:text-zinc-900"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="1.5"
							stroke-linecap="round"
							stroke-linejoin="round"
							><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"
							></polyline></svg
						>
					</div>
					<p class="text-sm leading-relaxed text-zinc-500">
						Examine the internal borehole fluid energy balance. Observe the non-linear, inverse
						relationship between flow rate and the resultant inlet-outlet temperature split.
					</p>
					<div class="mt-8 flex gap-2">
						<span
							class="inline-flex items-center rounded-md bg-zinc-200 px-2.5 py-0.5 text-xs font-medium text-zinc-800"
							>Line Curve Chart</span
						>
						<span
							class="inline-flex items-center rounded-md border border-zinc-200 bg-white px-2.5 py-0.5 text-xs font-medium text-zinc-600"
							>Energy Balance</span
						>
					</div>
				</a>

				<!-- ILS Card -->
				<a
					href="/examples/ils"
					class="group block rounded-2xl border border-zinc-200 bg-zinc-50 p-8 transition-all duration-300 hover:border-zinc-900"
				>
					<div class="mb-6 flex items-center justify-between">
						<h3 class="text-2xl font-bold text-zinc-900 transition-colors">
							Infinite Line Source (ILS)
						</h3>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-6 w-6 text-zinc-300 transition-colors group-hover:text-zinc-900"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="1.5"
							stroke-linecap="round"
							stroke-linejoin="round"
							><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"
							></polyline></svg
						>
					</div>
					<p class="text-sm leading-relaxed text-zinc-500">
						Simulates pure radial heat conduction around an infinitely long borehole. Observe the
						logarithmic temperature rise and thermal penetration over time based on the exponential
						integral.
					</p>
					<div class="mt-8 flex gap-2">
						<span
							class="inline-flex items-center rounded-md bg-zinc-200 px-2.5 py-0.5 text-xs font-medium text-zinc-800"
							>D3 Chart</span
						>
						<span
							class="inline-flex items-center rounded-md border border-zinc-200 bg-white px-2.5 py-0.5 text-xs font-medium text-zinc-600"
							>Exponential Integral</span
						>
					</div>
				</a>

				<!-- FLS Card -->
				<a
					href="/examples/fls"
					class="group block rounded-2xl border border-zinc-200 bg-zinc-50 p-8 transition-all duration-300 hover:border-zinc-900"
				>
					<div class="mb-6 flex items-center justify-between">
						<h3 class="text-2xl font-bold text-zinc-900 transition-colors">
							Finite Line Source (FLS)
						</h3>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-6 w-6 text-zinc-300 transition-colors group-hover:text-zinc-900"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="1.5"
							stroke-linecap="round"
							stroke-linejoin="round"
							><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"
							></polyline></svg
						>
					</div>
					<p class="text-sm leading-relaxed text-zinc-500">
						Explores the 2D radial-axial profile using the mirror-source principle. Visualizes
						steady-state behavior and borehole end effects for long-term performance evaluation.
					</p>
					<div class="mt-8 flex gap-2">
						<span
							class="inline-flex items-center rounded-md bg-zinc-200 px-2.5 py-0.5 text-xs font-medium text-zinc-800"
							>2D Heatmap</span
						>
						<span
							class="inline-flex items-center rounded-md border border-zinc-200 bg-white px-2.5 py-0.5 text-xs font-medium text-zinc-600"
							>Steady-State Limit</span
						>
					</div>
				</a>

				<!-- Moving Source Card -->
				<a
					href="/examples/moving"
					class="group block rounded-2xl border border-zinc-200 bg-zinc-50 p-8 transition-all duration-300 hover:border-zinc-900"
				>
					<div class="mb-6 flex items-center justify-between">
						<h3 class="text-2xl font-bold text-zinc-900 transition-colors">
							Moving Heat-source (Advection)
						</h3>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-6 w-6 text-zinc-300 transition-colors group-hover:text-zinc-900"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="1.5"
							stroke-linecap="round"
							stroke-linejoin="round"
							><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"
							></polyline></svg
						>
					</div>
					<p class="text-sm leading-relaxed text-zinc-500">
						Explores thermal diffusion distorted by lateral groundwater advection. Visualize planar
						thermal plumes mitigating localized borehole temperature accumulation.
					</p>
					<div class="mt-8 flex gap-2">
						<span
							class="inline-flex items-center rounded-md bg-zinc-200 px-2.5 py-0.5 text-xs font-medium text-zinc-800"
							>X-Y Heatmap</span
						>
						<span
							class="inline-flex items-center rounded-md border border-zinc-200 bg-white px-2.5 py-0.5 text-xs font-medium text-zinc-600"
							>Convective Cooling</span
						>
					</div>
				</a>

				<!-- Superposition / Duhamel Card -->
				<a
					href="/examples/duhamel"
					class="group block rounded-2xl border border-zinc-200 bg-zinc-50 p-8 transition-all duration-300 hover:border-zinc-900"
				>
					<div class="mb-6 flex items-center justify-between">
						<h3 class="text-2xl font-bold text-zinc-900 transition-colors">
							Duhamel's Superposition
						</h3>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-6 w-6 text-zinc-300 transition-colors group-hover:text-zinc-900"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="1.5"
							stroke-linecap="round"
							stroke-linejoin="round"
							><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"
							></polyline></svg
						>
					</div>
					<p class="text-sm leading-relaxed text-zinc-500">
						Ultimate modeling environment blending Spatial Interference (placing multiple boreholes
						on an X-Y plane) with Temporal Superposition (Duhamel's step loads for
						extraction/injection).
					</p>
					<div class="mt-8 flex gap-2">
						<span
							class="inline-flex items-center rounded-md bg-zinc-200 px-2.5 py-0.5 text-xs font-medium text-zinc-800"
							>Spatial Interference</span
						>
						<span
							class="inline-flex items-center rounded-md border border-zinc-200 bg-white px-2.5 py-0.5 text-xs font-medium text-zinc-600"
							>Temporal Convolution</span
						>
					</div>
				</a>

				<!-- Equivalent Thermal Conductivity -->
				<a
					href="/examples/layered-ground"
					class="group block rounded-2xl border border-zinc-200 bg-zinc-50 p-8 transition-all duration-300 hover:border-zinc-900"
				>
					<div class="mb-6 flex items-center justify-between">
						<h3 class="text-2xl font-bold text-zinc-900 transition-colors">
							Layered Ground Conductivity
						</h3>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-6 w-6 text-zinc-300 transition-colors group-hover:text-zinc-900"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="1.5"
							stroke-linecap="round"
							stroke-linejoin="round"
							><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"
							></polyline></svg
						>
					</div>
					<p class="text-sm leading-relaxed text-zinc-500">
						Analyze equivalent thermal conductivity in anisotropic ground formations. Visualize
						parallel and series resistance models iteratively with dynamic layers.
					</p>
					<div class="mt-8 flex gap-2">
						<span
							class="inline-flex items-center rounded-md bg-zinc-200 px-2.5 py-0.5 text-xs font-medium text-zinc-800"
							>Dynamic Layers</span
						>
						<span
							class="inline-flex items-center rounded-md border border-zinc-200 bg-white px-2.5 py-0.5 text-xs font-medium text-zinc-600"
							>Equivalent Path</span
						>
					</div>
				</a>

				<!-- Air Exergy Flow Card -->
				<a
					href="/examples/exergy"
					class="group block rounded-2xl border border-zinc-200 bg-zinc-50 p-8 transition-all duration-300 hover:border-zinc-900"
				>
					<div class="mb-6 flex items-center justify-between">
						<h3 class="text-2xl font-bold text-zinc-900 transition-colors">
							Air Exergy Analysis
						</h3>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-6 w-6 text-zinc-300 transition-colors group-hover:text-zinc-900"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="1.5"
							stroke-linecap="round"
							stroke-linejoin="round"
							><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"
							></polyline></svg
						>
					</div>
					<p class="text-sm leading-relaxed text-zinc-500">
						Observe the thermodynamic exergy embedded in conditioned air streams. Evaluate intake and exhaust performance via real-time exergy rate calculations.
					</p>
					<div class="mt-8 flex gap-2">
						<span
							class="inline-flex items-center rounded-md bg-zinc-200 px-2.5 py-0.5 text-xs font-medium text-zinc-800"
							>Exergy Curve</span
						>
						<span
							class="inline-flex items-center rounded-md border border-zinc-200 bg-white px-2.5 py-0.5 text-xs font-medium text-zinc-600"
							>HVAC Schematic</span
						>
					</div>
				</a>
			</div>
		</div>
	</div>
</div>
