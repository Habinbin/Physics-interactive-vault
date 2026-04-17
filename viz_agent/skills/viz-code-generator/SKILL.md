---
name: Viz Code Generator
description: 시각화 기획서(plan_*.md)를 입력받아 프로젝트 표준 스타일이 적용된 Python 스크립트 뼈대를 자동 생성한다.
---
# Viz Code Generator Skill

## Purpose
`viz-planner` 스킬이 만든 기획서를 1:1로 대응하여, Rule 02~06을 모두 만족하는 파이썬 스크립트 뼈대를 생성한다.

## When to Use
- 사용자가 `viz-planner`의 기획서를 승인한 직후
- `/slide-plot` · `/slide-video` · `/concept-to-viz` 워크플로우의 Code 단계

## Template Structure

```python
import os
import matplotlib.pyplot as plt
# (애니메이션인 경우) import matplotlib.animation as animation
import numpy as np
import dartwork_mpl as dm
import imageio_ffmpeg  # (애니메이션인 경우)

# (애니메이션인 경우)
plt.rcParams['animation.ffmpeg_path'] = imageio_ffmpeg.get_ffmpeg_exe()

# ── Slide Style Setup (Rule 03) ────────────────────────────────────
dm.style.use('presentation')
plt.rcParams['font.size'] = 14.0

fs = {
    'label':      dm.fs(-1.5),
    'tick':       dm.fs(-2.0),
    'legend':     dm.fs(-3.5),
    'subtitle':   dm.fs(0),
    'cbar_tick':  dm.fs(-3.5),
    'cbar_label': dm.fs(-1.5),
    'text':       dm.fs(-4.5),
}
plt.rcParams['axes.labelsize']        = fs['label']
plt.rcParams['xtick.labelsize']       = fs['tick']
plt.rcParams['ytick.labelsize']       = fs['tick']
plt.rcParams['legend.fontsize']       = fs['legend']
plt.rcParams['axes.titlesize']        = fs['subtitle']
plt.rcParams['mathtext.it']           = 'Roboto:italic:regular'
plt.rcParams['legend.handlelength']   = 2.0
plt.rcParams['legend.handletextpad']  = 0.5

# ── Config Block ────────────────────────────────────────────────────
FIG_W    = dm.cm2in({W})
FIG_H    = dm.cm2in({H})
BG_COLOR = '#fafaf9'
OUTPUT_DIR = 'PPT_slide/{ch}/{images_or_videos}'
os.makedirs(OUTPUT_DIR, exist_ok=True)

# ── Physical Parameters (Rule 05) ──────────────────────────────────
{param_block}

# ── Grid / Mesh Setup ───────────────────────────────────────────────
{grid_block}

# ── Figure & Axes Setup ─────────────────────────────────────────────
fig, ax = plt.subplots(figsize=(FIG_W, FIG_H), dpi=300)
fig.patch.set_facecolor(BG_COLOR)
ax.set_facecolor(BG_COLOR)

{plot_block}

# ── Labels & Title ──────────────────────────────────────────────────
ax.set_xlabel({xlabel})
ax.set_ylabel({ylabel})
ax.set_title({title}, weight='bold')

# ── Colorbar (Rule 04) ──────────────────────────────────────────────
{colorbar_block}

# ── Render / Save ───────────────────────────────────────────────────
out = '{output_name}'
# Rule 02: Pre-run audit gate (viz-audit next)
```

## Instructions
1. 기획서의 각 섹션을 위 Template의 `{placeholder}`에 채워 넣는다.
2. 정지 이미지: `plt.savefig(...)` 최종 1회만 추가
3. 애니메이션: `animation.FuncAnimation` + `FFMpegWriter` 패턴으로 작성
4. 스크립트 생성 후 **즉시 `viz-audit` 스킬로 검수**를 진행한다.
