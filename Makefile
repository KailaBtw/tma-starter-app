.PHONY: format


# backend
backend-check:
	$(MAKE) -C backend check

backend-fix:
	$(MAKE) -C backend fix

backend-test:
	$(MAKE) -C backend test


# mobile
mobile-check:
	$(MAKE) -C mobile check

mobile-fix:
	$(MAKE) -C mobile fix

mobile-test:
	$(MAKE) -C mobile test


# frontend
ui-check:
	$(MAKE) -C ui check

ui-fix:
	$(MAKE) -C ui fix

ui-test:
	$(MAKE) -C ui test



