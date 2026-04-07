// =================================================================
// --- CONFIGURACIÓN PRINCIPAL ---
// =================================================================
const CONFIG = {
  // PEGA AQUÍ LA URL DE TU IMPLEMENTACIÓN MÁS RECIENTE
  WEB_APP_URL: 'https://script.google.com/macros/s/AKfycbzFdmqYCz09zfE8P6cwz8cNeopdqnevQlQSy1r9Gjpg_T1pgQPM4CNtEWP5yCMJEBQV/exec',
  SHEET_ID: '133sZ-fwEO-JqtnLXinNIbrmczcF0VsDLgXSrbeuWqtE',
  PROCESSED_SHEET_NAME: 'Responses_Processed',
  STUDENTS_SHEET_NAME: 'Students',
  VERSION: 'v11.0' // Versión con correo de elección de carrera
};


// =================================================================
// --- MENÚ PERSONALIZADO Y FUNCIONES DE INICIO ---
// =================================================================

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Herramientas de Mentoría 🧭')
    .addItem('0. Enviar Correo de Invitación Inicial', 'sendInitialInvitationEmails')
    .addSeparator()
    .addItem('1. Generar Enlaces Personalizados', 'generateCustomLinks')
    .addSeparator()
    .addItem('2. Enviar Recordatorios (Manual)', 'sendAutomaticReminders')
    .addToUi();
}

/**Envía el correo de elección de carrera a todos los estudiantes.*/

