# Frontend continuous integration

`Frontend CI` runs on pushes to main, develop, feature, release and hotfix branches,
on pull requests into main/develop, and manually with workflow_dispatch.

Three independent Ubuntu/Node 24 jobs run npm ci and the existing test:account,
test:emergencies and test:sprint3 Angular/Vitest scripts. The selected regression
suites contain 21 tests; this is not a claim about the inherited unfiltered suite.
Logs are retained for 14 days even when a regression suite fails. Shell pipefail
ensures a failing test cannot be hidden by log capture.

A fourth job builds the production Angular bundle and the existing multi-stage
Docker image. The bundle is retained as an artifact for 14 days. Images are not
pushed to a registry and the app is not deployed. These tests use their configured
HTTP mocks; the workflow does not exercise a running MySQL/Compose backend.

No account tokens or production credentials are required. The workflow was added
after v0.3.0, during Sprint 3 evidence preparation; it is not historical Sprint 1
or Sprint 2 CI evidence.

For report evidence, capture a successful Actions > Frontend CI run showing its
branch, commit and four jobs. Open each Run regression suite log for its test
total, and Production and Docker build for compilation/image results. Include
the actual run URL and date.
