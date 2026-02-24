.PHONY: build test deploy clean

build:
	maturin build --release

test:
	cargo test
	python -m pytest tests/ -v
	python -m doctest python/handler.py
	python -m doctest python/voice_handler.py

clean:
	cargo clean
	rm -rf target/ *.whl

deploy:
	cd ../infra && npx cdk deploy WaveSubmissionStack
