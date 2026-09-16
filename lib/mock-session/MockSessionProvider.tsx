"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import type {
  Order,
  Payment,
  Sale,
  Entitlement,
  Withdrawal,
  CustomRequest,
  Conversation,
  Message,
  CustomProposal,
  CustomServiceOrder,
  Notification,
} from "@/lib/types";
import { orders as seedOrders } from "@/lib/data/orders";
import { payments as seedPayments } from "@/lib/data/payments";
import { sales as seedSales } from "@/lib/data/sales";
import { entitlements as seedEntitlements } from "@/lib/data/entitlements";
import { withdrawals as seedWithdrawals } from "@/lib/data/wallets";
import { mockCurrentUser } from "@/lib/data/users";
import { customRequests as seedCustomRequests } from "@/lib/data/custom-requests";
import { conversations as seedConversations, messages as seedMessages } from "@/lib/data/conversations";
import { customProposals as seedCustomProposals } from "@/lib/data/custom-proposals";
import { customServiceOrders as seedCustomServiceOrders } from "@/lib/data/custom-service-orders";
import { notifications as seedNotifications } from "@/lib/data/notifications";
import { createClient } from "@/lib/supabase/client";

/**
 * MockSessionProvider é o ÚNICO lugar da aplicação que acessa localStorage
 * diretamente. Ele guarda o estado mutável da sessão de mock (pedidos,
 * pagamentos, vendas, entitlements, saques e favoritos) e mantém tudo
 * hidratado entre navegações e reloads durante a sessão do navegador.
 *
 * Nenhum componente ou repositório deve chamar localStorage diretamente —
 * sempre passar por useMockSession().
 *
 * Implementado como um external store (useSyncExternalStore) em vez de
 * useState + useEffect: a leitura de localStorage é uma sincronização com um
 * sistema externo, não um derived state — esse é o padrão recomendado pelo
 * React para esse caso, e evita re-renderizações em cascata.
 */

const STORAGE_KEY = "onlyyou:mock-session:v1";

export interface MockSessionState {
  currentUserId: string;
  orders: Order[];
  payments: Payment[];
  sales: Sale[];
  entitlements: Entitlement[];
  withdrawals: Withdrawal[];
  favorites: string[];
  customRequests: CustomRequest[];
  conversations: Conversation[];
  messages: Message[];
  customProposals: CustomProposal[];
  customServiceOrders: CustomServiceOrder[];
  notifications: Notification[];
}

function getInitialState(): MockSessionState {
  return {
    currentUserId: mockCurrentUser.id,
    orders: seedOrders,
    payments: seedPayments,
    sales: seedSales,
    entitlements: seedEntitlements,
    withdrawals: seedWithdrawals,
    favorites: [],
    customRequests: seedCustomRequests,
    conversations: seedConversations,
    messages: seedMessages,
    customProposals: seedCustomProposals,
    customServiceOrders: seedCustomServiceOrders,
    notifications: seedNotifications,
  };
}

const serverSnapshot = getInitialState();

let store = getInitialState();
let hydratedFromStorage = false;
const listeners = new Set<() => void>();

function persist() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // Armazenamento indisponível (modo privado, quota excedida, etc.) — a
    // aplicação continua funcionando apenas sem persistência entre sessões.
  }
}

function hydrateOnce() {
  if (hydratedFromStorage || typeof window === "undefined") return;
  hydratedFromStorage = true;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<MockSessionState>;
      store = { ...store, ...parsed };
    }
  } catch {
    // Ignora dados corrompidos e mantém o estado inicial.
  }
}

function setStore(updater: (state: MockSessionState) => MockSessionState) {
  store = updater(store);
  persist();
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  hydrateOnce();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): MockSessionState {
  return store;
}

function getServerSnapshot(): MockSessionState {
  return serverSnapshot;
}

export interface MockSessionContextValue extends MockSessionState {
  setCurrentUserId: (id: string) => void;
  addOrder: (order: Order) => void;
  updateOrder: (id: string, patch: Partial<Order>) => void;
  addPayment: (payment: Payment) => void;
  updatePayment: (id: string, patch: Partial<Payment>) => void;
  addSale: (sale: Sale) => void;
  addEntitlement: (entitlement: Entitlement) => void;
  updateEntitlement: (id: string, patch: Partial<Entitlement>) => void;
  addWithdrawal: (withdrawal: Withdrawal) => void;
  updateWithdrawal: (id: string, patch: Partial<Withdrawal>) => void;
  toggleFavorite: (productId: string) => void;
  addCustomRequest: (request: CustomRequest) => void;
  updateCustomRequest: (id: string, patch: Partial<CustomRequest>) => void;
  addConversation: (conversation: Conversation) => void;
  updateConversation: (id: string, patch: Partial<Conversation>) => void;
  addMessage: (message: Message) => void;
  updateMessage: (id: string, patch: Partial<Message>) => void;
  addCustomProposal: (proposal: CustomProposal) => void;
  updateCustomProposal: (id: string, patch: Partial<CustomProposal>) => void;
  addCustomServiceOrder: (order: CustomServiceOrder) => void;
  updateCustomServiceOrder: (id: string, patch: Partial<CustomServiceOrder>) => void;
  addNotification: (notification: Notification) => void;
  updateNotification: (id: string, patch: Partial<Notification>) => void;
  resetMockSession: () => void;
}

const MockSessionContext = createContext<MockSessionContextValue | null>(null);

