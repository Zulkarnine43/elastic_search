import { Controller, Get, Post, Body, Patch, Param, Delete, HttpException, Version, UseGuards } from '@nestjs/common';
import { DbMigrationService } from './db-migration.service';
import { UpdateExportCronSettings } from './dto/update-cron-settings.dto';
import { UserTypes } from 'src/common/decorators/user-type.decorator';
import { UserType } from 'src/modules/user/entities/user.entity';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { UserTypeGuard } from 'src/common/guards/user-type.guard';
import { MediaSoftProductDto, MediaSoftProductStockDto } from './dto/create-db-migration.dto';

@Controller('db-migration')
export class DbMigrationController {
  constructor(
    private readonly migrationService: DbMigrationService,
  ) { }

  @Post('mediasoft-migration')
  @Version('1')
  @UserTypes(UserType.ADMIN)
  @UseGuards(JwtAuthGuard, UserTypeGuard)
  async migrateWithMediaSoft() {
    try {
      const data = await this.migrationService.migrateMediaSoftInstant()

      return {
        success: true,
        message: "Wait 15 seconds for the migration to complete"
      }
    } catch (error) {
      console.log(error)
      throw new HttpException(error.message, error.status);
    }
  }

  @Post('migrate-with-mediasoft-gadget')
  @Version('1')
  @UserTypes(UserType.ADMIN)
  @UseGuards(JwtAuthGuard, UserTypeGuard)
  async migrateMediaSoftGadgetProduct(@Body() mediaSoftProductDto: MediaSoftProductDto) {
    try {
      const data = await this.migrationService.migrateMediaSoftGadgetModelProduct(mediaSoftProductDto);

      return {
        success: true,
        data
      }
    } catch (error) {
      console.log(error)
      throw new HttpException(error.message, error.status);
    }
  }


  @Post('migrate-with-mediasoft')
  @Version('1')
  @UserTypes(UserType.ADMIN)
  @UseGuards(JwtAuthGuard, UserTypeGuard)
  async migrateMediaSoftProduct(@Body() mediaSoftProductDto: MediaSoftProductDto) {
    try {
      const data = await this.migrationService.migrateMediaSoftProduct(mediaSoftProductDto);

      return {
        success: true,
        data
      }
    } catch (error) {
      console.log(error)
      throw new HttpException(error.message, error.status);
    }
  }

  @Post('migrate-with-mediasoft-stock')
  @Version('1')
  @UserTypes(UserType.ADMIN)
  @UseGuards(JwtAuthGuard, UserTypeGuard)
  async migrateStockQuantity(@Body() mediaSoftProductStockDto: MediaSoftProductStockDto) {
    try {
      const data = await this.migrationService.migrateStockQuantity(mediaSoftProductStockDto);

      return {
        success: true,
        data
      }
    } catch (error) {
      console.log(error)
      throw new HttpException(error.message, error.status);
    }
  }

  @Patch('update-migration-cron-settings')
  @Version('1')
  @UserTypes(UserType.ADMIN)
  @UseGuards(JwtAuthGuard, UserTypeGuard)
  async updateMigrationCronTime(@Body() updateCronDto: UpdateExportCronSettings) {
    try {
      await this.migrationService.updateDbMigrationCronSettings(updateCronDto);

      return {
        success: true,
        message: 'Successfully updated'
      }
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }

  @Patch('update-order-cron-settings')
  @Version('1')
  @UserTypes(UserType.ADMIN)
  @UseGuards(JwtAuthGuard, UserTypeGuard)
  async updateOrderCronTime(@Body() updateCronDto: UpdateExportCronSettings) {
    try {
      await this.migrationService.updateOrderCronSettings(updateCronDto);

      return {
        success: true,
        message: 'Successfully updated'
      }
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }

  @Post('migrate-product-log')
  @Version('1')
  @UserTypes(UserType.ADMIN)
  @UseGuards(JwtAuthGuard, UserTypeGuard)
  async migrateProductLog(@Body() mediaSoftProductDto: MediaSoftProductDto) {
    try {
      const data = await this.migrationService.migrateProductLog();

      return {
        success: true,
        data
      }
    } catch (error) {
      console.log(error)
      throw new HttpException(error.message, error.status);
    }
  }

}
