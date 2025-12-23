import { createNavigationContainerRef } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef();

let navigationQueue: { name: string; params: any }[] = [];

export function navigate(name: string, params?: any) {
  if (navigationRef.isReady()) {
    console.log(`🚀 RootNavigation: Navigating to ${name}`);
    navigationRef.navigate(name as never, params as never);
  } else {
    console.log(`⌛ RootNavigation: Navigator not ready, queuing navigation to ${name}`);
    navigationQueue.push({ name, params });
  }
}

/**
 * Call this when the NavigationContainer is ready to flush any queued navigation actions.
 */
export function flushNavigationQueue() {
  if (navigationRef.isReady() && navigationQueue.length > 0) {
    console.log(`📡 RootNavigation: Flushing queue (${navigationQueue.length} items)`);
    const queue = [...navigationQueue];
    navigationQueue = [];
    queue.forEach((item) => {
      navigationRef.navigate(item.name as never, item.params as never);
    });
  }
}
