import { ObjectType, Field, InputType, ID } from '@nestjs/graphql';

@ObjectType()
export class PrivacySettings {
  @Field()
  dataSharing: boolean;

  @Field()
  analyticsTracking: boolean;

  @Field()
  aiPersonalization: boolean;

  @Field()
  thirdPartyIntegrations: boolean;

  @Field()
  dataRetention: string;

  @Field(() => [ExportRequest])
  exportRequests: ExportRequest[];
}

@ObjectType()
export class ExportRequest {
  @Field(() => ID)
  id: string;

  @Field()
  status: string;

  @Field()
  requestedAt: Date;

  @Field({ nullable: true })
  completedAt?: Date;

  @Field({ nullable: true })
  downloadUrl?: string;
}

@ObjectType()
export class DataExportResponse {
  @Field(() => ID)
  requestId: string;

  @Field()
  estimatedCompletion: Date;

  @Field()
  status: string;
}

@ObjectType()
export class DeleteAccountResponse {
  @Field()
  success: boolean;

  @Field()
  message: string;

  @Field()
  deletionDate: Date;
}

@ObjectType()
export class PrivacySettingsResponse {
  @Field()
  success: boolean;

  @Field()
  message: string;
}

@InputType()
export class PrivacySettingsInput {
  @Field()
  dataSharing: boolean;

  @Field()
  analyticsTracking: boolean;

  @Field()
  aiPersonalization: boolean;

  @Field()
  thirdPartyIntegrations: boolean;

  @Field()
  dataRetention: string;
}