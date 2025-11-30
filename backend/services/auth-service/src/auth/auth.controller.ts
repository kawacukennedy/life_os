import {
  Controller,
  Request,
  Post,
  UseGuards,
  Body,
  Get,
  Query,
  Param,
  Put,
  UseInterceptors,
  UploadedFile,
  Delete,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiBody, ApiParam } from '@nestjs/swagger';
import { AuthService } from "./auth.service";
import { GoogleCalendarService } from "./google-calendar.service";
import { FileService } from "./file.service";
import { LocalAuthGuard } from "./local-auth.guard";
import { AuthGuard } from "@nestjs/passport";

@ApiTags('Authentication')
@Controller("auth")
export class AuthController {
  constructor(
    private authService: AuthService,
    private googleCalendarService: GoogleCalendarService,
    private fileService: FileService,
  ) {}

  @Post('login')
  @ApiOperation({
    summary: 'User login',
    description: 'Authenticate user with email and password credentials'
  })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    schema: {
      type: 'object',
      properties: {
        accessToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
        refreshToken: { type: 'string', example: 'refresh-token-here' },
        user: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'user-uuid' },
            email: { type: 'string', example: 'user@example.com' },
            fullName: { type: 'string', example: 'John Doe' }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['email', 'password'],
      properties: {
        email: { type: 'string', format: 'email', example: 'user@example.com' },
        password: { type: 'string', minLength: 6, example: 'securepassword' }
      }
    }
  })
  @UseGuards(LocalAuthGuard)
  async login(@Request() req) {
    return this.authService.login(req.user);
  }

  @Post("register")
  @ApiOperation({
    summary: 'User registration',
    description: 'Create a new user account with email, password, and profile information'
  })
  @ApiResponse({
    status: 201,
    description: 'Registration successful',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'user-uuid' },
        email: { type: 'string', example: 'user@example.com' },
        fullName: { type: 'string', example: 'John Doe' },
        timezone: { type: 'string', example: 'America/New_York' },
        isActive: { type: 'boolean', example: true },
        role: { type: 'string', example: 'user' },
        createdAt: { type: 'string', format: 'date-time' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['email', 'password', 'fullName', 'timezone'],
      properties: {
        email: { type: 'string', format: 'email', example: 'user@example.com' },
        password: { type: 'string', minLength: 6, example: 'securepassword' },
        fullName: { type: 'string', minLength: 2, example: 'John Doe' },
        timezone: { type: 'string', example: 'America/New_York' }
      }
    }
  })
  async register(
    @Body()
    body: {
      email: string;
      password: string;
      fullName: string;
      timezone: string;
    },
  ) {
    return this.authService.register(body);
  }

  @Get("google")
  @UseGuards(AuthGuard("google"))
  async googleAuth() {}

  @Get("google/callback")
  @UseGuards(AuthGuard("google"))
  async googleAuthRedirect(@Request() req) {
    return this.authService.login(req.user);
  }

  @Get("dashboard")
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get user dashboard',
    description: 'Retrieve personalized dashboard data with integrated service information'
  })
  @ApiResponse({
    status: 200,
    description: 'Dashboard data retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        tiles: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', example: 'health' },
              type: { type: 'string', example: 'health' },
              data: { type: 'object', description: 'Service-specific data' }
            }
          }
        },
        suggestions: {
          type: 'array',
          items: { type: 'string', example: 'Consider reviewing your budget goals' }
        }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @UseGuards(AuthGuard("jwt"))
  async getDashboard(@Request() req) {
    return this.authService.getDashboard(req.user.id);
  }

  // Google Calendar Integration
  @Get("google/calendar/auth")
  @UseGuards(AuthGuard("jwt"))
  async getGoogleCalendarAuthUrl(@Request() req) {
    const authUrl = await this.googleCalendarService.getAuthUrl(req.user.id);
    return { authUrl };
  }

  @Get("google/calendar/callback")
  async googleCalendarCallback(
    @Query("code") code: string,
    @Query("state") userId: string,
  ) {
    await this.googleCalendarService.handleCallback(code, userId);
    return { message: "Google Calendar connected successfully" };
  }

  @Get("google/calendar/events")
  @UseGuards(AuthGuard("jwt"))
  async getCalendarEvents(
    @Request() req,
    @Query("timeMin") timeMin?: string,
    @Query("timeMax") timeMax?: string,
  ) {
    return this.googleCalendarService.getCalendarEvents(
      req.user.id,
      timeMin,
      timeMax,
    );
  }

  @Post("google/calendar/events")
  @UseGuards(AuthGuard("jwt"))
  async createCalendarEvent(@Request() req, @Body() eventData: any) {
    return this.googleCalendarService.createCalendarEvent(
      req.user.id,
      eventData,
    );
  }

  @Put("google/calendar/events/:eventId")
  @UseGuards(AuthGuard("jwt"))
  async updateCalendarEvent(
    @Request() req,
    @Param("eventId") eventId: string,
    @Body() eventData: any,
  ) {
    return this.googleCalendarService.updateCalendarEvent(
      req.user.id,
      eventId,
      eventData,
    );
  }

  // File Upload
  @Post('upload/avatar')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Upload user avatar',
    description: 'Upload and update user profile avatar image'
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        avatar: {
          type: 'string',
          format: 'binary',
          description: 'Avatar image file (JPEG, PNG, max 5MB)'
        }
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Avatar uploaded successfully',
    schema: {
      type: 'object',
      properties: {
        filename: { type: 'string', example: 'avatar-uuid.jpg' },
        url: { type: 'string', example: 'http://localhost:3001/uploads/avatars/avatar-uuid.jpg' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid file format or size' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(FileInterceptor('avatar'))
  async uploadAvatar(@Request() req, @UploadedFile() file: Express.Multer.File) {
    const filename = await this.fileService.uploadAvatar(req.user.id, file);
    return { filename, url: this.fileService.getAvatarUrl(filename) };
  }

  @Delete("upload/avatar")
  @UseGuards(AuthGuard("jwt"))
  async deleteAvatar(@Request() req) {
    await this.fileService.deleteAvatar(req.user.id);
    return { message: "Avatar deleted successfully" };
  }

  // MFA Endpoints
  @Post('mfa/setup')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Setup MFA', description: 'Generate MFA secret and QR code' })
  async setupMFA(@Request() req) {
    return this.authService.setupMFA(req.user.id);
  }

  @Post('mfa/enable')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Enable MFA', description: 'Verify and enable MFA' })
  async enableMFA(@Request() req, @Body() body: { token: string }) {
    return this.authService.enableMFA(req.user.id, body.token);
  }

  @Post('mfa/disable')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Disable MFA', description: 'Disable MFA for user' })
  async disableMFA(@Request() req) {
    return this.authService.disableMFA(req.user.id);
  }

   @Post('mfa/verify')
   @ApiOperation({ summary: 'Verify MFA', description: 'Verify MFA token during login' })
   async verifyMFA(@Body() body: { userId: string; token: string; backupCode?: string }) {
     return this.authService.verifyMFA(body.userId, body.token, body.backupCode);
   }

   @Post('refresh')
   @ApiOperation({ summary: 'Refresh access token', description: 'Get new access token using refresh token' })
   async refreshToken(@Body() body: { refreshToken: string }) {
     return this.authService.refreshAccessToken(body.refreshToken);
   }

   @Post('logout')
   @UseGuards(AuthGuard('jwt'))
   @ApiOperation({ summary: 'Logout', description: 'Invalidate refresh token' })
   async logout(@Body() body: { refreshToken: string }) {
     return this.authService.logout(body.refreshToken);
   }

   @Post('logout-all')
   @UseGuards(AuthGuard('jwt'))
   @ApiOperation({ summary: 'Logout from all devices', description: 'Invalidate all refresh tokens for user' })
   async logoutAll(@Request() req) {
     return this.authService.logoutAll(req.user.id);
   }
 }
