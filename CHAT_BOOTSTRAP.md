# Chat Bootstrap Protocol (All Future Chats in This Repo)

This project uses persistent in-repo memory files.
For **every new chat** in this repository, load the following in order:

1. `MAIN_MEMORY.md` (quick-state snapshot)
2. `NARRATIVE_ANCHORS.md` (full canon + protocols)

## Mandatory Startup Checklist
- Confirm locked canon invariants before generating new content.
- Restore continuity fields (`trust_matrix`, `public_stability`, `truth_exposure_level`, `seam_cost_index`).
- Identify active unresolved hook from prior turn.
- Use Candle Atlas / Night Constellation when user asks for synthesis.

## Scope
- Applies to all narrative work in this repo/project.
- If files conflict, `NARRATIVE_ANCHORS.md` is source of truth and `MAIN_MEMORY.md` is the condensed operational snapshot.
