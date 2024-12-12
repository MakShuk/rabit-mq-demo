import { connect } from "amqplib";
import * as dotenv from "dotenv";

const message = {
  email: "testuser10@test.com",
  password: "testpassword2",
};
let counter = 0;
async function sendMessage() {
  try {
    counter++;
    const username = process.env.AMQP_USER;
    const password = process.env.AMQP_PASSWORD;
    const queue = process.env.AMQP_QUEUE;
    const exchange = process.env.AMQP_EXCHANGE;
    const ROUTING_KEY = "account.register.command";

    if (!username || !password || !queue || !exchange) {
      throw new Error(
        "Необходимо указать AMQP_USER, AMQP_PASSWORD, AMQP_QUEUE и AMQP_EXCHANGE в файле .env"
      );
    }

    // Устанавливаем соединение с RabbitMQ
    const connection = await connect({
      username: process.env.AMQP_USER,
      password: process.env.AMQP_PASSWORD,
    });
    const channel = await connection.createChannel();

    // Объявляем обмен типа "topic"
    await channel.assertExchange(exchange, "topic", { durable: true });

    // Функция для отправки сообщения
    const send = () => {
      // Преобразуем объект в JSON-строку, затем в Buffer
      const buffer = Buffer.from(JSON.stringify(message));

      channel.publish(exchange, ROUTING_KEY, buffer, {
        contentType: "application/json",
      });

      console.log(
        `${counter}: отправлено на ${ROUTING_KEY}: ${JSON.stringify(message)}`
      );
    };

    const handleResponse = (msg: any) => {
      if (msg) {
        console.log(`${counter}: Получено сообщение:`);

        // Обработка полей (fields)
        console.log("Fields:");
        console.log("  Consumer Tag:", msg.fields.consumerTag);
        console.log("  Delivery Tag:", msg.fields.deliveryTag);
        console.log("  Redelivered:", msg.fields.redelivered);
        console.log("  Exchange:", msg.fields.exchange);
        console.log("  Routing Key:", msg.fields.routingKey);

        // Обработка свойств (properties)
        console.log("Properties:");
        console.log("  Content Type:", msg.properties.contentType);
        console.log("  Content Encoding:", msg.properties.contentEncoding);
        console.log("  Headers:", JSON.stringify(msg.properties.headers));
        console.log("  Delivery Mode:", msg.properties.deliveryMode);
        // Добавьте другие свойства по необходимости

        // Обработка содержимого (content)
        if (msg.content) {
          if (msg.properties.contentType === "application/json") {
            try {
              const jsonContent = JSON.parse(msg.content.toString());
              console.log("Content (JSON):", jsonContent);
              // Здесь вы можете добавить специфическую обработку JSON
            } catch (error) {
              console.error("Ошибка при разборе JSON:", error);
            }
          } else {
            console.log("Content (Buffer):", msg.content);
            console.log("Content (String):", msg.content.toString());
          }
        }

        // Подтверждение обработки сообщения
        channel.ack(msg);
      }
    };

    // Начинаем слушать ответы
    channel.consume(queue, handleResponse);

    // Отправляем сообщение сразу и затем каждые 10 секунд
    send();

    // Отправляем сообщение каждые 10 секунд
    //setInterval(send, 10000);

    setTimeout(send, 10000);

    console.log("Отправитель запущен. Нажмите CTRL+C для завершения.");
  } catch (error) {
    console.error("Ошибка:", error);
  }
}

dotenv.config();
sendMessage();
