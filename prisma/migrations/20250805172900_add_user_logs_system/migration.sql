BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[users] ADD [ubicacion] NVARCHAR(1000);

-- CreateTable
CREATE TABLE [dbo].[consulta_logs] (
    [id] NVARCHAR(1000) NOT NULL,
    [consultaType] NVARCHAR(1000) NOT NULL,
    [consultaSubtype] NVARCHAR(1000) NOT NULL,
    [parametros] NVARCHAR(1000) NOT NULL,
    [resultado] NVARCHAR(1000),
    [totalEncontrado] DECIMAL(15,2),
    [errorMessage] NVARCHAR(1000),
    [ip] NVARCHAR(1000),
    [userAgent] NVARCHAR(1000),
    [duracionMs] INT,
    [userId] NVARCHAR(1000) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [consulta_logs_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [consulta_logs_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[user_locations] (
    [id] NVARCHAR(1000) NOT NULL,
    [locationName] NVARCHAR(1000) NOT NULL,
    [locationCode] NVARCHAR(1000),
    [description] NVARCHAR(1000),
    [isActive] BIT NOT NULL CONSTRAINT [user_locations_isActive_df] DEFAULT 1,
    [assignedAt] DATETIME2 NOT NULL CONSTRAINT [user_locations_assignedAt_df] DEFAULT CURRENT_TIMESTAMP,
    [assignedBy] NVARCHAR(1000),
    [userId] NVARCHAR(1000) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [user_locations_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [user_locations_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [user_locations_userId_isActive_key] UNIQUE NONCLUSTERED ([userId],[isActive])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [consulta_logs_userId_consultaType_idx] ON [dbo].[consulta_logs]([userId], [consultaType]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [consulta_logs_createdAt_idx] ON [dbo].[consulta_logs]([createdAt]);

-- AddForeignKey
ALTER TABLE [dbo].[consulta_logs] ADD CONSTRAINT [consulta_logs_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[users]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[user_locations] ADD CONSTRAINT [user_locations_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[users]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
