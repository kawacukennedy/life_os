import { Test, TestingModule } from '@nestjs/testing';
import { SecurityMiddleware } from './security.middleware';

describe('SecurityMiddleware', () => {
  let middleware: SecurityMiddleware;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SecurityMiddleware],
    }).compile();

    middleware = module.get<SecurityMiddleware>(SecurityMiddleware);
  });

  it('should be defined', () => {
    expect(middleware).toBeDefined();
  });

  describe('use', () => {
    let mockReq: any;
    let mockRes: any;
    let mockNext: jest.Mock;

    beforeEach(() => {
      mockReq = {
        path: '/test',
        headers: {},
      };
      mockRes = {
        setHeader: jest.fn(),
        getHeader: jest.fn(),
      };
      mockNext = jest.fn();
    });

    it('should apply helmet security headers', () => {
      const helmetSpy = jest.fn();
      jest.doMock('helmet', () => helmetSpy);

      middleware.use(mockReq, mockRes, mockNext);

      // Helmet should be called
      expect(helmetSpy).toHaveBeenCalled();
    });

    it('should apply CORS', () => {
      const corsSpy = jest.fn();
      jest.doMock('cors', () => corsSpy);

      middleware.use(mockReq, mockRes, mockNext);

      // CORS should be called with proper config
      expect(corsSpy).toHaveBeenCalledWith({
        origin: expect.any(Array),
        credentials: true,
      });
    });

    it('should apply general rate limiting for non-auth routes', () => {
      const rateLimitSpy = jest.fn((req, res, next) => next());
      jest.doMock('express-rate-limit', () => rateLimitSpy);

      middleware.use(mockReq, mockRes, mockNext);

      // General rate limiter should be called
      expect(rateLimitSpy).toHaveBeenCalled();
    });

    it('should apply auth-specific rate limiting for login routes', () => {
      mockReq.path = '/auth/login';

      const rateLimitSpy = jest.fn((req, res, next) => next());
      jest.doMock('express-rate-limit', () => rateLimitSpy);

      middleware.use(mockReq, mockRes, mockNext);

      // Auth rate limiter should be called for login routes
      expect(rateLimitSpy).toHaveBeenCalled();
    });

    it('should apply auth-specific rate limiting for signup routes', () => {
      mockReq.path = '/auth/signup';

      const rateLimitSpy = jest.fn((req, res, next) => next());
      jest.doMock('express-rate-limit', () => rateLimitSpy);

      middleware.use(mockReq, mockRes, mockNext);

      // Auth rate limiter should be called for signup routes
      expect(rateLimitSpy).toHaveBeenCalled();
    });
  });
});