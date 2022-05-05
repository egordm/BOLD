MATCH (resource:Resource) DETACH DELETE resource;

CALL n10s.graphconfig.init();

CALL n10s.graphconfig.set({
  keepLangTag: false,

});

CREATE CONSTRAINT n10s_unique_uri ON (r:Resource) ASSERT r.uri IS UNIQUE

CALL n10s.rdf.import.fetch(
  "file:///home/egordm/.config/Neo4j Desktop/Application/relate-data/dbmss/dbms-972a219f-16da-4dac-886c-c9d9ab12a0c9/import/Law_2021.nt.gz",
  "..."
);

# Clean graph
MATCH (n)
REMOVE n.uri
RETURN n

MATCH (n)
REMOVE n.uri
RETURN n