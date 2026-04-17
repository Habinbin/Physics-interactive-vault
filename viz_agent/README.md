# VizEdu Agent

> **역할**: 학습 자료(교재, PDF, 강의 노트)를 분석하여, 수업·발표에 바로 활용할 수 있는 고품질 시각화 자료(정지 이미지 & 애니메이션 MP4)를 자동 생성하는 전담 에이전트.

---

## Directory Structure

```
agent/
├── README.md           ← 이 파일
├── rules/
│   ├── README.md       ← 규칙 인덱스 및 우선순위
│   ├── 01_material_analysis.md      (Material 분석 게이트)
│   ├── 02_viz_design_workflow.md    (기획서·Audit·파일명)
│   ├── 03_slide_production.md       (폰트·여백·텍스트)
│   ├── 04_plot_components.md        (Colorbar·Heatmap·Lineplot)
│   ├── 05_scientific_notation.md    (단위·수식·기호)
│   └── 06_video_rendering.md        (배경색·FPS·테스트프레임)
├── skills/
│   ├── material-reader/SKILL.md    (교재 개념 추출)
│   ├── viz-planner/SKILL.md        (기획서 작성 보조)
│   ├── viz-code-generator/SKILL.md (Python 스크립트 뼈대 생성)
│   └── viz-audit/SKILL.md          (실행 전 규칙 위반 검수)
└── workflows/
    ├── concept-to-viz.md            (/concept-to-viz — 핵심 파이프라인)
    ├── slide-plot.md                (/slide-plot — 정지 이미지 단축)
    └── slide-video.md               (/slide-video — 애니메이션 단축)
```

---

## Workflow 카탈로그

| 슬래시 커맨드 | 설명 |
|---|---|
| `/concept-to-viz` | **핵심**: 교재 → 개념 추출 → 기획 → 코드 → Audit → 렌더링 full pipeline |
| `/slide-plot` | 기획 완료 후 정지 이미지(PNG) 빠른 생성 |
| `/slide-video` | 기획 완료 후 애니메이션 MP4 빠른 생성 |

---

## Skills 카탈로그

| 스킬 | 역할 |
|---|---|
| `material-reader` | PDF/노트에서 수식·변수 추출 → 시각화 후보 목록 보고 |
| `viz-planner` | `plan_NN_*.md` 기획서 템플릿 작성 |
| `viz-code-generator` | 기획서 → Rule 준수 Python 스크립트 뼈대 생성 |
| `viz-audit` | 실행 전 `savefig` 금지·텍스트 배치·단위 규칙 위반 검출 |

---

## Output Paths

| 결과물 | 경로 |
|---|---|
| 정지 이미지 (PNG/SVG) | `PPT_slide/{ch}/images/` |
| 애니메이션 (MP4) | `PPT_slide/{ch}/videos/` |
| 기획서 | `PPT_slide/{ch}/viz_codes/plan_NN_*.md` |
| 스크립트 | `PPT_slide/{ch}/viz_codes/{plot|video}_NN_*.py` |

---

## 원본 규칙 참조

이 에이전트의 `rules/`는 프로젝트 루트 `rules/` 디렉토리의 **Rule 26~40 통합·재구성본**이다. 원본 파일은 해당 디렉토리에 보존된다.
