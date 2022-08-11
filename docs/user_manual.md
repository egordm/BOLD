# User Manual
This document is aimed at new users who want learn or get an overview of the BOLD platform features.

## Definitions
### Dataset
> A BOLD dataset represents an (imported) RDF dataset. 
>
> The dataset consists of a SPARQL endpoint and a search index.
> Both can point to either a local of a remote resource.
> 
> The datasets can be shared between users and reports.

### Report
> A BOLD report represents a collection of cells that contain SPARQL queries and widgets.
> A report also persists all the query and widget results so that they can be reviewed later.

#### Report Cell
> A report cell contains either SPARQL queries or a configurable widget which generates queries for the database.

### Task
> A BOLD task represents a collection of work that can be scheduled and assigned to a worker.
> Tasks are meant to be used for long-running tasks and run in parallel to avoid blocking the main server.

## Basic Navigation
Navigate through the app by using the sidebar.

* Reports - Page to manage the reports.
* Datasets - Page to manage the datasets.
* Tasks - Page to view scheduled/completed tasks.
* LODC - Browse the LODC datasets
* TriplyDB - Browse the TriplyDB datasets

![Navigation](resources/user_guide/navigation.png)


![Navigation Filtering](resources/user_guide/navigation_filter.gif)

TODO: Image

## Importing Datasets

### Importing from Linked Open Data Cloud

![Import from LODC](resources/user_guide/dataset_create_lodc.gif)

### Importing from Triply DB

![Import from TriplyDB](resources/user_guide/dataset_create_triplydb.gif)

### Importing from RDF files

### Importing from SPARQL endpoints

![Import from Wikidata](resources/user_guide/dataset_create_wikidata.gif)


## Dataset Actions

![Delete Dataset]()

## Creating a Report

![Create Report](resources/user_guide/report_create.gif)

## Report Cell Types

### Code Cell

![Code Cell](resources/user_guide/widget_code.gif)

### Histogram Cell

![Histogram Cell](resources/user_guide/widget_histogram_base.gif)

### Triple Cell

![Triple Cell](resources/user_guide/widget_triple.gif)

### Class Tree Cell

![Class Tree Cell]()

### Properties Cell

![Properties Cell](resources/user_guide/widget_properties.gif)

### Subgraph Cell

![Subgraph Cell](resources/user_guide/widget_subgraph.gif)