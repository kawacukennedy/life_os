import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Profile (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('/profile (GET)', () => {
    it('should return profile for valid user', () => {
      return request(app.getHttpServer())
        .get('/profile/user-123')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('userId', 'user-123');
          expect(res.body).toHaveProperty('preferences');
          expect(res.body).toHaveProperty('connectedIntegrations');
        });
    });

    it('should return 404 for non-existent user', () => {
      return request(app.getHttpServer())
        .get('/profile/non-existent-user')
        .expect(404);
    });
  });

  describe('/profile (POST)', () => {
    it('should create a new profile', () => {
      const profileData = {
        displayName: 'Test User',
        bio: 'Test bio',
      };

      return request(app.getHttpServer())
        .post('/profile/new-user-123')
        .send(profileData)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('userId', 'new-user-123');
          expect(res.body.displayName).toBe('Test User');
        });
    });
  });

  describe('/profile (PUT)', () => {
    it('should update profile', () => {
      const updateData = {
        displayName: 'Updated Name',
      };

      return request(app.getHttpServer())
        .put('/profile/user-123')
        .send(updateData)
        .expect(200)
        .expect((res) => {
          expect(res.body.displayName).toBe('Updated Name');
        });
    });
  });

  describe('/profile/preferences (PUT)', () => {
    it('should update preferences', () => {
      const preferences = {
        theme: 'dark',
        notifications: {
          email: false,
          push: true,
          sms: false,
        },
      };

      return request(app.getHttpServer())
        .put('/profile/user-123/preferences')
        .send(preferences)
        .expect(200)
        .expect((res) => {
          expect(res.body.preferences.theme).toBe('dark');
        });
    });
  });

  describe('/profile/privacy (PUT)', () => {
    it('should update privacy settings', () => {
      const privacy = {
        profileVisibility: 'private',
        dataSharing: false,
      };

      return request(app.getHttpServer())
        .put('/profile/user-123/privacy')
        .send(privacy)
        .expect(200)
        .expect((res) => {
          expect(res.body.preferences.privacy.profileVisibility).toBe('private');
        });
    });
  });

  describe('/profile/integrations (PUT)', () => {
    it('should update integrations', () => {
      const integrations = {
        google: true,
        fitbit: true,
      };

      return request(app.getHttpServer())
        .put('/profile/user-123/integrations')
        .send(integrations)
        .expect(200)
        .expect((res) => {
          expect(res.body.connectedIntegrations.google).toBe(true);
          expect(res.body.connectedIntegrations.fitbit).toBe(true);
        });
    });
  });

  describe('/profile/export (GET)', () => {
    it('should export profile data in JSON format', () => {
      return request(app.getHttpServer())
        .get('/profile/user-123/export')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('profile');
          expect(res.body).toHaveProperty('exportDate');
          expect(res.body).toHaveProperty('dataRetention');
        });
    });

    it('should export profile data in CSV format', () => {
      return request(app.getHttpServer())
        .get('/profile/user-123/export?format=csv')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body).toHaveProperty('contentType', 'text/csv');
          expect(res.body).toHaveProperty('filename');
        });
    });
  });

  describe('/profile/anonymize (POST)', () => {
    it('should anonymize profile', () => {
      return request(app.getHttpServer())
        .post('/profile/user-123/anonymize')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('message', 'Profile anonymized successfully');
        });
    });
  });

  describe('/profile (DELETE)', () => {
    it('should delete profile', () => {
      return request(app.getHttpServer())
        .delete('/profile/user-123')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('message', 'Profile deleted successfully');
        });
    });
  });

  describe('Role management', () => {
    it('should update user role', () => {
      return request(app.getHttpServer())
        .put('/profile/user-123/role')
        .send({ role: 'admin' })
        .expect(200)
        .expect((res) => {
          expect(res.body.role).toBe('admin');
        });
    });

    it('should get user role', () => {
      return request(app.getHttpServer())
        .get('/profile/user-123/role')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('role');
        });
    });

    it('should check permissions', () => {
      return request(app.getHttpServer())
        .get('/profile/user-123/permissions?resource=profile&action=read')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('hasPermission');
        });
    });
  });
});