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
    
    const missingColumns = [
        // Tabela Devices - Colunas Novas da v1.7.0+
        { table: 'Devices', col: 'ModelId', type: 'NVARCHAR(50)' },
        { table: 'Devices', col: 'PurchaseInvoiceUrl', type: 'NVARCHAR(MAX)' },
        { table: 'Devices', col: 'Imei', type: 'NVARCHAR(50)' },
        { table: 'Devices', col: 'PulsusId', type: 'NVARCHAR(50)' },
        { table: 'Devices', col: 'SectorId', type: 'NVARCHAR(50)' },
        { table: 'Devices', col: 'CostCenter', type: 'NVARCHAR(50)' },
        { table: 'Devices', col: 'LinkedSimId', type: 'NVARCHAR(50)' },
        { table: 'Devices', col: 'InvoiceNumber', type: 'NVARCHAR(50)' },
        { table: 'Devices', col: 'Supplier', type: 'NVARCHAR(100)' },
        { table: 'Devices', col: 'PurchaseDate', type: 'DATE' },
        { table: 'Devices', col: 'PurchaseCost', type: 'DECIMAL(18, 2)' },
        // Tabela Users
        { table: 'Users', col: 'Pis', type: 'NVARCHAR(20)' },
        { table: 'Users', col: 'Rg', type: 'NVARCHAR(20)' },
        { table: 'Users', col: 'HasPendingIssues', type: 'BIT' },
        { table: 'Users', col: 'PendingIssuesNote', type: 'NVARCHAR(MAX)' },
        // Tabela SystemSettings
        { table: 'SystemSettings', col: 'ReturnTermTemplate', type: 'NVARCHAR(MAX)' }
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
async function logAction(assetId, assetType, action, adminUser, notes) {
    try {
        const pool = await sql.connect(dbConfig);
        await pool.request()
            .input('Id', sql.NVarChar, Math.random().toString(36).substr(2, 9))
            .input('AssetId', sql.NVarChar, assetId)
            .input('AssetType', sql.NVarChar, assetType)
            .input('Action', sql.NVarChar, action)
            .input('AdminUser', sql.NVarChar, adminUser)
            .input('Notes', sql.NVarChar, notes || '')
            .query(`INSERT INTO AuditLogs (Id, AssetId, AssetType, Action, AdminUser, Notes) VALUES (@Id, @AssetId, @AssetType, @Action, @AdminUser, @Notes)`);
    } catch (e) { console.error('Log Error', e); }
}

// --- ROUTES ---

// Health Check
app.get('/', (req, res) => {
    res.send({ status: 'ok', service: 'IT Asset 360 API', port: PORT });
});

// 1. Devices (Updated to fetch Accessories)
app.get('/api/devices', async (req, res) => {
    try {
        const devices = await query(`
            SELECT 
                Id as id, ModelId as modelId, SerialNumber as serialNumber, 
                AssetTag as assetTag, Imei as imei, PulsusId as pulsusId,
                Status as status, CurrentUserId as currentUserId,
                SectorId as sectorId, CostCenter as costCenter, LinkedSimId as linkedSimId,
                PurchaseDate as purchaseDate, PurchaseCost as purchaseCost,
                InvoiceNumber as invoiceNumber, Supplier as supplier, PurchaseInvoiceUrl as purchaseInvoiceUrl
            FROM Devices
        `);
        
        // Fetch Accessories for all devices
        const accessories = await query(`SELECT Id as id, DeviceId as deviceId, AccessoryTypeId as accessoryTypeId, Name as name FROM DeviceAccessories`);
        
        // Merge
        const result = devices.map(d => ({
            ...d,
            accessories: accessories.filter(a => a.deviceId === d.id)
        }));

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
                INSERT INTO Devices (Id, ModelId, SerialNumber, AssetTag, Imei, PulsusId, Status, CurrentUserId, SectorId, CostCenter, LinkedSimId, PurchaseDate, PurchaseCost, InvoiceNumber, Supplier)
                VALUES (@Id, @ModelId, @SerialNumber, @AssetTag, @Imei, @PulsusId, @Status, @CurrentUserId, @SectorId, @CostCenter, @LinkedSimId, @PurchaseDate, @PurchaseCost, @InvoiceNumber, @Supplier)
            `);
        
        // Handle Accessories
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
            .input('Status', sql.NVarChar, d.status)
            .input('CurrentUserId', sql.NVarChar, d.currentUserId || null)
            .input('LinkedSimId', sql.NVarChar, d.linkedSimId || null)
            .input('SectorId', sql.NVarChar, d.sectorId || null)
            .query(`UPDATE Devices SET ModelId=@ModelId, Status=@Status, CurrentUserId=@CurrentUserId, LinkedSimId=@LinkedSimId, SectorId=@SectorId WHERE Id=@Id`);
        
        // Sync Accessories (Delete all and Re-insert is simplest strategy for now)
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

        res.json(d);
    } catch (err) { res.status(500).send(err.message); }
});

// ... (Sims Code remains same)

// 3. Users (Updated to include Pending Fields)
app.get('/api/users', async (req, res) => {
    try {
        const data = await query(`SELECT Id as id, FullName as fullName, Cpf as cpf, Rg as rg, Pis as pis, Address as address, Email as email, SectorId as sectorId, JobTitle as jobTitle, Active as active, HasPendingIssues as hasPendingIssues, PendingIssuesNote as pendingIssuesNote FROM Users`);
        const formatted = data.map(u => ({ ...u, active: !!u.active, hasPendingIssues: !!u.hasPendingIssues }));
        res.json(formatted);
    } catch (err) { res.status(500).send(err.message); }
});

// Update User (Generic)
app.put('/api/users/:id', async (req, res) => {
    const u = req.body;
    try {
        const pool = await sql.connect(dbConfig);
        await pool.request()
            .input('Id', sql.NVarChar, req.params.id)
            .input('FullName', sql.NVarChar, u.fullName)
            .input('Email', sql.NVarChar, u.email)
            .input('Active', sql.Bit, u.active ? 1 : 0)
            .input('HasPendingIssues', sql.Bit, u.hasPendingIssues ? 1 : 0)
            .input('PendingIssuesNote', sql.NVarChar, u.pendingIssuesNote || '')
            .query(`UPDATE Users SET FullName=@FullName, Email=@Email, Active=@Active, HasPendingIssues=@HasPendingIssues, PendingIssuesNote=@PendingIssuesNote WHERE Id=@Id`);
        res.json(u);
    } catch (err) { res.status(500).send(err.message); }
});

// ... (Other routes remain similar)

// NEW: Accessory Types
app.get('/api/accessory-types', async (req, res) => {
    const data = await query(`SELECT Id as id, Name as name FROM AccessoryTypes`);
    res.json(data);
});

app.post('/api/accessory-types', async (req, res) => {
    const t = req.body;
    try {
        const pool = await sql.connect(dbConfig);
        await pool.request()
            .input('Id', sql.NVarChar, t.id)
            .input('Name', sql.NVarChar, t.name)
            .query(`INSERT INTO AccessoryTypes (Id, Name) VALUES (@Id, @Name)`);
        await logAction(t.id, 'Type', 'Criação', t._adminUser, t.name);
        res.json(t);
    } catch (err) { res.status(500).send(err.message); }
});

app.delete('/api/accessory-types/:id', async (req, res) => {
    try {
        await query(`DELETE FROM AccessoryTypes WHERE Id = '${req.params.id}'`);
        res.json({ success: true });
    } catch (err) { res.status(500).send(err.message); }
});

// ... (Existing Routes)

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});