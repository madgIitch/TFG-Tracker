// src/utils/activeChatRef.ts
// Módulo singleton para rastrear el chat abierto actualmente.
// Usado por App.tsx para suprimir notificaciones del chat activo.

export let activeChatId: string | null = null;

export function setActiveChatId(id: string | null): void {
  activeChatId = id;
}
