---
description: 슬라이드·비디오 이미지 생성 시 폰트, 여백, 텍스트 배치, 범례 표준 (Rule 27+28+32+35+40 통합)
trigger: always_on
---
# Rule 03 — Slide Production Standards

> **Trigger**: `always_on` — PPT 발표용 정지 이미지 및 MP4 비디오 프레임 생성 시 적용

## 1. 전역 폰트 설정 (Rule 27)

모든 슬라이드용 시각화 스크립트 최상단에 아래 블록을 **반드시** 포함한다.

```python
dm.style.use('presentation')

# Global font (Rule 27)
plt.rcParams['font.size'] = 14.0

fs = {
    'label':     dm.fs(-1.5),
    'tick':      dm.fs(-2.0),
    'legend':    dm.fs(-3.5),
    'subtitle':  dm.fs(0),
    'cbar_tick': dm.fs(-3.5),
    'cbar_label':dm.fs(-1.5),
    'text':      dm.fs(-4.5),
}
plt.rcParams['axes.labelsize']  = fs['label']
plt.rcParams['xtick.labelsize'] = fs['tick']
plt.rcParams['ytick.labelsize'] = fs['tick']
plt.rcParams['legend.fontsize'] = fs['legend']
plt.rcParams['axes.titlesize']  = fs['subtitle']

# MathText Roboto override (Rule 40)
plt.rcParams['mathtext.it'] = 'Roboto:italic:regular'

# Legend padding (Rule 35)
plt.rcParams['legend.handlelength']  = 2.0
plt.rcParams['legend.handletextpad'] = 0.5
```

## 2. 여백(Margins) 기준 (Rule 28)

`tight_layout()` 대신 `fig.subplots_adjust()` 고정 좌표 방식을 사용한다.

- **최소 여백**: 2~3% (텍스트 잘림 방지)
- **최대 여백**: 5~8% (도화지 낭비 방지)
- Colorbar, 타이틀 텍스트가 `ax` 영역을 침범하지 않는지 반드시 확인한다.

## 3. 텍스트 배치 규칙 (Rule 32)

텍스트 배치 기준은 **항상 `ax`** 좌표계를 사용한다. `fig.text()`는 사용 금지.

```python
# ✅ 올바른 예
time_text = ax.text(0.5, 1.05, '', transform=ax.transAxes,
                    ha='center', va='bottom', weight='bold')

# ❌ 잘못된 예 (colorbar 유무에 따라 위치가 틀어짐)
time_text = fig.text(0.5, 0.95, '', ha='center')
```

다중 서브플롯 환경에서는 **가장 상단의 `ax`** 기준으로 배치한다.

## 4. 그림 크기 기준

| 용도 | 권장 크기 |
|---|---|
| 전체 슬라이드 1개 | `dm.cm2in(24) × dm.cm2in(16)` (16:9) |
| 슬라이드 절반 (좌/우) | `dm.cm2in(16) × dm.cm2in(16)` |
| 4분할 패널 | `dm.cm2in(30) × dm.cm2in(20)` |

## 5. 배경색

모든 슬라이드 스크립트에서 `BG_COLOR = '#fafaf9'`를 표준 배경색으로 사용한다.

```python
BG_COLOR = '#fafaf9'
fig.patch.set_facecolor(BG_COLOR)
ax.set_facecolor(BG_COLOR)
```
