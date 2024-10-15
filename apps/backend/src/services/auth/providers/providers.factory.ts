import { Provider } from '@prisma/client';
import { GithubProvider } from '@loadplug/backend/services/auth/providers/github.provider';
import { ProvidersInterface } from '@loadplug/backend/services/auth/providers.interface';
import { GoogleProvider } from '@loadplug/backend/services/auth/providers/google.provider';

export class ProvidersFactory {
  static loadProvider(provider: Provider): ProvidersInterface {
    switch (provider) {
      case Provider.GITHUB:
        return new GithubProvider();
      case Provider.GOOGLE:
        return new GoogleProvider();
    }
  }
}
