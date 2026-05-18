import React from 'react';
import { Toaster } from 'sonner';
import Index from './pages/Index';
export function App() {
  return (
    <>
      <Toaster position="bottom-right" theme="dark" richColors />
      <Index />
    </>);

}