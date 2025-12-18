
const express = require('express');
const sql = require('mssql');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// SQL Configuration
const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    port: parseInt(process.env.DB_PORT || '1433'),
    database: process.env.DB_DATABASE,
    options: {
        encrypt: false, // Set to true if using Azure
        trustServerCertificate: true,
        enableArithAbort: true
    }
};

// --- AUTO MIGRATION SYSTEM ---
async function runMigrations(pool) {
    console.log('🔄 Verificando esquema do banco de dados (Auto-Migração)...');
    
    // 1. Create Tables if not exist
    const createTablesQuery = `
        IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'AccessoryTypes')
        CREATE TABLE AccessoryTypes (
            Id NVARCHAR(50) PRIMARY KEY,
            Name NVARCHAR(100) NOT NULL
        );

        IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'CustomFields')
        CREATE TABLE CustomFields (
            Id NVARCHAR(50) PRIMARY KEY,
            Name NVARCHAR(100) NOT NULL
        );

        IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'DeviceAccessories')
        CREATE TABLE DeviceAccessories (
            Id NVARCHAR(50) PRIMARY KEY,
            DeviceId NVARCHAR(50) NOT NULL,
            AccessoryTypeId NVARCHAR(50) NOT NULL,
            Name NVARCHAR(100),
            CONSTRAINT FK_DevAcc_Devices FOREIGN KEY (DeviceId) REFERENCES Devices(Id) ON DELETE CASCADE,
            CONSTRAINT FK_DevAcc_Type FOREIGN KEY (AccessoryTypeId) REFERENCES AccessoryTypes(Id)
        );
    `;
    try {
        await pool.request().query(createTablesQuery);
    } catch (e) {
        console.warn('⚠️ Erro na criação de tabelas novas:', e.message);
    }

    // 2. Add Columns to Existing Tables
    const missingColumns = [
        // Tabela Devices
        { table: 'Devices', col: 'CustomData', type: 'NVARCHAR(MAX)' }, 
        { table: 'Devices', col: 'ModelId', type: 'NVARCHAR(50)' },
        { table: 'Devices', col: 'PurchaseInvoiceUrl', type: 'NVARCHAR(MAX)' },
        { table: 'Devices', col: 'Imei', type: 'NVARCHAR(50)' },
        { table: 'Devices', col: 'PulsusId', type: 'NVARCHAR(50)' },
        { table: 'Devices', col: 'SectorCode', type: 'NVARCHAR(50)' }, // RENOMEADO
        { table: 'Devices', col: 'SectorId', type: 'NVARCHAR(50)' },
        { table: 'Devices', col: 'CostCenter', type: 'NVARCHAR(50)' },
        { table: 'Devices', col: 'LinkedSimId', type: 'NVARCHAR(50)' },
        { table: 'Devices', col: 'InvoiceNumber', type: 'NVARCHAR(50)' },
        { table: 'Devices', col: 'Supplier', type: 'NVARCHAR(100)' },
        { table: 'Devices', col: 'PurchaseDate', type: 'DATE' },
        { table: 'Devices', col: 'PurchaseCost', type: 'DECIMAL(18, 2)' },
        
        // Tabela AssetTypes
        { table: 'AssetTypes', col: 'CustomFieldIds', type: 'NVARCHAR(MAX)' }, 

        // Tabela Users
        { table: 'Users', col: 'Pis', type: 'NVARCHAR(20)' },
        { table: 'Users', col: 'Rg', type: 'NVARCHAR(20)' },
        { table: 'Users', col: 'SectorCode', type: 'NVARCHAR(50)' }, // ADICIONADO AOS USUÁRIOS
        { table: 'Users', col: 'HasPendingIssues', type: 'BIT' },
        { table: 'Users', col: 'PendingIssuesNote', type: 'NVARCHAR(MAX)' },
        
        // Tabela SystemSettings
        { table: 'SystemSettings', col: 'ReturnTermTemplate', type: 'NVARCHAR(MAX)' },
        
        // Tabela AuditLogs
        { table: 'AuditLogs', col: 'BackupData', type: 'NVARCHAR(MAX)' }
    ];

    for (const item of missingColumns) {
        try {
            await pool.request().query(`
                IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = '${item.table}')
                BEGIN
                    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = '${item.table}' AND COLUMN_NAME = '${item.col}')
                    BEGIN
                        ALTER TABLE ${item.table} ADD ${item.col} ${item.type};
                        PRINT 'Coluna ${item.col} adicionada em ${item.table}';
                    END
                END
            `);
        } catch (e) {
            console.warn(`⚠️ Aviso de Migração (${item.table}.${item.col}):`, e.message);
        }
    }
    console.log('✅ Banco de Dados Verificado/Atualizado.');
}

