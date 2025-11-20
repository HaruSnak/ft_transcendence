FROM docker.elastic.co/kibana/kibana:7.17.25

COPY kibana.yml /usr/share/kibana/config/kibana.yml
COPY create-dashboards.sh /create-dashboards.sh

USER root
# Install jq from static binary
RUN curl -Lo /usr/local/bin/jq https://github.com/jqlang/jq/releases/download/jq-1.6/jq-linux64 && \
	chmod +x /usr/local/bin/jq && \
	chown kibana:kibana /usr/share/kibana/config/kibana.yml && \
	chmod +x /create-dashboards.sh

USER kibana

EXPOSE 5601