function sendCareerChoiceEmail() {
  const ui = SpreadsheetApp.getUi();
  const confirmation = ui.alert(
    'Confirmación de Envío Masivo',
    'Estás a punto de enviar el correo sobre la ELECCIÓN DE ENFOQUE a TODOS los estudiantes en la lista. Esta acción es para un proceso administrativo importante. ¿Deseas continuar?',
    ui.ButtonSet.YES_NO);

  if (confirmation !== ui.Button.YES) {
    ui.alert('Envío cancelado.');
    return;
  }

  const sheet = SpreadsheetApp.openById(CONFIG.SHEET_ID).getSheetByName(CONFIG.STUDENTS_SHEET_NAME);
  const students = sheet.getRange('A2:B' + sheet.getLastRow()).getValues();
  
  const emailTemplate = `
  <!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Define tu futuro: Registra tu Enfoque</title></head><body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;"><center style="width: 100%; table-layout: fixed; background-color: #f5f5f5; padding-bottom: 60px;"><table style="background-color: #ffffff; margin: 0 auto; width: 100%; max-width: 600px; border-spacing: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; color: #1a1a1a;">
  <tr><td style="padding: 0;"><div style="background-color: #333c87; color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center;"><h1 style="margin: 0; font-size: 28px; color: white; line-height: 1.2;">🎯 ¡Define tu futuro!</h1><p style="margin: 10px 0 0 0; font-size: 18px; color: white;">Registra tu Enfoque de Carrera del 12 al 22 de septiembre</p></div></td></tr>
  <tr><td style="padding: 30px 20px;"><p style="font-size: 18px; color: #1a1a1a;">¡Hola, {{nombre_alumno}}!</p><p style="line-height: 1.6;">Se acerca un momento clave en tu trayectoria: la <strong>elección de tu Enfoque de Carrera</strong>. Para acompañarte, retomamos nuestra iniciativa "Brújula de Enfoque". Si aún no la completas, este es el momento perfecto para hacerlo y ganar claridad.</p>
  <div style="text-align: center; margin: 25px 0;"><a href="{{enlace_brujula}}" style="display: inline-block; padding: 12px 24px; background-color: #333c87; color: #ffffff; text-decoration: none; border-radius: 20px; font-weight: bold;">➡️ Completar mi Brújula de Enfoque</a></div>
  <div style="background-color: #fff3cd; border: 2px solid #ffeaa7; border-radius: 8px; padding: 20px; margin: 30px 0; text-align: center;"><h3 style="margin: 0; color: #856404; font-size: 20px;">🗓️ Fechas Clave</h3><p style="font-size: 18px; margin: 10px 0; color: #856404;"><strong>12 al 22 de Septiembre</strong></p><p style="margin: 0; font-size: 14px;">Periodo oficial para registrar tu decisión en el sistema.</p></div>
  <div style="background-color: #f8d7da; border: 2px solid #dc3545; border-radius: 8px; padding: 20px; margin: 20px 0;"><h3 style="margin-top: 0; color: #721c24;">⚠️ ¿Por qué es importante registrarte a tiempo?</h3><p style="line-height: 1.6; margin: 0; color: #721c24;">No hacerlo a tiempo puede implicar inscripciones extemporáneas, menor disponibilidad de materias y el riesgo de no completar tu carga académica para Feb-Jun 2026. ¡Evitemos cualquier inconveniente!</p></div>
  <div style="background-color: white; border-radius: 12px; padding: 20px; margin: 25px 0; box-shadow: 0 2px 6px rgba(0,0,0,0.1); border-left: 4px solid #79858B;"><h3 style="margin-top: 0; color: #5a6469;">✅ Pasos para tu Registro</h3><ol style="line-height: 1.8; padding-left: 20px;"><li>Ingresa al servicio <strong>Definiendo Horizontes</strong> en mitec.</li><li>Selecciona “Elección del enfoque de carrera”.</li><li>Elige el programa que deseas como enfoque.</li><li>Confirma tu selección para iniciar el trámite.</li><li>Recibirás un correo de confirmación y podrás monitorear el estatus en el mismo servicio.</li></ol></div>
  <p style="line-height: 1.6;">Sé que esta decisión puede generar dudas. Si quieres platicar sobre tus opciones, no dudes en contactarme. ¡Estoy aquí para apoyarte!</p></td></tr>
  <tr><td style="padding: 0 20px 30px 20px;"><div style="border-top: 2px solid #79858B; margin-top: 20px; padding-top: 20px;"><p style="margin: 0 0 5px 0; font-size: 14px; color: #5a6469; font-weight: 600;">Karen Ariadna Guzmán Vega</p><p style="margin: 0 0 12px 0; font-size: 12px; color: #666;">Mentora Estudiantil • Tecnológico de Monterrey • Comunidad Krei</p><p style="margin: 0 0 15px 0; font-size: 11px; color: #333; font-style: italic;">"Somos un equipo y estoy aquí para apoyarte" ✨</p><p style="margin: 0; font-size: 11px;">💬 <strong>WhatsApp:</strong> <a href="https://wa.me/5218128612913" style="color: #25D366; text-decoration: none;">+52 81 2861 2913</a></p></div></td></tr>
  </table></center></body></html>
  `;

  students.forEach(student => {
    const email = student[0];
    const name = student[1];
    const link = CONFIG.WEB_APP_URL + `?email=${email}&name=${encodeURIComponent(name)}`;

    if (email && name) {
      let personalizedBody = emailTemplate.replace('{{nombre_alumno}}', name.split(' ')[0]);
      personalizedBody = personalizedBody.replace('{{enlace_brujula}}', link);
      
      MailApp.sendEmail({
        to: email,
        subject: `🎯 ¡Define tu futuro! Registra tu Enfoque de Carrera`,
        htmlBody: personalizedBody
      });
      Utilities.sleep(1000);
    }
  });
  ui.alert(`Se envió el correo de "Elección de Enfoque" a ${students.length} estudiantes.`);
}

/**Envía el correo de invitación inicial a todos los estudiantes.*/

