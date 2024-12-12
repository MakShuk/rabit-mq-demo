import amqp from "amqplib";
import winston from "winston";
import dotenv from "dotenv";

// Загрузка переменных окружения
dotenv.config();

// Конфигурация из переменных окружения
const username = process.env.AMQP_USER;
const password = process.env.AMQP_PASSWORD;
const queue = process.env.AMQP_QUEUE;
const exchange = process.env.AMQP_EXCHANGE;
const ROUTING_KEY = "account.register.command";

// Проверка наличия необходимых переменных окружения
if (!username || !password || !queue || !exchange) {
  console.error("Missing required environment variables");
  process.exit(1);
}

// Настройка логгера
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: "rabbitmq-routes.log" }),
  ],
});

async function setupRabbitMQ() {
  try {
    if (!username || !password || !queue || !exchange) {
      console.error("Missing required environment variables");
      process.exit(1);
    }

    const connection = await amqp.connect(
      `amqp://${username}:${password}@localhost:5672`
    );
    const channel = await connection.createChannel();

    // Объявление exchange
    await channel.assertExchange(exchange, "topic", { durable: true });

    // Объявление очереди
    await channel.assertQueue(queue, { durable: true });

    // Привязка очереди к exchange
    await channel.bindQueue(queue, exchange, ROUTING_KEY);

    // Функция для отправки сообщения
    async function sendMessage(message: string) {
      if (!username || !password || !queue || !exchange) {
        console.error("Missing required environment variables");
        process.exit(1);
      }

      channel.publish(exchange, ROUTING_KEY, Buffer.from(message));
      logger.info(
        `Sent message to exchange: ${exchange}, routing key: ${ROUTING_KEY}`
      );
    }

    // Функция для приема сообщений
    function receiveMessages() {
      
      if (!username || !password || !queue || !exchange) {
        console.error("Missing required environment variables");
        process.exit(1);
      }

      channel.consume(queue, (msg) => {
        if (msg) {
          logger.info(
            `Received message from exchange: ${exchange}, routing key: ${msg.fields.routingKey}`
          );
          console.log(`Message content: ${msg.content.toString()}`);
          channel.ack(msg);
        }
      });
    }

    // Пример использования
    await sendMessage("Hello, RabbitMQ!");
    receiveMessages();

    logger.info("RabbitMQ client setup completed");
  } catch (error) {
    logger.error("Error setting up RabbitMQ client", error);
  }
}

setupRabbitMQ();
