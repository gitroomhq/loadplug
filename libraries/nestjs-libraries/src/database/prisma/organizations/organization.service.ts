import { CreateOrgUserDto } from '@loadplug/nestjs-libraries/dtos/auth/create.org.user.dto';
import { Injectable } from '@nestjs/common';
import { OrganizationRepository } from '@loadplug/nestjs-libraries/database/prisma/organizations/organization.repository';
import { AddTeamMemberDto } from '@loadplug/nestjs-libraries/dtos/settings/add.team.member.dto';
import { AuthService } from '@loadplug/helpers/auth/auth.service';
import dayjs from 'dayjs';
import { makeId } from '@loadplug/nestjs-libraries/services/make.is';
import { Organization } from '@prisma/client';
import { NotificationService } from '@loadplug/nestjs-libraries/database/prisma/notifications/notification.service';

@Injectable()
export class OrganizationService {
  constructor(
    private _organizationRepository: OrganizationRepository,
    private _notificationService: NotificationService
  ) {}
  async createOrgAndUser(
    body: Omit<CreateOrgUserDto, 'providerToken'> & { providerId?: string }
  ) {
    return this._organizationRepository.createOrgAndUser(body, true);
  }

  addUserToOrg(
    userId: string,
    id: string,
    orgId: string,
    role: 'USER' | 'ADMIN'
  ) {
    return this._organizationRepository.addUserToOrg(userId, id, orgId, role);
  }

  getOrgById(id: string) {
    return this._organizationRepository.getOrgById(id);
  }

  getUserOrg(id: string) {
    return this._organizationRepository.getUserOrg(id);
  }

  getOrgsByUserId(userId: string) {
    return this._organizationRepository.getOrgsByUserId(userId);
  }

  getTeam(orgId: string) {
    return this._organizationRepository.getTeam(orgId);
  }

  async inviteTeamMember(orgId: string, body: AddTeamMemberDto) {
    const timeLimit = dayjs().add(15, 'minutes').format('YYYY-MM-DD HH:mm:ss');
    const id = makeId(5);
    const url =
      process.env.FRONTEND_URL +
      `/?org=${AuthService.signJWT({ ...body, orgId, timeLimit, id })}`;
    if (body.sendEmail) {
      await this._notificationService.sendEmail(
        body.email,
        'You have been invited to join an organization',
        `You have been invited to join an organization. Click <a href="${url}">here</a> to join.<br />The link will expire in 15 minutes.`
      );
    }
    return { url };
  }

  async deleteTeamMember(org: Organization, userId: string) {
    const userOrgs = await this._organizationRepository.getOrgsByUserId(userId);
    const findOrgToDelete = userOrgs.find((orgUser) => orgUser.id === org.id);
    if (!findOrgToDelete) {
      throw new Error('User is not part of this organization');
    }

    // @ts-ignore
    const myRole = org.users[0].role;

    // @ts-ignore
    const userRole = findOrgToDelete.users[0].role;
    const myLevel = myRole === 'USER' ? 0 : myRole === 'ADMIN' ? 1 : 2;
    const userLevel = userRole === 'USER' ? 0 : userRole === 'ADMIN' ? 1 : 2;

    if (myLevel < userLevel) {
      throw new Error('You do not have permission to delete this user');
    }

    return this._organizationRepository.deleteTeamMember(org.id, userId);
  }

  disableOrEnableNonSuperAdminUsers(orgId: string, disable: boolean) {
    return this._organizationRepository.disableOrEnableNonSuperAdminUsers(orgId, disable);
  }
}
