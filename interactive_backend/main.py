from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import CoolProp.CoolProp as CP
import math

app = FastAPI(title="Polytropic Compressor API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class CompressionRequest(BaseModel):
    refrigerant: str
    T_cmp_in: float  # Kelvin
    P_cmp_in: float  # Pa
    P_cmp_out: float # Pa
    n: float
    m_dot: float     # kg/s

class CompressionResponse(BaseModel):
    T_cmp_out: float
    W_closed: float
    W_shaft: float
    Q_out: float
    gamma: float
    c_p: float
    c_v: float
    success: bool
    error: str | None = None
    P_in: float = 0.0
    T_in: float = 0.0
    h_in: float = 0.0
    s_in: float = 0.0
    P_out: float = 0.0
    h_out: float = 0.0
    s_out: float = 0.0
    
class SaturationPoint(BaseModel):
    T: float
    P: float
    h_liq: float
    s_liq: float
    h_vap: float
    s_vap: float

class SaturationResponse(BaseModel):
    refrigerant: str
    points: list[SaturationPoint]
    success: bool
    error: str | None = None

@app.post("/api/compress", response_model=CompressionResponse)
def compute_compression(req: CompressionRequest):
    try:
        T_cmp_out = req.T_cmp_in * math.pow(req.P_cmp_out / req.P_cmp_in, (req.n - 1) / req.n)
        
        # Calculate Average specific heat
        T_avg = (req.T_cmp_in + T_cmp_out) / 2.0
        P_avg = (req.P_cmp_in + req.P_cmp_out) / 2.0
        
        c_p = CP.PropsSI('C', 'T', T_avg, 'P', P_avg, req.refrigerant)
        c_v = CP.PropsSI('O', 'T', T_avg, 'P', P_avg, req.refrigerant) # 'O' is Cvmass
        
        gamma = c_p / c_v
        R_prime = c_p - c_v
        
        # Avoid division by zero if n is 1 (isothermal). Though we assume n > 1.
        if abs(req.n - 1.0) < 1e-5:
            # Revert to ideal gas isothermal log formulas if needed, but for now just bump it
            n_safe = req.n + 1e-5
        else:
            n_safe = req.n

        delta_T = T_cmp_out - req.T_cmp_in
        
        W_closed = req.m_dot * c_v * ((gamma - 1)/(n_safe - 1)) * delta_T
        W_shaft = req.m_dot * R_prime * (n_safe / (n_safe - 1)) * delta_T
        
        Q_out = req.m_dot * c_p * ((gamma - n_safe)/(gamma * (n_safe - 1))) * delta_T
        h_in = CP.PropsSI('H', 'T', req.T_cmp_in, 'P', req.P_cmp_in, req.refrigerant)
        s_in = CP.PropsSI('S', 'T', req.T_cmp_in, 'P', req.P_cmp_in, req.refrigerant)
        h_out = CP.PropsSI('H', 'T', T_cmp_out, 'P', req.P_cmp_out, req.refrigerant)
        s_out = CP.PropsSI('S', 'T', T_cmp_out, 'P', req.P_cmp_out, req.refrigerant)
        
        return CompressionResponse(
            T_cmp_out=T_cmp_out,
            W_closed=W_closed,
            W_shaft=W_shaft,
            Q_out=Q_out,
            gamma=gamma,
            c_p=c_p,
            c_v=c_v,
            success=True,
            P_in=req.P_cmp_in,
            T_in=req.T_cmp_in,
            h_in=h_in,
            s_in=s_in,
            P_out=req.P_cmp_out,
            h_out=h_out,
            s_out=s_out
        )
    except Exception as e:
         return CompressionResponse(
            T_cmp_out=0.0,
            W_closed=0.0,
            W_shaft=0.0,
            Q_out=0.0,
            gamma=0.0,
            c_p=0.0,
            c_v=0.0,
            success=False,
            error=str(e)
        )

@app.get("/api/saturation/{refrigerant}", response_model=SaturationResponse)
def get_saturation(refrigerant: str):
    try:
        T_crit = CP.PropsSI('Tcrit', refrigerant)
        T_min = CP.PropsSI('Tmin', refrigerant)
        
        T_end = T_crit - 0.05
        T_start = max(T_min, 200.0) 
        
        steps = 150
        delta = (T_end - T_start) / steps
        
        points = []
        for i in range(steps + 1):
            T = T_start + i * delta
            try:
                P_sat = CP.PropsSI('P', 'T', T, 'Q', 0, refrigerant)
                h_liq = CP.PropsSI('H', 'T', T, 'Q', 0, refrigerant)
                s_liq = CP.PropsSI('S', 'T', T, 'Q', 0, refrigerant)
                
                h_vap = CP.PropsSI('H', 'T', T, 'Q', 1, refrigerant)
                s_vap = CP.PropsSI('S', 'T', T, 'Q', 1, refrigerant)
                
                points.append(SaturationPoint(
                    T=T, P=P_sat, 
                    h_liq=h_liq, s_liq=s_liq, 
                    h_vap=h_vap, s_vap=s_vap
                ))
            except:
                pass 
                
        # Append exact critical point to bridge the gap perfectly
        try:
            P_crit = CP.PropsSI('Pcrit', refrigerant)
            h_crit = CP.PropsSI('H', 'T', T_crit, 'P', P_crit, refrigerant)
            s_crit = CP.PropsSI('S', 'T', T_crit, 'P', P_crit, refrigerant)
            points.append(SaturationPoint(
                T=T_crit, P=P_crit,
                h_liq=h_crit, s_liq=s_crit,
                h_vap=h_crit, s_vap=s_crit
            ))
        except:
            pass

        return SaturationResponse(refrigerant=refrigerant, points=points, success=True)
    except Exception as e:
        return SaturationResponse(refrigerant=refrigerant, points=[], success=False, error=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
