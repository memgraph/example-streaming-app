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
        messages = [
            f'edge|{label1}|{fields1}|{edge_type}|{edge_fields}|{label2}|{fields2}',
            f'edge|{label2}|{fields2}|{edge_type}|{edge_fields}|{label1}|{fields1}',
        ]
        for message in messages:
            print(message)
            producer.send(
                'topic',
                message.encode('utf-8')
            )
            print(message)
    producer.send(
        'topic',
        f'node|{label1}|{fields1}|{{}}'.encode('utf-8')
    )
    print(f'node|{label1}|{fields1}|{{}}')
    producer.flush()
    sleep(4)
