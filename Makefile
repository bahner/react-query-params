
lint: eslint markdownlint

eslint:
	bun lint

build:
	bun run build

pack: lint
	bun pm pack

publish: pack
	bun publish

markdownlint:
	mdl -r ~MD024 -g README.md
