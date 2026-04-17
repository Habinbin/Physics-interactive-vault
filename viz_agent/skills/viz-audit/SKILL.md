---
name: Viz Audit
description: 파이썬 시각화 스크립트 실행 전 금지 패턴을 스캔하고 규칙 준수 여부를 강제 검수한다. Rule 02 § 3의 실행 게이트.
---
# Viz Audit Skill

## Purpose
`run_command`로 스크립트를 실행하기 **직전**, 코드 내 규칙 위반 패턴을 정적 분석(Static Analysis)으로 검출하는 실행 게이트.

## When to Use
- `plot_*.py` 또는 `video_*.py` 파일을 실행하기 직전 (항상)
- `/slide-plot` · `/slide-video` · `/concept-to-viz` 워크플로우의 Audit 단계

## Audit Checklist

스크립트 파일에 대해 다음 항목을 `grep_search` 또는 `view_file`로 순차 점검한다.

| # | 점검 항목 | 금지 패턴 | 조치 |
|---|---|---|---|
| A1 | 테스트 프레임 저장 | `savefig('test_start`)`, `savefig('test_end')`, `_final.png` | 해당 줄 삭제 |
| A2 | 불법 savefig (비디오) | `video_*.py` 내 `plt.savefig(` (MP4 저장 외) | 해당 줄 삭제 |
| A3 | fig.text 텍스트 배치 | `fig.text(` | `ax.text(` + `transform=ax.transAxes`로 교체 |
| A4 | 단위 곱셈 기호 누락 | `m.K`, `m*K`, `m/K` (수식 없이 사용) | `m$\cdot$K`으로 교체 |
| A5 | raw string 누락 | `'\Delta'`, `'\cdot'` (r 접두사 없이) | `r'\Delta'` 등으로 교체 |
| A6 | 파일명 접두사 불일치 | MP4 생성 스크립트명이 `plot_`으로 시작 | 파일명 변경 제안 |

## Instructions

```
1. 스크립트 파일을 view_file로 전체 읽는다.
2. 위 6가지 항목을 grep_search 또는 내용 검토로 점검한다.
3. 위반 항목 발견 시:
   a. 실행 보류
   b. replace_file_content로 자동 수정
   c. 수정 내용 사용자에게 보고
4. 모든 항목 통과 시 → run_command 실행 허가
```

## Output
- Audit 통과: "✅ All checks passed. Running script..."
- Audit 실패: "⚠️ Found violations: [목록]. Auto-fixing..."

> [!CAUTION]
> 이 스킬을 건너뛰고 `run_command`를 실행하는 것은 Rule 02 위반이다.
