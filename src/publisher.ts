import { connect } from "amqplib";
import "dotenv/config";

const publisher = async () => {
  try {
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
      username,
      password,
    });

    // Создаем канал для работы с сообщениями
    const channel = await connection.createChannel();

    // Объявляем обменник с именем из переменной окружения и типом "topic"
    await channel.assertExchange(exchange, "topic", { durable: true });

    // Объявляем очередь с именем из переменной окружения, но без exclusive flag
    const { queue: replyQueueName } = await channel.assertQueue(queue, {
      exclusive: false,
      durable: true,
    });

    // Подписываемся на получение сообщений из replyQueue
    channel.consume(replyQueueName, (message) => {
      if (message) {
        console.log("Получено сообщение:", message.content.toString());
        console.log(
          "Идентификатор корреляции:",
          message.properties.correlationId
        );
        channel.ack(message);
      }
    });

    // Публикуем сообщение в обменник с использованием ROUTING_KEY
    const content = Buffer.from("Работает!");
    const published = channel.publish(exchange, ROUTING_KEY, content, {
      persistent: true,
      replyTo: replyQueueName,
      correlationId: "1",
    });

    if (published) {
      console.log("Сообщение успешно отправлено");
    } else {
      console.log("Не удалось отправить сообщение");
    }

    // Закрываем канал и соединение после короткой задержки
    setTimeout(() => {
      channel.close();
      connection.close();
    }, 500);
  } catch (e) {
    console.error("Произошла ошибка:", e);
  }
};

console.log("Запуск publisher");
publisher();

setInterval(publisher, 5000);
