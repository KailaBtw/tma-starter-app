.PHONY: format

fix:
	poetry run black .
	poetry run isort .
	poetry run ruff check --fix .

check:
	poetry run black --check .
	poetry run isort --check-only .
	poetry run ruff check .
	