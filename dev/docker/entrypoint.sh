#!/bin/bash

echo "Waiting for postgres..."

while ! nc -z $SQL_HOST $SQL_PORT; do
  sleep 0.1
done

echo "PostgreSQL started"

gunicorn backend.wsgi:application --bind 0.0.0.0:8000