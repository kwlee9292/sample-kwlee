package main.java;

import java.io.IOException;

public class KafkaMain {
    public static void main(String[] args) throws IOException {
        String topicName = args[1];
        String brokers = args[2];

        switch(args[0]){
            case "produce":
                Producer.produce(brokers, topicName);
                break;
            case "consume":
                Consumer.consume(brokers, topicName);
                break;
            default:
                System.out.println("Wrong arguments");
                break;
        }
        System.exit(0);
    }
}