/opt/stardog/bin/stardog-admin db create -o search.enabled=true search.index.properties.included=http:\/\/www.w3.org\/2000\/01\/rdf-schema\#label strict.parsing=false index.statistics.chains.enabled=false -n wikidata_law /var/data/import/Law_2021.nt.gz
/opt/stardog/bin/stardog-admin db create -o search.enabled=true search.index.properties.included=http:\/\/www.w3.org\/2000\/01\/rdf-schema\#label strict.parsing=false index.statistics.chains.enabled=false -n wikidata_law /var/data/import/latest-truthy.nt.bz2
/opt/stardog/bin/stardog-admin db create -o strict.parsing=false -n dbpedia_16g /var/data/downloads/DBpedia.ttl.gz
/opt/stardog/bin/stardog-admin db create -o strict.parsing=false -n dbpedia_triply /var/data/downloads/dbpedia_small.ttl.gz

# https://docs.stardog.com/graph-analytics/setup#running-graph-analytics
dc exec spark bin/spark-submit --master "spark://localhost:7077" /opt/bitnami/spark/jars/stardog-spark-connector-1.0.1.jar algorithm.name=PageRank stardog.server=http://stardog:5820 stardog.database=wikidata_law output.property=example:analytics:rank output.graph=example:analytics:graph

dc exec spark bin/spark-submit --master "spark://6a65595502ea:7077" /opt/bitnami/spark/jars/stardog-spark-connector-1.0.1.jar algorithm.name=ConnectedComponents stardog.server=http://stardog:5820 stardog.database=wikidata_law output.property=example:analytics:cc output.graph=example:analytics:graph
# NOTE: make sure stardog-graph-analytics exists


stardog data export myDb export.ttl.gz

# Regex to remove all lines with translations for languages other than English
\@((?!en).*)\s\.
rg --pcre2 -v '@((?!en).*)\s\.' latest-truthy.nt > latest-truthy.nt.new


celery -A backend call loading.tasks.lodc_kg_download --args='["Biop"]'



dc exec stardog bash -c "/opt/stardog/bin/stardog query execute --format=TSV --limit=10000 --run-as admin -p admin yago /var/data/export/sub.sparql > /var/data/export/sub.csv"



https://yago-knowledge.org/data/yago4/en/2020-02-24/yago-wd-class.nt.gz
https://yago-knowledge.org/data/yago4/en/2020-02-24/yago-wd-facts.nt.gz
https://yago-knowledge.org/data/yago4/en/2020-02-24/yago-wd-full-types.nt.gz
https://yago-knowledge.org/data/yago4/en/2020-02-24/yago-wd-labels.nt.gz
https://yago-knowledge.org/data/yago4/en/2020-02-24/yago-wd-sameAs.nt.gz
https://yago-knowledge.org/data/yago4/en/2020-02-24/yago-wd-schema.nt.gz
https://yago-knowledge.org/data/yago4/en/2020-02-24/yago-wd-shapes.nt.gz
https://yago-knowledge.org/data/yago4/en/2020-02-24/yago-wd-simple-types.nt.gz