# How it works

Downloads and runs Memgraph.

## How to run and init Memgraph?

The following command starts Memgraph docker container in the background +
creates required indexes, constraints, and triggers.

```bash
bash run.sh memgraph
```

## NOTES

Memgraph transform script inside `query_modules` can NOT be called `kafka.py`
because of a conflict with the `KAFKA` clause.
