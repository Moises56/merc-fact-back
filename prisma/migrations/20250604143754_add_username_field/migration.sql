BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[users] (
    [id] NVARCHAR(1000) NOT NULL,
    [correo] NVARCHAR(1000) NOT NULL,
    [username] NVARCHAR(1000) NOT NULL,
    [nombre] NVARCHAR(1000) NOT NULL,
    [apellido] NVARCHAR(1000) NOT NULL,
    [contrasena] NVARCHAR(1000) NOT NULL,
    [telefono] NVARCHAR(1000),
    [dni] NVARCHAR(1000) NOT NULL,
    [gerencia] NVARCHAR(1000),
    [numero_empleado] INT,
    [role] NVARCHAR(1000) NOT NULL CONSTRAINT [users_role_df] DEFAULT 'USER',
    [isActive] BIT NOT NULL CONSTRAINT [users_isActive_df] DEFAULT 1,
    [lastLogin] DATETIME2,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [users_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [users_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [users_correo_key] UNIQUE NONCLUSTERED ([correo]),
    CONSTRAINT [users_username_key] UNIQUE NONCLUSTERED ([username]),
    CONSTRAINT [users_dni_key] UNIQUE NONCLUSTERED ([dni]),
    CONSTRAINT [users_numero_empleado_key] UNIQUE NONCLUSTERED ([numero_empleado])
);

-- CreateTable
CREATE TABLE [dbo].[mercados] (
    [id] NVARCHAR(1000) NOT NULL,
    [nombre_mercado] NVARCHAR(1000) NOT NULL,
    [direccion] NVARCHAR(1000) NOT NULL,
    [latitud] FLOAT(53) NOT NULL,
    [longitud] FLOAT(53) NOT NULL,
    [descripcion] NVARCHAR(1000),
    [isActive] BIT NOT NULL CONSTRAINT [mercados_isActive_df] DEFAULT 1,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [mercados_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [mercados_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [mercados_nombre_mercado_key] UNIQUE NONCLUSTERED ([nombre_mercado])
);

-- CreateTable
CREATE TABLE [dbo].[locales] (
    [id] NVARCHAR(1000) NOT NULL,
    [nombre_local] NVARCHAR(1000) NOT NULL,
    [numero_local] NVARCHAR(1000) NOT NULL,
    [permiso_operacion] NVARCHAR(1000) NOT NULL,
    [tipo_local] NVARCHAR(1000) NOT NULL,
    [direccion_local] NVARCHAR(1000) NOT NULL,
    [estado_local] NVARCHAR(1000) NOT NULL CONSTRAINT [locales_estado_local_df] DEFAULT 'PENDIENTE',
    [monto_mensual] DECIMAL(10,2) NOT NULL,
    [propietario] NVARCHAR(1000) NOT NULL,
    [dni_propietario] NVARCHAR(1000) NOT NULL,
    [telefono] NVARCHAR(1000),
    [email] NVARCHAR(1000),
    [latitud] FLOAT(53),
    [longitud] FLOAT(53),
    [mercadoId] NVARCHAR(1000) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [locales_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [locales_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [locales_numero_local_key] UNIQUE NONCLUSTERED ([numero_local]),
    CONSTRAINT [locales_permiso_operacion_key] UNIQUE NONCLUSTERED ([permiso_operacion])
);

-- CreateTable
CREATE TABLE [dbo].[facturas] (
    [id] NVARCHAR(1000) NOT NULL,
    [numero_factura] NVARCHAR(1000) NOT NULL,
    [correlativo] NVARCHAR(1000) NOT NULL,
    [concepto] NVARCHAR(1000) NOT NULL,
    [mes] NVARCHAR(1000) NOT NULL,
    [anio] INT NOT NULL,
    [monto] DECIMAL(10,2) NOT NULL,
    [estado] NVARCHAR(1000) NOT NULL CONSTRAINT [facturas_estado_df] DEFAULT 'PENDIENTE',
    [fecha_vencimiento] DATETIME2 NOT NULL,
    [fecha_pago] DATETIME2,
    [observaciones] NVARCHAR(1000),
    [mercado_nombre] NVARCHAR(1000) NOT NULL,
    [local_nombre] NVARCHAR(1000) NOT NULL,
    [local_numero] NVARCHAR(1000) NOT NULL,
    [propietario_nombre] NVARCHAR(1000) NOT NULL,
    [propietario_dni] NVARCHAR(1000) NOT NULL,
    [localId] NVARCHAR(1000) NOT NULL,
    [createdByUserId] NVARCHAR(1000) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [facturas_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [facturas_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [facturas_numero_factura_key] UNIQUE NONCLUSTERED ([numero_factura]),
    CONSTRAINT [facturas_correlativo_key] UNIQUE NONCLUSTERED ([correlativo]),
    CONSTRAINT [facturas_localId_mes_anio_key] UNIQUE NONCLUSTERED ([localId],[mes],[anio])
);

-- CreateTable
CREATE TABLE [dbo].[audit_logs] (
    [id] NVARCHAR(1000) NOT NULL,
    [accion] NVARCHAR(1000) NOT NULL,
    [tabla] NVARCHAR(1000) NOT NULL,
    [registroId] NVARCHAR(1000),
    [datosAntes] NVARCHAR(1000),
    [datosDespues] NVARCHAR(1000),
    [ip] NVARCHAR(1000),
    [userAgent] NVARCHAR(1000),
    [userId] NVARCHAR(1000) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [audit_logs_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [audit_logs_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- AddForeignKey
ALTER TABLE [dbo].[locales] ADD CONSTRAINT [locales_mercadoId_fkey] FOREIGN KEY ([mercadoId]) REFERENCES [dbo].[mercados]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[facturas] ADD CONSTRAINT [facturas_localId_fkey] FOREIGN KEY ([localId]) REFERENCES [dbo].[locales]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[facturas] ADD CONSTRAINT [facturas_createdByUserId_fkey] FOREIGN KEY ([createdByUserId]) REFERENCES [dbo].[users]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[audit_logs] ADD CONSTRAINT [audit_logs_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[users]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
