FROM bitnami/spark:3
RUN curl https://stardog-spark-connector.s3.amazonaws.com/stardog-spark-connector-1.0.1.jar --output /opt/bitnami/spark/jars/stardog-spark-connector-1.0.1.jar
USER root
RUN mkdir /opt/bitnami/spark/stardog-graph-analytics && chown -R 1001:1001 /opt/bitnami/spark/stardog-graph-analytics
USER 1001