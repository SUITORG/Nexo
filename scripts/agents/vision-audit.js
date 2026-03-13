const { chromium } = require('playwright');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');

/**
 * AGENT BROWSER: VISION AUDIT v1.1.0 (SUPABASE ENABLED)
 * Propósito: Escuchar la tabla Agent_Tasks en Supabase y ejecutar 
 * auditorías visuales automáticas cuando se solicite.
 */

// Configuración de Supabase (Extraída de core.js)
const SB_URL = 'https://hmrpotibipxhsnowgjvq.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhtcnBvdGliaXB4aHNub3dnanZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzNzAxMzQsImV4cCI6MjA4ODk0NjEzNH0.6Ftmwtbw5Prp-TQhMkmGivo6CDVV8QDP_Xj1OJZ7G5w';
const supabase = createClient(SB_URL, SB_KEY);

async function runVisionAudit(taskId, id_empresa, targetUrl) {
    console.log(`🚀 [TASK-${taskId}] Iniciando Auditoría Visual para ${id_empresa}...`);
    
    // Actualizar estado a RUNNING
    await supabase.from('Agent_Tasks').update({ status: 'RUNNING' }).eq('id', taskId);

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        viewport: { width: 1280, height: 800 },
        deviceScaleFactor: 1,
    });
    
    const page = await context.newPage();
    const auditResults = { logs: [], itemsFound: 0, layoutOk: false };

    try {
        console.log(`📡 Navegando a: ${targetUrl}`);
        await page.goto(targetUrl, { waitUntil: 'networkidle' });

        // 1. Auditoría de Galería Matrix
        const galleryItems = await page.$$('.gallery-item-huge');
        auditResults.itemsFound = galleryItems.length;

        if (galleryItems.length > 0) {
            const firstItemBox = await galleryItems[0].boundingBox();
            const pageWidth = 1280;
            const percentageUsed = ((firstItemBox.width / pageWidth) * 100).toFixed(2);
            auditResults.percentage = percentageUsed;
            
            if (galleryItems.length === 3 && percentageUsed > 30) {
                auditResults.layoutOk = true;
                auditResults.logs.push('✅ Matriz 33% detectada correctamente.');
            } else if (galleryItems.length >= 4 && percentageUsed <= 26) {
                auditResults.layoutOk = true;
                auditResults.logs.push('✅ Matriz 25% detectada correctamente.');
            }
        }

        // 2. Captura de Pantalla
        const screenshotName = `audit-${id_empresa}-${Date.now()}.png`;
        const screenshotPath = path.join(__dirname, screenshotName);
        await page.screenshot({ path: screenshotPath, fullPage: true });

        // 3. Finalizar Tarea en Supabase
        await supabase.from('Agent_Tasks').update({ 
            status: 'COMPLETED',
            result: auditResults,
            completed_at: new Date().toISOString()
        }).eq('id', taskId);

        console.log(`✅ [TASK-${taskId}] Auditoría finalizada exitosamente.`);

    } catch (error) {
        console.error(`❌ [TASK-${taskId}] Error:`, error.message);
        await supabase.from('Agent_Tasks').update({ 
            status: 'FAILED',
            result: { error: error.message }
        }).eq('id', taskId);
    } finally {
        await browser.close();
    }
}

async function listenTasks() {
    console.log('👀 [AGENT] Buscando tareas PENDING en Supabase...');
    
    // 1. Buscar tareas existentes que se quedaron pendientes
    const { data: pendingTasks } = await supabase
        .from('Agent_Tasks')
        .select('*')
        .eq('status', 'PENDING')
        .eq('task_type', 'VISION_AUDIT');

    if (pendingTasks && pendingTasks.length > 0) {
        for (const task of pendingTasks) {
            const url = task.parameters?.url || 'http://localhost:3000';
            await runVisionAudit(task.id, task.id_empresa, url);
        }
    }

    // 2. Realtime Listening (Opcional si Supabase Realtime está activo)
    console.log('⏳ [AGENT] Esperando nuevas tareas...');
    // Por simplicidad en este script de terminal, haremos un poll cada 10 segundos
    setInterval(async () => {
        const { data } = await supabase
            .from('Agent_Tasks')
            .select('*')
            .eq('status', 'PENDING')
            .eq('task_type', 'VISION_AUDIT')
            .limit(1);

        if (data && data.length > 0) {
            const task = data[0];
            const url = task.parameters?.url || 'http://localhost:3000';
            await runVisionAudit(task.id, task.id_empresa, url);
        }
    }, 10000);
}

listenTasks();
