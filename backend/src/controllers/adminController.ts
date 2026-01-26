
import { Request, Response } from 'express';
import { query } from '../db';
import { handleControllerError } from '../utils';

export const rawQuery = async (req: Request, res: Response) => {
    try {
        const { sql, params } = req.body;

        // Basic check to prevent accidental destructive commands if needed, 
        // but user requested "Edit", so we allow UPDATE/DELETE/DROP.
        // In production, this would be behind strictly protected middleware.
        console.log('[ADMIN DB] Executing SQL:', sql);

        const result = await query(sql, params || []);

        res.json({
            status: 'success',
            rowCount: result.rowCount,
            rows: result.rows,
            fields: result.fields.map(f => ({ name: f.name, dataType: f.dataTypeID }))
        });

    } catch (error) {
        handleControllerError(error, res);
    }
};

export const listTables = async (req: Request, res: Response) => {
    try {
        const result = await query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name
        `);
        res.json({ tables: result.rows.map(r => r.table_name) });
    } catch (error) {
        handleControllerError(error, res);
    }
};

export const getTableData = async (req: Request, res: Response) => {
    try {
        const { tableName } = req.params;
        const nameStr = String(tableName);
        const cleanTableName = nameStr.replace(/[^a-zA-Z0-9_]/g, '');

        const result = await query(`SELECT * FROM ${cleanTableName} ORDER BY 1 DESC LIMIT 100`);
        res.json({
            rows: result.rows,
            fields: result.fields.map(f => f.name)
        });
    } catch (error) {
        handleControllerError(error, res);
    }
};
