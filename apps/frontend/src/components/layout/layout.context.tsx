'use client';

import { ReactNode, useCallback } from 'react';
import { FetchWrapperComponent } from '@loadplug/helpers/utils/custom.fetch';
import { deleteDialog } from '@loadplug/react/helpers/delete.dialog';
import { useReturnUrl } from '@loadplug/frontend/app/auth/return.url.component';
import { useVariables } from '@loadplug/react/helpers/variable.context';

export default function LayoutContext(params: { children: ReactNode }) {
  if (params?.children) {
    // eslint-disable-next-line react/no-children-prop
    return <LayoutContextInner children={params.children} />;
  }

  return <></>;
}
function LayoutContextInner(params: { children: ReactNode }) {
  const returnUrl = useReturnUrl();
  const {backendUrl} = useVariables();

  const afterRequest = useCallback(
    async (url: string, options: RequestInit, response: Response) => {
      const reloadOrOnboarding =
        response?.headers?.get('reload') ||
        response?.headers?.get('onboarding');

      if (reloadOrOnboarding) {
        const getAndClear = returnUrl.getAndClear();
        if (getAndClear) {
          window.location.href = getAndClear;
          return true;
        }
      }

      if (response?.headers?.get('onboarding')) {
        window.location.href = '/integrations?onboarding=true';

        return true;
      }

      if (response?.headers?.get('reload')) {
        window.location.reload();
        return true;
      }

      if (response.status === 401) {
        window.location.href = '/';
      }

      if (response.status === 402) {
        if (
          await deleteDialog(
            (
              await response.json()
            ).message,
            'Move to billing',
            'Payment Required'
          )
        ) {
          window.open('/billing', '_blank');
        }
        return false;
      }

      return true;
    },
    []
  );

  return (
    <FetchWrapperComponent
      baseUrl={backendUrl}
      afterRequest={afterRequest}
    >
      {params?.children || <></>}
    </FetchWrapperComponent>
  );
}
