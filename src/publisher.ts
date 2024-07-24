import { connect } from "amqplib";
import "dotenv/config";

const publisher = async () => {// издатель
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
    // Объявляем очередь с пустым именем, которая будет использоваться для получения ответов
    const replyQueue = await channel.assertQueue("", { exclusive: true });
    // Подписываемся на получение сообщений из replyQueue
    channel.consume(replyQueue.queue, (message) => {
      // Выводим содержимое сообщения в консоль
      console.log(message?.content.toString());
      // Выводим идентификатор корреляции сообщения в консоль
      console.log(message?.properties.correlationId);
    });
    // Публикуем сообщение в обменник "test" с ключом "my.command"
    // и указываем replyTo и correlationId для получения ответа
    channel.publish("test", "my.command", Buffer.from("Работает!"), {
      replyTo: replyQueue.queue,
      correlationId: "1",
    });
  } catch (e) {
    // В случае ошибки выводим ее в консоль
    console.error(e);
  }
};

console.log('publisher');
publisher();
