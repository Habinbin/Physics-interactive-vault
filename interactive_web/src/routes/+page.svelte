<script lang="ts">
	import CompressorDashboard from '$lib/components/interactive/CompressorDashboard.svelte';
	import FormulaBlock from '$lib/components/interactive/FormulaBlock.svelte';
</script>

<div class="min-h-screen bg-white font-sans text-zinc-900 selection:bg-zinc-200">
	<div class="mx-auto max-w-5xl px-6 py-20 lg:px-8">
		<header class="mt-12 mb-16">
			<h1 class="mb-6 text-4xl font-extrabold tracking-tight text-zinc-900 sm:text-5xl">
				Polytropic Compression Dynamics
			</h1>
			<p class="max-w-3xl text-xl leading-relaxed font-light text-zinc-500">
				An interactive and analytical model defining the heat loss and temperature change across a closed-system polytropic compression cycle. 
			</p>
		</header>

		<!-- Interactive Section (Moves up for immediate WOW factor) -->
		<section class="mb-24">
			<CompressorDashboard />
		</section>

		<article class="prose prose-zinc max-w-none">
			<h2>1. Overview and Equilibrium Assumption</h2>
			<p>
				The compression process within the compressor is assumed to be a <strong>Closed System</strong> driven by the piston's reciprocating motion. The process follows a polytropic path <FormulaBlock math={String.raw`P v^n = \text{const}`} />. Simultaneously, heat exchange (heat dissipation) occurs through the cylinder walls.
			</p>
			<p>
				To simplify the real continuous variations during the stroke, we adopt the <strong>Average specific heat</strong> concept. We denote the mass-specific heat capacity at constant pressure as <FormulaBlock math={String.raw`\bar{c}_p`} /> and at constant volume as <FormulaBlock math={String.raw`\bar{c}_v`} /> to distinguish them from total heat capacity.
			</p>

			<hr class="my-10 border-zinc-200" />

			<h2>2. Compressor Outlet Temperature (<FormulaBlock math={String.raw`T_{out}`} />)</h2>
			<p>
				In a polytropic process, the relationship between temperature and pressure is evaluated using the polytropic index <FormulaBlock math={String.raw`n`} />:
			</p>
			<div class="p-6 bg-zinc-50 rounded-xl my-6 flex justify-center text-xl">
				<FormulaBlock math={String.raw`T_{cmp,out} = T_{cmp,in} \left(\frac{P_{cmp,out}}{P_{cmp,in}}\right)^{\frac{n-1}{n}}`} block />
			</div>

			<hr class="my-10 border-zinc-200" />

			<h2>3. Work, Energy, and Heat Loss (<FormulaBlock math={String.raw`Q_{out}`} />)</h2>
			
			<h3>3.1 First Law of Thermodynamics</h3>
			<p>
				Applying the First Law of Thermodynamics to the closed gas system inside the piston. <FormulaBlock math={String.raw`W`} /> represents the compression work received from the outside.
			</p>
			<div class="p-6 bg-zinc-50 rounded-xl my-6 flex justify-center text-xl">
				<FormulaBlock math={String.raw`Q_{in} + W = \Delta U`} block />
			</div>
			<p>
				Defining the heat loss released outward as <FormulaBlock math={String.raw`Q_{out} = -Q_{in}`} />, we get:
			</p>
			<div class="p-6 bg-zinc-50 rounded-xl my-6 flex justify-center text-xl">
				<FormulaBlock math={String.raw`Q_{out} = W - \Delta U`} block />
			</div>

			<h3>3.2 Work and Internal Energy Formulation</h3>
			<p>
				The change in internal energy rate is given by multiplying the mass flow <FormulaBlock math={String.raw`\dot{m}`} /> and the average specific heat <FormulaBlock math={String.raw`\bar{c_v}`} />:
			</p>
			<div class="p-6 bg-zinc-50 rounded-xl my-6 flex justify-center text-xl">
				<FormulaBlock math={String.raw`\Delta U = \dot{m} \bar{c_v} (T_{cmp,out} - T_{cmp,in})`} block />
			</div>
			
			<p>
				The boundary work along the polytropic path <FormulaBlock math={String.raw`\int P dv`} /> results in:
			</p>
			<div class="p-6 bg-zinc-50 rounded-xl my-6 flex justify-center text-xl text-center">
				<FormulaBlock math={String.raw`W = \frac{\dot{m} R'}{n-1} (T_{cmp,out} - T_{cmp,in})`} block />
			</div>

			<h3>3.3 Final Heat Loss Substitution</h3>
			<p>
				Using Mayer's relation <FormulaBlock math={String.raw`R' = \bar{c}_p - \bar{c}_v`} /> and the specific heat ratio <FormulaBlock math={String.raw`\gamma = \frac{\bar{c}_p}{\bar{c}_v}`} />, we fully derive the final heat dissipation rate <FormulaBlock math={String.raw`Q_{out}`} /> acting on the compressor body:
			</p>
			<div class="p-6 bg-zinc-50 rounded-xl my-6 flex justify-center text-xl">
				<FormulaBlock math={String.raw`Q_{out} = \dot{m} \bar{c}_p \frac{\gamma-n}{\gamma(n-1)}(T_{cmp,out} - T_{cmp,in})`} block />
			</div>

			<div class="mt-8 p-4 bg-sky-50 border border-sky-100 rounded-lg text-sky-900 text-sm flex gap-3">
				<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 shrink-0 text-sky-500" viewBox="0 0 20 20" fill="currentColor">
				  <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
				</svg>
				<p class="m-0">
					The ratio coefficient <FormulaBlock math={String.raw`\frac{\gamma-n}{\gamma(n-1)}`} /> reveals the sheer thermodynamic truth of how much internal boundary work decays into heat during the closed process. Notice the loss scales linearly as <FormulaBlock math={String.raw`n`} /> deviates from the adiabatic <FormulaBlock math={String.raw`\gamma`} /> index.
				</p>
			</div>

			<hr class="my-10 border-zinc-200" />

			<h3>3.4 Open System Shaft Work (<FormulaBlock math={String.raw`W^*`} />)</h3>
			<p>
				The actual compressor operates as an Open Flow System. The motor's mechanical power delivered to the refrigerant is the Shaft Work <FormulaBlock math={String.raw`W^*`} />, derived by incorporating the flow work <FormulaBlock math={String.raw`\Delta(Pv)`} />:
			</p>
			<div class="p-6 bg-zinc-50 rounded-xl my-6 flex justify-center text-xl">
				<FormulaBlock math={String.raw`W^* = \frac{n}{n-1} \dot{m} R' (T_{cmp,out} - T_{cmp,in})`} block />
			</div>
		</article>
	</div>
</div>
