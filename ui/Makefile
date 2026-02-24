.PHONY: bash fix check test test-watch logs

bash:
	docker exec -it tma_frontend bash

fix:
	docker exec -it tma_frontend npm run fix

check:
	docker exec -it tma_frontend npm run check

test:
	docker exec -it tma_frontend npm run test:verbose

test-watch:
	docker exec -it tma_frontend npm run test:watch

logs:
	docker logs -f tma_frontend