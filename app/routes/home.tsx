import type { Route } from "./+types/home";

export function meta(_args: Route.MetaArgs) {
  return [
    { title: "React Router App" },
    { name: "description", content: "A starter React Router application." },
  ];
}

export default function Home() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-3xl font-semibold">React Router App</h1>
      <p className="mt-4 text-base text-gray-700">
        Get started by editing <span className="font-mono">app/routes/home.tsx</span>.
      </p>
    </main>
  );
}
