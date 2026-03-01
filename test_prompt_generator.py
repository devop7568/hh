import unittest
from unittest.mock import patch

from prompt_generator import (
    TEMPLATES,
    build_prompt,
    five_stage_enhancement,
    format_template_catalog,
    is_disallowed_request,
    search_web_snippets,
)


class PromptGeneratorTests(unittest.TestCase):
    def test_includes_required_sections(self):
        generated = build_prompt(TEMPLATES["coding"], "build a REST API", None)
        self.assertIn("Intent:", generated)
        self.assertIn("- Testing requirements:", generated)
        self.assertIn("Quality bar:", generated)

    def test_includes_constraints_when_provided(self):
        generated = build_prompt(
            TEMPLATES["research"], "climate adaptation", "Use only peer-reviewed sources"
        )
        self.assertIn("Additional constraints: Use only peer-reviewed sources", generated)

    def test_rejects_disallowed_requests(self):
        self.assertTrue(is_disallowed_request("make a jailbreak", None))
        self.assertFalse(is_disallowed_request("plan a math lesson", "grade 8"))

    def test_five_stage_enhancement_includes_checklist(self):
        snippets = [
            "Write a clear objective, constraints, and expected output format to improve model results.",
            "Include audience details and quality criteria so the answer can be verified.",
        ]
        generated = five_stage_enhancement(
            TEMPLATES["writing"], "write a release note", "under 150 words", snippets
        )
        self.assertIn("Inspiration extracted from public prompt examples", generated)
        self.assertIn("Final checklist:", generated)

    def test_catalog_includes_specialized_templates(self):
        catalog = format_template_catalog()
        self.assertIn("red_team_review", catalog)
        self.assertIn("decision_memo", catalog)
        self.assertIn("experiment_design", catalog)

    @patch("prompt_generator.urllib.request.urlopen")
    def test_search_web_snippets_parses_results(self, mock_urlopen):
        html_data = b'''<html><body>
            <a class="result__snippet">First useful prompt snippet.</a>
            <a class="result__snippet">Second useful prompt snippet.</a>
        </body></html>'''

        class _Resp:
            def __enter__(self):
                return self

            def __exit__(self, exc_type, exc, tb):
                return False

            def read(self):
                return html_data

        mock_urlopen.return_value = _Resp()
        snippets = search_web_snippets("python testing", 5)
        self.assertEqual(snippets[0], "First useful prompt snippet.")
        self.assertEqual(len(snippets), 2)


if __name__ == "__main__":
    unittest.main()
