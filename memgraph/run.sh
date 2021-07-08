#!/bin/bash

set -Eeuo pipefail
script_dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

script_help_and_exit () {
    echo "USAGE: $0 memgraph|init|action"
    echo "    memgraph - starts an instance of Memgraph and runs init"
    echo "    init - creates indexes, constraints and triggers on a running"
    echo "           Memgraph instance"
    echo "    action - takes a filename (excluding the extension) from the"
    echo "             queries directory. The file contains a query that will"
    echo "             be executed in the running Memgraph instance"
    exit 1
}

memgraph_help_and_exit () {
    echo "Please start memgraph with: 'bash run.sh memgraph'"
    exit 1
}

cd "$script_dir" || script_help_and_exit

if [ "$#" -ne 1 ] && [ "$#" -ne 2 ]; then
    script_help_and_exit
fi
action="$1"
memgraph_binary_path="/usr/lib/memgraph/memgraph"
if [ "$#" -eq 2 ]; then
    memgraph_binary_path="$2"
fi
memgraph_docker_image="memgraph/memgraph:latest"
memgraph_docker_name="memgraph_minimal_streaming_app"

execute () {
    action=$1
    if [ -f "$script_dir/queries/$action.cypher" ]; then
        cat < "$script_dir/queries/$action.cypher" | docker run -i --rm --network host --entrypoint mgconsole "$memgraph_docker_image" || memgraph_help_and_exit
    else
        script_help_and_exit
    fi
}

init () {
    execute create_index
    execute create_constraint
    execute create_node_trigger
    execute create_update_neighbors_trigger
}

case "$action" in
    memgraph)
        docker run -d --rm --network host --name "$memgraph_docker_name" "$memgraph_docker_image"
        echo "Starting memgraph..."
        sleep 1
        init
    ;;

    memgraph_binary)
        sudo runuser -l memgraph -c "$memgraph_binary_path --log-level=DEBUG --also-log-to-stderr"
    ;;

    init)
        init
    ;;

    *)
        execute "$1"
    ;;
esac
