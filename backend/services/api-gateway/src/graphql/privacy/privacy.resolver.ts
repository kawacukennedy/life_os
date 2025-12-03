import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { PrivacyGraphQLService } from './privacy.service';
import {
  PrivacySettings,
  DataExportResponse,
  DeleteAccountResponse,
  PrivacySettingsResponse,
  PrivacySettingsInput
} from './privacy.types';

@Resolver()
export class PrivacyResolver {
  constructor(private privacyService: PrivacyGraphQLService) {}

  @Query(() => PrivacySettings)
  async getPrivacySettings(@Args('userId') userId: string): Promise<PrivacySettings> {
    return this.privacyService.getPrivacySettings(userId);
  }

  @Mutation(() => PrivacySettingsResponse)
  async updatePrivacySettings(
    @Args('userId') userId: string,
    @Args('settings') settings: PrivacySettingsInput
  ): Promise<PrivacySettingsResponse> {
    return this.privacyService.updatePrivacySettings(userId, settings);
  }

  @Mutation(() => DataExportResponse)
  async requestDataExport(@Args('userId') userId: string): Promise<DataExportResponse> {
    return this.privacyService.requestDataExport(userId);
  }

  @Mutation(() => DeleteAccountResponse)
  async deleteAccount(
    @Args('userId') userId: string,
    @Args('confirmation') confirmation: string
  ): Promise<DeleteAccountResponse> {
    return this.privacyService.deleteAccount(userId, confirmation);
  }
}