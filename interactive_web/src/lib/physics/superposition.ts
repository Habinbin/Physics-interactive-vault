import { expintE1 } from './math';

export interface HeatLoadSegment {
    startTime: number; // hours
    endTime: number; // hours
    q: number; // W/m (Positive = Injection/Heating ground, Negative = Extraction/Cooling ground)
}

export interface BoreholeInstance {
    id: string;
    x: number; // meters
    y: number; // meters
    segments: HeatLoadSegment[];
    color: string; // for UI identification
}

/**
 * Superposition calculation for a spatial x-y point at a specific target time.
 * Calculates the exact temperature rise (or drop) by chronologically summing 
 * spatial responses from all boreholes, utilizing Duhamel's theorem for step heat pulses.
 */
export function calculateSpatialTemporalSuperposition(
    targetX: number,
    targetY: number,
    currentTimeHours: number,
    boreholes: BoreholeInstance[],
    k: number,
    alpha: number
): number {
    let totalDeltaT = 0;

    for (const bh of boreholes) {
        const dx = targetX - bh.x;
        const dy = targetY - bh.y;
        // Radial distance from target point to this borehole
        const r = Math.sqrt(dx * dx + dy * dy);

        // Minimum radius boundary to prevent coordinate singularity exactly at borehole center
        // E.g., assume borehole radius 0.075m
        const r_eff = Math.max(r, 0.075);

        // Temporally process all segments of this borehole via Duhamel's principle
        for (const seg of bh.segments) {
            if (currentTimeHours <= seg.startTime) {
                continue; // Segment hasn't started yet
            }

            // 1) Positive step at startTime
            const t1_seconds = (currentTimeHours - seg.startTime) * 3600;
            const fo1 = (r_eff * r_eff) / (4 * alpha * t1_seconds);
            const temp1 = (seg.q / (4 * Math.PI * k)) * expintE1(fo1);
            totalDeltaT += temp1;

            // 2) Negative step at endTime (to cancel out the load if time has passed)
            if (currentTimeHours > seg.endTime) {
                const t2_seconds = (currentTimeHours - seg.endTime) * 3600;
                const fo2 = (r_eff * r_eff) / (4 * alpha * t2_seconds);
                const temp2 = (-seg.q / (4 * Math.PI * k)) * expintE1(fo2);
                totalDeltaT += temp2;
            }
        }
    }

    return totalDeltaT;
}
