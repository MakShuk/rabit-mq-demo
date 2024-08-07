// Импортируем библиотеку amqplib
import { connect } from "amqplib";
import "dotenv/config";

// Функция для отправки сообщения в очередь
async function sendMessage() {
  // URL для подключения к RabbitMQ серверу
 

  // Подключаемся к серверу
  const connection = await connect({
    username: process.env.RABBITMQ_USER,
    password: process.env.RABBITMQ_PASSWORD,
  });

  // Создаем канал
  const channel = await connection.createChannel();

  // Определяем имя очереди
  const queue = 'demo_queue';

  // Определяем сообщение
  const message = JSON.stringify({ pattern: 'test' });

  // Убеждаемся, что очередь существует
  await channel.assertQueue(queue, { durable: true });

  // Отправляем сообщение в очередь
  channel.sendToQueue(queue, Buffer.from(message));

  console.log(`Сообщение отправлено в очередь ${queue}: ${message}`);

  // Закрываем соединение и канал
  setTimeout(() => {
    channel.close();
    connection.close();
  }, 500);
}

// Запускаем функцию отправки сообщения
sendMessage().catch(console.error);
