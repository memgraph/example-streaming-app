import mgp
import csv


@mgp.transformation
def transform(
    messages: mgp.Messages,
) -> mgp.Record(query=str, parameters=mgp.Nullable[mgp.Map]):
    """Process messages in the following format:

    command|label|unique_fields|fields
    command|label1|unique_fields1|edge_type|edge_fields|label2|unique_fields2

        command - string: "edge", or "node"
        label - string: type of a node e.g. "Person" or "Machine:Vehicle:Car"
        edge_type - string: type of an edge e.g. "CONNECTED_WITH"
        fields - string in form of a json/python dictionary representing the
                properties of a node or edge:
                    `{age: 53}` or `{id: 4, name: "hero", alive: true}`
    """
    result_queries = []

    for i in range(messages.total_messages()):
        message = messages.message_at(i)
        payload_as_str = message.payload().decode("utf-8")
        payload = next(csv.reader([payload_as_str], delimiter="|"))
        command, *payload = payload

        if command == "node":
            label, unique_fields, fields = payload
            result_queries.append(
                mgp.Record(
                    query=f"merge (a:{label} {unique_fields}) set a += {fields}",
                    parameters=None,
                )
            )
        elif command == "edge":
            (
                label1,
                unique_fields1,
                edge_type,
                edge_fields,
                label2,
                unique_fields2,
            ) = payload
            result_queries.append(
                mgp.Record(
                    query=f"merge (a:{label1} {unique_fields1}) "
                    f"merge (b:{label2} {unique_fields2}) "
                    f"merge (a)-[:{edge_type} {edge_fields}]->(b)",
                    parameters=None,
                )
            )

    return result_queries
