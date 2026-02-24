.PHONY: format


# backend
check-backend:
	$(MAKE) -C backend check

fix-backend:
	$(MAKE) -C backend fix

test-backend:
	$(MAKE) -C backend test


# mobile
check-mobile:
	$(MAKE) -C mobile check

fix-mobile:
	$(MAKE) -C mobile fix

test-mobile:
	$(MAKE) -C mobile test


# frontend
check-ui:
	$(MAKE) -C ui check

fix-ui:
	$(MAKE) -C ui fix

test-ui:
	$(MAKE) -C ui test



# logs
logs-backend:
	$(MAKE) -C backend logs

logs-frontend:
	$(MAKE) -C ui logs

# database
logs-db:
	$(MAKE) -C database logs


