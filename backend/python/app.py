"""
This is a generic Kafka Consumer that will enable you to store data from Kafka
to Memgraph.
The data pushed to Kafka has to be in the following format:
    node|label|unique_fields|fields
    edge|label1|unique_fields1|edge_type|edge_fields|label2|unique_fields2

label - a string: `Person`
edge_type - a string: `CONNECTED_WITH`
fields - a string in form of a json/python dictionary:
    `{age: 53}` or `{id: 4, name: "hero", alive: true}`
"""
import csv
import logging

from gqlalchemy import Memgraph
from kafka import KafkaConsumer


def process(message, db):
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
    db = Memgraph()
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
