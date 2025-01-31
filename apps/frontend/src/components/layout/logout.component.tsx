'use client';

import { useCallback } from 'react';
import { deleteDialog } from '@loadplug/react/helpers/delete.dialog';
import { useFetch } from '@loadplug/helpers/utils/custom.fetch';

export const LogoutComponent = () => {
  const fetch = useFetch();
  const logout = useCallback(async () => {
    if (await deleteDialog('Are you sure you want to logout?', 'Yes logout')) {
      await fetch('/user/logout', {
        method: 'POST',
      });

      window.location.href = '/';
    }
  }, []);

  return (
    <div className="text-red-400 cursor-pointer" onClick={logout}>
      Logout from Loadplug
    </div>
  );
};
