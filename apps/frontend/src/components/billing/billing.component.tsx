'use client';

import { useCallback, useEffect } from 'react';
import useSWR from 'swr';
import { LoadingComponent } from '@loadplug/frontend/components/layout/loading';
import { useFetch } from '@loadplug/helpers/utils/custom.fetch';
import { MainBillingComponent } from './main.billing.component';
import { useSearchParams } from 'next/navigation';
import { useFireEvents } from '@loadplug/helpers/utils/use.fire.events';

export const BillingComponent = () => {
  const fetch = useFetch();
  const searchParams = useSearchParams();
  const fireEvents = useFireEvents();

  useEffect(() => {
    if (searchParams.get('check')) {
      fireEvents('purchase');
    }
  }, []);

  const load = useCallback(async (path: string) => {
    return await (await fetch(path)).json();
  }, []);

  const { isLoading: isLoadingTier, data: tiers } = useSWR(
    '/user/subscription/tiers',
    load
  );
  const { isLoading: isLoadingSubscription, data: subscription } = useSWR(
    '/user/subscription',
    load
  );

  if (isLoadingSubscription || isLoadingTier) {
    return <LoadingComponent />;
  }

  return (
    <MainBillingComponent sub={subscription?.subscription} />
  );
};
