import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { GatewayService } from '../gateway.service';

@Resolver()
export class EmailResolver {
  constructor(private gatewayService: GatewayService) {}

  @Mutation(() => Boolean)
  async sendEmail(
    @Args('to') to: string,
    @Args('subject') subject: string,
    @Args('body') body: string,
    @Args('type', { nullable: true }) type?: string
  ) {
    const serviceUrl = this.gatewayService.getServiceUrl('email');
    await this.gatewayService.proxyToService(`${serviceUrl}/emails/send`, 'POST', {
      to,
      subject,
      body,
      type
    });
    return true;
  }

  @Mutation(() => Boolean)
  async sendWelcomeEmail(@Args('userId') userId: string, @Args('email') email: string) {
    const serviceUrl = this.gatewayService.getServiceUrl('email');
    await this.gatewayService.proxyToService(`${serviceUrl}/emails/welcome`, 'POST', {
      userId,
      email
    });
    return true;
  }

  @Mutation(() => Boolean)
  async sendPasswordResetEmail(@Args('userId') userId: string, @Args('email') email: string) {
    const serviceUrl = this.gatewayService.getServiceUrl('email');
    await this.gatewayService.proxyToService(`${serviceUrl}/emails/password-reset`, 'POST', {
      userId,
      email
    });
    return true;
  }
}