# How it works

Downloads and runs Kafka.

## How to run Kafka

Since the current Kafka version requires Zookeeper, both Zookeeper and Kafka
have to be up and running. The following commands are blocking, so please run
them in different shells.

Once Kafka is successfully started, we also need to create a topic. The script
will create a new topic named `topic` or fail if the topic is already there.

```bash
bash run.sh zookeeper
bash run.sh kafka
bash run.sh topic
```

If you would like to test Kafka quickly, you could use the following commands
to start console producer and consumer. NOTE: This part is not required.

```bash
bash run.sh producer
bash run.sh consumer
```

## Special format

Information put to kafka must be in a special format:

```txt
command|label|unique_fields|fields
command|label1|unique_fields1|edge_type|edge_fields|label2|unique_fields2
```

- command - string: `edge`, or `node`
- label - string: type(s) of a node e.g. `Person`, or `Machine:Vehicle:Car`
- edge\_type - string: type of an edge e.g. `CONNECTED\_WITH`
- fields - string in form of a json/python dictionary representing the
         properties of a node or edge:
    `{age: 53}` or `{id: 4, name: "hero", alive: true}`
