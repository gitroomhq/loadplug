import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { GetOrgFromRequest } from '@loadplug/nestjs-libraries/user/org.from.request';
import { Organization } from '@prisma/client';
import { CheckPolicies } from '@loadplug/backend/services/auth/permissions/permissions.ability';
import {
  AuthorizationActions,
  Sections,
} from '@loadplug/backend/services/auth/permissions/permissions.service';
import { OrganizationService } from '@loadplug/nestjs-libraries/database/prisma/organizations/organization.service';
import {AddTeamMemberDto} from "@loadplug/nestjs-libraries/dtos/settings/add.team.member.dto";
import {ApiTags} from "@nestjs/swagger";

@ApiTags('Settings')
@Controller('/settings')
export class SettingsController {
  constructor(
    private _organizationService: OrganizationService
  ) {}

  @Get('/team')
  @CheckPolicies([AuthorizationActions.Create, Sections.TEAM_MEMBERS], [AuthorizationActions.Create, Sections.ADMIN])
  async getTeam(@GetOrgFromRequest() org: Organization) {
    return this._organizationService.getTeam(org.id);
  }

  @Post('/team')
  @CheckPolicies([AuthorizationActions.Create, Sections.TEAM_MEMBERS], [AuthorizationActions.Create, Sections.ADMIN])
  async inviteTeamMember(
      @GetOrgFromRequest() org: Organization,
      @Body() body: AddTeamMemberDto,
  ) {
    return this._organizationService.inviteTeamMember(org.id, body);
  }

  @Delete('/team/:id')
  @CheckPolicies([AuthorizationActions.Create, Sections.TEAM_MEMBERS], [AuthorizationActions.Create, Sections.ADMIN])
  deleteTeamMember(
      @GetOrgFromRequest() org: Organization,
      @Param('id') id: string
  ) {
    return this._organizationService.deleteTeamMember(org, id);
  }
}
