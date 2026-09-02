import importlib.util
import json
import sys
import tempfile
import unittest
from pathlib import Path
from subprocess import CompletedProcess
from unittest.mock import patch


WORKSPACE = Path(__file__).parent
sys.dont_write_bytecode = True
SPEC = importlib.util.spec_from_file_location("run_evals", WORKSPACE / "run_evals.py")
RUN_EVALS = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(RUN_EVALS)


class DispatchContractTest(unittest.TestCase):
    def test_full_matrix_has_three_isolated_configurations(self):
        dispatches = RUN_EVALS.build_prompts(
            model="gpt-5.6-sol",
            reasoning_effort="high",
        )
        self.assertEqual(len(dispatches), 39)
        self.assertEqual(
            {dispatch["group"] for dispatch in dispatches},
            {"mpx2web", "previous_mpx2web", "no_skill"},
        )
        self.assertTrue(all(dispatch["fork_turns"] == "none" for dispatch in dispatches))

    def test_no_skill_prompt_does_not_expose_skill_path(self):
        dispatch = RUN_EVALS.build_prompts(
            eval_ids=[0],
            groups=["no_skill"],
            model="gpt-5.6-sol",
            reasoning_effort="high",
        )[0]
        self.assertNotIn(str(RUN_EVALS.SKILL), dispatch["prompt"])
        self.assertIn("不要读取或使用任何 Mpx2Web Skill", dispatch["prompt"])

    def test_previous_skill_uses_complete_frozen_1_8_snapshot(self):
        dispatch = RUN_EVALS.build_prompts(
            eval_ids=[0],
            groups=["previous_mpx2web"],
            model="gpt-5.6-sol",
            reasoning_effort="high",
        )[0]
        self.assertIn(RUN_EVALS.BASELINE_SKILL_TOKEN, dispatch["prompt"])
        self.assertNotIn(str(RUN_EVALS.SKILL.parent / "references"), dispatch["prompt"])
        _, templates = RUN_EVALS.load_configs(validate=False)
        self.assertIn(
            'version: "1.8.0"',
            templates["templates"]["previous_mpx2web"]["frozen_skill_text"],
        )
        self.assertNotIn("iteration-11-internal", dispatch["prompt"])

    def test_previous_skill_materializes_from_frozen_commit(self):
        _, templates = RUN_EVALS.load_configs(validate=False)
        with tempfile.TemporaryDirectory() as directory:
            skill = RUN_EVALS.materialize_baseline(
                Path(directory) / "skills",
                templates["templates"]["previous_mpx2web"]["frozen_skill_text"],
            )
            self.assertIn('version: "1.8.0"', skill.read_text())
            self.assertTrue((skill.parents[1] / "mpx2rn/SKILL.md").is_file())
            self.assertTrue((skill.parent / "references/web-api-reference.md").is_file())

    def test_command_forces_workspace_and_model(self):
        dispatch = RUN_EVALS.build_prompts(
            eval_ids=[0],
            groups=["mpx2web"],
            model="gpt-5.6-sol",
            reasoning_effort="high",
        )[0]
        command = RUN_EVALS.build_codex_command(dispatch)
        self.assertEqual(command[command.index("-C") + 1], str(RUN_EVALS.EVAL_WORKDIR))
        self.assertEqual(command[command.index("-m") + 1], "gpt-5.6-sol")
        self.assertIn('model_reasoning_effort="high"', command)
        self.assertIn("--ignore-user-config", command)
        self.assertIn("--ephemeral", command)
        self.assertIn("--skip-git-repo-check", command)

    def test_frozen_contract_and_fixture_digests_are_current(self):
        self.assertTrue(RUN_EVALS.validate_contract())

    def test_each_sample_writes_an_isolated_output_snapshot(self):
        dispatch = RUN_EVALS.build_prompts(
            eval_ids=[0],
            groups=["mpx2web"],
            model="gpt-5.6-sol",
            reasoning_effort="high",
            run_number=2,
        )[0]
        self.assertIn("/mpx2web/run-2/outputs/", dispatch["output_paths"][0])
        self.assertIn("/mpx2web/outputs/", dispatch["published_output_paths"][0])

    def test_resume_requires_matching_fingerprint_and_complete_outputs(self):
        with tempfile.TemporaryDirectory(dir=RUN_EVALS.EVAL_WORKDIR) as directory:
            root = Path(directory)
            dispatch = RUN_EVALS.build_prompts(
                eval_ids=[0],
                groups=["mpx2web"],
                model="gpt-5.6-sol",
                reasoning_effort="high",
                run_number=9,
            )[0]
            output = root / "run-9/outputs/result.mpx"
            output.parent.mkdir(parents=True)
            output.write_text("<template />\n")
            dispatch["output_paths"] = [str(output)]
            dispatch["metrics_path"] = str(root / "run-9/metrics.json")
            run_path = root / "run-9/run.json"
            run_path.write_text(json.dumps({
                "fingerprint": "old-result-without-current-fingerprint",
                "returncode": 0,
                "outputs_complete": True,
            }))
            self.assertFalse(RUN_EVALS.dispatch_complete(dispatch))

            run_path.write_text(json.dumps({
                "fingerprint": dispatch["fingerprint"],
                "returncode": 0,
                "outputs_complete": True,
                "compile_status": "passed",
            }))
            self.assertTrue(RUN_EVALS.dispatch_complete(dispatch))

            run_path.write_text(json.dumps({
                "fingerprint": dispatch["fingerprint"],
                "returncode": 0,
                "outputs_complete": True,
                "compile_status": "failed",
            }))
            self.assertTrue(RUN_EVALS.dispatch_complete(dispatch))

    def test_runner_records_complete_multi_file_output(self):
        with tempfile.TemporaryDirectory(dir=RUN_EVALS.EVAL_WORKDIR) as directory:
            root = Path(directory)
            dispatch = RUN_EVALS.build_prompts(
                eval_ids=[0],
                groups=["no_skill"],
                model="gpt-5.6-sol",
                reasoning_effort="high",
                run_number=4,
            )[0]
            output_root = root / "outputs"
            output_paths = [output_root / path for path in (
                "src/pages/home/index.mpx",
                "src/components/product-card.mpx",
            )]
            original_output_paths = list(dispatch["output_paths"])
            dispatch["output_root"] = str(output_root)
            dispatch["output_paths"] = [str(path) for path in output_paths]
            for original, replacement in zip(original_output_paths, output_paths):
                dispatch["prompt"] = dispatch["prompt"].replace(
                    original, str(replacement)
                )
            published_root = root / "published"
            published_paths = [
                published_root / path for path in (
                    "src/pages/home/index.mpx",
                    "src/components/product-card.mpx",
                )
            ]
            dispatch["published_output_root"] = str(published_root)
            dispatch["published_output_paths"] = [str(path) for path in published_paths]
            dispatch["metrics_path"] = str(root / "run-4/metrics.json")

            def fake_run(*args, **kwargs):
                prompt = kwargs["input"]
                declared = prompt.split("输出文件：\n", 1)[1].split("\n\n", 1)[0]
                staged_outputs = [
                    Path(line.removeprefix("- "))
                    for line in declared.splitlines()
                ]
                for output in staged_outputs:
                    output.parent.mkdir(parents=True, exist_ok=True)
                    output.write_text("<template />\n")
                return CompletedProcess(
                    args[0],
                    0,
                    stdout=(
                        '{"type":"item.completed","item":{"type":"file_change"}}\n'
                        '{"type":"turn.completed","usage":{"input_tokens":10,"output_tokens":5}}\n'
                    ),
                    stderr="",
                )

            compile_result = {
                "status": "passed",
                "all_declared_outputs_present": True,
                "boundary": "test compile gate",
            }
            with patch.object(RUN_EVALS.subprocess, "run", side_effect=fake_run), patch.object(
                RUN_EVALS, "run_compile_gate", return_value=compile_result
            ):
                result = RUN_EVALS.run_dispatch(dispatch)

            self.assertTrue(result["outputs_complete"])
            self.assertEqual(result["compile_status"], "passed")
            self.assertTrue(all(path.is_file() for path in published_paths))
            metrics = json.loads(Path(dispatch["metrics_path"]).read_text())
            self.assertEqual(metrics["total_tokens"], 15)
            self.assertEqual(metrics["tool_calls"], 1)

    def test_compile_gate_rejects_fake_condition_comments_outside_style(self):
        with tempfile.TemporaryDirectory(dir=RUN_EVALS.EVAL_WORKDIR) as directory:
            root = Path(directory)
            output = root / "outputs/src/app.mpx"
            output.parent.mkdir(parents=True)
            output.write_text("""<template>
<!-- @mpx-if (__mpx_mode__ === 'web') -->
<view>web</view>
<!-- @mpx-endif -->
</template>
<script>
// @mpx-if (__mpx_mode__ === 'web')
useWebSdk()
// @mpx-endif
</script>
<style>
/* @mpx-if (__mpx_mode__ === 'web') */
.card:hover { color: red; }
/* @mpx-endif */
</style>
""")
            dispatch = {
                "output_paths": [str(output)],
                "output_relative_paths": ["src/app.mpx"],
                "metrics_path": str(root / "run-1/metrics.json"),
            }
            (root / "run-1").mkdir()
            result = RUN_EVALS.run_compile_gate(dispatch)
            self.assertEqual(result["status"], "failed")
            semantic = next(
                check for check in result["checks"]
                if check["kind"] == "mpx-conditional-compile-semantics"
            )
            self.assertFalse(semantic["passed"])
            self.assertEqual(
                len(semantic["detail"]["files"][0]["errors"]), 4
            )

    def test_compile_gate_accepts_real_mpx_conditions_and_style_comments(self):
        with tempfile.TemporaryDirectory(dir=RUN_EVALS.EVAL_WORKDIR) as directory:
            root = Path(directory)
            output = root / "outputs/src/app.mpx"
            output.parent.mkdir(parents=True)
            output.write_text("""<template>
<view @web>web</view>
<view wx:if=\"{{__mpx_mode__ === 'wx'}}\">wx</view>
</template>
<script>
if (__mpx_mode__ === 'web') useWebSdk()
</script>
<style>
/* @mpx-if (__mpx_mode__ === 'web') */
.card:hover { color: red; }
/* @mpx-endif */
</style>
""")
            dispatch = {
                "output_paths": [str(output)],
                "output_relative_paths": ["src/app.mpx"],
                "metrics_path": str(root / "run-1/metrics.json"),
            }
            (root / "run-1").mkdir()
            result = RUN_EVALS.run_compile_gate(dispatch)
            self.assertEqual(result["status"], "passed")

    def test_compile_gate_rejects_unclosed_style_condition(self):
        with tempfile.TemporaryDirectory(dir=RUN_EVALS.EVAL_WORKDIR) as directory:
            root = Path(directory)
            output = root / "outputs/src/app.mpx"
            output.parent.mkdir(parents=True)
            output.write_text("""<template><view /></template>
<style>
/* @mpx-if (__mpx_mode__ === 'web') */
.card:hover { color: red; }
</style>
""")
            dispatch = {
                "output_paths": [str(output)],
                "output_relative_paths": ["src/app.mpx"],
                "metrics_path": str(root / "run-1/metrics.json"),
            }
            (root / "run-1").mkdir()
            result = RUN_EVALS.run_compile_gate(dispatch)
            self.assertEqual(result["status"], "failed")
            semantic = next(
                check for check in result["checks"]
                if check["kind"] == "mpx-conditional-compile-semantics"
            )
            self.assertIn(
                "缺少对应的 @mpx-endif",
                semantic["detail"]["files"][0]["errors"][0]["message"],
            )

    def test_runner_has_no_internal_workspace_dependency(self):
        self.assertNotIn(
            "iteration-11-internal",
            (WORKSPACE / "run_evals.py").read_text(),
        )


if __name__ == "__main__":
    unittest.main()
