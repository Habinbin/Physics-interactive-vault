---
description: 시간 단위 일관성, 플롯 텍스트·기호 표기, 물리 단위 곱셈 기호 규칙 (Rule 31+36+38 통합)
trigger: always_on
---
# Rule 05 — Scientific Notation Standards

> **Trigger**: `always_on` — 축 라벨, 제목, 범례, 단위, 수식 포함 텍스트 작성 시 적용

## 1. 시계열 단위 일관성 (Rule 31)

애니메이션·시계열 시각화 전체에서 **시간 단위는 단 하나만 사용**한다. 중간에 단위를 전환(Days → Years)하는 것은 금지다.

```python
# ✅ 올바른 예 — 항상 Years 단위 고정
time_text.set_text(f'Time: {t_yr:.2f} Years')

# ❌ 잘못된 예 — 단위 전환 조건 분기
if t_yr < 1:
    text = f'Time: {t_yr*365:.0f} Days'  # 금지
else:
    text = f'Time: {t_yr:.1f} Years'  # 금지(분기)
```

## 2. 텍스트 대소문자 (Sentence Case, Rule 36)

축 라벨, 범례 항목, 플롯 제목은 **Sentence case** 적용 (첫 단어만 대문자).

| ✅ 올바른 예 | ❌ 잘못된 예 |
|---|---|
| `Heat transfer rate (W)` | `Heat Transfer Rate (W)` |
| `System COP values` | `system cop values` |
| `Depth $z$ [m]` | `depth $z$ [m]` |

## 3. 물리 변수 수식 표기 (Rule 36)

- **물리량 변수** (`T, q, k, r`): 이탤릭체 수식 모드 `r'$T$'`
- **하첨자 텍스트** (`in`, `out`, `b`): `\mathrm{}` 직립체 사용
  - ✅ `r'$T_{\mathrm{in}}$'` / ❌ `r'$T_{in}$'`
- **숫자-단위 공백**: 반드시 공백 1칸
  - ✅ `10 kW`, `0.5 m/s` / ❌ `10kW`
- **퍼센트**: 공백 없이 붙여 쓰기 (`50%`, `27–32%`)
- **Raw string 필수**: 역슬래시 포함 문자열은 반드시 `r'...'`

## 4. 물리 단위 곱셈 기호 (Rule 38)

단위에 곱셈이 포함된 경우 `\cdot`을 사용한다. 마침표(`.`) 또는 별표(`*`) 사용 금지.

| ✅ 올바른 예 | ❌ 잘못된 예 |
|---|---|
| `r'W/(m$\cdot$K)'` | `'W/(m.K)'`, `'W/(m*K)'` |
| `r'J/(m^3$\cdot$K)'` | `'J/(m3K)'` |

- Python 주석에서도 동일하게 `m$\cdot$K` 형태로 작성한다.
- `\cdot` 포함 문자열은 반드시 raw string (`r'...'`)으로 작성해야 SyntaxWarning을 피한다.
