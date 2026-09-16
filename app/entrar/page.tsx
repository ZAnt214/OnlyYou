import Link from "next/link";

export default function EntrarPage() {
  return (
    <div className="mx-auto flex max-w-sm flex-col gap-6 px-4 py-16">
      <h1 className="text-xl font-semibold text-(--color-text)">Entrar</h1>
      <form className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm text-(--color-text)">
          E-mail
          <input
            type="email"
            required
            className="rounded-md border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm focus:border-(--color-accent) focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-(--color-text)">
          Senha
          <input
            type="password"
            required
            className="rounded-md border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm focus:border-(--color-accent) focus:outline-none"
          />
        </label>
        <button
          type="submit"
          className="mt-2 rounded-md bg-(--color-accent) px-4 py-2 text-sm font-medium text-white hover:bg-(--color-accent-hover)"
        >
          Entrar
        </button>
      </form>
      <p className="text-sm text-(--color-text-muted)">
        Ainda não tem conta?{" "}
        <Link href="/cadastro" className="text-(--color-accent) hover:underline">
          Criar conta
        </Link>
      </p>
      <p className="text-xs text-(--color-text-subtle)">
        Nesta fase, o login é apenas ilustrativo — a sessão de uso é simulada via
        MockSessionProvider.
      </p>
    </div>
  );
}
