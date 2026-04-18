<script lang="ts">
  import { onMount } from 'svelte';
  import * as d3 from 'd3';
  import type { SaturationPoint, CompressorResult } from '../../api/compressor';

  let { type, domeData = [], cycleParams = null } = $props<{
    type: 'Ph' | 'Th' | 'Ts';
    domeData: SaturationPoint[];
    cycleParams: CompressorResult | null;
  }>();

  let container: HTMLDivElement;
  let svgWidth = $state(400);
  let svgHeight = $state(300);
  const margin = { top: 20, right: 30, bottom: 45, left: 60 };

  // Runes pattern for derived data
  let innerWidth = $derived(svgWidth - margin.left - margin.right);
  let innerHeight = $derived(svgHeight - margin.top - margin.bottom);

  // Processed Data
  let pDome = $derived(domeData.map((d: SaturationPoint) => ({
    P: d.P / 1000,
    T: d.T - 273.15,
    h_liq: d.h_liq / 1000,
    s_liq: d.s_liq / 1000,
    h_vap: d.h_vap / 1000,
    s_vap: d.s_vap / 1000
  })));

  let pIn = $derived(cycleParams ? cycleParams.P_in / 1000 : 0);
  let pOut = $derived(cycleParams ? cycleParams.P_out / 1000 : 0);
  let tIn = $derived(cycleParams ? cycleParams.T_in - 273.15 : 0);
  let tOut = $derived(cycleParams ? cycleParams.T_cmp_out - 273.15 : 0);
  let hIn = $derived(cycleParams ? cycleParams.h_in / 1000 : 0);
  let hOut = $derived(cycleParams ? cycleParams.h_out / 1000 : 0);
  let sIn = $derived(cycleParams ? cycleParams.s_in / 1000 : 0);
  let sOut = $derived(cycleParams ? cycleParams.s_out / 1000 : 0);

  // Scales computing
  let xScale = $derived.by(() => {
    if (pDome.length === 0) return d3.scaleLinear().domain([0, 1]).range([0, innerWidth]);
    if (type === 'Ts') {
      let minS = d3.min(pDome, (d: any) => d.s_liq as number) ?? 0;
      let maxS = d3.max(pDome, (d: any) => d.s_vap as number) ?? 1;
      if (cycleParams) {
        minS = Math.min(minS, sIn, sOut);
        maxS = Math.max(maxS, sIn, sOut);
      }
      return d3.scaleLinear().domain([minS * 0.9, maxS * 1.1]).range([0, innerWidth]);
    } else {
      let minH = d3.min(pDome, (d: any) => d.h_liq as number) ?? 0;
      let maxH = d3.max(pDome, (d: any) => d.h_vap as number) ?? 1;
      if (cycleParams) {
        minH = Math.min(minH, hIn, hOut);
        maxH = Math.max(maxH, hIn, hOut);
      }
      return d3.scaleLinear().domain([minH * 0.9, maxH * 1.1]).range([0, innerWidth]);
    }
  });

  let yScale = $derived.by(() => {
    if (pDome.length === 0) return d3.scaleLinear().domain([0, 1]).range([innerHeight, 0]);
    if (type === 'Ph') {
      let minP = d3.min(pDome, (d: any) => d.P as number) ?? 100;
      let maxP = d3.max(pDome, (d: any) => d.P as number) ?? 10000;
      if (cycleParams) {
        minP = Math.min(minP, pIn, pOut);
        maxP = Math.max(maxP, pIn, pOut);
      }
      if (minP <= 0) minP = 10;
      return d3.scaleLog().domain([minP * 0.7, maxP * 1.5]).range([innerHeight, 0]);
    } else {
      let minT = d3.min(pDome, (d: any) => d.T as number) ?? -50;
      let maxT = d3.max(pDome, (d: any) => d.T as number) ?? 100;
      if (cycleParams) {
        minT = Math.min(minT, tIn, tOut);
        maxT = Math.max(maxT, tIn, tOut);
      }
      return d3.scaleLinear().domain([minT - 10, maxT + 20]).range([innerHeight, 0]);
    }
  });

  let xTicks = $derived(xScale.ticks(5) as number[]);
  let yTicks = $derived((type === 'Ph' ? yScale.ticks(5) : yScale.ticks(6)) as number[]);
  let xFormat = $derived(xScale.tickFormat(5, "~s"));
  let yFormat = $derived(type === 'Ph' ? yScale.tickFormat(5, "~s") : yScale.tickFormat(6, "~s"));

  // Value formatting
  let getX = $derived((item: any, phase: 'liq' | 'vap') => {
    return type === 'Ts' ? xScale(item[`s_${phase}`]) : xScale(item[`h_${phase}`]);
  });
  
  let getY = $derived((item: any) => {
    return type === 'Ph' ? yScale(item.P) : yScale(item.T);
  });

  // Line generators
  let lineLiq = $derived(d3.line<any>().x(d => getX(d, 'liq')).y(d => getY(d))(pDome));
  let lineVap = $derived(d3.line<any>().x(d => getX(d, 'vap')).y(d => getY(d))(pDome));

  // States
  let x1 = $derived(type === 'Ts' ? xScale(sIn) : xScale(hIn));
  let y1 = $derived(type === 'Ph' ? yScale(pIn) : yScale(tIn));
  let x2 = $derived(type === 'Ts' ? xScale(sOut) : xScale(hOut));
  let y2 = $derived(type === 'Ph' ? yScale(pOut) : yScale(tOut));

  onMount(() => {
    const observer = new ResizeObserver(entries => {
      if (entries[0] && entries[0].contentRect.width > 0) {
        svgWidth = entries[0].contentRect.width;
        svgHeight = Math.max(300, svgWidth * 0.75); // 4:3 aspect
      }
    });
    observer.observe(container);
    return () => observer.disconnect();
  });

