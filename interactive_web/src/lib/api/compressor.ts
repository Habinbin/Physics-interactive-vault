export interface CompressorParams {
	refrigerant: string;
	T_cmp_in: number;
	P_cmp_in: number;
	P_cmp_out: number;
	n: number;
	m_dot: number;
}

export interface CompressorResult {
	T_cmp_out: number;
	W_closed: number;
	W_shaft: number;
	Q_out: number;
	gamma: number;
	c_p: number;
	c_v: number;
	success: boolean;
	error?: string;
	P_in: number;
	T_in: number;
	h_in: number;
	s_in: number;
	P_out: number;
	h_out: number;
	s_out: number;
}

export interface SaturationPoint {
	T: number;
	P: number;
	h_liq: number;
	s_liq: number;
	h_vap: number;
	s_vap: number;
}

export interface SaturationResponse {
	refrigerant: string;
	points: SaturationPoint[];
	success: boolean;
	error?: string;
}

export async function fetchCompressionData(params: CompressorParams): Promise<CompressorResult> {
	try {
        // Assume backend runs on port 8000
		const res = await fetch('/api/compress', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(params)
		});
		if (!res.ok) throw new Error('API request failed');
		return await res.json();
	} catch (e) {
		console.error(e);
		return {
			T_cmp_out: 0,
			W_closed: 0,
			W_shaft: 0,
			Q_out: 0,
			gamma: 0,
			c_p: 0,
			c_v: 0,
			success: false,
			error: (e as Error).message,
			P_in: 0, T_in: 0, h_in: 0, s_in: 0,
			P_out: 0, h_out: 0, s_out: 0
		};
	}
}

export async function fetchSaturationDome(refrigerant: string): Promise<SaturationResponse> {
	try {
		const res = await fetch(`/api/saturation/${encodeURIComponent(refrigerant)}`);
		if (!res.ok) throw new Error('API request failed');
		return await res.json();
	} catch (e) {
		console.error(e);
		return {
			refrigerant,
			points: [],
			success: false,
			error: (e as Error).message
		};
	}
}

