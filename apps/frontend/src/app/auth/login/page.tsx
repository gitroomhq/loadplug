
export const dynamic = 'force-dynamic';

import {Login} from "@loadplug/frontend/components/auth/login";
import {Metadata} from "next";

export const metadata: Metadata = {
  title: `Integrations Login`,
  description: '',
};

export default async function Auth() {
    return (
        <Login />
    );
}
