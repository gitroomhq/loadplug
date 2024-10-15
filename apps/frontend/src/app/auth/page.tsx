export const dynamic = 'force-dynamic';

import { Register } from '@loadplug/frontend/components/auth/register';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: `Integrations Register`,
  description: '',
};

export default async function Auth() {
  return <Register />;
}
