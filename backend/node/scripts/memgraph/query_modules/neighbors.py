import mgp

neighbors_count = {}


@mgp.read_proc
def store_count(
        _: mgp.ProcCtx,
        start_vertex: mgp.Nullable[mgp.Any],
        neighbors_count: int) -> mgp.Record():
    # TODO(gitbuda): Store neighbors_count inside Memgraph Python query module.
    print(start_vertex.properties["id"])
    print(neighbors_count)
    return mgp.Record()


@mgp.read_proc
def get_count(_: mgp.ProcCtx) -> mgp.Record(id=int, count=int):
    return [mgp.Record(id=key, count=value)
            for key, value in neighbors_count.items()]