function sendInitialInvitationEmails() {
  const ui = SpreadsheetApp.getUi();
  const confirmation = ui.alert(
    'Confirmación de Envío de Invitaciones',
    'Estás a punto de enviar el correo de invitación a TODOS los estudiantes en la lista. ¿Deseas continuar?',
    ui.ButtonSet.YES_NO);

  if (confirmation !== ui.Button.YES) {
    ui.alert('Envío cancelado.');
    return;
  }

  const sheet = SpreadsheetApp.openById(CONFIG.SHEET_ID).getSheetByName(CONFIG.STUDENTS_SHEET_NAME);
  const students = sheet.getRange('A2:B' + sheet.getLastRow()).getValues();
  
  const emailTemplate = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>¿Estás listo/a para tu Etapa de Enfoque?</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;">
    <center style="width: 100%; table-layout: fixed; background-color: #f5f5f5; padding-bottom: 60px;">
        <table style="background-color: #ffffff; margin: 0 auto; width: 100%; max-width: 600px; border-spacing: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; color: #1a1a1a;">
            <!-- BANNER AZUL TEC -->
            <tr>
                <td style="padding: 0;">
                    <div style="background-color: #333c87; color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
                        <h1 style="margin: 0; font-size: 28px; color: white; line-height: 1.2;">Te acercas a la mitad de tu carrera</h1>
                        <p style="margin: 10px 0 0 0; font-size: 18px; color: white;">Es momento de recibir mentoría para tu Etapa de Enfoque</p>
                    </div>
                </td>
            </tr>
            <!-- CONTENIDO PRINCIPAL -->
            <tr>
                <td style="padding: 30px 20px;">
                    <p style="font-size: 18px; color: #1a1a1a;">¡Hola, {{nombre_alumno}}!</p>
                    <p style="line-height: 1.6;">Como tu mentora, quiero asegurarme de que tengas el mejor acompañamiento posible ahora que te preparas para una nueva etapa en tu vida universitaria.</p>
                    <!-- TARJETA DE TAREA -->
                    <div style="background-color: white; border-radius: 12px; padding: 20px; margin: 25px 0; box-shadow: 0 2px 6px rgba(0,0,0,0.1); border-left: 4px solid #79858B;">
                        <h3 style="margin-top: 0; color: #5a6469; font-size: 20px;">Evalúa qué tan listo/a te sientes</h3>
                        <p style="line-height: 1.6;"><strong>Da clic aquí y en dos minutos</strong> completa tu Brújula de Enfoque. Tus respuestas me permitirán darte una orientación más personalizada.</p>
                        <div style="text-align: center; margin-top: 20px;">
                            <a href="{{enlace_personalizado}}" style="display: inline-block; padding: 12px 24px; background-color: #333c87; color: #ffffff; text-decoration: none; border-radius: 20px; font-weight: bold;">Iniciar mi Brújula de Enfoque</a>
                        </div>
                    </div>
                    <!-- CITA -->
                    <div style="background-color: #f0f8ff; color: #5a6469; padding: 15px; border-radius: 8px; margin: 15px 0; text-align: center; font-weight: bold; border: 2px solid #79858B;">
                        <p style="margin: 0; font-style: italic;">"El acompañamiento funciona cuando tú lo accionas"</p>
                    </div>
                    <!-- TARJETA DE FECHAS -->
                    <div style="background-color: #f8f9fa; border-radius: 12px; padding: 20px; margin: 30px 0; border: 2px solid #79858B;">
                        <h3 style="margin: 0; color: #5a6469; font-size: 20px; text-align: center;">☕️🍩 Hablemos en el Café de Mentoría</h3>
                        <p style="font-size: 16px; margin: 15px 0; line-height: 1.6; text-align: center;">Una vez que respondas, acércate a platicar conmigo. ¡Tendré café y donas listos!</p>
                        <div style="background-color: white; padding: 15px; border-radius: 8px; margin-top: 15px;">
                            <p style="margin: 0; font-size: 16px;"><strong>Viernes 29 de agosto:</strong> 9:00 AM - 3:00 PM</p>
                            <p style="margin: 10px 0 0 0; font-size: 14px; color: #5a6469;">📍 Área de Mentores, Centrales Sur 3er piso</p>
                        </div>
                    </div>
                </td>
            </tr>
            <!-- FIRMA -->
            <tr>
                <td style="padding: 0 20px 30px 20px;">
                    <div style="border-top: 2px solid #79858B; margin-top: 20px; padding-top: 20px;">
                        <p style="margin: 0 0 5px 0; font-size: 14px; color: #5a6469; font-weight: 600;">Karen Ariadna Guzmán Vega</p>
                        <p style="margin: 0 0 12px 0; font-size: 12px; color: #666;">Mentora Estudiantil • Tecnológico de Monterrey • Comunidad Krei</p>
                        <p style="margin: 0 0 15px 0; font-size: 11px; color: #333; font-style: italic;">"Somos un equipo y estoy aquí para apoyarte" ✨</p>
                        <p style="margin: 0; font-size: 11px;">💬 <strong>WhatsApp:</strong> <a href="https://wa.me/5218128612913" style="color: #25D366; text-decoration: none;">+52 81 2861 2913</a></p>
                    </div>
                </td>
            </tr>
        </table>
    </center>
</body>
</html>
  `;

  students.forEach(student => {
    const email = student[0];
    const name = student[1];
    const link = CONFIG.WEB_APP_URL + `?email=${email}&name=${encodeURIComponent(name)}`;

    if (email && name) {
      let personalizedBody = emailTemplate.replace('{{nombre_alumno}}', name.split(' ')[0]);
      personalizedBody = personalizedBody.replace('{{enlace_personalizado}}', link);
      
      MailApp.sendEmail({
        to: email,
        subject: `🧭 ${name.split(' ')[0]}, ¿estás listo/a para tu Etapa de Enfoque?`,
        htmlBody: personalizedBody
      });
      Utilities.sleep(1000); // Pausa para no exceder los límites de envío
    }
  });

  ui.alert(`Se enviaron ${students.length} invitaciones.`);
}


/**
 * Genera los enlaces personalizados para cada estudiante en la hoja "Students".
 */
function generateCustomLinks() {
  const sheet = SpreadsheetApp.openById(CONFIG.SHEET_ID).getSheetByName(CONFIG.STUDENTS_SHEET_NAME);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    SpreadsheetApp.getUi().alert('No hay estudiantes en la lista para generar enlaces.');
    return;
  }
  
  // AHORA USA LA URL FIJA DE LA CONFIGURACIÓN
  const webAppUrl = CONFIG.WEB_APP_URL;
  if (!webAppUrl || webAppUrl === 'REPLACE_ME') {
     SpreadsheetApp.getUi().alert('Error: No has configurado la WEB_APP_URL en el script.');
     return;
  }

  const range = sheet.getRange(`C2:C${lastRow}`);
  const formulas = [];
  
  for (let i = 2; i <= lastRow; i++) {
    const formula = `=HYPERLINK("${webAppUrl}?email=" & A${i} & "&name=" & ENCODEURL(B${i}), "Enlace para " & B${i})`;
    formulas.push([formula]);
  }
  
  range.setFormulas(formulas);
  SpreadsheetApp.getUi().alert('¡Enlaces personalizados generados exitosamente en la columna C!');
}


// =================================================================
// --- LÓGICA DE RECORDATORIOS AUTOMÁTICOS (FUNCIÓN CORREGIDA) ---
// =================================================================

/**
 * Envía un correo de recordatorio a los estudiantes que no han completado la Brújula.
 */
function sendAutomaticReminders() {
  const ui = SpreadsheetApp.getUi();
  const confirmation = ui.alert(
    'Confirmación de Envío',
    'Estás a punto de enviar un correo de recordatorio a todos los estudiantes que no han respondido. ¿Deseas continuar?',
    ui.ButtonSet.YES_NO);

  if (confirmation !== ui.Button.YES) {
    ui.alert('Envío cancelado.');
    return;
  }

  const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
  const studentsSheet = ss.getSheetByName(CONFIG.STUDENTS_SHEET_NAME);
  const responsesSheet = ss.getSheetByName(CONFIG.PROCESSED_SHEET_NAME);

  // --- CORRECCIÓN ---
  // 1. Obtener la lista COMPLETA de estudiantes primero.
  const allStudents = studentsSheet.getRange('A2:B' + studentsSheet.getLastRow()).getValues();
  const respondedEmails = responsesSheet.getRange('B2:B' + responsesSheet.getLastRow()).getValues().flat();
  const respondedSet = new Set(respondedEmails);

  // 2. FILTRAR la lista completa para encontrar a los pendientes.
  const pendingStudents = allStudents.filter(student => student[0] && !respondedSet.has(student[0]));
  // --- FIN DE LA CORRECCIÓN ---

  if (pendingStudents.length === 0) {
    ui.alert('¡Todos los estudiantes han respondido! No se enviaron recordatorios.');
    return;
  }

  pendingStudents.forEach(student => {
    const email = student[0];
    const name = student[1].split(' ')[0];
    const link = CONFIG.WEB_APP_URL + `?email=${email}&name=${encodeURIComponent(student[1])}`;
    const subject = `👋 ${name}, un recordatorio para completar tu Brújula de Enfoque`;
    
    // Plantilla HTML del correo de recordatorio
    let body = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tu Etapa de Enfoque Comienza Ahora</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;">
    <center style="width: 100%; table-layout: fixed; background-color: #f5f5f5; padding-bottom: 60px;">
        <table style="background-color: #ffffff; margin: 0 auto; width: 100%; max-width: 600px; border-spacing: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; color: #1a1a1a;">
            <!-- BANNER PRINCIPAL ROSA -->
            <tr>
                <td style="padding: 0;">
                    <div style="background-color: #e16f7c; color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
                        <h1 style="margin: 0; font-size: 28px; color: white; line-height: 1.2;">Tu Etapa de Enfoque te espera</h1>
                        <p style="margin: 10px 0 0 0; font-size: 18px; color: white;">Aún estás a tiempo de prepararte</p>
                    </div>
                </td>
            </tr>
            <!-- CONTENIDO PRINCIPAL -->
            <tr>
                <td style="padding: 30px 20px;">
                    <p style="font-size: 18px; color: #1a1a1a;">¡Hola, ${name}!</p>
                    <p style="line-height: 1.6;">Solo paso para recordarte que completes tu <strong>Brújula de Enfoque</strong>. Estamos en un momento clave de tu carrera y quiero asegurarme de darte el mejor acompañamiento.</p>
                    
                    <!-- TARJETA DE TAREA -->
                    <div style="background-color: white; border-radius: 12px; padding: 20px; margin: 25px 0; box-shadow: 0 2px 6px rgba(0,0,0,0.1); border-left: 4px solid #79858B;">
                        <h3 style="margin-top: 0; color: #5a6469; font-size: 20px;">🧭 Tu perspectiva es muy importante</h3>
                        <p style="line-height: 1.6;">Tus respuestas son el primer paso para que platiquemos en el <strong>Café de Mentoría</strong>. ¡No te quedes fuera!</p>
                        <div style="text-align: center; margin-top: 20px;">
                            <a href="{{enlace_personalizado}}" style="display: inline-block; padding: 12px 24px; background-color: #e16f7c; color: #ffffff; text-decoration: none; border-radius: 20px; font-weight: bold;">Completar mi Brújula (2 min)</a>
                        </div>
                    </div>

                    <!-- TARJETA DE FECHAS -->
                    <div style="background-color: #fff3cd; border: 2px solid #ffeaa7; border-radius: 8px; padding: 20px; margin: 30px 0; text-align: center;">
                        <h3 style="margin: 0; color: #856404; font-size: 20px;">☕️🍩 ¡Nos vemos en el Café de Mentoría!</h3>
                        <div style="background-color: white; padding: 15px; border-radius: 8px; margin-top:15px;">
                            <p style="margin: 0; font-size: 16px;"><strong>Viernes 29 de agosto:</strong> 9:00 AM - 3:00 PM</p>
                            <p style="margin: 10px 0 0 0; font-size: 14px; color: #5a6469;">📍 Área de Mentores, Centrales Sur 3er piso</p>
                        </div>
                    </div>
                    <p style="line-height: 1.6;">¡Gracias y espero verte pronto!</p>
                </td>
            </tr>
            <!-- FIRMA -->
            <tr>
                <td style="padding: 0 20px 30px 20px;">
                    <div style="border-top: 2px solid #79858B; margin-top: 20px; padding-top: 20px;">
                        <p style="margin: 0 0 5px 0; font-size: 14px; color: #5a6469; font-weight: 600;">Karen Ariadna Guzmán Vega</p>
                        <p style="margin: 0 0 12px 0; font-size: 12px; color: #666;">Mentora Estudiantil • Tecnológico de Monterrey • Comunidad Krei</p>
                        <p style="margin: 0 0 15px 0; font-size: 11px; color: #333; font-style: italic;">"Somos un equipo y estoy aquí para apoyarte" ✨</p>
                        <p style="margin: 0; font-size: 11px;">
                            💬 <strong>WhatsApp:</strong> <a href="https://wa.me/5218128612913" style="color: #25D366; text-decoration: none;">+52 81 2861 2913</a>
                        </p>
                    </div>
                </td>
            </tr>
        </table>
    </center>
</body>
</html>
    `;

    // Reemplazamos el placeholder con el enlace real del estudiante.
    const finalBody = body.replace('{{enlace_personalizado}}', link);

    MailApp.sendEmail({ to: email, subject: subject, htmlBody: finalBody });
    Utilities.sleep(1000);
  });

  ui.alert(`Se enviaron ${pendingStudents.length} recordatorios.`);
}

