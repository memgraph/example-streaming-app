const express = require('express');
const app = express();
const port = 3000;

const kafka = require('node-rdkafka');
let kafkaCounter = 0;

const memgraph = require('neo4j-driver');
const driver = memgraph.driver('bolt://localhost:7687', memgraph.auth.basic('', ''));
const session = driver.session();

function createConsumer(onData) {
  // Kafka consumer is not created if group.id is not present.
  const consumer = new kafka.KafkaConsumer({ 'group.id': 'kafka', 'metadata.broker.list': 'localhost:9092' });
  return new Promise((resolve, reject) => {
    consumer.on('ready', () => resolve(consumer)).on('data', onData);
    consumer.connect();
  });
}

async function runConsumer() {
  const consumer = await createConsumer(async ({ key, value, partition, offset }) => {
    // TODO(gitbuda): Handle errors from createConsumer::onData function.
    console.log(`Consumed record with: \
                 \n  - key ${key} \
                 \n  - value ${value} \
                 \n  - partition ${partition} \
                 \n  - offset ${offset}. \
                 \nUpdated total count to ${++kafkaCounter}`);
    const [type, ...rest] = value.toString().split('|');
    if (type === 'node') {
      const [label, uniqueFields, fields] = rest;
      const allFields = uniqueFields.concat(',', fields);
      await session.run(`CREATE (n:${label} {${allFields}});`);
    } else if (type === 'edge') {
      const [n1l, n1u, n2l, n2u, edgeType, edgeFields] = rest;
      await session.run(`MATCH (n1:${n1l} {${n1u}}) MATCH (n2:${n2l} {${n2u}}) \
                         CREATE (n1)-[:${edgeType} {${edgeFields}}]->(n2);`);
    } else {
      throw Error('Unknown message type');
    }
  });
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

app.get('/', (req, res) => {
  console.log('New incoming request...');
  res.send(`Hello streaming data sources! I've received ${kafkaCounter} Kafka messages so far :D`);
});

app.listen(port, () => {
  console.log(`Minimal streaming app listening at http://localhost:${port}`);
  console.log('Ready to roll!');
});
