import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Analytics (e2e)', () => {
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

  describe('/analytics/events (POST)', () => {
    it('should track an event', () => {
      const eventData = {
        userId: 'test-user-123',
        eventType: 'page_view',
        properties: { page: '/dashboard' },
        sessionId: 'session-456',
      };

      return request(app.getHttpServer())
        .post('/api/v1/analytics/events')
        .set('Authorization', 'Bearer test-token') // Mock auth
        .send(eventData)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('success', true);
          expect(res.body).toHaveProperty('eventId');
        });
    });

    it('should return 401 without auth', () => {
      const eventData = {
        userId: 'test-user-123',
        eventType: 'page_view',
      };

      return request(app.getHttpServer())
        .post('/api/v1/analytics/events')
        .send(eventData)
        .expect(401);
    });
  });

  describe('/analytics/events/batch (POST)', () => {
    it('should track multiple events', () => {
      const events = [
        {
          userId: 'test-user-123',
          eventType: 'page_view',
          properties: { page: '/dashboard' },
        },
        {
          userId: 'test-user-123',
          eventType: 'button_click',
          properties: { button: 'save' },
        },
      ];

      return request(app.getHttpServer())
        .post('/api/v1/analytics/events/batch')
        .set('Authorization', 'Bearer test-token')
        .send(events)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('success', true);
          expect(res.body).toHaveProperty('eventsTracked', 2);
        });
    });
  });

  describe('/analytics/health (GET)', () => {
    it('should return health status', () => {
      return request(app.getHttpServer())
        .get('/api/v1/analytics/health')
        .set('Authorization', 'Bearer test-token')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status');
          expect(res.body).toHaveProperty('service', 'analytics-service');
          expect(res.body).toHaveProperty('checks');
        });
    });
  });

  describe('/analytics/reports/user-activity (GET)', () => {
    it('should return user activity report', () => {
      return request(app.getHttpServer())
        .get('/api/v1/analytics/reports/user-activity?userId=test-user-123&startDate=2024-01-01&endDate=2024-01-31')
        .set('Authorization', 'Bearer test-token')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('userId', 'test-user-123');
          expect(res.body).toHaveProperty('period');
          expect(res.body).toHaveProperty('activity');
          expect(res.body).toHaveProperty('totalEvents');
        });
    });

    it('should validate query parameters', () => {
      return request(app.getHttpServer())
        .get('/api/v1/analytics/reports/user-activity?userId=invalid-uuid&startDate=invalid-date&endDate=2024-01-31')
        .set('Authorization', 'Bearer test-token')
        .expect(400);
    });
  });
});