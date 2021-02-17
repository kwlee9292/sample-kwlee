import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.apache.kafka.clients.consumer.ConsumerRecords;
import org.apache.kafka.clients.consumer.KafkaConsumer;

import java.util.Arrays;
import java.util.Properties;

public class Consumer {
    public static int consume(String brokers, String topicName) {
        // Create Consumer
        KafkaConsumer<String, String> consumer;
        // Configure
        Properties properties = new Properties();
        properties.setProperty("bootstrap.servers", brokers);
        properties.setProperty("key.deserializer", "org.apache.kafka.common.serialization.StringDeserializer");
        properties.setProperty("value.deserializer", "org.apache.kafka.common.serialization.StringDeserializer");
        properties.setProperty("group.id", "consumer_group");
        properties.setProperty("auto.offset.reset", "earliest");

        consumer = new KafkaConsumer<>(properties);

        consumer.subscribe(Arrays.asList(topicName));

        while (true) {
            ConsumerRecords<String, String> records = consumer.poll(500); // wait for 500ms
            for (ConsumerRecord<String, String> record : records) {
                System.out.println(record);
                System.out.println(record.value());
            }
        }
    }
}
