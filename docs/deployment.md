# Deployment


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