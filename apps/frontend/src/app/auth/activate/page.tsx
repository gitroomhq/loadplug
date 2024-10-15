
export const dynamic = 'force-dynamic';

import {Metadata} from "next";
import { Activate } from '@loadplug/frontend/components/auth/activate';

export const metadata: Metadata = {
  title: `Integrations - Activate your account`,
  description: '',
};

export default async function Auth() {
    return (
        <Activate />
    );
}
