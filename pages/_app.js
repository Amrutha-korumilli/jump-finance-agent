import { SessionProvider, useSession } from 'next-auth/react';
import '../styles/globals.css';
import FloatingChatButton from "../components/FloatingChatButton"

function MyApp({ Component, pageProps: { session, ...pageProps } }) {
  return (
    <SessionProvider session={session}>
      <Component {...pageProps} />
      <FloatingChatButton />
    </SessionProvider>
  );
}

export default MyApp;
