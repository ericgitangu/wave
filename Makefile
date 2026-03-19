# Wave — Build, test, and deploy commands
.PHONY: test build deploy deploy-dry clean

# Run all Rust tests
test:
	cd backend && PYO3_USE_ABI3_FORWARD_COMPATIBILITY=1 \
		RUSTFLAGS="-L $$(python3 -c 'import sysconfig; print(sysconfig.get_config_var("LIBDIR"))') -l $$(python3 -c 'import sysconfig; print(sysconfig.get_config_var("LDLIBRARY").replace("lib","").replace(".dylib","").replace(".so",""))')" \
		cargo test --release

# Build Docker image only (no deploy)
build:
	cd backend && docker build -f Dockerfile.lambda --platform linux/amd64 -t wave-lambda:latest .

# Full build + deploy to AWS
deploy:
	bash scripts/build-lambdas.sh

# Build only, no push or deploy
deploy-dry:
	bash scripts/build-lambdas.sh --dry-run

# CDK synth (validate templates without deploying)
synth:
	cd infra && npx cdk synth

# Clean build artifacts
clean:
	cd backend && cargo clean
	docker rmi wave-lambda:latest 2>/dev/null || true

# Dashboard dev server
dashboard-dev:
	cd dashboard && pnpm dev

# Dashboard production build
dashboard-build:
	cd dashboard && pnpm build
