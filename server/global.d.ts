import { EventEmitter } from 'events';

declare global {
  var eventEmitter: EventEmitter | undefined;
}