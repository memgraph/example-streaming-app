# Minimal Streaming App

This repository serves as a point of reference when developing a streaming application with [Memgraph](https://memgraph.com) and a message broker such as [Kafka](https://kafka.apache.org).

![drawing](https://i.imgur.com/wL9swCR.png)

*KafkaProducer* represents the source of your data.
That can be transactions, queries, metadata or something different entirely.
In this minimal example we propose using a [special string format](./kafka) that is easy to parse.
The data is sent from the *KafkaProducer* to *Kafka* under a topic aptly named *topic*.
The *Backend* implements a *KafkaConsumer*.
It takes data from *Kafka*, parses it and sends it to *Memgraph* for graph analysis, feature extraction or storage.

## Installation
Install [Kafka](./kafka) and [Memgraph](./memgraph) using the instructions in the homonymous directories.
Then choose a programming language from the list of supported languages and follow the instructions given there.

### List of supported programming languages
- [node](./backend/node)
- [python](./backend/python)
- [java](./backend/java)
