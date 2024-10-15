
export const dynamic = 'force-dynamic';

import { Metadata } from 'next';
import { AfterActivate } from '@loadplug/frontend/components/auth/after.activate';

export const metadata: Metadata = {
  title: `Integrations - Activate your account`,
  description: '',
};

export default async function Auth() {
  return <AfterActivate />;
}
