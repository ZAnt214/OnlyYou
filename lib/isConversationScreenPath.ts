/**
 * Rotas de conversa (/pedidos/[id] e /dashboard/pedidos-personalizados/[id])
 * são tela cheia de verdade — sem header/footer/nav do site por trás. Usado
 * por Header/Footer/MobileNav pra sumir nessas rotas, e por
 * ConversationScreen pra saber que não precisa mais de `position: fixed`
 * pra "cobrir" nada (ver histórico de bugs do teclado em mobile com fixed +
 * viewport — a causa raiz era competir com o site por trás, não o teclado
 * em si).
 */
export function isConversationScreenPath(pathname: string): boolean {
  return /^\/pedidos\/[^/]+$/.test(pathname) || /^\/dashboard\/pedidos-personalizados\/[^/]+$/.test(pathname);
}
