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
		arr := strings.Split(message, "|")

		if arr[0] == "node" {
			result, err := runCypherCommand(
				driver,
				fmt.Sprintf("MATCH (node:%s %s) RETURN node.neighbors", arr[1], arr[2]),
			)
			if err != nil {
				panic(err)
			}
			fmt.Printf("Node (node:%s %s) has %d neighbors.\n", arr[1], arr[2], result)
		}
	}
}

func runCypherCommand(driver neo4j.Driver, cypherCommand string) (interface{}, error) {
	session := driver.NewSession(neo4j.SessionConfig{})
	defer session.Close()
	result, err := session.WriteTransaction(func(tx neo4j.Transaction) (interface{}, error) {
		result, err := tx.Run(cypherCommand, map[string]interface{}{})
		if err != nil {
			return nil, err
		}
		if result.Next() {
			return result.Record().Values[0], nil
		}

		return nil, result.Err()
	})
	return result, err
}
