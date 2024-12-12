import { connect } from "amqplib";
import * as dotenv from "dotenv";

 const customLog = (message: string) =>
   console.log(`[${new Date().toISOString()}] ${message}`);

async function listenMessages() {
  try {
    dotenv.config();

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

    // Объявляем очередь (если её нет) и привязываем её к обменнику с ключом маршрутизации
    await channel.assertQueue(queue, { durable: true });
    await channel.bindQueue(queue, exchange, ROUTING_KEY);

    // Настраиваем слушателя для очереди
    console.log(
      `Ожидание сообщений в очереди ${queue}. Для выхода нажмите CTRL+C.`
    );

    channel.consume(
      queue,
      (msg) => {
        if (msg !== null) {
          const messageContent = msg.content.toString();
          customLog(`Получено сообщение: ${messageContent}`);

          // Здесь вы можете обрабатывать полученные данные, например, выполнять логику регистрации пользователя.

          // Подтверждаем получение сообщения
          channel.ack(msg);
        }
      },
      { noAck: false }
    );
  } catch (error) {
    console.error("Ошибка:", error);
  }
}

listenMessages();
