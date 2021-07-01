const express = require('express');
const app = express();
const port = 3000;

const kafka = require('node-rdkafka');
let kafkaCounter = 0;

const memgraph = require('neo4j-driver');
const driver = memgraph.driver('bolt://localhost:7687', memgraph.auth.basic('', ''));

function createConsumer(onData) {
  // Kafka consumer is not created if group.id is not present.
  const consumer = new kafka.KafkaConsumer({ 'group.id': 'kafka', 'metadata.broker.list': 'localhost:9092' });
  return new Promise((resolve, reject) => {
    consumer.on('ready', () => resolve(consumer)).on('data', onData);
    consumer.connect();
  });
}

// Adds catch to the wrapped function.
// Convenient to use when the error just has to be console logged.
const consoleErrorWrap =
  (fn) =>
  (...args) =>
    fn(...args).catch((err) => {
      console.error(`${err}`);
    });

async function runConsumer() {
  const consumer = await createConsumer(
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
  consumer.subscribe(['node_minimal']);
  consumer.consume();
  process.on('SIGINT', async () => {
    console.log('\nDisconnecting consumer...');
    consumer.disconnect();
    await driver.close();
    process.exit(0);
  });
}

runConsumer().catch((err) => {
  console.error(`Something went wrong: ${err}`);
  process.exit(1);
});

// Adds catch to the wrapped function.
// Convenient to use with Express callbacks.
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
