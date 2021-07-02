# How it works
Downloads and runs Kafka

# How to run
```bash
bash run.sh
```
# Special format
Information put to kafka must be in a special format:
```
command|label|unique_fields|fields
command|label1|unique_fields1|edge_type|edge_fields|label2|unique_fields2
```

- command - string: `edge`, or `node`
- label - string: type(s) of a node e.g. `Person`, or `Machine:Vehicle:Car`
- edge\_type - string: type of an edge e.g. `CONNECTED\_WITH`
- fields - string in form of a json/python dictionary representing the
         properties of a node or edge:
    `{age: 53}` or `{id: 4, name: "hero", alive: true}`
