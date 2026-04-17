---
description: Colorbar, Heatmap, Lineplot 등 그래프 구성요소 스타일 표준 (Rule 29+30+34 통합)
trigger: always_on
---
# Rule 04 — Plot Component Standards

> **Trigger**: `always_on` — Colorbar, Heatmap, Lineplot 생성 시 적용

## 1. Colorbar 위치 동기화 (Rule 29)

### 1.1 세로형 Colorbar (우측 배치)

`fig.canvas.draw()` 이후 bbox를 추출하여 좌표를 고정한다.

```python
fig.subplots_adjust(right=0.85)
fig.canvas.draw()
pos_top    = axes[0].get_position()
pos_bottom = axes[-1].get_position()

cbar_x0    = pos_top.x1 + 0.02
cbar_width = 0.02
cax = fig.add_axes([cbar_x0, pos_bottom.y0, cbar_width, pos_top.y1 - pos_bottom.y0])
cbar = fig.colorbar(im, cax=cax)
```

### 1.2 가로형 Colorbar (하단 배치)

```python
fig.subplots_adjust(bottom=0.15)
fig.canvas.draw()
pos_bottom = axes[-1].get_position()

cbar_x0     = pos_bottom.x0
cbar_y0     = pos_bottom.y0 - 0.08
cbar_width  = pos_bottom.x1 - pos_bottom.x0
cbar_height = 0.02

cax = fig.add_axes([cbar_x0, cbar_y0, cbar_width, cbar_height])
cbar = fig.colorbar(im, cax=cax, orientation='horizontal')
```

Colorbar 폰트는 항상 `fs['cbar_tick']`, `fs['cbar_label']` 을 사용한다.

## 2. Heatmap 스타일 (Rule 30)

- **shading**: `shading='gouraud'` (부드러운 보간)
- **colormap**: 기본 `cmap='inferno'` 사용
- **vmin/vmax**: 항상 명시적으로 지정 (데이터 분포 기반으로 사전 결정)
- **ax 내부 텍스트 금지**: Heatmap 데이터 영역(`ax`) 안에 텍스트 삽입 금지 → 반드시 `ax` 외부에 배치

```python
mesh = ax.pcolormesh(R, Z, T_field, shading='gouraud',
                     cmap='inferno', vmin=15.0, vmax=35.0)
```

### 로그스케일 Heatmap

온도 상승량(ΔT) 등 End-Effect 시각화 시 `LogNorm` 사용:

```python
from matplotlib.colors import LogNorm
mesh = ax.pcolormesh(R, Z, dT_field, shading='gouraud',
                     cmap='inferno', norm=LogNorm(vmin=1e-2, vmax=30.0))
```

## 3. Lineplot 선 두께 (Rule 34)

- 모든 라인의 `linewidth`는 `dm.lw(0)` 또는 `dm.lw(1)` 중 하나로 통일한다.
- 동일 플롯 내 여러 비교 라인은 **모두 동일한 두께**를 사용한다.

```python
ax.plot(x, y_exact,  color='tw.blue500',   linewidth=dm.lw(1))
ax.plot(x, y_approx, color='tw.orange500', linewidth=dm.lw(1))  # 동일 두께
```
