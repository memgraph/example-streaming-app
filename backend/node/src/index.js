const express = require('express');
const app = express();
const port = 3000;
const kafka = require('node-rdkafka');

function createConsumer(onData) {
  // Kafka consumer is not created if group.id is not present.
  const consumer = new kafka.KafkaConsumer({ 'group.id': 'kafka', 'metadata.broker.list': 'localhost:9092' });
  return new Promise((resolve, reject) => {
    consumer.on('ready', () => resolve(consumer)).on('data', onData);
    consumer.connect();
  });
}

let kafkaCounter = 0;

async function runConsumer() {
  const consumer = await createConsumer(({ key, value, partition, offset }) => {
    console.log(`Consumed record with: \
                 \n  - key ${key} \
                 \n  - value ${value} \
                 \n  - partition ${partition} \
                 \n  - offset ${offset}. \
                 \nUpdated total count to ${++kafkaCounter}`);
  });
  consumer.subscribe(['node_minimal']);
  consumer.consume();
  process.on('SIGINT', () => {
    console.log('\nDisconnecting consumer...');
    consumer.disconnect();
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
