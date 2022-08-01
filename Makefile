
start_backend:
	@echo "Starting backend"
	python backend/manage.py runserver

start_worker:
	@echo "Starting worker"
	cd backend && celery -A backend worker -l info

start_frontend:
	@echo "Starting frontend"
	cd frontend && yarn start

release-tools:
	cd tools && cargo build --release
	cp tools/target/release/bold-cli backend/backend/bin/bold-cli

release-frontend:
	cd frontend && yarn build
	rm -rf backend/frontend/static
	cp -r frontend/build backend/frontend/static
