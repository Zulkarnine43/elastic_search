import { Test, TestingModule } from '@nestjs/testing';
import { DbMigrationController } from './db-migration.controller';
import { DbMigrationService } from './db-migration.service';

describe('DbMigrationController', () => {
  let controller: DbMigrationController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DbMigrationController],
      providers: [DbMigrationService],
    }).compile();

    controller = module.get<DbMigrationController>(DbMigrationController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
