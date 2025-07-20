FROM docker.elastic.co/logstash/logstash:8.15.0

COPY pipeline/ /usr/share/logstash/pipeline/
COPY config/logstash.yml /usr/share/logstash/config/

USER root
RUN chown -R logstash:logstash /usr/share/logstash
USER logstash

CMD ["/usr/share/logstash/bin/logstash"]