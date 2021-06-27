import mgp

# TODO(gitbuda): Fix trigger+store_count because transitive counts are wrong.

all_neighbors_count = {}


@mgp.read_proc
def store_count(
        _: mgp.ProcCtx,
        start_vertex: mgp.Nullable[mgp.Any],
        neighbors_count: int) -> mgp.Record():
    all_neighbors_count[start_vertex.properties["id"]] = neighbors_count
    return mgp.Record()


@mgp.read_proc
def get_count(_: mgp.ProcCtx) -> mgp.Record(id=int, count=int):
    return [mgp.Record(id=key, count=value)
            for key, value in all_neighbors_count.items()]
