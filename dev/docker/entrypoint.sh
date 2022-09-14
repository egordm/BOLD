#!/bin/bash

echo "Waiting for postgres..."

while ! nc -z postgres 5432; do
  sleep 0.1
done

echo "PostgreSQL started"

poetry run python manage.py createcachetable
poetry run python manage.py migrate
/usr/bin/supervisord