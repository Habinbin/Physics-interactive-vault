import { expintE1 } from './math';

/**
 * Calculates the thermal resistance of a cylindrical shell.
 * R = ln(r2 / r1) / (2 * pi * k * L)
 * 
 * @param r1 Inner radius (m)
 * @param r2 Outer radius (m)
 * @param k Thermal conductivity (W/mK)
 * @param L Length of the cylinder (m)
 * @returns Thermal resistance (K/W)
 */
export function calculateCylindricalResistance(r1: number, r2: number, k: number, L: number): number {
    if (r1 <= 0 || r2 <= r1 || k <= 0 || L <= 0) return 0;
    return Math.log(r2 / r1) / (2 * Math.PI * k * L);
}

/**
 * Calculates the transient radial temperature rise in an infinite medium
 * around a cylindrical heat source (approximated by line source for larger times/radii).
 * 
 * @param r Radial distance from center (m)
 * @param t Elapsed time (s)
 * @param ql Linear heat transfer rate (W/m)
 * @param k Thermal conductivity (W/mK)
 * @param alpha Thermal diffusivity (m^2/s)
 * @returns Temperature rise (K)
 */
export function calculateRadialHeatSpread(r: number, t: number, ql: number, k: number, alpha: number): number {
    if (r <= 0 || t <= 0) return 0;

    const Fo_r = (r * r) / (4 * alpha * t); // Fourier number analog related to radius
    const E1 = expintE1(Fo_r);

    return (ql / (4 * Math.PI * k)) * E1;
}
