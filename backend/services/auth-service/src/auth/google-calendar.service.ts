import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { google } from "googleapis";
import { User } from "../users/user.entity";

@Injectable()
export class GoogleCalendarService {
  private oauth2Client: any;

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI ||
        "http://localhost:3001/auth/google/callback",
    );
  }

  async getAuthUrl(userId: string): Promise<string> {
    const scopes = [
      "https://www.googleapis.com/auth/calendar.readonly",
      "https://www.googleapis.com/auth/calendar.events",
    ];

    const url = this.oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: scopes,
      state: userId, // Pass user ID in state
    });

    return url;
  }

  async handleCallback(code: string, userId: string): Promise<void> {
    try {
      const { tokens } = await this.oauth2Client.getToken(code);
      this.oauth2Client.setCredentials(tokens);

      // Store tokens in user record
      await this.usersRepository.update(userId, {
        googleTokens: {
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          expiryDate: tokens.expiry_date,
        },
      });
    } catch (error) {
      console.error("Error handling Google OAuth callback:", error);
      throw error;
    }
  }

  async getCalendarEvents(userId: string, timeMin?: string, timeMax?: string) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user?.googleTokens) {
      throw new Error("User not connected to Google Calendar");
    }

    // Check if token is expired and refresh if needed
    if (this.isTokenExpired(user.googleTokens.expiryDate)) {
      await this.refreshAccessToken(userId);
      // Reload user with fresh tokens
      const updatedUser = await this.usersRepository.findOne({
        where: { id: userId },
      });
      if (!updatedUser?.googleTokens) {
        throw new Error("Failed to refresh Google tokens");
      }
      this.oauth2Client.setCredentials(updatedUser.googleTokens);
    } else {
      this.oauth2Client.setCredentials(user.googleTokens);
    }

    const calendar = google.calendar({
      version: "v3",
      auth: this.oauth2Client,
    });

    const response = await calendar.events.list({
      calendarId: "primary",
      timeMin: timeMin || new Date().toISOString(),
      timeMax: timeMax,
      maxResults: 50,
      singleEvents: true,
      orderBy: "startTime",
    });

    return response.data.items;
  }

  async createCalendarEvent(userId: string, eventData: any) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user?.googleTokens) {
      throw new Error("User not connected to Google Calendar");
    }

    this.oauth2Client.setCredentials(user.googleTokens);
    const calendar = google.calendar({
      version: "v3",
      auth: this.oauth2Client,
    });

    const response = await calendar.events.insert({
      calendarId: "primary",
      requestBody: eventData,
    });

    return response.data;
  }

  async updateCalendarEvent(userId: string, eventId: string, eventData: any) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user?.googleTokens) {
      throw new Error("User not connected to Google Calendar");
    }

    this.oauth2Client.setCredentials(user.googleTokens);
    const calendar = google.calendar({
      version: "v3",
      auth: this.oauth2Client,
    });

    const response = await calendar.events.update({
      calendarId: "primary",
      eventId,
      requestBody: eventData,
    });

    return response.data;
  }

  private async refreshAccessToken(userId: string): Promise<void> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user?.googleTokens?.refreshToken) {
      throw new Error("No refresh token available");
    }

    this.oauth2Client.setCredentials({
      refresh_token: user.googleTokens.refreshToken,
    });

    try {
      const { credentials } = await this.oauth2Client.refreshAccessToken();
      await this.usersRepository.update(userId, {
        googleTokens: {
          accessToken: credentials.access_token,
          refreshToken:
            credentials.refresh_token || user.googleTokens.refreshToken,
          expiryDate: credentials.expiry_date,
        },
      });
    } catch (error) {
      console.error("Error refreshing Google access token:", error);
      throw error;
    }
  }

  private isTokenExpired(expiryDate: number): boolean {
    return Date.now() >= expiryDate;
  }
}
