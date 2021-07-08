# Minimal Streaming App 🚀🚀

<p align="center">
    <a href="https://github.com/memgraph/minimal-streaming-app/blob/main/LICENSE" alt="Licence">
        <img src="https://img.shields.io/github/license/memgraph/minimal-streaming-app" />
    </a>
    <a href="https://github.com/memgraph/minimal-streaming-app" alt="Languages">
        <img src="https://img.shields.io/github/languages/count/memgraph/minimal-streaming-app" />
    </a>
    <a href="https://github.com/memgraph/minimal-streaming-app/stargazers" alt="Stargazers">
        <img src="https://img.shields.io/github/stars/memgraph/minimal-streaming-app?style=social" />
    </a>
</p>

This repository serves as a point of reference when developing a streaming application with [Memgraph](https://memgraph.com) and a message broker such as [Kafka](https://kafka.apache.org).

![drawing](https://i.imgur.com/BOLVF8t.png)

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
- [go](./backend/go)
- [c#](./backend/cs)

## How does it work *exactly*
### KafkaProducer
The *KafkaProducer* in [./kafka/producer](./kafka/producer) creates nodes with a label *Person* that are connected with edges of type *CONNECTED_WITH*.
In this repository we provide a static producer that reads entries from a file and a stream producer that produces entries every *X* seconds.

### Backend
The *backend* takes a message at a time from kafka, parses it with a csv parser as a line, converts it into a `openCypher` query and sends it to Memgraph.
After storing a node in Memgraph the backend asks Memgraph how many adjacent nodes does it have and prints it to the terminal.

### Memgraph
You can think of Memgraph as two separate components: a storage engine and an algorithm execution engine.
First we create a [trigger](./memgraph/queries/create_trigger.cypher): an algorithm that will be run every time a node is inserted.
This algorithm calculates and updates the number of neighbors of each affected node after every query is executed.
