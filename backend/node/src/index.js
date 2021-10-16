/**
 * This is a generic Kafka Consumer + an example express app.
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
        return node.properties['id'] + ': ' + node.properties['neighbors'];
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
