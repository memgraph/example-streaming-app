#!/bin/bash

# TODO(gitbuda): Replace Memgraph start script with something any user can start.

help_and_exit () {
    echo "USAGE: $0 memgraph|create_trigger"
    exit 1
}

set -Eeuo pipefail
script_dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$script_dir" || help_and_exit

if [ "$#" -ne 1 ]; then
    help_and_exit
fi
action="$1"

case "$action" in
    create_trigger)
        cat < "$script_dir/queries/create_trigger.gql" | mgconsole
    ;;

    drop_trigger)
        cat < "$script_dir/queries/drop_trigger.gql" | mgconsole
    ;;

    memgraph)
        sudo runuser -l memgraph -c "/usr/lib/memgraph/memgraph --query-modules-directory=$script_dir/query_modules --also-log-to-stderr"
    ;;

    *)
        help_and_exit
    ;;
esac
