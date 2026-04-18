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
  const margin = { top: 20, right: 20, bottom: 45, left: 55 };

  // Runes pattern for derived data
  let innerWidth = $derived(svgWidth - margin.left - margin.right);
  let innerHeight = $derived(svgHeight - margin.top - margin.bottom);

  // Processed Data
  let pDome = $derived(domeData.map(d => ({
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
  let xScale = $derived(getXScale(type, pDome, innerWidth));
  let yScale = $derived(getYScale(type, pDome, innerHeight));

  function getXScale(type: string, data: any[], width: number) {
    if (data.length === 0) return d3.scaleLinear().domain([0, 1]).range([0, width]);
    if (type === 'Ts') {
      const minS = d3.min(data, d => d.s_liq) || 0;
      const maxS = d3.max(data, d => d.s_vap) || 1;
      return d3.scaleLinear().domain([minS * 0.9, maxS * 1.1]).range([0, width]);
    } else {
      const minH = d3.min(data, d => d.h_liq) || 0;
      const maxH = d3.max(data, d => d.h_vap) || 1;
      return d3.scaleLinear().domain([minH * 0.9, maxH * 1.1]).range([0, width]);
    }
  }

  function getYScale(type: string, data: any[], height: number) {
    if (data.length === 0) return d3.scaleLinear().domain([0, 1]).range([height, 0]);
    if (type === 'Ph') {
      const minP = d3.min(data, d => d.P) || 100;
      const maxP = d3.max(data, d => d.P) || 10000;
      return d3.scaleLog().domain([minP, maxP * 1.5]).range([height, 0]);
    } else {
      const minT = d3.min(data, d => d.T) || -50;
      const maxT = d3.max(data, d => d.T) || 100;
      return d3.scaleLinear().domain([minT - 10, maxT + 20]).range([height, 0]);
    }
  }

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
      <!-- Title -->
      <div class="absolute top-4 left-6 text-sm font-bold text-zinc-800 tracking-wider">
        {type.charAt(0)}-{type.charAt(1)} Diagram
      </div>
      
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
            <text x={x1 - 8} y={y1 + 4} text-anchor="end" font-size="11" fill="#52525b">cmp,in</text>
            
            <!-- Outlet Point -->
            <circle cx={x2} cy={y2} r="4" fill="#18181b" />
            <text x={x2 + 8} y={y2 + 4} text-anchor="start" font-size="11" fill="#52525b">cmp,out</text>
          {/if}

          <!-- X Axis Line -->
          <line x1="0" y1={innerHeight} x2={innerWidth} y2={innerHeight} stroke="#d4d4d8" stroke-width="1" />
          <!-- Y Axis Line -->
          <line x1="0" y1="0" x2="0" y2={innerHeight} stroke="#d4d4d8" stroke-width="1" />
          
          <!-- Basic Axis Labels -->
          <text x={innerWidth / 2} y={innerHeight + 35} text-anchor="middle" font-size="12" fill="#71717a">
            {type === 'Ts' ? 'Entropy [kJ/(kg·K)]' : 'Enthalpy [kJ/kg]'}
          </text>
          
          <text transform="rotate(-90)" x={-innerHeight / 2} y={-40} text-anchor="middle" font-size="12" fill="#71717a">
            {type === 'Ph' ? 'Pressure [kPa]' : 'Temperature [°C]'}
          </text>
        </g>
      </svg>
    </div>
  {/if}
</div>
