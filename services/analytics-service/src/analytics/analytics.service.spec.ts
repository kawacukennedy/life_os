import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsService } from './analytics.service';
import { AnalyticsEvent } from './analytics-event.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventProcessorService } from './event-processor.service';
import { BigQueryService } from './bigquery.service';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let eventRepository: Repository<AnalyticsEvent>;
  let eventProcessor: EventProcessorService;
  let bigQueryService: BigQueryService;

  const mockEventRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
  };

  const mockEventProcessor = {
    processEvent: jest.fn(),
  };

  const mockBigQueryService = {
    insertEvent: jest.fn(),
    insertEvents: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        {
          provide: getRepositoryToken(AnalyticsEvent),
          useValue: mockEventRepository,
        },
        {
          provide: EventProcessorService,
          useValue: mockEventProcessor,
        },
        {
          provide: BigQueryService,
          useValue: mockBigQueryService,
        },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
    eventRepository = module.get<Repository<AnalyticsEvent>>(getRepositoryToken(AnalyticsEvent));
    eventProcessor = module.get<EventProcessorService>(EventProcessorService);
    bigQueryService = module.get<BigQueryService>(BigQueryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('trackEvent', () => {
    it('should track a single event', async () => {
      const eventData = { userId: 'user1', eventType: 'page_view' };
      const processedEvent = { ...eventData, timestamp: new Date() };

      mockEventProcessor.processEvent.mockReturnValue(processedEvent);
      mockEventRepository.create.mockReturnValue(processedEvent);
      mockEventRepository.save.mockResolvedValue(processedEvent);
      mockBigQueryService.insertEvent.mockResolvedValue(undefined);

      const result = await service.trackEvent(eventData);

      expect(mockEventProcessor.processEvent).toHaveBeenCalledWith(eventData);
      expect(mockEventRepository.create).toHaveBeenCalledWith(processedEvent);
      expect(mockEventRepository.save).toHaveBeenCalledWith(processedEvent);
      expect(mockBigQueryService.insertEvent).toHaveBeenCalledWith(processedEvent);
      expect(result).toEqual({ success: true, eventId: undefined });
    });
  });

  describe('trackEvents', () => {
    it('should track multiple events', async () => {
      const events = [
        { userId: 'user1', eventType: 'page_view' },
        { userId: 'user2', eventType: 'button_click' },
      ];
      const processedEvents = events.map(event => ({ ...event, timestamp: new Date() }));

      mockEventProcessor.processEvent.mockImplementation(event => ({ ...event, timestamp: new Date() }));
      mockEventRepository.save.mockResolvedValue(processedEvents);
      mockBigQueryService.insertEvents.mockResolvedValue(undefined);

      const result = await service.trackEvents(events);

      expect(mockEventProcessor.processEvent).toHaveBeenCalledTimes(2);
      expect(mockEventRepository.save).toHaveBeenCalledWith(processedEvents);
      expect(mockBigQueryService.insertEvents).toHaveBeenCalledWith(processedEvents);
      expect(result).toEqual({ success: true, eventsTracked: 2 });
    });
  });

  describe('getUserActivityReport', () => {
    it('should return user activity report', async () => {
      const userId = 'user1';
      const startDate = '2024-01-01';
      const endDate = '2024-01-31';
      const mockEvents = [
        { userId, eventType: 'page_view', timestamp: new Date('2024-01-15') },
        { userId, eventType: 'button_click', timestamp: new Date('2024-01-16') },
      ];

      mockEventRepository.find.mockResolvedValue(mockEvents);

      const result = await service.getUserActivityReport(userId, startDate, endDate);

      expect(mockEventRepository.find).toHaveBeenCalledWith({
        where: {
          userId,
          timestamp: expect.any(Object), // Between query
        },
        order: { timestamp: 'ASC' },
      });
      expect(result).toHaveProperty('userId', userId);
      expect(result).toHaveProperty('activity');
      expect(result).toHaveProperty('totalEvents', 2);
    });
  });
});