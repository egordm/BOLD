# Contributing Guidelines
If you are a first time contributor, start by reading [this fantastic guide](https://opensource.guide/how-to-contribute/).

## [Read the docs](https://egordm.github.io/BOLD/)

### Get familliar with the stack
#### Backend:
- [Django](https://docs.djangoproject.com/en/4.1/)
- [Celery](https://github.com/celery/celery/)
- [Stardog](https://docs.stardog.com/)

#### Frontend:
- [React](https://reactjs.org/)
- [React Reouter](https://reactrouter.com/)
- [MUI](https://mui.com/material-ui/getting-started/overview/)

## Development setup
For development purposes, you need to have a working python and rust installation.

* Set up local databases (See [detabase setup](/installation#database-setup))
* Install [Rust](https://www.rust-lang.org/tools/install) and [Python](https://www.python.org/)
* Build BOLD cli tools: `make release-tools`
* Install [Poetry](https://python-poetry.org/docs/#installation)
* Install necessary dependencies: `poetry install`
* Run worker application: `make start_worker`
* Run backend server: `make start_backend`
* Run docs server: `make start_docs`
* Open the BOLD web interface: [http://localhost:8000/](http://localhost:8000/)


## Follow the style guidelines
Follow the code style enforced by tools such as black and eslint.
For markdown files, markdownlint must be followed.

Install [pre-commit](https://pre-commit.com/) hooks.
```shell
pre-commit install
```

Tests must pass
If you are adding features write tests.

For further information proceed to [Architechture guide](/architecture).