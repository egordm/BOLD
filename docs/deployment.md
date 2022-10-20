# Deployment
It is advised to deploy BOLD using preconfigured docker containers.

> Note: StarDog is free but requires a license. Request a free license at [stardog.com](https://www.stardog.com/download-free//).
> Place the license at `dev/stardog/stardog-license-key.bin` in the project root.

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

Create a `backend/.env` file with the following contents:
```env
OPENAPI_KEY="(optional) key for the openai api"
DEBUG=off
STARDOG_ENABLE=on
```

Change `STARDOG_ENABLE` to `off` if you don't want to use stardog.

Then run `docker-compose up -d` to start the container. You can now access BOLD at `http://localhost:8000`.


## System Requirements
The server requirements are mostly bound by the Stardog database.

You can choose to not use the Stardog database, but you will not be able to import the full datasets (only external SPARQL endpoints are allowed).
Moreover you can decide to run Stardog on a different machine.

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