// =================================================================
// --- FUNCIONES PARA LA APLICACIÓN WEB INTERACTIVA (V7.0) ---
// =================================================================
function findPreviousResponse_(email) {
  const sheet = SpreadsheetApp.openById(CONFIG.SHEET_ID).getSheetByName(CONFIG.PROCESSED_SHEET_NAME);
  if (sheet.getLastRow() < 2) return null;

  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const emailColumnIndex = headers.indexOf('email');

  // Buscar de abajo hacia arriba para obtener la respuesta más reciente
  for (let i = data.length - 1; i > 0; i--) {
    if (data[i][emailColumnIndex] === email) {
      const response = {};
      headers.forEach((header, index) => {
        response[header] = data[i][index];
      });
      return response;
    }
  }
  return null;
}

/**
 * LÓGICA ACTUALIZADA: Maneja las solicitudes GET a la aplicación web.
 * Ahora revisa si el estudiante ya respondió.
 */
function doGet(e) {
  const params = e.parameter;
  const email = params.email;
  const name = params.name;

  if (!email || !name) {
    return HtmlService.createHtmlOutput('<h1>Error de Acceso</h1><p>Utiliza el enlace personalizado que recibiste por correo.</p>');
  }

  // Revisar si hay una respuesta previa
  const previousResponse = findPreviousResponse_(email);

  if (previousResponse) {
    // Si ya respondió, mostrar la página de resultados
    const resultsTemplate = HtmlService.createTemplateFromFile('results');
    resultsTemplate.data = previousResponse;
    return resultsTemplate.evaluate()
      .setTitle('Tus Resultados - Brújula de Enfoque')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1.0');
  } else {
    // Si no ha respondido, mostrar el test
    const formTemplate = HtmlService.createTemplateFromFile('index');
    formTemplate.email = email;
    formTemplate.name = name;
    return formTemplate.evaluate()
      .setTitle('Brújula de Enfoque')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1.0');
  }
}

