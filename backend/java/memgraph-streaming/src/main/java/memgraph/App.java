package memgraph;

import java.time.Duration;
import java.util.Arrays;
import java.util.Properties;
import org.apache.kafka.clients.consumer.ConsumerRecords;
import org.apache.kafka.clients.consumer.KafkaConsumer;
import org.apache.kafka.common.serialization.LongDeserializer;
import org.apache.kafka.common.serialization.StringDeserializer;
import org.neo4j.driver.Driver;
import org.neo4j.driver.GraphDatabase;
import org.neo4j.driver.Result;
import org.neo4j.driver.Session;
import org.neo4j.driver.Transaction;
import org.neo4j.driver.TransactionWork;

public class App {
  public static void main(String[] args) throws Exception {

    try (Driver driver = GraphDatabase.driver("bolt://localhost:7687");
         Session session = driver.session();
         KafkaConsumer<String, String> consumer = getKafkaConsumer()) {
      consumer.subscribe(Arrays.asList("topic"));
      while (true) {
        ConsumerRecords<String, String> records =
            consumer.poll(Duration.ofMillis(100));

        if (records.count() > 0) {
          records.forEach(record -> {
            String[] command = record.value().split("\\|");
            session.writeTransaction(new TransactionWork<String>() {
              @Override
              public String execute(Transaction tx) {
                switch (command[0]) {
                case "node":
                  Result result = tx.run(String.format(
                      "MATCH (node:%s %s) RETURN node.neighbors AS neighbors",
                      command[1], command[2]));
                  System.out.printf("Node (node:%s %s) has %d neighbors.\n",
                                    command[1], command[2],
                                    result.single().get(0).asInt());
                  break;
                }
                System.out.printf("%s\n", record.value());
                return null;
              }
            });
          });
        }
      }
    }
  }

  public static KafkaConsumer<String, String> getKafkaConsumer() {
    Properties props = new Properties();
    props.put("bootstrap.servers", "localhost:9092");
    props.put("key.deserializer", LongDeserializer.class.getName());
    props.put("value.deserializer", StringDeserializer.class.getName());
    props.put("group.id", "MemgraphStreaming");
    return new KafkaConsumer<String, String>(props);
  }
}
