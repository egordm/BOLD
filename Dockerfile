FROM rust:1.62.0-slim AS builder-tools

WORKDIR /code
COPY tools/ /code

RUN cargo build --release


FROM node:16-slim AS builder-frontend

RUN #yarn set version berry

WORKDIR /code
COPY frontend/package.json frontend/yarn.lock frontend/.yarnrc.yml /code/
COPY frontend/.yarn .yarn
RUN yarn install --immutable

COPY frontend/ /code
RUN yarn build

FROM python:3.10-slim AS base

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl libpq-dev build-essential

RUN apt-get update && apt-get install -y --no-install-recommends \
    supervisor

COPY dev/docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

WORKDIR /app
RUN curl -sSL https://raw.githubusercontent.com/python-poetry/poetry/master/get-poetry.py | python -
ENV PATH="/root/.poetry/bin:/root/.poetry/env:$PATH"

COPY pyproject.toml poetry.lock ./
RUN poetry install --no-dev --no-interaction --no-ansi

COPY backend /app

COPY --from=builder-tools /code/target/release/bold-cli /app/backend/bin/bold-cli
RUN rm -rf /app/frontend/static
COPY --from=builder-frontend /code/build /app/frontend/static

RUN mkdir /storage
ENV STORAGE_DIR=/storage \
    STARDOG_HOST=stardog \
    DB_HOST=postgres

EXPOSE 8000

CMD ["/usr/bin/supervisord"]

