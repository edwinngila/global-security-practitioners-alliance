-- AlterTable
ALTER TABLE `subtopic` ADD COLUMN `attachments` JSON NULL,
    ADD COLUMN `externalLinks` JSON NULL,
    ADD COLUMN `readingMaterial` TEXT NULL;

-- AlterTable
ALTER TABLE `testquestion` ADD COLUMN `modelId` VARCHAR(191) NULL,
    ADD COLUMN `modelType` VARCHAR(191) NULL;
