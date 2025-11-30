import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-openidconnect';
import { AuthService } from './auth.service';

@Injectable()
export class OIDCStrategy extends PassportStrategy(Strategy, 'oidc') {
  constructor(private authService: AuthService) {
    super({
      issuer: process.env.OIDC_ISSUER,
      authorizationURL: process.env.OIDC_AUTH_URL,
      tokenURL: process.env.OIDC_TOKEN_URL,
      userInfoURL: process.env.OIDC_USERINFO_URL,
      clientID: process.env.OIDC_CLIENT_ID,
      clientSecret: process.env.OIDC_CLIENT_SECRET,
      callbackURL: process.env.OIDC_CALLBACK_URL || 'http://localhost:3001/auth/oidc/callback',
      scope: ['openid', 'profile', 'email'],
    });
  }

  async validate(
    issuer: string,
    sub: string,
    profile: any,
    accessToken: string,
    refreshToken: string,
    done: Function,
  ) {
    try {
      const user = {
        id: sub,
        email: profile.emails?.[0]?.value,
        fullName: profile.displayName,
        provider: 'oidc',
        accessToken,
        refreshToken,
      };
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  }
}