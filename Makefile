.PHONY: ci lint lint-fix format format-check typecheck test terraform-fmt-check deploy

ci: lint format-check typecheck test terraform-fmt-check

lint:
	pnpm exec eslint .

lint-fix:
	pnpm exec eslint . --fix

format:
	pnpm exec prettier --write .

format-check:
	pnpm exec prettier --check .

typecheck:
	pnpm exec tsc --noEmit

test:
	pnpm exec vitest run --coverage

terraform-fmt-check:
	terraform fmt -check -recursive infrastructure/terraform/

deploy:
	scripts/deploy.sh
