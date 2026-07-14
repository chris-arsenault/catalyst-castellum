.PHONY: ci architecture-check copy-check performance-check lint lint-fix format format-check typecheck test build campaign-health terraform-fmt-check deploy

ci: architecture-check copy-check performance-check lint format-check typecheck test build campaign-health terraform-fmt-check

architecture-check:
	pnpm run architecture:check

copy-check:
	pnpm run copy:check

performance-check:
	pnpm run performance:check

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

build:
	pnpm run build

campaign-health:
	pnpm run campaign:health

terraform-fmt-check:
	terraform fmt -check -recursive infrastructure/terraform/

deploy:
	scripts/deploy.sh
