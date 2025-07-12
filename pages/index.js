import { useSession, signIn, signOut } from "next-auth/react";

export default function Home() {
  const { data: session } = useSession();

  return (
    <main className="min-h-screen flex flex-col items-center justify-center">
      {!session ? (
        <>
          <h1 className="text-2xl mb-4">Jump Agent</h1>
          <button
            onClick={() => signIn("google")}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Sign in with Google
          </button>
        </>
      ) : (
        <>
          <h2 className="mb-2">Hello, {session.user.name}</h2>
          <p className="mb-4">Email: {session.user.email}</p>
          <button
            onClick={() => signOut()}
            className="bg-gray-500 text-white px-4 py-2 rounded"
          >
            Sign out
          </button>
        </>
      )}
    </main>
  );
}

