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

## Acknowledgements

This work was supported by [SIDN Fonds](https://www.sidnfonds.nl/).

This project is tested with BrowserStack
