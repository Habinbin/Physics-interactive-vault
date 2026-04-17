---
description: 정지 이미지(PNG/SVG) 시각화 생성 단축 워크플로우
---
# /slide-plot

기획서 승인 후 **정지 이미지(PNG/SVG)** 생성에 특화된 단축 워크플로우.  
`/concept-to-viz`의 Step 3 이후를 독립 실행한다.

## Steps

### Step 1: 기획서 확인
기존 `plan_*.md` 기획서가 있으면 로드한다. 없으면 `viz-planner` 스킬을 실행한다.

### Step 2: 스크립트 생성
`viz-code-generator` 스킬을 사용하여 `plot_NN_*.py` 스크립트를 생성한다.
- 스크립트명은 반드시 `plot_` 접두사이어야 한다.
- 결과물은 `PPT_slide/{ch}/images/` 에 저장한다.

### Step 3: Audit 검수
`viz-audit` 스킬로 A1~A6 항목 순차 점검한다.

// turbo
### Step 4: 렌더링 실행
```bash
timeout 60 uv run python3 PPT_slide/{ch}/viz_codes/{plot_script}.py
```

### Step 5: 결과물 검증
```bash
ls -lh PPT_slide/{ch}/images/{output_file}.{ext}
```
파일이 0바이트이면 실패로 판정하고 에러 로그를 분석한다.
