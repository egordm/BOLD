/opt/stardog/bin/stardog-admin db create -o search.enabled=true search.index.properties.included=http:\/\/www.w3.org\/2000\/01\/rdf-schema\#label strict.parsing=false index.statistics.chains.enabled=false -n wikidata_law /var/data/import/Law_2021.nt.gz
/opt/stardog/bin/stardog-admin db create -o search.enabled=true search.index.properties.included=http:\/\/www.w3.org\/2000\/01\/rdf-schema\#label strict.parsing=false index.statistics.chains.enabled=false -n wikidata_law /var/data/import/latest-truthy.nt.bz2

# https://docs.stardog.com/graph-analytics/setup#running-graph-analytics
dc exec spark bin/spark-submit --master "spark://localhost:7077" /opt/bitnami/spark/jars/stardog-spark-connector-1.0.1.jar algorithm.name=PageRank stardog.server=http://stardog:5820 stardog.database=wikidata_law output.property=example:analytics:rank output.graph=example:analytics:graph

dc exec spark bin/spark-submit --master "spark://6a65595502ea:7077" /opt/bitnami/spark/jars/stardog-spark-connector-1.0.1.jar algorithm.name=ConnectedComponents stardog.server=http://stardog:5820 stardog.database=wikidata_law output.property=example:analytics:cc output.graph=example:analytics:graph
# NOTE: make sure stardog-graph-analytics exists


stardog data export myDb export.ttl.gz

# Regex to remove all lines with translations for languages other than English
\@((?!en).*)\s\.
rg --pcre2 -v '@((?!en).*)\s\.' latest-truthy.nt > latest-truthy.nt.new


celery -A backend call loading.tasks.lodc_kg_download --args='["Biop"]'

