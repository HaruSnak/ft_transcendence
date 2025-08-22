FROM docker.elastic.co/elasticsearch/elasticsearch:8.15.0

COPY elasticsearch.yml /usr/share/elasticsearch/config/elasticsearch.yml

USER root
RUN chown -R elasticsearch:elasticsearch /usr/share/elasticsearch/data && \
    chown -R elasticsearch:elasticsearch /usr/share/elasticsearch/logs && \
    chown -R elasticsearch:elasticsearch /usr/share/elasticsearch/config

USER elasticsearch

EXPOSE 9200 9300

CMD ["elasticsearch"]