---
description: 시각화 기획서 작성 의무, 스크립트 실행 전 Audit, 파일명 규칙 (Rule 33+37+39 통합)
trigger: always_on
---
# Rule 02 — Visualization Design Workflow

> **Trigger**: `always_on` — 시각화 코드(plot_*.py, video_*.py) 작성·수정·실행 시 항상 적용

## 1. 기획서(plan_*.md) 작성 의무 (Rule 33)

시각화 코드를 작성하거나 수정하기 전, **반드시 대응하는 마크다운 기획서(`plan_*.md`)를 먼저 작성**해야 한다. 코드보다 기획서가 선행되어야 한다.

### 기획서 필수 포함 항목
1. **시각화 목적**: 전달하려는 핵심 물리/수학적 의미
2. **데이터 및 변수**: x/y축, 단위, 물리 파라미터 목록
3. **시각적 구성요소**: Plot 종류, 축 제한 범위, Colorbar 범위, 레이아웃
4. **출력 경로**: `PPT_slide/{ch}/images/` 또는 `PPT_slide/{ch}/videos/`

### 기획서 작성 위치
```
PPT_slide/{ch}/viz_codes/plan_NN_description.md
```

## 2. 스크립트 파일명 규칙 (Rule 37)

| 결과물 유형 | 파일명 접두사 | 예시 |
|---|---|---|
| 정지 이미지(PNG/SVG) | `plot_` | `plot_01_ils_profile.py` |
| 애니메이션(MP4) | `video_` | `video_01_fls_heatmap.py` |

- `plot_`으로 시작하는 파일이 MP4를 생성하면 **규칙 위반**이다.
- 번호는 `NN` 2자리 서수를 사용한다.

## 3. 실행 전 코드 검수 (Rule 39)

에이전트는 `run_command`로 스크립트를 실행하기 **직전에** 다음을 강제로 점검한다.

1. **savefig 잔재 검출**: 스크립트 내 `savefig` 호출 전수 확인
2. **금지된 테스트 프레임 저장 검출**: `test_start.png`, `test_end.png`, `_final.png` 등 잔재 확인
3. **자동 수정**: 위 항목 발견 시 실행 보류 → `replace_file_content`로 해당 구문 제거 후 재실행

> [!CAUTION]
> 코드 검수 없이 `run_command`를 실행하는 것은 금지이다. `viz-audit` 스킬을 먼저 실행한다.
