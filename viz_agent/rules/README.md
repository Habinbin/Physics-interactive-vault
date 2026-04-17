---
description: Rules 시스템 컨트롤러 — 규칙 인덱스, 활성화 조건, 적용 우선순위
---
# VizEdu Rules — Index

이 디렉토리는 VizEdu 에이전트의 모든 시각화 규칙을 포함한다. 기존 `rules/` 디렉토리의 Rule 26~40을 기능별로 통합·재구성한 것이다.

## Rules 목록

| 파일 | 역할 | Trigger | 통합 원본 |
|---|---|---|---|
| [`01_material_analysis.md`](01_material_analysis.md) | Material 분석 게이트 | `model_decision` | 신규 |
| [`02_viz_design_workflow.md`](02_viz_design_workflow.md) | 기획서·Audit·파일명 | `always_on` | Rule 33, 37, 39 |
| [`03_slide_production.md`](03_slide_production.md) | 폰트·여백·텍스트 | `always_on` | Rule 27, 28, 32, 35, 40 |
| [`04_plot_components.md`](04_plot_components.md) | Colorbar·Heatmap·Lineplot | `always_on` | Rule 29, 30, 34 |
| [`05_scientific_notation.md`](05_scientific_notation.md) | 단위·수식·기호 | `always_on` | Rule 31, 36, 38 |
| [`06_video_rendering.md`](06_video_rendering.md) | 배경색·FPS·테스트프레임 | `always_on` | Rule 26 |

## 원본 규칙 참조

기존 개별 규칙 원본은 프로젝트 루트 `rules/` 디렉토리에 그대로 유지된다. 이 `agent/rules/` 파일들은 해당 내용의 **통합·재구성본**이다.

## 적용 우선순위

```
01 (분석 게이트) → 02 (설계 워크플로우) → 03 (스타일) → 04 (컴포넌트) → 05 (표기) → 06 (렌더링)
```
