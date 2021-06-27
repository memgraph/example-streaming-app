#!/bin/bash

# TODO(gitbuda): Replace Memgraph start script with something any user can start.

help_and_exit () {
    echo "USAGE: $0 memgraph|action"
    echo "    where action is a filename (excluding extension) from queries dir."
    exit 1
}

set -Eeuo pipefail
script_dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$script_dir" || help_and_exit

if [ "$#" -ne 1 ]; then
    help_and_exit
fi
action="$1"

if [ -f "$script_dir/queries/$action.gql" ]; then
    cat < "$script_dir/queries/$action.gql" | mgconsole
    exit 0
fi

case "$action" in
    memgraph)
        sudo runuser -l memgraph -c "/usr/lib/memgraph/memgraph --query-modules-directory=$script_dir/query_modules --log-level=DEBUG --also-log-to-stderr"
    ;;

    *)
        help_and_exit
    ;;
esac
