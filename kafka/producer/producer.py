from kafka import KafkaProducer
from time import sleep

producer = KafkaProducer(bootstrap_servers=['localhost:9092'])

with open('input.csv') as f:
    for line in f.read().split('\n')[:-1]:
        producer.send('topic', line.encode('utf-8'))
        producer.flush()
        sleep(0.2)
