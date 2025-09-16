declare module 'react-hot-toast' {
  import * as React from 'react';

  export interface ToastOptions {
    duration?: number;
    className?: string;
    style?: React.CSSProperties;
    icon?: React.ReactNode;
    success?: ToastOptions;
    error?: ToastOptions;
    warning?: ToastOptions;
    info?: ToastOptions;
    loading?: ToastOptions;
  }

  export interface ToasterProps {
    position?:
      | 'top-left'
      | 'top-center'
      | 'top-right'
      | 'bottom-left'
      | 'bottom-center'
      | 'bottom-right';
    reverseOrder?: boolean;
    gutter?: number;
    toastOptions?: ToastOptions;
    containerStyle?: React.CSSProperties;
  }

  export const Toaster: React.FC<ToasterProps>;

  export interface ToastHandler {
    (message: string, options?: ToastOptions): string | number;
    success(message: string, options?: ToastOptions): string | number;
    error(message: string, options?: ToastOptions): string | number;
    warning(message: string, options?: ToastOptions): string | number;
    info(message: string, options?: ToastOptions): string | number;
    loading(message: string, options?: ToastOptions): string | number;
  }

  export const toast: ToastHandler;

  export type Toast = any;
}

