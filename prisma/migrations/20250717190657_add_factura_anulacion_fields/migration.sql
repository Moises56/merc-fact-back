BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[facturas] ADD [anulada_por_user_id] NVARCHAR(1000),
[fecha_anulacion] DATETIME2,
[razon_anulacion] NVARCHAR(1000);

-- AddForeignKey
ALTER TABLE [dbo].[facturas] ADD CONSTRAINT [facturas_anulada_por_user_id_fkey] FOREIGN KEY ([anulada_por_user_id]) REFERENCES [dbo].[users]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
