/**
 * BrujulApp - Unified Backend API 
 * Este script debe publicarse como Aplicación Web (Web App) en Google Apps Script.
 * Configuración recomendada: 
 * - Ejecutar como: El usuario que accede a la aplicación web (SSO Tec)
 * - Quién tiene acceso: Cualquier usuario dentro de Tecnológico de Monterrey
 */

const CONFIG = {
  SPREADSHEET_ID: 'REEMPLAZAR_CON_TU_ID_DE_SHEET_UNIFICADA',
  SHEET_RESPUESTAS: 'Respuestas_Test',     // Donde cae el test inicial
  SHEET_SESION: 'Sesiones_Mentoria',       // Donde se guardan las metas
  SHEET_BANCO_METAS: 'Banco_Metas'         // El diccionario de metas
};

/**
 * Endpoint para recibir peticiones POST desde React/Vite (Frontend)
 */
function doPost(e) {
  try {
    const params = JSON.parse(e.postData.contents);
    const action = params.action;
    const payload = params.payload;
    let result;

    switch (action) {
      case 'getDiagnostico':
        result = getDiagnostico(payload.matricula);
        break;
      case 'getMetas':
        result = getMetas();
        break;
      case 'saveMetas':
        result = saveMetas(payload);
        break;
      case 'confirmRegistro':
        result = confirmRegistro(payload.matricula);
        break;
      case 'sendCampaign':
        result = sendCampaign(payload.type);
        break;
      default:
        return createJsonResponse({ success: false, error: "Acción no válida en la API" });
    }
    
    return createJsonResponse({ success: true, data: result });
  } catch (error) {
    return createJsonResponse({ success: false, error: error.toString() });
  }
}

/**
 * Responder solicitudes OPTIONS para soporte de CORS (Cross-Origin Resource Sharing)
 * Necesario si tu React App está en Vercel y llama a Google Scripts.
 */
function doOptions(e) {
  return createJsonResponse({ status: "ok" });
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
    // Nota: Las Web Apps de Apps Script manejan los headers de CORS automáticamente,
    // pero devuelven un 302 y JSON envuelto si no se llama correctamente.
}


// =========================================================================
// FUNCIONES DE NEGOCIO (Adaptadas de tus scripts originales a JSON API)
// =========================================================================

function getDiagnostico(matricula) {
  const sheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID).getSheetByName(CONFIG.SHEET_RESPUESTAS);
  if (!sheet) throw new Error("Hoja de respuestas no encontrada.");
  
  const data = sheet.getDataRange().getValues();
  // ... lógica para buscar la matrícula igual que en Code.js original ...
  // Por brevedad, esto es un esqueleto. Aquí integrarías tu findHeaderIndex_
  
  // Fake response temporal (reemplazar con lectura de Sheet):
  return {
    matricula: matricula,
    name: "Estudiante",
    version: "Enfoque",
    areasDebiles: ["practicas", "idioma"]
  };
}

function getMetas() {
  const sheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID).getSheetByName(CONFIG.SHEET_BANCO_METAS);
  if (!sheet) throw new Error("Hoja de Banco de Metas no encontrada.");
  
  // ... leer metas, estructurar en prioritarias y complementarias ...
  
  return {
     prioritarias: {
       idioma: [{ id: 1, texto: "Acreditar B2", dimension: "idioma", pasos: ["Paso 1", "Paso 2"] }]
     },
     complementarias: {
       fisica: [{ id: 3, texto: "Hacer ejercicio", dimension: "fisica", pasos: ["Ir al GYM"] }]
     }
  };
}

function saveMetas(payload) {
  const sheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID).getSheetByName(CONFIG.SHEET_SESION);
  // Guardar datos en la última fila...
  sheet.appendRow([new Date(), payload.matricula, payload.nombre, payload.metaPrioritaria, payload.metaComplementaria, 'Pendiente']);
  return true;
}

function confirmRegistro(matricula) {
  // Buscar fila y cambiar 'Pendiente' a 'Completado'
  return true;
}

// =========================================================================
// FUNCIONES ADMINISTRATIVAS (Campañas de Correo)
// =========================================================================

function sendCampaign(type) {
  const sheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID).getSheetByName(CONFIG.SHEET_SESION);
  // type puede ser "initial" (Brújula) o "review" (Metas)
  // Lógica de MailApp.sendEmail recorriendo la hoja...
  return { success: true, countSent: 5 };
}