// Connect to Database & Run Migrations
sql.connect(dbConfig).then(async pool => {
    if (pool.connected) {
        console.log('✅ Connected to SQL Server');
        await runMigrations(pool);
    }
}).catch(err => {
    console.error('❌ Database Connection Failed:', err);
});

// Helper to execute query
async function query(command) {
    try {
        const pool = await sql.connect(dbConfig);
        const result = await pool.request().query(command);
        return result.recordset;
    } catch (err) {
        console.error('SQL Error:', err);
        throw err;
    }
}

// --- HELPER LOG ---
async function logAction(assetId, assetType, action, adminUser, notes, backupData = null) {
    try {
        const pool = await sql.connect(dbConfig);
        await pool.request()
            .input('Id', sql.NVarChar, Math.random().toString(36).substr(2, 9))
            .input('AssetId', sql.NVarChar, assetId)
            .input('AssetType', sql.NVarChar, assetType)
            .input('Action', sql.NVarChar, action)
            .input('AdminUser', sql.NVarChar, adminUser || 'Sistema')
            .input('Notes', sql.NVarChar, notes || '')
            .input('BackupData', sql.NVarChar, backupData)
            .query(`INSERT INTO AuditLogs (Id, AssetId, AssetType, Action, AdminUser, Notes, BackupData) VALUES (@Id, @AssetId, @AssetType, @Action, @AdminUser, @Notes, @BackupData)`);
    } catch (e) { console.error('Log Error', e); }
}

// --- ROUTES ---

// Health Check
app.get('/', (req, res) => {
    res.send({ status: 'ok', service: 'IT Asset 360 API', port: PORT });
});

// 1. Devices
app.get('/api/devices', async (req, res) => {
    try {
        const devices = await query(`
            SELECT 
                Id as id, ModelId as modelId, SerialNumber as serialNumber, 
                AssetTag as assetTag, Imei as imei, PulsusId as pulsusId, SectorCode as sectorCode,
                CustomData as customDataStr,
                Status as status, CurrentUserId as currentUserId,
                SectorId as sectorId, CostCenter as costCenter, LinkedSimId as linkedSimId,
                PurchaseDate as purchaseDate, PurchaseCost as purchaseCost,
                InvoiceNumber as invoiceNumber, Supplier as supplier, PurchaseInvoiceUrl as purchaseInvoiceUrl
            FROM Devices
        `);
        
        let accessories = [];
        try {
            accessories = await query(`SELECT Id as id, DeviceId as deviceId, AccessoryTypeId as accessoryTypeId, Name as name FROM DeviceAccessories`);
        } catch(e) {
            console.warn('Could not fetch accessories:', e.message);
        }
        
        const result = devices.map(d => {
            let customData = {};
            try {
                if (d.customDataStr) customData = JSON.parse(d.customDataStr);
            } catch(e) {}

            return {
                ...d,
                customData,
                accessories: accessories.filter(a => a.deviceId === d.id)
            };
        });

        res.json(result);
    } catch (err) { res.status(500).send(err.message); }
});

