import { Injectable, ArgumentMetadata, BadRequestException, ValidationPipe } from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import DOMPurify from 'isomorphic-dompurify';

@Injectable()
export class SanitizationValidationPipe extends ValidationPipe {
  async transform(value: any, metadata: ArgumentMetadata) {
    // Sanitize input data
    const sanitizedValue = this.sanitizeInput(value);

    // Call parent transform for validation
    return super.transform(sanitizedValue, metadata);
  }

  private sanitizeInput(value: any): any {
    if (typeof value === 'string') {
      // Sanitize HTML and prevent XSS
      return DOMPurify.sanitize(value, {
        ALLOWED_TAGS: [], // No HTML tags allowed
        ALLOWED_ATTR: [],
      }).trim();
    }

    if (Array.isArray(value)) {
      return value.map(item => this.sanitizeInput(item));
    }

    if (value && typeof value === 'object') {
      const sanitized: any = {};
      for (const [key, val] of Object.entries(value)) {
        sanitized[key] = this.sanitizeInput(val);
      }
      return sanitized;
    }

    return value;
  }
}