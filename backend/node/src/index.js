/**
 * This is a generic Kafka Consumer that will enable you to store data from
 * Kafka to Memgraph.
 *
 * The data pushed to Kafka has to be in the following format:
 *   command|label|unique_fields|fields
 *   command|label1|unique_fields1|edge_type|edge_fields|label2|unique_fields2
 *
 * command - string: "edge", or "node"
 * label - string: type(s) of a node e.g. "Person", or "Machine:Vehicle:Car"
 * edge_type - string: type of an edge e.g. "CONNECTED_WITH"
 * fields - string in form of a json/python dictionary representing the
 *          properties of a node or edge:
 *   `{age: 53}` or `{id: 4, name: "hero", alive: true}`
 */
const express = require('express');
const app = express();
const port = 3000;

const kafka = require('kafka-node');
let kafkaCounter = 0;

const memgraph = require('neo4j-driver');
const driver = memgraph.driver('bolt://localhost:7687', memgraph.auth.basic('', ''));
process.on('SIGINT', async () => {
  await driver.close();
  process.exit(0);
});

function createConsumer(onData) {
  return new Promise((resolve, reject) => {
    const client = new kafka.KafkaClient({ kafkaHost: 'localhost:9092' });
    const consumer = new kafka.Consumer(client, [{ topic: 'topic' }]);
    consumer.on('message', onData);
    resolve(consumer);
  });
}

/**
 * Adds catch to the wrapped function.
 * Convenient to use when the error just has to be console logged.
 */
const consoleErrorWrap =
  (fn) =>
  (...args) =>
    fn(...args).catch((err) => {
      console.error(`${err}`);
    });

async function runConsumer() {
  await createConsumer(
    consoleErrorWrap(async ({ key, value, partition, offset }) => {
      console.log(`Consumed record with: \
                 \n  - key ${key} \
                 \n  - value ${value} \
                 \n  - partition ${partition} \
                 \n  - offset ${offset}. \
                 \nUpdated total count to ${++kafkaCounter}`);
      const [type, ...rest] = value.toString().split('|');
      const session = driver.session();
      if (type === 'node') {
        const [label, uniqueFields, fields] = rest;
        await session.run(`MERGE (n:${label} ${uniqueFields}) SET n += ${fields};`);
      } else if (type === 'edge') {
        const [n1l, n1u, edgeType, edgeFields, n2l, n2u] = rest;
        await session.run(`MERGE (n1:${n1l} ${n1u}) MERGE (n2:${n2l} ${n2u}) \
                         MERGE (n1)-[:${edgeType} ${edgeFields}]->(n2);`);
      } else {
        throw new Error('Unknown message type.');
      }
    }),
  );
}

runConsumer().catch((err) => {
  console.error(`Something went wrong: ${err}`);
  process.exit(1);
});

/**
 * Adds catch to the wrapped function.
 * Convenient to use with Express callbacks.
 */
const expressErrorWrap =
  (fn) =>
  (...args) =>
    fn(...args).catch(args[2]);

app.get(
  '/',
  expressErrorWrap(async (req, res) => {
    const session = driver.session();
    const allNodes = await session.run(`MATCH (n) RETURN n;`);
    const allNodesStr = allNodes.records
      .map((r) => {
        const node = r.get('n');
        return node.properties['id'] + ': ' + node.properties['neighbours'];
      })
      .join(', ');
    res.send(`<h3>Hello streaming data sources!</h3>\
           <p>I've received ${kafkaCounter} Kafka messages so far :D</p>\
           <p>All neighbors count: <b>${allNodesStr}</b></p>`);
  }),
);

app.listen(port, () => {
  console.log(`Minimal streaming app listening at http://localhost:${port}`);
  console.log('Ready to roll!');
});
