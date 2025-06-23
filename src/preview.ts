import { renderToCanvas, bootstrapAureliaApp } from './preview/render';
import Aurelia from 'aurelia';

// Track the current story's cleanup function
let currentCleanup: (() => void) | null = null;

export const render = (args: any, context: any) => {
  // Clean up previous story if exists
  if (currentCleanup) {
    currentCleanup();
    currentCleanup = null;
  }

  // Create a container element
  const container = document.createElement('div');
  
  // Get the story function result
  const story = context.storyFn();
  
  // Bootstrap Aurelia app immediately
  if (story && (story.Component || story.template)) {
    const app = bootstrapAureliaApp(
      story,
      args,
      container,
      story.Component || context.component
    ) as Aurelia;
    
    // Start the app asynchronously
    const startPromise = app.start();
    if (startPromise && typeof startPromise.catch === 'function') {
      startPromise.catch((error: any) => {
        console.error('Failed to start Aurelia app:', error);
      });
    }
    
    // Set cleanup function
    currentCleanup = () => {
      const stopPromise = app.stop();
      if (stopPromise && typeof stopPromise.catch === 'function') {
        stopPromise.catch((error: any) => {
          console.error('Failed to stop Aurelia app:', error);
        });
      }
    };
  }
  
  // Return the container element immediately
  return container;
}; 