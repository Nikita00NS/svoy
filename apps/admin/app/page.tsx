import { AdminApp } from '../components/AdminApp';
import { TelegramLogin } from '../components/TelegramLogin';

export default function HomePage() {
  return (
    <>
      <main className="container">
        <h1>СВОЙ — Admin</h1>
        <TelegramLogin />
      </main>
      <AdminApp />
    </>
  );
}
