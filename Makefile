
start_backend:
	@echo "Starting backend"
	python backend/manage.py runserver

start_worker:
	@echo "Starting worker"
	cd backend && celery -A backend worker -l info

start_frontend:
	@echo "Starting frontend"
	cd frontend && yarn start