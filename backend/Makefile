.PHONY: format

bash:
	docker exec -it tma_backend bash

fix:
	docker exec -it tma_backend bash scripts/fix.sh

check:
	docker exec -it tma_backend bash scripts/check.sh

test:
	docker exec -it tma_backend poetry run pytest -v

test-cov:
	docker exec -it tma_backend poetry run pytest --cov


	