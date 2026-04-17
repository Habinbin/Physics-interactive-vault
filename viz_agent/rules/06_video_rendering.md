---
description: MP4 애니메이션 렌더링 시 배경색 동기화, 테스트 프레임 저장 금지, FPS/프레임 수 설정 규칙 (Rule 26)
trigger: always_on
---
# Rule 06 — Video Rendering

> **Trigger**: `always_on` — 모든 MP4 비디오·애니메이션 생성 시 적용

## 1. 배경색 렌더링 동기화

비디오는 투명 배경(`transparent=True`)을 지원하지 않는다. PPT 슬라이드 배경색과 동일하게 지정한다.

```python
BG_COLOR = '#fafaf9'
fig.patch.set_facecolor(BG_COLOR)
ax.set_facecolor(BG_COLOR)

# 저장 시 반드시 facecolor 지정
ani.save('video.mp4', writer=writer,
         savefig_kwargs={'facecolor': BG_COLOR, 'edgecolor': 'none'})
```

## 2. 테스트 프레임 저장 금지

- `test_start.png`, `test_end.png`, `_final.png` 등 테스트용 파일을 디스크에 저장하는 것은 **절대 금지**이다.
- 오직 최종 **MP4 파일 하나만** 산출물로 저장되어야 한다.

## 3. FPS 및 프레임 수 설정

총 재생 시간과 시뮬레이션 기간에 맞춰 역산하여 설정한다.

| 시뮬레이션 기간 | 영상 길이 목표 | FPS | 총 프레임 수 |
|---|---|---|---|
| 10년 | 20초 | 20 | 400 |
| 10년 | 10초 | 20 | 200 |
| 1년 | 20초 | 20 | 400 |

```python
# 예시: 10년 시뮬레이션 → 20초 영상
time_years = np.linspace(start, 10.0, 400)   # 400 프레임
writer = animation.FFMpegWriter(fps=20, bitrate=2000)
```

## 4. 출력 경로

```python
OUTPUT_DIR = 'PPT_slide/{ch}/videos'
os.makedirs(OUTPUT_DIR, exist_ok=True)
```

출력 파일명은 스크립트명과 동일하게 한다.
```python
out = 'video_01_fls_rz_heatmap'
ani.save(f'{OUTPUT_DIR}/{out}.mp4', ...)
```
