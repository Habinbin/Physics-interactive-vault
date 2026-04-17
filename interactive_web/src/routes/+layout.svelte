<script lang="ts">
	import './layout.css';
</script>

<div class="min-h-screen bg-white font-sans text-zinc-900 selection:bg-zinc-200">
	<!-- Nav Bar -->
	<header class="sticky top-0 z-50 w-full border-b border-zinc-200 bg-white/80 backdrop-blur-md">
		<div class="container mx-auto flex h-16 items-center justify-between px-4">
			<a href="/" class="text-xl font-bold tracking-tight text-zinc-900"> Ground Energy Systems </a>
		</div>
	</header>

	<!-- Main Content -->
	<main class="container mx-auto px-4 py-8">
		<slot />
	</main>
</div>
