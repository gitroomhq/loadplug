
export const dynamic = 'force-dynamic';

import {Forgot} from "@loadplug/frontend/components/auth/forgot";
import {Metadata} from "next";

export const metadata: Metadata = {
  title: `Integrations Forgot Password`,
  description: '',
};

export default async function Auth() {
    return (
        <Forgot />
    );
}
