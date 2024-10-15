
export const dynamic = 'force-dynamic';

import { ForgotReturn } from '@loadplug/frontend/components/auth/forgot-return';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: `Integrations Forgot Password`,
  description: '',
};
export default async function Auth(params: { params: { token: string } }) {
  return <ForgotReturn token={params.params.token} />;
}
