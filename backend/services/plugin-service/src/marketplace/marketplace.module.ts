import { Module } from "@nestjs/common";
import { MarketplaceService } from "./marketplace.service";
import { MarketplaceController } from "./marketplace.controller";
import { PluginModule } from "../plugins/plugin.module";

@Module({
  imports: [PluginModule],
  controllers: [MarketplaceController],
  providers: [MarketplaceService],
  exports: [MarketplaceService],
})
export class MarketplaceModule {}