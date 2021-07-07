#!/bin/bash

set -Eeuo pipefail
script_dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

help_and_exit () {
    echo "USAGE: $0 memgraph|initialize|action [memgraph_binary_path]"
    echo "    where action is a filename (excluding extension) from queries dir."
    echo "    default memgraph_binary_path is /usr/lib/memgraph/memgraph"
    exit 1
}

cd "$script_dir" || help_and_exit

if [ "$#" -ne 1 ] && [ "$#" -ne 2 ]; then
    help_and_exit
fi
action="$1"
memgraph_binary_path="/usr/lib/memgraph/memgraph"
if [ "$#" -eq 2 ]; then
    memgraph_binary_path="$2"
fi
memgraph_docker_image="memgraph/memgraph:latest"

execute () {
    action=$1
    if [ -f "$script_dir/queries/$action.cypher" ]; then
        cat < "$script_dir/queries/$action.cypher" | docker run -i --rm --network host --entrypoint mgconsole "$memgraph_docker_image"
    else
        help_and_exit
    fi
}

case "$action" in
    memgraph)
        docker run -it --rm --network host "$memgraph_docker_image"
    ;;

    memgraph_binary)
        sudo runuser -l memgraph -c "$memgraph_binary_path --log-level=DEBUG --also-log-to-stderr"
    ;;

    initialize)
        execute create_index
        execute create_constraint
        execute create_node_trigger
        execute create_update_neighbours_trigger
        exit 0
    ;;

    *)
        execute "$1"
    ;;
esac
