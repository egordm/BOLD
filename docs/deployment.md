# Deployment
It is advised to deploy BOLD using preconfigured docker containers.

Create a `docker-compose.yml` file with the following contents:
```yaml
version: '3'
services:
  bold:
    image: egordm/ankc:latest
    environment:
      BLAZEGRAPH_ENABLE: on
      BLAZEGRAPH_ENDPOINT: http://blazegraph:9999
      MEILISEARCH_ENDPOINT: http://meilisearch:7700
      MEILISEARCH_MASTER_KEY: masterKey
    ports:
      - 8001:8000
    volumes:
      - ./storage:/storage
      - ./backend/.env:/app/.env
    networks:
      - bold-net
    links:
      - postgres
      - blazegraph
      - meilisearch
    depends_on:
      - postgres
      - blazegraph
      - meilisearch

  postgres:
    build: ./dev/postgres
    environment:
      POSTGRES_USER: root
      POSTGRES_PASSWORD: helloworld
      POSTGRES_MULTIPLE_DATABASES: test,develop,production
    ports:
      - 5432:5432
    volumes:
      - data-postgres:/var/lib/postgresql/data
    networks:
      - bold-net

  blazegraph:
    image: openkbs/blazegraph-docker
    ports:
      - 9999:9999
    volumes:
      - data-blazegraph:/var/lib/blazegraph/data
      - ./storage:/storage
      - ./dev/blazegraph:/opt/blazegraph-custom
    healthcheck:
      test: [ "CMD", "curl", "-f", "http://localhost:9999" ]
      interval: 3s
      timeout: 5s
      retries: 3
    networks:
      - bold-net

  meilisearch:
    image: getmeili/meilisearch:v1.7.2
    ports:
      - 7700:7700
    environment:
      MEILI_NO_ANALYTICS: true
      MEILI_MASTER_KEY: "masterKey"
    volumes:
      - data-meilisearch:/meili_data
    networks:
      - bold-net


volumes:
  data-postgres:
  data-blazegraph:
  data-meilisearch:

networks:
  bold-net:
```

Create a `backend/.env` file with the following contents:
```env
OPENAPI_KEY="(optional) key for the openai api"
DEBUG=off
STARDOG_ENABLE=on
```

Change `BLAZEGRAPH_ENABLE` to `off` if you don't want to use Blazegraph.

Then run `docker-compose up -d` to start the container. You can now access BOLD at `http://localhost:8000`.


## System Requirements
The server requirements are mostly bound by the Blazegraph database.

You can choose to not use the Blazegraph database, but you will not be able to import the full datasets (only external SPARQL endpoints are allowed).
Moreover you can decide to run Blazegraph on a different machine.

* You must have twice the amount of storage your datasets require. (YAGO is 60Gb thus 120Gb)
* You must allocate at least 2 cores for the server.
* Memory requirements are found below:

| Number of Triples | Total System Memory |
|-------------------|---------------------|
| 100 million       | 8G                  |
| 1 billion         | 32G                 |
| 10 billion        | 128G                |
| 25 billion        | 256G                |
| 50 billion        | 512G                |