import { defineEventHandler } from 'h3';
import { EventEmitter } from 'events';

export default defineEventHandler((event) => {
  if (!global.eventEmitter) {
    //initialize eventEmitter
    global.eventEmitter = new EventEmitter();
  }

  event.node.res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

  const sendEvent = (data: any) => {
    event.node.res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  const stripeEventListener = (data : any) => {
    sendEvent(data);
  };

  global?.eventEmitter?.on('stripe-event', stripeEventListener);

  event.node.res.on('close', () => {
    global?.eventEmitter?.removeListener('stripe-event', stripeEventListener);
    event.node.res.end();
  });
});