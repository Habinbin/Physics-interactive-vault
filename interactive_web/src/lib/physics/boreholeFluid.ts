/**
 * Borehole Fluid Energy Balance (Based on Equation 6.6)
 */

export interface FluidTemperatures {
    Tf_in: number;
    Tf_out: number;
    deltaT: number;
}

/**
 * Calculates the fluid inlet and outlet temperatures based on the energy balance.
 * Eq 6.6 Approximation for large t:
 * Tf_i(t) = Tf(t) + (ql * H) / (2 * rho_f * cf * Vf)
 * Tf_o(t) = Tf(t) - (ql * H) / (2 * rho_f * cf * Vf)
 * 
 * @param Tf Average circulating fluid temperature (°C)
 * @param ql Heat transfer rate per unit length (W/m)
 * @param H Length of the ground heat exchanger (m)
 * @param rho_f Density of the circulating fluid (kg/m^3)
 * @param c_f Specific heat of the circulating fluid (J/kgK)
 * @param V_f Volume flow rate of the circulating fluid (m^3/s)
 * @returns In/Out Fluid Temperatures and Delta T
 */
export function calculateFluidTemperatures(
    Tf: number,
    ql: number,
    H: number,
    rho_f: number,
    c_f: number,
    V_f: number
): FluidTemperatures {
    if (V_f <= 0 || rho_f <= 0 || c_f <= 0) {
        return { Tf_in: Tf, Tf_out: Tf, deltaT: 0 };
    }

    const heatCapacityRate = rho_f * c_f * V_f;
    const tempChange = (ql * H) / (2 * heatCapacityRate);

    const Tf_in = Tf + tempChange;
    const Tf_out = Tf - tempChange;

    return {
        Tf_in,
        Tf_out,
        deltaT: Tf_in - Tf_out
    };
}
