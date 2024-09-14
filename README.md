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
Copy `docker-compose.full.yml` to `docker-compose.yml`.
It provides all services that BOLD needs and runs BOLD itself.
Use it by running `docker compose up -d`, you should see several services starting.

Once they have all started, you should be able to access BOLD at `http://localhost:8000`.

Log in with the following credentials:
* Username: `admin`
* Password: `admin`

## Development Installation
Copy `docker-compose.services.yml` to `docker-compose.yml`.
Use it by running `docker compose up -d`, you should see several services starting.
They will run in the background, the application will only work if they are running which you can check with `docker ps`.
After following the preparation steps below once, you should be able to run `make start_dev` to start developing the project.

### Prepare the Front-end
Go into the `./frontend` folder.
Make sure yarn is installed so you can do a `yarn install`.

Checkout the avaiable scripts in the `package.json`, you should be able to run `yarn start`
It should start a development server and open the webbrowser with the frontend.
Make sure the backend is also running, see the preparation for it below.

### Prepare the Back-end
Go into the `./backend` folder.
Make sure you have poetry for python installed, as you can install the project dependencies with it.
Run `poetry install` to make it install the packages listed in `pyproject.toml`.
It creates a virtual environment in which the dependencies are installed.

## Acknowledgements

This work was supported by [SIDN Fonds](https://www.sidnfonds.nl/).

This project is tested with BrowserStack
