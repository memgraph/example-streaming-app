#!/bin/bash

set -Eeuo pipefail
script_dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

help_and_exit () {
    echo "USAGE: $0 zookeeper|kafka|topic|producer|consumer|offsets"
    exit 1
}

cd "$script_dir" || help_and_exit

if [ "$#" -ne 1 ]; then
    help_and_exit
fi
action="$1"
kafka_dir="$script_dir/kafka"
if [ ! -d "$kafka_dir" ]; then
    echo "Downloading kafka..."
    git clone git@github.com:apache/kafka.git "$kafka_dir"
    echo "Building kafka..."
    cd "$kafka_dir" || help_and_exit
    ./gradlew jar -PscalaVersion=2.13.6
fi
zookeeper_config="$kafka_dir/config/zookeeper.properties"
kafka_config="$kafka_dir/config/server.properties"
kafka_endpoint="${KAFKA_ENDPOINT:-localhost:9092}"
topic_name="${KAFKA_TOPIC:-topic}"

case "$action" in
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

    offsets)
        cd "$kafka_dir/bin" || help_and_exit
        ./kafka-run-class.sh kafka.tools.GetOffsetShell --topic "$topic_name" --bootstrap-server "$kafka_endpoint"
    ;;

    *)
        help_and_exit
    ;;
esac