</script>

<div class="w-full h-full min-h-[300px] flex flex-col items-center justify-center bg-white border border-zinc-100 rounded-xl shadow-xs" bind:this={container}>
  
  {#if pDome.length === 0}
    <div class="animate-pulse text-zinc-400 text-sm">Loading Chart...</div>
  {:else}
    <div class="relative w-full h-full">
      <svg width={svgWidth} height={svgHeight} class="select-none">
        <g transform="translate({margin.left}, {margin.top})">
          
          <!-- Grid lines & Axes could be added heavily here, for now simple lines -->
          
          <!-- Saturation Domes -->
          <!-- Liquid Line (Blue) -->
          <path d={lineLiq} fill="none" stroke="#3b82f6" stroke-width="1.5" />
          
          <!-- Vapor Line (Red) -->
          <path d={lineVap} fill="none" stroke="#f43f5e" stroke-width="1.5" />
          
          <!-- Connected Reference Cycle if active -->
          {#if cycleParams && cycleParams.success}
            <!-- Cycle Path -->
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#9ca3af" stroke-width="1.5" stroke-dasharray="3,3" />
            
            <!-- Inlet Point -->
            <circle cx={x1} cy={y1} r="4" fill="#18181b" />
            <text x={x1} y={y1 - 10} text-anchor="middle" font-size="13" fill="#52525b" stroke="white" stroke-width="3" stroke-linejoin="round" style="paint-order: stroke fill;">
              cmp,in ({type === 'Ts' ? sIn.toFixed(1) : hIn.toFixed(1)}, {type === 'Ph' ? pIn.toFixed(1) : tIn.toFixed(1)})
            </text>
            
            <!-- Outlet Point -->
            <circle cx={x2} cy={y2} r="4" fill="#18181b" />
            <text x={x2} y={y2 - 10} text-anchor="middle" font-size="13" fill="#52525b" stroke="white" stroke-width="3" stroke-linejoin="round" style="paint-order: stroke fill;">
              cmp,out ({type === 'Ts' ? sOut.toFixed(1) : hOut.toFixed(1)}, {type === 'Ph' ? pOut.toFixed(1) : tOut.toFixed(1)})
            </text>
          {/if}

          <!-- Axes and Ticks -->
          <!-- X Axis -->
          <line x1="0" y1={innerHeight} x2={innerWidth} y2={innerHeight} stroke="#d4d4d8" stroke-width="1" />
          {#each xTicks as tick (tick)}
            <g transform="translate({xScale(tick)}, {innerHeight})">
              <line y2="5" stroke="#d4d4d8" />
              <text y="18" text-anchor="middle" font-size="13" fill="#71717a">{xFormat(tick)}</text>
            </g>
          {/each}

          <!-- Y Axis -->
          <line x1="0" y1="0" x2="0" y2={innerHeight} stroke="#d4d4d8" stroke-width="1" />
          {#each yTicks as tick (tick)}
            <g transform="translate(0, {yScale(tick)})">
              <line x2="-5" stroke="#d4d4d8" />
              <text x="-8" y="4" text-anchor="end" font-size="13" fill="#71717a">{yFormat(tick)}</text>
            </g>
          {/each}
          
          <!-- Basic Axis Labels -->
          <text x={innerWidth / 2} y={innerHeight + 35} text-anchor="middle" font-size="14" fill="#71717a">
            {type === 'Ts' ? 'Entropy [kJ/(kg·K)]' : 'Enthalpy [kJ/kg]'}
          </text>
          
          <text transform="rotate(-90)" x={-innerHeight / 2} y={-40} text-anchor="middle" font-size="14" fill="#71717a">
            {type === 'Ph' ? 'Pressure [kPa]' : 'Temperature [°C]'}
          </text>
        </g>
      </svg>
    </div>
  {/if}
</div>