function processWebAppSubmission(payload) {
  try {
    const student = payload.student;
    const answers = payload.answers;
    const scores = {
      score_carrera: answers.carrera || 0,
      score_academico: answers.academico || 0,
      score_practicas: answers.practicas || 0,
      score_servicio: answers.servicio_social || 0
    };
    const scoreValues = Object.values(scores);
    const highScores = scoreValues.filter(s => s >= 4).length;
    const lowScores = scoreValues.filter(s => s <= 2).length;
    let scenario = 'Desarrollo';
    if (highScores === 4) {
      scenario = 'Consolidado';
    } else if (lowScores >= 2) {
      scenario = 'Oportunidad';
    }
    const processedRecord = {
      submission_ts: new Date(),
      email: student.email,
      name: student.name,
      matricula: '',
      ...scores,
      interest_topic: '',
      profile_scenario: scenario,
      version: CONFIG.VERSION + '-brujula'
    };
    writeToProcessedSheet_(processedRecord);
    sendStudentEmail_(processedRecord);
    return {status: 'success'};
  } catch (error) {
    Logger.log(`Error en processWebAppSubmission: ${error.toString()}`);
    throw new Error('No se pudieron procesar los datos: ' + error.message);
  }
}

// =================================================================
// --- REEMPLAZA TU FUNCIÓN sendStudentEmail_ CON ESTA VERSIÓN ---
// =================================================================
function sendStudentEmail_(record) {
  const webAppUrl = ScriptApp.getService().getUrl();
  const studentName = record.name.split(' ')[0];
  const scoreEntries = Object.entries({
    score_carrera: record.score_carrera,
    score_academico: record.score_academico,
    score_practicas: record.score_practicas,
    score_servicio: record.score_servicio
  }).sort(([, a], [, b]) => a - b);
  
  const opportunities = scoreEntries.slice(0, 2);
  const topic1 = getTopicName(opportunities[0][0]);
  const topic2 = getTopicName(opportunities[1][0]);
  const link1 = `${webAppUrl}?action=register&email=${record.email}&name=${encodeURIComponent(studentName)}&topic=${encodeURIComponent(topic1)}`;
  const link2 = `${webAppUrl}?action=register&email=${record.email}&name=${encodeURIComponent(studentName)}&topic=${encodeURIComponent(topic2)}`;

  let subject = '';
  let body = '';
  
  // --- NUEVO: ID del evento de calendario que creamos ---
  const calendarEventId = 'k4r5e8n770qkemte6bip0mlogg@group.calendar.google.com';
  
  // --- NUEVO: Generamos el bloque del evento para el correo ---
  const calendarBlock = `
    <div style="background-color: #f8f9fa; border-radius: 12px; padding: 20px; margin: 30px 0; border: 2px solid #79858B; text-align: center;">
        <h3 style="margin: 0; color: #5a6469; font-size: 20px;">☕️🍩 Tu invitación al Café de Mentoría</h3>
        <p style="font-size: 16px; margin: 15px 0; line-height: 1.6;">He reservado un lugar para ti. Por favor, revisa tu calendario para ver y aceptar la invitación al evento del viernes.</p>
        <div style="background-color: white; padding: 15px; border-radius: 8px; margin-top: 15px;">
            <p style="margin: 0; font-size: 16px;"><strong>Viernes 29 de agosto:</strong> 9:00 AM - 3:00 PM</p>
            <p style="margin: 10px 0 0 0; font-size: 14px; color: #5a6469;">📍 Área de Mentores, Centrales Sur 3er piso</p>
        </div>
    </div>
  `;

  switch (record.profile_scenario) {
    case 'Consolidado':
      subject = `🚀 ${studentName}, ¡felicidades por tu avance! Hablemos de tus próximos retos`;
      body = `
        <div style="background-color: #a5c882; color: white; padding: 25px; border-radius: 12px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px; color: white;">¡Excelente Avance!</h1>
        </div>
        <p style="margin-top: 20px;">¡Hola, ${studentName}!</p>
        <p>¡Los resultados de tu Brújula de Enfoque son excelentes! Es emocionante ver que ya tienes un plan claro para iniciar tu Etapa de Enfoque. Te felicito mucho por tu gran trabajo.</p>
        <p>Tener un avance tan destacado como el tuyo es una oportunidad increíble. Por favor, apenas tengas oportunidad, mándame un mensaje contándome más sobre tus planes y logros, quisiera saber cómo puedo ayudarte en ellos.</p>
        <div style="text-align: center; margin: 25px 0;">
            <a href="https://wa.me/5218128612913" style="display: inline-block; padding: 12px 24px; background-color: #25D366; color: #ffffff; text-decoration: none; border-radius: 20px; font-weight: bold;">💬 Contarme por WhatsApp</a>
        </div>
        ${calendarBlock}
      `;
      break;

    case 'Oportunidad':
      subject = `🎯 ${studentName}, definamos tus prioridades para tu Etapa de Enfoque`;
      body = `
        <div style="background-color: #e16f7c; color: white; padding: 25px; border-radius: 12px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px; color: white;">¡Es Momento de Trazar el Plan!</h1>
        </div>
        <p style="margin-top: 20px;">¡Hola, ${studentName}!</p>
        <p>Gracias por tu honestidad en la Brújula de Enfoque. Estás justo a tiempo para fortalecer algunas áreas clave antes de que inicie tu <strong>Etapa de Enfoque</strong>.</p>
        <p>He identificado que <strong>${topic1}</strong> y <strong>${topic2}</strong> son dos puntos excelentes para empezar. El primer paso es que acudas al <strong>Café de Mentoría</strong> conmigo para que platiquemos de estas oportunidades. Para prepararlo mejor, por favor, elige cuál de estos dos temas es tu prioridad ahora mismo:</p>
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="text-align:center; margin: 25px 0;"><tr><td>
          <a href="${link1}" style="background-color: #79858B; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; margin: 5px; display: inline-block;">Me interesa más "${topic1}"</a>
          <a href="${link2}" style="background-color: #A8B0B4; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; margin: 5px; display: inline-block;">Me interesa más "${topic2}"</a>
        </td></tr></table>
        ${calendarBlock}
      `;
      break;

    default:
      subject = `🧭 ${studentName}, tus resultados para la Etapa de Enfoque están aquí`;
      body = `
        <div style="background-color: #333c87; color: white; padding: 25px; border-radius: 12px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px; color: white;">Tus Resultados de la Brújula de Enfoque</h1>
        </div>
        <p style="margin-top: 20px;">¡Hola, ${studentName}!</p>
        <p>Gracias por completar la Brújula de Enfoque. He revisado tus resultados y veo que tienes áreas muy bien desarrolladas y otras donde podemos trazar un plan juntos para fortalecer tu entrada a la <strong>Etapa de Enfoque</strong>.</p>
        <p>Las principales oportunidades que he identificado para ti son <strong>${topic1}</strong> y <strong>${topic2}</strong>. Para que el <strong>Café de Mentoría</strong> sea lo más relevante para ti, por favor, dime, ¿cuál de estos dos temas es tu prioridad para que platiquemos?</p>
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="text-align:center; margin: 25px 0;"><tr><td>
          <a href="${link1}" style="background-color: #79858B; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; margin: 5px; display: inline-block;">Me interesa más "${topic1}"</a>
          <a href="${link2}" style="background-color: #A8B0B4; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; margin: 5px; display: inline-block;">Me interesa más "${topic2}"</a>
        </td></tr></table>
        ${calendarBlock}
      `;
  }

  const footer = `
    <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;">
    <div style="font-size: 12px; color: #777;">
      <p><strong>Recursos de interés:</strong></p>
      <p>
        <a href="https://centrodeidiomas.tec.mx/es/centro-de-idiomas-en-monterrey">Centro de Idiomas</a> |
        <a href="https://linktr.ee/CVDP.mty">Centro de Vinculación y Desarrollo Profesional</a> |
        <a href="https://linktr.ee/sscmty">Servicio Social</a> |
        <a href="https://linktr.ee/ConsejeriaMty">Consejería Emocional</a>
      </p>
      <br>
      <div style="border-top: 2px solid #79858B; margin-top: 20px; padding-top: 15px;">
        <p style="margin: 0 0 5px 0; font-size: 14px; color: #5a6469; font-weight: 600;">Karen Ariadna Guzmán Vega</p>
        <p style="margin: 0 0 12px 0; font-size: 12px; color: #666;">Mentora Estudiantil • Tecnológico de Monterrey • Comunidad Krei</p>
        <p style="margin: 0 0 15px 0; font-size: 11px; color: #333; font-style: italic;">"Somos un equipo y estoy aquí para apoyarte" ✨</p>
        <p style="margin: 0; font-size: 11px;">
          💬 <strong>WhatsApp:</strong> <a href="https://wa.me/5218128612913" style="color: #25D366; text-decoration: none;">+52 81 2861 2913</a>
        </p>
      </div>
    </div>
  `;

  const finalHtml = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 30px;">${body}${footer}</div>`;
  
  // --- NUEVO: Llamada a la función para invitar al estudiante al evento ---
  addCalendarInvitation_(calendarEventId, record.email);

  MailApp.sendEmail({ to: record.email, subject: subject, htmlBody: finalHtml });
}

