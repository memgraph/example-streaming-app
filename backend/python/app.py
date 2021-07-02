"""
This is a generic Kafka Consumer that will enable you to store data from Kafka
to Memgraph.
The data pushed to Kafka has to be in the following format:
    command|label|unique_fields|fields
    command|label1|unique_fields1|edge_type|edge_fields|label2|unique_fields2

command - string: "edge", or "node"
label - string: type(s) of a node e.g. "Person", or "Machine:Vehicle:Car"
edge_type - string: type of an edge e.g. "CONNECTED_WITH"
fields - string in form of a json/python dictionary representing the
         properties of a node or edge:
    `{age: 53}` or `{id: 4, name: "hero", alive: true}`
"""
import csv
import logging

from gqlalchemy import Memgraph
from kafka import KafkaConsumer


def process(message: str, db: Memgraph):
    """Takes graph database `db` and a string message in the following format:

    command|label|unique_fields|fields
    command|label1|unique_fields1|edge_type|edge_fields|label2|unique_fields2

        command - string: "edge", or "node"
        label - string: type of a node e.g. "Person" or "Machine:Vehicle:Car"
        edge_type - string: type of an edge e.g. "CONNECTED_WITH"
        fields - string in form of a json/python dictionary representing the
                properties of a node or edge:
            `{age: 53}` or `{id: 4, name: "hero", alive: true}`

    Throws a ValueError if the command isn't recognised.
    """
    payload = next(csv.reader([message], delimiter='|'))
    command, *payload = payload

    if command == 'node':
        label, unique_fields, fields = payload
        db.execute_query(
            f'merge (a:{label} {unique_fields}) '
            f'set a += {fields}'
        )
    elif command == 'edge':
        (
            label1,
            unique_fields1,
            edge_type,
            edge_fields,
            label2,
            unique_fields2,
        ) = payload
        db.execute_query(
            f'merge (a:{label1} {unique_fields1}) '
            f'merge (b:{label2} {unique_fields2}) '
            f'merge (a)-[:{edge_type} {edge_fields}]->(b)'
        )
    else:
        raise ValueError(f'Command `{command}` not recognized.')
    logging.info(f'`{message}`, Successfully entered {command} in Memgraph.')


if __name__ == '__main__':
    logging.basicConfig(
        filename='info.log',
        encoding='utf-8',
        level=logging.INFO,
        format='%(levelname)s: %(asctime)s %(message)s'
    )
    db = Memgraph(host='localhost', port=7687)
    db.drop_database()
    consumer = KafkaConsumer(
        'topic',
        bootstrap_servers=['localhost:9092']
    )
    try:
        for message in consumer:
            message = message.value.decode('utf-8')
            try:
                process(message, db)
            except Exception as error:
                logging.error(f'`{message}`, {repr(error)}')
                continue

    except KeyboardInterrupt:
        pass
