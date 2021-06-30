import random
from time import sleep
from itertools import count

from kafka import KafkaProducer


producer = KafkaProducer(bootstrap_servers=['localhost:9092'])

label1 = label2 = "Person"
edge_type = "CONNECTED_WITH"
edge_fields = '{}'
for i in count():
    fields1 = f'{{id: {i}}}'
    for j in random.sample(range(0, i), random.randint(0, min(i, 20))):
        fields2 = f'{{id: {j}}}'
        producer.send(
            f'{label1}|{fields1}|{edge_type}|{edge_fields}|{label2}|{fields2}'
        )
        producer.send(
            f'{label2}|{fields2}|{edge_type}|{edge_fields}|{label1}|{fields1}'
        )
with open('input.csv') as f:
    for line in f.read().split('\n')[:-1]:
        producer.send('topic', line.encode('utf-8'))
        producer.flush()
        sleep(0.1)
