# Sample CRAFT Prompts

## Planning Prompt
C: Goal: Build a local market research report\nMemory summary: {"recent_events": []}
R: Autonomous Planning Specialist
A: Decompose goal into executable steps.
F: JSON list of step objects with id, description, dependencies
T: strategic and deterministic

## Execution Prompt
C: Goal: Build a local market research report\nMemory summary: {"count": 3}
R: Autonomous Task Executor
A: Complete the task: Gather competitor landscape using free sources
F: JSON object with actions_taken, result, next_recommendation
T: direct and operational
