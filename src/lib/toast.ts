export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastEventDetail {
  message: string;
  type: ToastType;
  onUndo?: () => void; // Ajout de la fonction d'annulation
}

export const toast = (message: string, type: ToastType = 'success', onUndo?: () => void) => {
  const event = new CustomEvent<ToastEventDetail>('lexi-toast', { 
    detail: { message, type, onUndo } 
  });
  window.dispatchEvent(event);
};
