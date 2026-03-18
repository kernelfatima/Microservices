const amqp = require('amqplib');

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost:5672';

console.log('Starting Email Service Worker...');

const startWorker = async () => {
    try {
        const conn = await amqp.connect(RABBITMQ_URL);
        const channel = await conn.createChannel();
        
        const queue = 'user_events';
        await channel.assertQueue(queue);
        
        console.log(`Email Service natively listening on RabbitMQ queue "${queue}"...`);
        
        channel.consume(queue, (msg) => {
            if (msg !== null) {
                const payload = JSON.parse(msg.content.toString());
                
                if (payload.event === 'UserRegistered') {
                    console.log(`\n============================`);
                    console.log(`📧 [VIRTUAL EMAIL DISPATCHED]`);
                    console.log(`To: ${payload.email}`);
                    console.log(`Subject: Welcome to MicroStore, ${payload.name}!`);
                    console.log(`Body: We are officially thrilled you registered. Happy shopping!`);
                    console.log(`============================\n`);
                }
                
                channel.ack(msg); // Guarantee RabbitMQ knows we fully processed it
            }
        });
    } catch (err) {
        console.error('Failed to connect to RabbitMQ. Retrying in 5s...', err.message);
        setTimeout(startWorker, 5000);
    }
};

startWorker();