app.post('/api/devices', async (req, res) => {
    const d = req.body;
    try {
        const pool = await sql.connect(dbConfig);
        await pool.request()
            .input('Id', sql.NVarChar, d.id)
            .input('ModelId', sql.NVarChar, d.modelId)
            .input('SerialNumber', sql.NVarChar, d.serialNumber)
            .input('AssetTag', sql.NVarChar, d.assetTag)
            .input('Imei', sql.NVarChar, d.imei || null)
            .input('PulsusId', sql.NVarChar, d.pulsusId || null)
            .input('SectorCode', sql.NVarChar, d.sectorCode || null)
            .input('CustomData', sql.NVarChar, JSON.stringify(d.customData || {}))
            .input('Status', sql.NVarChar, d.status)
            .input('CurrentUserId', sql.NVarChar, d.currentUserId || null)
            .input('SectorId', sql.NVarChar, d.sectorId || null)
            .input('CostCenter', sql.NVarChar, d.costCenter || null)
            .input('LinkedSimId', sql.NVarChar, d.linkedSimId || null)
            .input('PurchaseDate', sql.Date, d.purchaseDate || null)
            .input('PurchaseCost', sql.Decimal(18,2), d.purchaseCost || 0)
            .input('InvoiceNumber', sql.NVarChar, d.invoiceNumber || null)
            .input('Supplier', sql.NVarChar, d.supplier || null)
            .query(`
                INSERT INTO Devices (Id, ModelId, SerialNumber, AssetTag, Imei, PulsusId, SectorCode, CustomData, Status, CurrentUserId, SectorId, CostCenter, LinkedSimId, PurchaseDate, PurchaseCost, InvoiceNumber, Supplier)
                VALUES (@Id, @ModelId, @SerialNumber, @AssetTag, @Imei, @PulsusId, @SectorCode, @CustomData, @Status, @CurrentUserId, @SectorId, @CostCenter, @LinkedSimId, @PurchaseDate, @PurchaseCost, @InvoiceNumber, @Supplier)
            `);
        
        if (d.accessories && d.accessories.length > 0) {
            for (const acc of d.accessories) {
                await pool.request()
                    .input('Id', sql.NVarChar, acc.id)
                    .input('DeviceId', sql.NVarChar, d.id)
                    .input('AccessoryTypeId', sql.NVarChar, acc.accessoryTypeId)
                    .input('Name', sql.NVarChar, acc.name)
                    .query(`INSERT INTO DeviceAccessories (Id, DeviceId, AccessoryTypeId, Name) VALUES (@Id, @DeviceId, @AccessoryTypeId, @Name)`);
            }
        }

        await logAction(d.id, 'Device', 'Criação', d._adminUser, 'Novo dispositivo');
        res.json(d);
    } catch (err) { res.status(500).send(err.message); }
});

app.put('/api/devices/:id', async (req, res) => {
    const d = req.body;
    try {
        const pool = await sql.connect(dbConfig);
        await pool.request()
            .input('Id', sql.NVarChar, req.params.id)
            .input('ModelId', sql.NVarChar, d.modelId)
            .input('SectorCode', sql.NVarChar, d.sectorCode || null)
            .input('PulsusId', sql.NVarChar, d.pulsusId || null)
            .input('CustomData', sql.NVarChar, JSON.stringify(d.customData || {}))
            .input('Status', sql.NVarChar, d.status)
            .input('CurrentUserId', sql.NVarChar, d.currentUserId || null)
            .input('LinkedSimId', sql.NVarChar, d.linkedSimId || null)
            .input('SectorId', sql.NVarChar, d.sectorId || null)
            .input('CostCenter', sql.NVarChar, d.costCenter || null)
            .query(`UPDATE Devices SET ModelId=@ModelId, SectorCode=@SectorCode, PulsusId=@PulsusId, CustomData=@CustomData, Status=@Status, CurrentUserId=@CurrentUserId, LinkedSimId=@LinkedSimId, SectorId=@SectorId, CostCenter=@CostCenter WHERE Id=@Id`);
        
        try {
            await pool.request().query(`DELETE FROM DeviceAccessories WHERE DeviceId='${req.params.id}'`);
            if (d.accessories && d.accessories.length > 0) {
                for (const acc of d.accessories) {
                    await pool.request()
                        .input('Id', sql.NVarChar, acc.id || Math.random().toString(36).substr(2,9))
                        .input('DeviceId', sql.NVarChar, d.id)
                        .input('AccessoryTypeId', sql.NVarChar, acc.accessoryTypeId)
                        .input('Name', sql.NVarChar, acc.name)
                        .query(`INSERT INTO DeviceAccessories (Id, DeviceId, AccessoryTypeId, Name) VALUES (@Id, @DeviceId, @AccessoryTypeId, @Name)`);
                }
            }
        } catch(e) { console.error('Accessory sync failed', e); }

        await logAction(d.id, 'Device', 'Atualização', d._adminUser, `Atualização de cadastro (Tag: ${d.assetTag})`);
        res.json(d);
    } catch (err) { res.status(500).send(err.message); }
});

