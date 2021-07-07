package main

import (
	"context"
	"fmt"
	"strings"

	"github.com/neo4j/neo4j-go-driver/v4/neo4j"
	"github.com/segmentio/kafka-go"
)

func main() {
	db_auth := neo4j.BasicAuth("", "", "")
	driver, err := neo4j.NewDriver("bolt://localhost:7687", db_auth)
	if err != nil {
		panic(err)
	}
	defer driver.Close()

	cypherNodeCommand := "MERGE (node:%s %s) " +
		"SET node += %s"
	cypherEdgeCommand := "MERGE (node1:%s %s)" +
		"MERGE (node2:%s %s) " +
		"MERGE (node1)-[:%s %s]->(node2)"

	kafkaReader := kafka.NewReader(kafka.ReaderConfig{
		Brokers:  []string{"localhost:9092"},
		Topic:    "topic",
		MinBytes: 0,
		MaxBytes: 10e6,
	})
	defer kafkaReader.Close()
	for {
		kafkaMessage, err := kafkaReader.ReadMessage(context.Background())
		if err != nil {
			fmt.Println("nothing to read...")
			break
		}
		message := string(kafkaMessage.Value)
		cypherCommand := ""
		arr := strings.Split(message, "|")

		switch arr[0] {
		case "node":
			cypherCommand = fmt.Sprintf(cypherNodeCommand, arr[1], arr[2], arr[3])
		case "edge":
			cypherCommand = fmt.Sprintf(cypherEdgeCommand, arr[1], arr[2], arr[5], arr[6], arr[3], arr[4])
		}
		if cypherCommand == "" {
			fmt.Println("breaking")
			break
		}
		err = runCypherCommand(driver, cypherCommand)
		if err != nil {
			panic(err)
		}
	}
}

func runCypherCommand(driver neo4j.Driver, cypherCommand string) error {
	session := driver.NewSession(neo4j.SessionConfig{})
	defer session.Close()
	_, err := session.WriteTransaction(func(tx neo4j.Transaction) (interface{}, error) {
		_, err := tx.Run(cypherCommand, map[string]interface{}{})
		return nil, err
	})
	return err
}
