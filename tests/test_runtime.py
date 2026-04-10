from agentic_system.config import RuntimeConfig
from agentic_system.runtime import AgentRuntime


def test_runtime_stub_executes(tmp_path):
    runtime = AgentRuntime(RuntimeConfig(provider="stub", data_dir=tmp_path, max_steps=3))
    result = runtime.run_goal("Create a launch plan for a small app")
    assert result["steps_executed"] >= 1
    assert isinstance(result["history"], list)
