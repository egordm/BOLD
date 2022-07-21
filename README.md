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
  <a href="#installation">Installation</a> •
</p>
<!-- markdownlint-enable -->

## Features
TODO

## Installation
The BOLD platform depends on [postgresql](https://www.postgresql.org/) and [stardog](https://www.stardog.com/) databases for knowledge graph storage.
In the following steps we discuss their setup as well as necessary steps to get BOLD up and running.

### Database Setup
If you have already postgresql and stardog databases installed, you can skip this step.
In this step we discuss their setup as docker containers.

* Install [Docker](https://www.docker.com/community-edition) and [Docker Compose](https://docs.docker.com/compose/install/)
* Build the Docker images: `docker-compose build`
* Start the database services: `docker-compose up`

### Docker setup
If you want to install BOLD for development purposes, we refer you to the [next section](#development-setup).
In this step we describe steps on how to run BOLD as a docker container.'

* Build docker images: `dc -f docker-compose.yml -f docker-compose.standalone.yml build`
* Start BOLD and the relevant services: `dc -f docker-compose.yml -f docker-compose.standalone.yml up`
* Open the BOLD web interface: [http://127.0.0.1:8000/](http://localhost:8000/)

### Development setup
For development purposes, you need to have a working python and rust installation.

* Install [Rust](https://www.rust-lang.org/tools/install) and [Python](https://www.python.org/)
* Build BOLD cli tools: `make release-tools`
* Install [Poetry](https://python-poetry.org/docs/#installation)
* Install necessary dependencies: `poetry install`
* Run worker application: `make start_worker`
* Run backend server: `make start_backend`
* Open the BOLD web interface: [http://localhost:8000/](http://localhost:8000/)


## System Requirements
The server requirements are mostly bound by the Stardog database.

You can choose to not use the Stardog database, but you will not be able to import the full datasets (only external SPARQL endpoints are allowed).

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