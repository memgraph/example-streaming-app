using System;
using Neo4j.Driver;
using Confluent.Kafka;

namespace memgraph_streaming
{
  class Program
  {
    static void Main(string[] args)
    {
      var cypherNodeCommand = "MERGE (node:{0} {1}) "
        + "SET node += {2}";
      var cypherEdgeCommand = "MERGE (node1:{0} {1}) "
        + "MERGE (node2:{2} {3}) "
        + "MERGE (node1)-[:{4} {5}]->(node2)";

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
          var cypherCommand = "";
          switch (arr[0])
          {
            case "node":
              cypherCommand = string.Format(cypherNodeCommand, arr[1], arr[2], arr[3]);
              break;
            case "edge":
              cypherCommand = string.Format(cypherEdgeCommand, arr[1], arr[2], arr[5], arr[6], arr[3], arr[4]);
              break;
            default:
              throw new InvalidOperationException(
                string.Format("Command '{0}' not supported.", message)
              );
          }
          System.Console.WriteLine(cypherCommand);
          session.WriteTransaction(tx =>
          {
            tx.Run(cypherCommand);
            return "";
          });
          if (arr[0] == "node") {
            var neighbors = session.WriteTransaction(tx =>
            {
              return tx.Run(string.Format("MATCH (node:{0} {1}) RETURN node.neighbors AS neighbors", arr[1], arr[2])).Peek();
            });
            Console.WriteLine(string.Format("Node (node:{0} {1}) has {2} neighbors.", arr[1], arr[2], neighbors.Values["neighbors"]));
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
