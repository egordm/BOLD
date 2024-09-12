# Installation
This document is describes how to install BOLD for typical usage.
If you want to install BOLD for development purposes, we refer you to the [CONTRIBUTING](/BOLD/CONTRIBUTING) section.

The BOLD platform depends on [postgresql](https://www.postgresql.org/) and [blazegraph](https://blazegraph.com/) databases for knowledge graph and state storage.
In the following steps we discuss their setup as well as necessary steps to get BOLD up and running.


### Database Setup
If you have already postgresql and blazegraph databases installed, you can skip this step.
In this step we discuss their setup as docker containers.

* Install [Docker](https://www.docker.com/community-edition) and [Docker Compose](https://docs.docker.com/compose/install/)
* Build the Docker images: `docker-compose build`
* Start the database services: `docker-compose up`

### Pull docker image from docker hub (for demonstration)
If you want to install BOLD for development purposes, we refer you to the [CONTRIBUTING](/BOLD/CONTRIBUTING) section.
This step will pull the latest deployed version from docker hub, which should be a working version of BOLD.

* Build docker images: `docker-compose -f docker-compose.full.yml build`
* Start BOLD and the relevant services: `docker-compose -f docker-compose.full.yml up`
* Open the BOLD web interface: [http://127.0.0.1:8000/](http://localhost:8000/)

### Build docker image from source (for development)
Build docker image from source if you want to run newest or modified version of BOLD.
In this step we describe steps on how to run BOLD as a docker container.

* Build docker images: `docker-compose -f docker-compose.services.yml -f docker-compose.standalone.yml build`
* Start BOLD and the relevant services: `docker-compose -f docker-compose.standalone.yml -f docker-compose.services.yml up`
* Open the BOLD web interface: [http://127.0.0.1:8000/](http://localhost:8000/)

### Enabling GPT code completion
To enable code completion with GPT you need an OpenAI API key. If you don't have one, you can request one at [openai.com](https://openai.com/api/).
Once you have a key, create file `backend/.env` and add the following line:

```
OPENAPI_KEY=<your-key>
```

### Configuration
You can configure your bold installation by creating `backend/.env` file and setting following variables:

* `DEBUG`: Set to `False` to disable debug mode.
* `BLAZEGRAPH_ENABLE`: Set to `False` to disable local dataset downloads and search indexing. This is useful if you don't have a blazegraph instance running.
* `MEILISEARCH_ENDPOINT`: Set to the endpoint of your meilisearch instance. (default: `http://meilisearch:7700`)
* `BLAZEGRAPH_ENDPOINT`: Set to the endpoint of your blazegraph instance. (default: `http://blazegraph:9999`)
* `DJANGO_SUPERUSER_USERNAME`: Set to the username of the superuser. (default: `admin`)
* `DJANGO_SUPERUSER_PASSWORD`: Set to the password of the superuser. (default: `admin`)
* `DJANGO_SUPERUSER_EMAIL`: Set to the email of the superuser.