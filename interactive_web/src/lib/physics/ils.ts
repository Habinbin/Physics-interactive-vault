import { expintE1 } from './math';

/**
 * Infinite Line Source (ILS) Model Calculation
 * 
 * Computes the temperature rise Delta T at a given radius r and time t.
 * 
 * @param r - radial distance from the borehole center (m)
 * @param t - elapsed time (s)
 * @param q - heat transfer rate per unit length (W/m)
 * @param k - ground thermal conductivity (W/mK)
 * @param alpha - ground thermal diffusivity (m^2/s)
 * @returns Temperature rise (K)
 */
export function calculateILS(r: number, t: number, q: number, k: number, alpha: number): number {
    if (r <= 0 || t <= 0) return 0;

    const Fo_r = (r * r) / (4 * alpha * t); // Fourier number analog related to radius
    const E1 = expintE1(Fo_r);

    return (q / (4 * Math.PI * k)) * E1;
}
