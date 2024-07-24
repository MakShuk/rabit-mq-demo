import { connect } from "amqplib";
import "dotenv/config";

const subscriber = async () => { // подписчик
  try {
    // Устанавливаем соединение с RabbitMQ
    const connection = await connect({
      username: process.env.RABBITMQ_USER,
      password: process.env.RABBITMQ_PASSWORD,
    });
    // Создаем канал для работы с сообщениями
    const channel = await connection.createChannel();
    // Объявляем обменник с именем "test" и типом "topic"
    await channel.assertExchange("test", "topic", { durable: true });
    // Объявляем очередь с именем "my-cool-queue" и параметром durable: true, чтобы очередь была сохранена при перезапуске RabbitMQ
    const queue = await channel.assertQueue("my-cool-queue", { durable: true });
    // Привязываем очередь к обменнику с ключом "my.command"
    channel.bindQueue(queue.queue, "test", "my.command");
    // Подписываемся на получение сообщений из очереди
    channel.consume(
      queue.queue,
      (message) => {
        if (!message) {
          return;
        }
        // Выводим содержимое сообщения в консоль
        console.log(message.content.toString());
        if (message.properties.replyTo) {
          // Если у сообщения указан адрес для ответа, отправляем ответное сообщение
          console.log(message.properties.replyTo);
          channel.sendToQueue(
            message.properties.replyTo,
            Buffer.from("Ответ"),
            { correlationId: message.properties.correlationId }
          );
        }
      },
      {
        noAck: true, // Отключаем подтверждение получения сообщений (acknowledgement)
      }
    );
  } catch (e) {
    console.error(e);
  }
};

console.log('subscriber');
subscriber();