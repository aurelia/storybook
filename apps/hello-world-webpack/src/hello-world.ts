import { bindable } from 'aurelia';

export class HelloWorld {
  @bindable() message = 'Hello from Aurelia!';
  // New reactive counter property to track number of clicks
  counter = 0;
  // New bindable event callback for the increment action
  @bindable() onIncrement;

  // Method to increment the counter and fire the onIncrement callback if provided.
  increment() {
    this.counter++;
    if (this.onIncrement) {
      this.onIncrement(this.counter);
    }
  }
} 