export let activeChatId: string | null = null;

export const setActiveChatId = (id: string | null): void => {
  activeChatId = id;
};
