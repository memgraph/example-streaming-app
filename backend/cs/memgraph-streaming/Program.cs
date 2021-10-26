using System;
using Neo4j.Driver;
using Confluent.Kafka;

namespace memgraph_streaming
{
  class Program
  {
    static void Main(string[] args)
    {
      using var driver = GraphDatabase.Driver("bolt://localhost:7687", AuthTokens.None);
      using var session = driver.Session();

      var config = new ConsumerConfig
      {
        BootstrapServers = "localhost:9092",
        GroupId = "consumers",
      };
      using var consumer = new ConsumerBuilder<Ignore, string>(config).Build();
      consumer.Subscribe("topic");
      try {
        while (true)
        {
          var message = consumer.Consume().Message.Value;
          System.Console.WriteLine("received message: " + message);
          var arr = message.Split("|");
          if (arr[0] == "node") {
            var neighbors = session.WriteTransaction(tx =>
            {
              return tx.Run(string.Format("MATCH (node:{0} {1}) RETURN node.neighbors AS neighbors", arr[1], arr[2])).Peek();
            });
            if (neighbors != null) {
              Console.WriteLine(string.Format("Node (node:{0} {1}) has {2} neighbors.", arr[1], arr[2], neighbors.Values["neighbors"]));
            } else {
              Console.WriteLine("Neighbors number is null. Triggers are not defined or not yet executed.");
            }
          }
        }
      }
      finally
      {
        // this has to be called despite the using statement, supposedly
        consumer.Close();
      };
    }
  }
}