export function MockSessionProvider({ children }: { children: ReactNode }) {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // Se existir uma sessão Supabase real, sobrepõe a "identidade agindo" nos
  // fluxos mock (pedidos/favoritos/etc.) para o UUID real da pessoa — só
  // depois de montar (evita divergência entre o snapshot do servidor e o do
  // cliente, já que o servidor não tem acesso à sessão do navegador aqui).
  // Roda uma vez sem depender de `store`/`setCurrentUserId` de propósito:
  // só precisa ler a sessão ao montar e reagir a mudanças de auth depois.
  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    supabase.auth.getUser().then(async ({ data }) => {
      const user = data.user;
      if (!user || cancelled) return;
      // Confirma que existe uma linha em profiles para este id antes de
      // assumir a identidade (deveria sempre existir, via trigger de
      // signup, mas evita assumir um id sem perfil correspondente).
      const { data: row } = await supabase.from("profiles").select("id").eq("id", user.id).single();
      if (!cancelled && row) {
        setStore((s) => ({ ...s, currentUserId: user.id }));
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setStore((s) => ({ ...s, currentUserId: session.user.id }));
      }
      // Sem sessão (logout): mantém currentUserId como está — não há
      // redirecionamento forçado nesta fase, então reverter para o
      // comprador mock não é necessário nem esperado.
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<MockSessionContextValue>(
    () => ({
      ...state,
      setCurrentUserId: (id) => setStore((s) => ({ ...s, currentUserId: id })),
      addOrder: (order) => setStore((s) => ({ ...s, orders: [...s.orders, order] })),
      updateOrder: (id, patch) =>
        setStore((s) => ({
          ...s,
          orders: s.orders.map((o) => (o.id === id ? { ...o, ...patch } : o)),
        })),
      addPayment: (payment) => setStore((s) => ({ ...s, payments: [...s.payments, payment] })),
      updatePayment: (id, patch) =>
        setStore((s) => ({
          ...s,
          payments: s.payments.map((p) => (p.id === id ? { ...p, ...patch } : p)),
        })),
      addSale: (sale) => setStore((s) => ({ ...s, sales: [...s.sales, sale] })),
      addEntitlement: (entitlement) =>
        setStore((s) => ({ ...s, entitlements: [...s.entitlements, entitlement] })),
      updateEntitlement: (id, patch) =>
        setStore((s) => ({
          ...s,
          entitlements: s.entitlements.map((e) => (e.id === id ? { ...e, ...patch } : e)),
        })),
      addWithdrawal: (withdrawal) =>
        setStore((s) => ({ ...s, withdrawals: [...s.withdrawals, withdrawal] })),
      updateWithdrawal: (id, patch) =>
        setStore((s) => ({
          ...s,
          withdrawals: s.withdrawals.map((w) => (w.id === id ? { ...w, ...patch } : w)),
        })),
      toggleFavorite: (productId) =>
        setStore((s) => ({
          ...s,
          favorites: s.favorites.includes(productId)
            ? s.favorites.filter((id) => id !== productId)
            : [...s.favorites, productId],
        })),
      addCustomRequest: (request) =>
        setStore((s) => ({ ...s, customRequests: [...s.customRequests, request] })),
      updateCustomRequest: (id, patch) =>
        setStore((s) => ({
          ...s,
          customRequests: s.customRequests.map((r) => (r.id === id ? { ...r, ...patch } : r)),
        })),
      addConversation: (conversation) =>
        setStore((s) => ({ ...s, conversations: [...s.conversations, conversation] })),
      updateConversation: (id, patch) =>
        setStore((s) => ({
          ...s,
          conversations: s.conversations.map((c) => (c.id === id ? { ...c, ...patch } : c)),
        })),
      addMessage: (message) => setStore((s) => ({ ...s, messages: [...s.messages, message] })),
      updateMessage: (id, patch) =>
        setStore((s) => ({
          ...s,
          messages: s.messages.map((m) => (m.id === id ? { ...m, ...patch } : m)),
        })),
      addCustomProposal: (proposal) =>
        setStore((s) => ({ ...s, customProposals: [...s.customProposals, proposal] })),
      updateCustomProposal: (id, patch) =>
        setStore((s) => ({
          ...s,
          customProposals: s.customProposals.map((p) => (p.id === id ? { ...p, ...patch } : p)),
        })),
      addCustomServiceOrder: (order) =>
        setStore((s) => ({ ...s, customServiceOrders: [...s.customServiceOrders, order] })),
      updateCustomServiceOrder: (id, patch) =>
        setStore((s) => ({
          ...s,
          customServiceOrders: s.customServiceOrders.map((o) => (o.id === id ? { ...o, ...patch } : o)),
        })),
      addNotification: (notification) =>
        setStore((s) => ({ ...s, notifications: [...s.notifications, notification] })),
      updateNotification: (id, patch) =>
        setStore((s) => ({
          ...s,
          notifications: s.notifications.map((n) => (n.id === id ? { ...n, ...patch } : n)),
        })),
      resetMockSession: () => setStore(() => getInitialState()),
    }),
    [state],
  );

  return <MockSessionContext.Provider value={value}>{children}</MockSessionContext.Provider>;
}

export function useMockSession(): MockSessionContextValue {
  const ctx = useContext(MockSessionContext);
  if (!ctx) {
    throw new Error("useMockSession precisa ser usado dentro de <MockSessionProvider>");
  }
  return ctx;
}
