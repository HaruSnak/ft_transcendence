FROM docker.elastic.co/logstash/logstash:7.17.25

COPY --chown=logstash:logstash pipeline/ /usr/share/logstash/pipeline/
COPY --chown=logstash:logstash config/logstash.yml /usr/share/logstash/config/

CMD ["/usr/share/logstash/bin/logstash"]