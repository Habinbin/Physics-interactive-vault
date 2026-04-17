/**
 * math.ts - Shared Mathematical Utilities
 */

/**
 * Exponential Integral E1(x)
 * 
 * Approximation based on Abramowitz and Stegun (1964) Eq. 5.1.53 and 5.1.54
 * Accuracy: ~2x10^-7
 */
export function expintE1(x: number): number {
    if (x === 0) return Infinity;
    if (x < 0) return NaN;

    if (x <= 1.0) {
        const a0 = -0.57721566;
        const a1 = 0.99999193;
        const a2 = -0.24991055;
        const a3 = 0.05519968;
        const a4 = -0.00976004;
        const a5 = 0.00107857;

        const term = a0 + a1 * x + a2 * Math.pow(x, 2) + a3 * Math.pow(x, 3) + a4 * Math.pow(x, 4) + a5 * Math.pow(x, 5);
        return -Math.log(x) + term;
    } else {
        // x > 1
        const a1 = 2.334733;
        const a2 = 0.250621;
        const b1 = 3.330657;
        const b2 = 1.681534;

        const num = Math.pow(x, 2) + a1 * x + a2;
        const den = Math.pow(x, 2) + b1 * x + b2;
        return (Math.exp(-x) / x) * (num / den);
    }
}
