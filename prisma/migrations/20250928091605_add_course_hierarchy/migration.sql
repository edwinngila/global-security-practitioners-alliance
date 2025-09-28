-- CreateTable
CREATE TABLE `SubTopic` (
    `id` VARCHAR(191) NOT NULL,
    `levelId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `orderIndex` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `estimatedDuration` INTEGER NULL,
    `learningObjectives` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SubTopicContent` (
    `id` VARCHAR(191) NOT NULL,
    `subTopicId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `contentType` ENUM('VIDEO', 'DOCUMENT', 'QUIZ', 'ASSIGNMENT', 'LIVE_SESSION', 'NOTES', 'STUDY_GUIDE', 'TEXT') NOT NULL,
    `contentUrl` VARCHAR(191) NULL,
    `contentText` TEXT NULL,
    `durationMinutes` INTEGER NULL,
    `isRequired` BOOLEAN NOT NULL DEFAULT true,
    `orderIndex` INTEGER NOT NULL DEFAULT 0,
    `isPublished` BOOLEAN NOT NULL DEFAULT false,
    `publishedAt` DATETIME(3) NULL,
    `createdById` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SubTopicTest` (
    `id` VARCHAR(191) NOT NULL,
    `subTopicId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `questions` JSON NOT NULL,
    `totalQuestions` INTEGER NOT NULL,
    `passingScore` INTEGER NOT NULL DEFAULT 70,
    `timeLimit` INTEGER NOT NULL DEFAULT 600,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `SubTopicTest_subTopicId_key`(`subTopicId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ModuleTest` (
    `id` VARCHAR(191) NOT NULL,
    `moduleId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `questions` JSON NOT NULL,
    `totalQuestions` INTEGER NOT NULL,
    `passingScore` INTEGER NOT NULL DEFAULT 70,
    `timeLimit` INTEGER NOT NULL DEFAULT 3600,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ModuleTest_moduleId_key`(`moduleId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `SubTopic` ADD CONSTRAINT `SubTopic_levelId_fkey` FOREIGN KEY (`levelId`) REFERENCES `Level`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SubTopicContent` ADD CONSTRAINT `SubTopicContent_subTopicId_fkey` FOREIGN KEY (`subTopicId`) REFERENCES `SubTopic`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SubTopicContent` ADD CONSTRAINT `SubTopicContent_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SubTopicTest` ADD CONSTRAINT `SubTopicTest_subTopicId_fkey` FOREIGN KEY (`subTopicId`) REFERENCES `SubTopic`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ModuleTest` ADD CONSTRAINT `ModuleTest_moduleId_fkey` FOREIGN KEY (`moduleId`) REFERENCES `Module`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
