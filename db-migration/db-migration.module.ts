import { Module, forwardRef } from '@nestjs/common';
import { DbMigrationService } from './db-migration.service';
import { DbMigrationController } from './db-migration.controller';
import { CronModule } from 'src/cron/cron.module';
import { TaskScheduleService } from 'src/cron/task-scheduler.service';
import { SearchModule } from 'src/modules/search/search.module';

@Module({
  imports: [forwardRef(() => CronModule), SearchModule],
  controllers: [DbMigrationController],
  providers: [DbMigrationService, TaskScheduleService],
  exports: [DbMigrationService]
})
export class DbMigrationModule { }
