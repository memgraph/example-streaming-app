sudo zServer.sh start
sudo kafka-server-start.sh /usr/share/kafka/config/server.properties
kafka-topics.sh --create --topic topic --bootstrap-server localhost:9092
