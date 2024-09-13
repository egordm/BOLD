<!-- markdownlint-disable -->
<div id="top"></div>
<div align="center">
    <h1>BOLD ⋮</h1>
    <p>
        <b>Knowledge Graph Exploration and Analysis platform</b>
    </p>
</div>
<p align="center">
  <a href="#features">Features</a> •
  <a href="#quick-installation">Quick Installation</a> •
  <a href="https://egordm.github.io/BOLD/">Documentation</a> •
  <a href="#demo">Demo</a>
</p>
<!-- markdownlint-enable -->

## Features
* Seamless import of Knowledge Bases from [LOD Cloud](https://lod-cloud.net/) and [Triply DB](https://triplydb.com/)
* Interact with external SPARQL endpoints
* Create persistent reports and share them with others
* Run SPARQL or pre-built analysis queries
* Explore knowledge graph with interactive visualizations
* Pick unseen terms with fuzzy search

## Demo
A live demo of BOLD can be found [here](https://bold-demo.ml/).

Log in with the following credentials:
* Username: `demo`
* Password: `demodemo`

## Documentation
Visit [BOLD documentation](https://egordm.github.io/BOLD/) for more information.

## Quick Installation
You can quickly spin up a BOLD instance using [Docker](https://www.docker.com/).
Create a `docker-compose.yml` file with the following contents:
```yaml
version: '3'
services:
  bold:
#    image: egordm/ankc:latest
    image: egordm/bold:latest
    build: .
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
Then run `docker compose up -d` to start the container. You can now access BOLD at `http://localhost:8000`.
