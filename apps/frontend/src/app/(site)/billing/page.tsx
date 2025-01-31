
export const dynamic = 'force-dynamic';

import { BillingComponent } from '@loadplug/frontend/components/billing/billing.component';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: `Integrations Billing`,
  description: '',
};

export default async function Page() {
  return <BillingComponent />;
}
