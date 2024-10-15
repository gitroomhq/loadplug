import { Injectable } from '@nestjs/common';
import { Provider, User } from '@prisma/client';
import { CreateOrgUserDto } from '@loadplug/nestjs-libraries/dtos/auth/create.org.user.dto';
import { LoginUserDto } from '@loadplug/nestjs-libraries/dtos/auth/login.user.dto';
import { UsersService } from '@loadplug/nestjs-libraries/database/prisma/users/users.service';
import { OrganizationService } from '@loadplug/nestjs-libraries/database/prisma/organizations/organization.service';
import { AuthService as AuthChecker } from '@loadplug/helpers/auth/auth.service';
import { ProvidersFactory } from '@loadplug/backend/services/auth/providers/providers.factory';
import dayjs from 'dayjs';
import { NewsletterService } from '@loadplug/nestjs-libraries/services/newsletter.service';
import { ForgotReturnPasswordDto } from '@loadplug/nestjs-libraries/dtos/auth/forgot-return.password.dto';
import { EmailService } from '@loadplug/nestjs-libraries/services/email.service';

@Injectable()
export class AuthService {
  constructor(
    private _userService: UsersService,
    private _organizationService: OrganizationService,
    private _emailService: EmailService,
  ) {}
  async routeAuth(
    provider: Provider,
    body: CreateOrgUserDto | LoginUserDto,
    addToOrg?: boolean | { orgId: string; role: 'USER' | 'ADMIN'; id: string }
  ) {
    if (provider === Provider.LOCAL) {
      const user = await this._userService.getUserByEmail(body.email);
      if (body instanceof CreateOrgUserDto) {
        if (user) {
          throw new Error('User already exists');
        }

        const create = await this._organizationService.createOrgAndUser(body);

        const addedOrg =
          addToOrg && typeof addToOrg !== 'boolean'
            ? await this._organizationService.addUserToOrg(
                create.users[0].user.id,
                addToOrg.id,
                addToOrg.orgId,
                addToOrg.role
              )
            : false;

        const obj = { addedOrg, jwt: await this.jwt(create.users[0].user) };
        await this._emailService.sendEmail(body.email, 'Activate your account', `Click <a href="${process.env.FRONTEND_URL}/auth/activate/${obj.jwt}">here</a> to activate your account`);
        return obj;
      }

      if (!user || !AuthChecker.comparePassword(body.password, user.password)) {
        throw new Error('Invalid user name or password');
      }

      if (!user.activated) {
        throw new Error('User is not activated');
      }

      return { addedOrg: false, jwt: await this.jwt(user) };
    }

    const user = await this.loginOrRegisterProvider(
      provider,
      body as CreateOrgUserDto
    );

    const addedOrg =
      addToOrg && typeof addToOrg !== 'boolean'
        ? await this._organizationService.addUserToOrg(
            user.id,
            addToOrg.id,
            addToOrg.orgId,
            addToOrg.role
          )
        : false;
    return { addedOrg, jwt: await this.jwt(user) };
  }

  public getOrgFromCookie(cookie?: string) {
    if (!cookie) {
      return false;
    }

    try {
      const getOrg: any = AuthChecker.verifyJWT(cookie);
      if (dayjs(getOrg.timeLimit).isBefore(dayjs())) {
        return false;
      }

      return getOrg as {
        email: string;
        role: 'USER' | 'ADMIN';
        orgId: string;
        id: string;
      };
    } catch (err) {
      return false;
    }
  }

  private async loginOrRegisterProvider(
    provider: Provider,
    body: CreateOrgUserDto
  ) {
    const providerInstance = ProvidersFactory.loadProvider(provider);
    const providerUser = await providerInstance.getUser(body.providerToken);

    if (!providerUser) {
      throw new Error('Invalid provider token');
    }

    const user = await this._userService.getUserByProvider(
      providerUser.id,
      provider
    );
    if (user) {
      return user;
    }

    const create = await this._organizationService.createOrgAndUser({
      company: body.company,
      email: providerUser.email,
      password: '',
      provider,
      providerId: providerUser.id,
    });

    NewsletterService.register(providerUser.email);

    return create.users[0].user;
  }

  async forgot(email: string) {
    const user = await this._userService.getUserByEmail(email);
    if (!user || user.providerName !== Provider.LOCAL) {
      return false;
    }

    const resetValues = AuthChecker.signJWT({
      id: user.id,
      expires: dayjs().add(20, 'minutes').format('YYYY-MM-DD HH:mm:ss'),
    });
  }

  forgotReturn(body: ForgotReturnPasswordDto) {
    const user = AuthChecker.verifyJWT(body.token) as {
      id: string;
      expires: string;
    };
    if (dayjs(user.expires).isBefore(dayjs())) {
      return false;
    }

    return this._userService.updatePassword(user.id, body.password);
  }

  async activate(code: string) {
    const user = AuthChecker.verifyJWT(code) as { id: string, activated: boolean, email: string };
    if (user.id && !user.activated) {
      const getUserAgain = await this._userService.getUserByEmail(user.email);
      if (getUserAgain.activated) {
        return false;
      }
      await this._userService.activateUser(user.id);
      user.activated = true;
      await NewsletterService.register(user.email);
      return this.jwt(user as any);
    }

    return false;
  }

  oauthLink(provider: string) {
    const providerInstance = ProvidersFactory.loadProvider(
      provider as Provider
    );
    return providerInstance.generateLink();
  }

  async checkExists(provider: string, code: string) {
    const providerInstance = ProvidersFactory.loadProvider(
      provider as Provider
    );
    const token = await providerInstance.getToken(code);
    const user = await providerInstance.getUser(token);
    if (!user) {
      throw new Error('Invalid user');
    }
    const checkExists = await this._userService.getUserByProvider(
      user.id,
      provider as Provider
    );
    if (checkExists) {
      return { jwt: await this.jwt(checkExists) };
    }

    return { token };
  }

  private async jwt(user: User) {
    return AuthChecker.signJWT(user);
  }
}
