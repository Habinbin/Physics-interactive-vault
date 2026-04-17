/**
 * Moving Heat-source Method (Advection in X-Y Plane)
 * Calculates the temperature rise at a point (x, y) after time t 
 * for an infinite line source subjected to groundwater flow in the +x direction.
 * 
 * @param x - Distance in groundwater flow direction (m)
 * @param y - Transverse distance (m)
 * @param tSeconds - Time elapsed (s)
 * @param q - Heat rejection rate (W/m)
 * @param k - Soil thermal conductivity (W/mK)
 * @param alpha - Soil thermal diffusivity (m2/s)
 * @param Ux - Effective thermal velocity of groundwater in x-direction (m/s)
 * @param Uy - Effective thermal velocity of groundwater in y-direction (m/s)
 * @returns Temperature rise (K)
 */
export function calculateMovingSource(
    x: number,
    y: number,
    tSeconds: number,
    q: number,
    k: number,
    alpha: number,
    Ux: number,
    Uy: number
): number {
    if (tSeconds <= 0) return 0;

    // Ensure the integration step does not exceed 10 hours (36000 seconds)
    let N = Math.ceil(tSeconds / 36000);
    if (N < 80) N = 80; // keep a minimum resolution for very short times

    const dTau = tSeconds / N;
    let sum = 0;

    for (let i = 1; i <= N; i++) {
        // Avoid exact tau=0 by taking midpoints or starting from i=1
        // Midpoint Rule is highly stable for 1/tau singularity at 0
        const tau = (i - 0.5) * dTau;

        const dx = x - Ux * tau;
        const dy = y - Uy * tau;
        const distSq = dx * dx + dy * dy;

        // The integrand: (1 / tau) * exp( -distSq / (4 * alpha * tau) )
        const exponent = -distSq / (4 * alpha * tau);

        // Prevent underflow to 0 causing NaN issues (if exp(-huge) = 0)
        let integrand = 0;
        if (exponent > -100) {
            integrand = Math.exp(exponent) / tau;
        }

        sum += integrand * dTau;
    }

    return (q / (4 * Math.PI * k)) * sum;
}