function getTopicName(scoreKey) {
  const names = {
    'score_carrera': 'Definición de Carrera',
    'score_academico': 'Desempeño Académico',
    'score_practicas': 'Prácticas Profesionales',
    'score_servicio': 'Servicio Social'
  };
  return names[scoreKey] || 'Tema General';
}

function writeToProcessedSheet_(record) {
  const sheet = SpreadsheetApp.openById(CONFIG.SHEET_ID).getSheetByName(CONFIG.PROCESSED_SHEET_NAME);
  ensureHeaders_(sheet);
  appendToSheet_(sheet, record);
}

function ensureHeaders_(sheet) {
  if (sheet.getLastRow() === 0) {
    const headers = [
      "submission_ts", "email", "name", "matricula", "score_carrera", 
      "score_academico", "score_practicas", "score_servicio", "interest_topic", 
      "profile_scenario", "version"
    ];
    sheet.appendRow(headers);
  }
}

function appendToSheet_(sheet, record) {
  const row = [
    record.submission_ts, record.email, record.name, record.matricula,
    record.score_carrera, record.score_academico, record.score_practicas,
    record.score_servicio, record.interest_topic, record.profile_scenario, record.version
  ];
  sheet.appendRow(row);
}
// =================================================================
// --- AGREGA ESTA NUEVA FUNCIÓN AL FINAL DE TU SCRIPT ---
// =================================================================
/**
 * Agrega a un estudiante como invitado a un evento de calendario existente.
 * @param {string} eventId - El ID del evento de calendario.
 * @param {string} studentEmail - El correo del estudiante a invitar.
 */
function addCalendarInvitation_(eventId, studentEmail) {
  try {
    const event = CalendarApp.getEventById(eventId);
    if (event) {
      // Verifica si el invitado ya está en el evento para no enviarlo dos veces.
      const guests = event.getGuestList();
      let isAlreadyInvited = false;
      for (let i = 0; i < guests.length; i++) {
        if (guests[i].getEmail() === studentEmail) {
          isAlreadyInvited = true;
          break;
        }
      }
      
      if (!isAlreadyInvited) {
        event.addGuest(studentEmail);
        Logger.log(`Invitación enviada a ${studentEmail} para el evento ${eventId}`);
      } else {
        Logger.log(`${studentEmail} ya estaba invitado/a al evento ${eventId}`);
      }
    } else {
      Logger.log(`Error: No se encontró el evento con ID ${eventId}`);
    }
  } catch (e) {
    Logger.log(`Error al agregar invitado de calendario: ${e.toString()}`);
  }
}