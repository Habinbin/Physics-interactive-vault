---
name: Viz Planner
description: 시각화 기획서(plan_*.md) 템플릿을 인터랙티브하게 채워서 생성한다. Rule 02 § 1의 기획서 의무를 충족한다.
---
# Viz Planner Skill

## Purpose
시각화 코드를 작성하기 전, 구성 요소를 빠짐없이 설계한 기획서(`plan_*.md`)를 자동으로 생성하는 스킬.

## When to Use
- 새로운 `plot_*.py` 또는 `video_*.py` 파일을 작성하기 전
- `/concept-to-viz` 또는 `/slide-plot` · `/slide-video` 워크플로우의 Plan 단계

## Output Location
```
PPT_slide/{ch}/viz_codes/plan_NN_description.md
```

## Template (반드시 이 구조로 생성한다)

```markdown
# Viz Plan: {시각화 제목}

## 1. 목적 (Objective)
{전달하려는 핵심 물리/수학적 의미 한 문장}

## 2. 데이터 및 변수 (Variables)
- 독립변수: {이름} [{단위}], 범위: {최솟값} ~ {최댓값}
- 종속변수: {이름} [{단위}]
- 파라미터: {이름} = {값} [{단위}]

## 3. 시각적 구성요소 (Layout)
- Plot 종류: {Heatmap / Line Plot / Animation 등}
- 그림 크기: {dm.cm2in(W)} × {dm.cm2in(H)}
- 서브플롯: {nrows} × {ncols}
- X축 범위: {xmin} ~ {xmax}
- Y축 범위: {ymin} ~ {ymax}
- Colorbar: {세로형(우측) / 가로형(하단)}, vmin={값}, vmax={값}
- 텍스트 배치: {ax 기준 위치 설명}

## 4. 규칙 준수 확인 (Rule Checklist)
- [ ] Rule 03: 전역 폰트 설정 블록 포함 여부
- [ ] Rule 04: Colorbar bbox 동기화 방식 적용 여부
- [ ] Rule 05: 단위 `\cdot`, Sentence case 적용 여부
- [ ] Rule 06: 배경색 동기화, savefig 금지 적용 여부

## 5. 출력 경로 (Output)
- 스크립트명: {plot_NN_name.py 또는 video_NN_name.py}
- 결과물: PPT_slide/{ch}/{images 또는 videos}/{파일명}
```

## Instructions
1. `material-reader`의 출력을 받아 Template의 각 항목을 자동으로 채운다.
2. 불확실한 항목은 사용자에게 질문하고 공란으로 두지 않는다.
3. 기획서가 완성되면 사용자 승인을 구한다.
4. 승인 후 `viz-code-generator` 스킬을 호출한다.
