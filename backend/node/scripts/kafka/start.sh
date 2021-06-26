#!/bin/bash

# TODO(gitbuda): Replace Kafka start script with something any user can start.

help_and_exit () {
    echo "USAGE: $0 kafka_git_clone_dir build|zookeeper"
    exit 1
}

set -Eeuo pipefail
script_dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$script_dir" || help_and_exit

if [ "$#" -ne 1 ]; then
    help_and_exit
fi
action="$1"
kafka_dir="$script_dir/kafka"
if [ ! -d "$kafka_dir" ]; then
    git clone git@github.com:apache/kafka.git "$kafka_dir"
fi
zookeeper_config="$kafka_dir/config/zookeeper.properties"
kafka_config="$kafka_dir/config/server.properties"
kafka_endpoint="localhost:9092"
topic_name="node_minimal"

case "$action" in
    build)
        cd "$kafka_dir" || help_and_exit
        ./gradlew jar -PscalaVersion=2.13.6
    ;;

    consumer)
        cd "$kafka_dir/bin" || help_and_exit
        ./kafka-console-consumer.sh --topic "$topic_name" --from-beginning --bootstrap-server "$kafka_endpoint"
    ;;

    kafka)
        cd "$kafka_dir/bin" || help_and_exit
        ./kafka-server-start.sh "$kafka_config"
    ;;

    producer)
        cd "$kafka_dir/bin" || help_and_exit
        ./kafka-console-producer.sh --topic "$topic_name" --bootstrap-server "$kafka_endpoint"
    ;;

    topic)
        cd "$kafka_dir/bin" || help_and_exit
        ./kafka-topics.sh --create --topic "$topic_name" --bootstrap-server "$kafka_endpoint" --partitions 1 --replication-factor 1
    ;;

    zookeeper)
        cd "$kafka_dir/bin" || help_and_exit
        ./zookeeper-server-start.sh "$zookeeper_config"
    ;;

    *)
        help_and_exit
    ;;
esac