app.delete('/api/devices/:id', async (req, res) => {
    const { _adminUser, reason } = req.body;
    try {
        const pool = await sql.connect(dbConfig);
        const toDelete = await pool.request().query(`SELECT * FROM Devices WHERE Id = '${req.params.id}'`);
        
        if (toDelete.recordset.length > 0) {
            const backupJson = JSON.stringify(toDelete.recordset[0]);
            await query(`DELETE FROM Devices WHERE Id = '${req.params.id}'`);
            await logAction(req.params.id, 'Device', 'Exclusão', _adminUser || 'Sistema', `Motivo: ${reason || 'Não informado'}`, backupJson); 
        }
        res.json({ success: true });
    } catch (err) { res.status(500).send(err.message); }
});

app.get('/api/users', async (req, res) => { try { const data = await query(`SELECT Id as id, FullName as fullName, Cpf as cpf, Rg as rg, Pis as pis, SectorCode as sectorCode, Address as address, Email as email, SectorId as sectorId, JobTitle as jobTitle, Active as active, HasPendingIssues as hasPendingIssues, PendingIssuesNote as pendingIssuesNote FROM Users`); const formatted = data.map(u => ({ ...u, active: !!u.active, hasPendingIssues: !!u.hasPendingIssues })); res.json(formatted); } catch (err) { res.status(500).send(err.message); } });
app.post('/api/users', async (req, res) => { const u = req.body; try { const pool = await sql.connect(dbConfig); await pool.request().input('Id', sql.NVarChar, u.id).input('FullName', sql.NVarChar, u.fullName).input('Cpf', sql.NVarChar, u.cpf).input('Rg', sql.NVarChar, u.rg).input('SectorCode', sql.NVarChar, u.sectorCode || null).input('Email', sql.NVarChar, u.email).input('SectorId', sql.NVarChar, u.sectorId).input('JobTitle', sql.NVarChar, u.jobTitle).input('Address', sql.NVarChar, u.address || '').query(`INSERT INTO Users (Id, FullName, Cpf, Rg, SectorCode, Email, SectorId, JobTitle, Address, Active) VALUES (@Id, @FullName, @Cpf, @Rg, @SectorCode, @Email, @SectorId, @JobTitle, @Address, 1)`); await logAction(u.id, 'User', 'Criação', u._adminUser, u.fullName); res.json(u); } catch (err) { res.status(500).send(err.message); } });
app.put('/api/users/:id', async (req, res) => { const u = req.body; try { const pool = await sql.connect(dbConfig); await pool.request().input('Id', sql.NVarChar, req.params.id).input('FullName', sql.NVarChar, u.fullName).input('Email', sql.NVarChar, u.email).input('SectorCode', sql.NVarChar, u.sectorCode || null).input('SectorId', sql.NVarChar, u.sectorId).input('JobTitle', sql.NVarChar, u.jobTitle).input('Active', sql.Bit, u.active ? 1 : 0).input('HasPendingIssues', sql.Bit, u.hasPendingIssues ? 1 : 0).input('PendingIssuesNote', sql.NVarChar, u.pendingIssuesNote || '').query(`UPDATE Users SET FullName=@FullName, Email=@Email, SectorCode=@SectorCode, SectorId=@SectorId, JobTitle=@JobTitle, Active=@Active, HasPendingIssues=@HasPendingIssues, PendingIssuesNote=@PendingIssuesNote WHERE Id=@Id`); await logAction(u.id, 'User', 'Atualização', u._adminUser, 'Dados atualizados'); res.json(u); } catch (err) { res.status(500).send(err.message); } });

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
