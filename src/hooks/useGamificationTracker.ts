// Gamificação desativada no NEXO.
// Mantemos o hook/export para evitar quebrar imports antigos, mas ele não
// calcula XP, não dispara notificações, não libera conquistas e não toca sons.
export const useGamificationTracker = (): void => {
  return;
};
