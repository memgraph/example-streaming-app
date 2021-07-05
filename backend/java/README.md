## How it works
1. A [kafka](https://kafka.apache.org) consumer is started and messages are accepted in a [special format](../../kafka).
2. A memgraph client connects to [Memgraph](https://memgraph.com/) on port 7687.
3. The consumer script parses the messages and inserts data from them to Memgraph using [Cypher](https://opencypher.org/) via the [bolt protocol](https://en.wikipedia.org/wiki/Bolt_\(network_protocol\)).

## How to run

1. Install java and maven
2. Position yourself within the project or open with a java IDE
3. Compile the project within an IDE or with `mvn compile`
4. Run kafka on port 9092, [instructions](../../kafka)
5. Run memgraph on port 7687, [instructions](../../memgraph)
6. Start the application within an IDE or with `mvn exec:java -Dexec.mainClass=memgraph.App`
7. Run a producer, [instructions](../../kafka/producer)
