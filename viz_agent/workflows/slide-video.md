---
description: 애니메이션 MP4 비디오 생성 단축 워크플로우
---
# /slide-video

기획서 승인 후 **애니메이션 MP4 비디오** 생성에 특화된 단축 워크플로우.  
`/concept-to-viz`의 Step 3 이후를 독립 실행한다.

## Steps

### Step 1: 기획서 확인
기존 `plan_*.md` 기획서가 있으면 로드한다. 없으면 `viz-planner` 스킬을 실행한다.
- **FPS·프레임 수·시뮬레이션 기간**이 기획서에 명시되어 있는지 확인한다 (Rule 06 § 3).

### Step 2: 스크립트 생성
`viz-code-generator` 스킬을 사용하여 `video_NN_*.py` 스크립트를 생성한다.
- 스크립트명은 반드시 `video_` 접두사이어야 한다.
- `animation.FuncAnimation` + `FFMpegWriter` 패턴을 사용한다.
- 결과물은 `PPT_slide/{ch}/videos/` 에 저장한다.

### Step 3: Audit 검수
`viz-audit` 스킬로 A1~A6 항목 순차 점검한다.
- **A1, A2 (테스트 프레임 저장 금지)** 항목에 특히 집중한다.

// turbo
### Step 4: 렌더링 실행
```bash
timeout 180 uv run python3 PPT_slide/{ch}/viz_codes/{video_script}.py
```
FLS 적분 등 계산이 무거운 스크립트는 timeout을 조절한다.

### Step 5: 결과물 검증
```bash
ls -lh PPT_slide/{ch}/videos/{output_file}.mp4
```
파일이 100바이트 미만이면 렌더링 실패로 판정하고 에러 로그를 분석한다.
