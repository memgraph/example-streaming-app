use log::{info, warn, LevelFilter, Record};
use std::io::Write;
use std::thread;

use chrono::prelude::*;
use clap::{App, Arg};
use csv::ReaderBuilder;
use env_logger::fmt::Formatter;
use env_logger::Builder;
use rdkafka::client::ClientContext;
use rdkafka::config::{ClientConfig, RDKafkaLogLevel};
use rdkafka::consumer::stream_consumer::StreamConsumer;
use rdkafka::consumer::{CommitMode, Consumer, ConsumerContext, Rebalance};
use rdkafka::error::KafkaResult;
use rdkafka::message::{Headers, Message};
use rdkafka::topic_partition_list::TopicPartitionList;
use rdkafka::util::get_rdkafka_version;
use rsmgclient::{ConnectParams, Connection, SSLMode};

fn payload_vector(payload: &str) -> Option<Vec<String>> {
    let mut rdr = ReaderBuilder::new()
        .has_headers(false)
        .delimiter(b'|')
        .from_reader(payload.as_bytes());
    for record in rdr.records() {
        match record {
            Ok(row) => {
                return Some(row.iter().map(|s| s.to_string()).collect());
            }
            Err(e) => panic!("{}", e),
        }
    }
    None
}

fn execute_and_fetchall(query: &str, memgraph: &mut Connection) {
    match memgraph.execute(query, None) {
        Ok(_) => {}
        Err(err) => panic!("{}", err),
    };
    match memgraph.fetchall() {
        Ok(_) => {}
        Err(err) => panic!("{}", err),
    };
    match memgraph.commit() {
        Ok(_) => {}
        Err(err) => panic!("{}", err),
    }
}

fn store_memgraph(payload: &Vec<String>, memgraph: &mut Connection) {
    match &payload[..] {
        [command, label, unique_fields, fields] => {
            if command == "node" {
                let add_node_query =
                    format!("merge (a:{} {}) set a += {};", label, unique_fields, fields);
                execute_and_fetchall(&add_node_query, memgraph);
            } else {
                panic!("Got something that looks like node but it's not a node!");
            }
        }
        [command, label1, unique_fields1, edge_type, edge_fields, label2, unique_fields2] => {
            if command == "edge" {
                let add_edge_query = format!(
                    "merge (a:{} {}) merge (b:{} {}) merge (a)-[:{} {}]->(b);",
                    label1, unique_fields1, label2, unique_fields2, edge_type, edge_fields
                );
                execute_and_fetchall(&add_edge_query, memgraph);
            } else {
                panic!("Got something that looks like edge but it's not an edge!");
            }
        }
        _ => {}
    }
}

pub fn setup_logger(log_thread: bool, rust_log: Option<&str>) {
    let output_format = move |formatter: &mut Formatter, record: &Record| {
        let thread_name = if log_thread {
            format!("(t: {}) ", thread::current().name().unwrap_or("unknown"))
        } else {
            "".to_string()
        };

        let local_time: DateTime<Local> = Local::now();
        let time_str = local_time.format("%H:%M:%S%.3f").to_string();
        write!(
            formatter,
            "{} {}{} - {} - {}\n",
            time_str,
            thread_name,
            record.level(),
            record.target(),
            record.args()
        )
    };

    let mut builder = Builder::new();
    builder
        .format(output_format)
        .filter(None, LevelFilter::Info);

    rust_log.map(|conf| builder.parse_filters(conf));

    builder.init();
}

// A context can be used to change the behavior of producers and consumers by adding callbacks
// that will be executed by librdkafka.
// This particular context sets up custom callbacks to log rebalancing events.
struct CustomContext;

impl ClientContext for CustomContext {}

impl ConsumerContext for CustomContext {
    fn pre_rebalance(&self, rebalance: &Rebalance) {
        info!("Pre rebalance {:?}", rebalance);
    }

