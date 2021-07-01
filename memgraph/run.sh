#!/bin/bash

set -Eeuo pipefail
script_dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

help_and_exit () {
    echo "USAGE: $0 memgraph|action [memgraph_binary_path]"
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

if [ -f "$script_dir/queries/$action.gql" ]; then
    cat < "$script_dir/queries/$action.gql" | mgconsole
    exit 0
fi

case "$action" in
    memgraph)
        sudo runuser -l memgraph -c "$memgraph_binary_path --log-level=DEBUG --also-log-to-stderr"
    ;;

    *)
        help_and_exit
    ;;
esac
