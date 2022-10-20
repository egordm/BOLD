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
> Note: StarDog is free but requires a license. Request a free license at [stardog.com](https://www.stardog.com/download-free//).
> Place the license at `dev/stardog/stardog-license-key.bin` in the project root.

You can quickly spin up a BOLD instance using [Docker](https://www.docker.com/).
Create a `docker-compose.yml` file with the following contents:
```yaml
version: '3'
services:
  bold:
    image: egordm/bold:latest
    ports:
      - 8000:8000
    volumes:
      - ./storage:/storage
      - ./backend/.env:/app/.env
    networks:
      - bold-net
    links:
      - postgres
      - stardog
    depends_on:
      - postgres
      - stardog

  postgres:
    image: egordm/postgres-multidb:latest
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

  stardog:
    image: stardog/stardog:7.9.1-java11-preview
    userns_mode: host
    ports:
      - 5820:5820
    volumes:
      - data-stardog:/var/opt/stardog
      - ./dev/stardog/stardog-license-key.bin:/var/opt/stardog/stardog-license-key.bin
      - ./storage/import:/var/data/import
      - ./storage/downloads:/var/data/downloads
      - ./storage/export:/var/data/export
    environment:
      STARDOG_SERVER_JAVA_ARGS: "-Xmx8g -Xms8g -XX:MaxDirectMemorySize=12g"
    networks:
      - bold-net

volumes:
  data-stardog:
  data-postgres:

networks:
  bold-net:
```
Then run `docker-compose up -d` to start the container. You can now access BOLD at `http://localhost:8000`.