    fn post_rebalance(&self, rebalance: &Rebalance) {
        info!("Post rebalance {:?}", rebalance);
    }

    fn commit_callback(&self, result: KafkaResult<()>, _offsets: &TopicPartitionList) {
        info!("Committing offsets: {:?}", result);
    }
}

// A type alias with your custom consumer can be created for convenience.
type LoggingConsumer = StreamConsumer<CustomContext>;

async fn consume(brokers: &str, group_id: &str, topics: &[&str], memgraph: &mut Connection) {
    let context = CustomContext;

    let consumer: LoggingConsumer = ClientConfig::new()
        .set("group.id", group_id)
        .set("bootstrap.servers", brokers)
        .set("enable.partition.eof", "false")
        .set("session.timeout.ms", "6000")
        .set("enable.auto.commit", "true")
        //.set("statistics.interval.ms", "30000")
        //.set("auto.offset.reset", "smallest")
        .set_log_level(RDKafkaLogLevel::Debug)
        .create_with_context(context)
        .expect("Consumer creation failed");

    consumer
        .subscribe(&topics.to_vec())
        .expect("Can't subscribe to specified topics");

    loop {
        match consumer.recv().await {
            Err(e) => warn!("Kafka error: {}", e),
            Ok(m) => {
                let payload = match m.payload_view::<str>() {
                    None => "",
                    Some(Ok(s)) => s,
                    Some(Err(e)) => {
                        warn!("Error while deserializing message payload: {:?}", e);
                        ""
                    }
                };
                info!("key: '{:?}', payload: '{}', topic: {}, partition: {}, offset: {}, timestamp: {:?}",
                      m.key(), payload, m.topic(), m.partition(), m.offset(), m.timestamp());
                if let Some(headers) = m.headers() {
                    for i in 0..headers.count() {
                        let header = headers.get(i).unwrap();
                        info!("  Header {:#?}: {:?}", header.0, header.1);
                    }
                }

                if let Some(command) = payload_vector(payload) {
                    store_memgraph(&command, memgraph);
                }

                consumer.commit_message(&m, CommitMode::Async).unwrap();
            }
        };
    }
}

#[tokio::main]
async fn main() {
    let matches = App::new("consumer example")
        .version(option_env!("CARGO_PKG_VERSION").unwrap_or(""))
        .about("Simple command line consumer")
        .arg(
            Arg::with_name("brokers")
                .short("b")
                .long("brokers")
                .help("Broker list in kafka format")
                .takes_value(true)
                .default_value("localhost:9092"),
        )
        .arg(
            Arg::with_name("group-id")
                .short("g")
                .long("group-id")
                .help("Consumer group id")
                .takes_value(true)
                .default_value("example_consumer_group_id"),
        )
        .arg(
            Arg::with_name("log-conf")
                .long("log-conf")
                .help("Configure the logging format (example: 'rdkafka=trace')")
                .takes_value(true),
        )
        .arg(
            Arg::with_name("topics")
                .short("t")
                .long("topics")
                .help("Topic list")
                .takes_value(true)
                .multiple(true)
                .required(true),
        )
        .get_matches();

    setup_logger(true, matches.value_of("log-conf"));

    let (version_n, version_s) = get_rdkafka_version();
    info!("rd_kafka_version: 0x{:08x}, {}", version_n, version_s);

    let topics = matches.values_of("topics").unwrap().collect::<Vec<&str>>();
    let brokers = matches.value_of("brokers").unwrap();
    let group_id = matches.value_of("group-id").unwrap();

    // Make a connection to the database.
    let connect_params = ConnectParams {
        host: Some(String::from("localhost")),
        sslmode: SSLMode::Disable,
        ..Default::default()
    };
    let mut connection = match Connection::connect(&connect_params) {
        Ok(c) => c,
        Err(err) => panic!("{}", err),
    };

    consume(brokers, group_id, &topics, &mut connection).await
}
