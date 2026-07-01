# Server-authoritative interview state + deterministic phase/time gating.
# The LLM only fills wording & adaptive follow-ups; the MOVE is decided here.
from typing import Dict, Any, List

PHASES_BY_DURATION: Dict[int, List[str]] = {
    5: ["exploration", "challenge", "wrap_up"],
    10: ["exploration", "deep_dive", "challenge", "wrap_up"],
    15: ["exploration", "deep_dive", "challenge", "wrap_up"],
}

def new_state(interview_id: str, duration_min: int, difficulty: str,
              jd_skills: List[str], title: str = "Technical Interview") -> Dict[str, Any]:
    return {
        "interview_id": interview_id,
        "title": title,
        "phase": "exploration",
        "duration_min": duration_min,
        "time_remaining_sec": duration_min * 60,
        "difficulty": difficulty,
        "jd_skills": jd_skills,
        "skills_assessed": {s: "unknown" for s in jd_skills},
        "topics_covered": [],
        "open_questions": [],
        "candidate_claims": [],
        "strengths": [],
        "weaknesses": [],
        "challenge_used": False,
        "hints_given": 0,
        "next_objective": "Explore candidate's experience with the required skills",
        "next_move": "follow_up",
    }

def _phase_for_elapsed(duration_min: int, elapsed_sec: int) -> str:
    phases = PHASES_BY_DURATION[duration_min]
    total = duration_min * 60
    # reserve final ~15% for wrap-up
    wrap_start = total * 0.85
    if elapsed_sec >= wrap_start:
        return "wrap_up"
    work = [p for p in phases if p != "wrap_up"]
    seg = wrap_start / len(work)
    idx = min(int(elapsed_sec // seg), len(work) - 1)
    return work[idx]

def advance(state: Dict[str, Any], elapsed_sec: int) -> Dict[str, Any]:
    """Update phase/time and choose next_move deterministically."""
    state["time_remaining_sec"] = max(0, state["duration_min"] * 60 - elapsed_sec)
    phase = _phase_for_elapsed(state["duration_min"], elapsed_sec)
    state["phase"] = phase

    if phase == "wrap_up":
        state["next_move"] = "wrap_up"
        state["next_objective"] = "Summarize and close the interview"
    elif phase == "challenge" and not state["challenge_used"]:
        state["next_move"] = "challenge"
        state["challenge_used"] = True
        state["next_objective"] = "Introduce one light constraint change"
    else:
        state["next_move"] = "follow_up"
        state["next_objective"] = f"Probe {phase} grounded in JD/candidate answer"
    return state

def record_turn(state: Dict[str, Any], role: str, text: str) -> Dict[str, Any]:
    if role == "candidate" and text.strip():
        state["candidate_claims"].append(text.strip()[:280])
    return state
