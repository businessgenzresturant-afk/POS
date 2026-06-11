import { redirect } from 'next/navigation';

export default function RootPage() {
  // Redirect root to POS login
  redirect('/pos/tables');
}
