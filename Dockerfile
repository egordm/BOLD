FROM rust:1.62.0-slim AS builder-tools

WORKDIR /code
COPY tools/ /code

RUN cargo build --release


FROM node:16-slim AS builder-frontend

WORKDIR /code
COPY frontend/package.json frontend/yarn.lock frontend/.yarnrc.yml /code/
COPY frontend/.yarn .yarn
RUN yarn install --immutable

COPY frontend/ /code
RUN yarn build

FROM python:3.10-slim AS base

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl libpq-dev build-essential netcat supervisor

WORKDIR /app
RUN curl -sSL https://install.python-poetry.org | python3 -
ENV PATH="/root/.local/bin:/root/.local/env:$PATH"

COPY pyproject.toml poetry.lock ./
RUN poetry install --no-dev --no-interaction --no-ansi

COPY backend /app

COPY --from=builder-tools /code/target/release/bold-cli /app/backend/bin/bold-cli
RUN rm -rf /app/frontend/static
COPY --from=builder-frontend /code/build /app/frontend/static
RUN poetry run python manage.py collectstatic --no-input

RUN mkdir /storage
ENV STORAGE_DIR=/storage \
    STARDOG_HOST=stardog \
    DB_HOST=postgres

COPY dev/docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY dev/docker/entrypoint.sh /app/entrypoint.sh

EXPOSE 8000

CMD ["sh", "/app/entrypoint.sh"]

