'use client';

import { useCallback, useEffect } from 'react';
import { useUser } from '@loadplug/frontend/components/layout/user.context';
import { TeamsComponent } from '@loadplug/frontend/components/settings/teams.component';
import { useFetch } from '@loadplug/helpers/utils/custom.fetch';
import useSWR from 'swr';
import { LoadingComponent } from '@loadplug/frontend/components/layout/loading';
import { useRouter } from 'next/navigation';

export const SettingsComponent = () => {
  const user = useUser();
  const router = useRouter();

  const fetch = useFetch();

  const load = useCallback(async (path: string) => {
    const { github } = await (await fetch('/settings/github')).json();
    if (!github) {
      return false;
    }

    const emptyOnes = github.find((p: { login: string }) => !p.login);
    const { organizations } = emptyOnes
      ? await (await fetch(`/settings/organizations/${emptyOnes.id}`)).json()
      : { organizations: [] };

    return { github, organizations };
  }, []);

  const { isLoading: isLoadingSettings, data: loadAll } = useSWR(
    'load-all',
    load
  );

  useEffect(() => {
    if (!isLoadingSettings && !loadAll) {
      router.push('/');
    }
  }, [loadAll, isLoadingSettings]);

  if (isLoadingSettings) {
    return <LoadingComponent />;
  }

  if (!loadAll) {
    return null;
  }

  return (
    <div className="flex flex-col gap-[68px]">
      {!!user?.tier?.team_members && <TeamsComponent />}
    </div>
  );
};
