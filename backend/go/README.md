## How it works
1. A [kafka](https://kafka.apache.org) consumer is started and messages are accepted in a [special format](../../kafka).
2. A memgraph client connects to [Memgraph](https://memgraph.com/) on port 7687.
3. The consumer script parses the messages and inserts data from them to Memgraph using [Cypher](https://opencypher.org/) via the [bolt protocol](https://en.wikipedia.org/wiki/Bolt_\(network_protocol\)).

## How to run

1. Create go repository `go mod init memgraph.com/streaming-app`
2. Install dependencies `go mod tidy`
3. Run kafka on port 9092, [instructions](../../kafka)
4. Run memgraph on port 7687, [instructions](../../memgraph)
5. Run the app with `go run app.go`
6. Run a producer, [instructions](../../kafka/producer)
