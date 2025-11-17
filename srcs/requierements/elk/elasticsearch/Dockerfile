FROM docker.elastic.co/elasticsearch/elasticsearch:7.17.25

COPY elasticsearch.yml /usr/share/elasticsearch/config/elasticsearch.yml

USER root
RUN chown elasticsearch:elasticsearch /usr/share/elasticsearch/config/elasticsearch.yml

USER elasticsearch

EXPOSE 9200