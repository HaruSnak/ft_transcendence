FROM docker.elastic.co/logstash/logstash:8.15.0

COPY --chown=logstash:logstash pipeline/ /usr/share/logstash/pipeline/
COPY --chown=logstash:logstash config/logstash.yml /usr/share/logstash/config/

CMD ["/usr/share/logstash/bin/logstash"]