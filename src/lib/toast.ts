export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastEventDetail {
  message: string;
  type: ToastType;
}

export const toast = (message: string, type: ToastType = 'success') => {
  const event = new CustomEvent<ToastEventDetail>('lexi-toast', { 
    detail: { message, type } 
  });
  window.dispatchEvent(event);
};
