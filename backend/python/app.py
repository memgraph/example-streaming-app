"""This is a generic Kafka Consumer and an example Python code on how to query
Memgraph.
"""
import logging
import csv

from gqlalchemy import Memgraph
from kafka import KafkaConsumer


def process(message: str, db: Memgraph):
    """Prints the number of neighbors."""
    logging.info(f"Received `{message}`")
    payload = next(csv.reader([message], delimiter="|"))
    command, *payload = payload

    if command == "node":
        label, unique_fields, fields = payload
        neighbors = next(
            db.execute_and_fetch(
                f"match (a:{label} {unique_fields}) return a.neighbors as n"
            )
        )["n"]
        if neighbors is None:
            print(
                "The neighbors variable isn't set. "
                "Memgraph triggers are probably not set up properly."
            )
        else:
            print(f"(node:{label} {unique_fields}) has {neighbors} neighbors.")
    elif command == "edge":
        pass
    else:
        raise ValueError(f"Command `{command}` not recognized.")


if __name__ == "__main__":
    logging.basicConfig(
        level=logging.INFO,
        format="%(levelname)s: %(asctime)s %(message)s",
    )

    db = Memgraph(host="localhost", port=7687)
    db.drop_database()

    consumer = KafkaConsumer("topic", bootstrap_servers=["localhost:9092"])
    try:
        for message in consumer:
            message = message.value.decode("utf-8")
            try:
                process(message, db)
            except Exception as error:
                logging.error(f"`{message}`, {repr(error)}")
                continue
    except KeyboardInterrupt:
        pass
