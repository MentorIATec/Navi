// =================================================================
// --- CONFIGURACIÓN PRINCIPAL ---
// =================================================================
const CONFIG = {
  SHEET_ID: '1AAQqWwDqk77MiW_0tPbPNGbLvAX3jikaGJJ7dJzVSM4', // Reemplaza con el ID de tu Google Sheet
  PROCESSED_SHEET_NAME: 'Responses_Processed',
  STUDENTS_SHEET_NAME: 'Students',
  
  // --- IMPORTANTE: Pega aquí la URL de tu implementación más reciente ---
  WEB_APP_URL: 'https://script.google.com/macros/s/AKfycbxEthyWiAO7FxhaNByuvGmGcAUUOp5AFKxg_TELli1Wy-CuIVlR1P11sHo9XWuP96RCjA/exec',
  
  VERSION: 'v2.0-planDeVuelo-Final' // Versión del nuevo sistema
};

// =================================================================
// --- MENÚ PERSONALIZADO Y FUNCIONES DE INICIO ---
// =================================================================

/**
 * Se ejecuta cuando se abre la hoja de cálculo para crear el menú.
 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Plan de Vuelo ✈️')
    .addItem('1. Generar Enlaces Personalizados', 'generateCustomLinks')
    .addSeparator()
    .addItem('2. Enviar Correo de Invitación', 'sendInitialInvitationEmails')
    .addItem('3. Enviar Recordatorios (a pendientes)', 'sendAutomaticReminders')
    .addToUi();
}

/**
 * Envía el correo de invitación inicial a todos los estudiantes.
 */
function sendInitialInvitationEmails() {
  const ui = SpreadsheetApp.getUi();
  const confirmation = ui.alert(
    'Confirmación de Envío de Invitaciones',
    'Estás a punto de enviar el correo de invitación a TODOS los estudiantes. ¿Deseas continuar?',
    ui.ButtonSet.YES_NO);

  if (confirmation !== ui.Button.YES) {
    ui.alert('Envío cancelado.');
    return;
  }

  const sheet = SpreadsheetApp.openById(CONFIG.SHEET_ID).getSheetByName(CONFIG.STUDENTS_SHEET_NAME);
  const students = sheet.getRange('A2:B' + sheet.getLastRow()).getValues();
  
  // --- PLANTILLA HTML ACTUALIZADA ---
  const emailTemplate = `
<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"><title>¿Listo/a para tu Etapa de Especialización?</title></head>
<body style="margin:0;padding:0;background-color:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
<center style="width:100%;table-layout:fixed;background-color:#f5f5f5;padding-bottom:60px;">
<table style="background-color:#ffffff;margin:0 auto;width:100%;max-width:600px;border-spacing:0;color:#1a1a1a;">
<tr><td style="padding:0;"><div style="background-color:#333c87;color:white;padding:30px;border-radius:12px 12px 0 0;text-align:center;">
<h1 style="margin:0;font-size:28px;color:white;line-height:1.2;">Tu Etapa de Especialización está cerca</h1>
<p style="margin:10px 0 0 0;font-size:18px;color:white;">Es momento de recibir mentoría para tus siguientes pasos</p>
</div></td></tr>
<tr><td style="padding:30px 20px;">
<p style="font-size:18px;color:#1a1a1a;">¡Hola, {{nombre_alumno}}!</p>
<p style="line-height:1.6;">Como tu mentora, quiero asegurarme de que tengas el mejor acompañamiento ahora que te preparas para una de las etapas más importantes de tu carrera: la <strong>Etapa de Especialización</strong>.</p>
<div style="background-color:white;border-radius:12px;padding:20px;margin:25px 0;box-shadow:0 2px 6px rgba(0,0,0,0.1);border-left:4px solid #79858B;">
<h3 style="margin-top:0;color:#5a6469;font-size:20px;">Evalúa tu preparación actual</h3>
<p style="line-height:1.6;"><strong>Da clic aquí y en dos minutos</strong> completa este diagnóstico. Tus respuestas me permitirán darte una orientación más personalizada sobre tus opciones de Semestre Tec (prácticas, intercambio, concentraciones, etc.).</p>
<div style="text-align:center;margin-top:20px;"><a href="{{enlace_personalizado}}" style="display:inline-block;padding:12px 24px;background-color:#333c87;color:#ffffff;text-decoration:none;border-radius:20px;font-weight:bold;">🧭 Iniciar Diagnóstico</a></div>
</div>
<div style="background-color:#f0f8ff;color:#5a6469;padding:15px;border-radius:8px;margin:15px 0;text-align:center;font-weight:bold;border:2px solid #79858B;">
<p style="margin:0;font-style:italic;">"El acompañamiento funciona cuando tú lo accionas."</p>
</div>
<div style="background-color:#f8f9fa;border-radius:12px;padding:20px;margin:30px 0;border:2px solid #79858B;">
<h3 style="margin:0;color:#5a6469;font-size:20px;text-align:center;">☕️🍩 Hablemos en el Café de Mentoría</h3>
<p style="font-size:16px;margin:15px 0;line-height:1.6;text-align:center;">Una vez que respondas, acércate a platicar conmigo. ¡Tendré café y donas listos!</p>
<div style="background-color:white;padding:15px;border-radius:8px;margin-top:15px;">
<p style="margin:0;font-size:16px;"><strong>Viernes 5 de septiembre:</strong> 9:00 AM - 3:00 PM</p>
<p style="margin:10px 0 0 0;font-size:14px;color:#5a6469;">📍 Área de Mentores, Centrales Sur 3er piso</p>
</div></div>
</td></tr>
<tr><td style="padding:0 20px 30px 20px;"><div style="border-top:2px solid #79858B;margin-top:20px;padding-top:20px;">
<p style="margin:0 0 5px 0;font-size:14px;color:#5a6469;font-weight:600;">Karen Ariadna Guzmán Vega</p>
<p style="margin:0 0 12px 0;font-size:12px;color:#666;">Mentora Estudiantil • Tecnológico de Monterrey • Comunidad Krei</p>
<p style="margin:0 0 15px 0;font-size:11px;color:#333;font-style:italic;">"Somos un equipo y estoy aquí para apoyarte" ✨</p>
<p style="margin:0;font-size:11px;">💬 <strong>WhatsApp:</strong> <a href="https://wa.me/5218128612913" style="color:#25D366;text-decoration:none;">+52 81 2861 2913</a></p>
</div></td></tr>
</table></center></body></html>
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
        subject: `🧭 ${name.split(' ')[0]}, ¿estás listo/a para tu Etapa de Especialización?`,
        htmlBody: personalizedBody
      });
      Utilities.sleep(1000); 
    }
  });

  ui.alert(`Se enviaron ${students.length} invitaciones.`);
}

/**
 * Genera los enlaces personalizados para cada estudiante.
 */
function generateCustomLinks() {
  const sheet = SpreadsheetApp.openById(CONFIG.SHEET_ID).getSheetByName(CONFIG.STUDENTS_SHEET_NAME);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return;
  
  const webAppUrl = CONFIG.WEB_APP_URL;
  if (!webAppUrl || webAppUrl === 'REPLACE_WITH_YOUR_WEB_APP_URL') {
     SpreadsheetApp.getUi().alert('Error: Configura la WEB_APP_URL en el script.');
     return;
  }

  const range = sheet.getRange(`C2:C${lastRow}`);
  const formulas = [];
  for (let i = 2; i <= lastRow; i++) {
    const formula = `=HYPERLINK("${webAppUrl}?email=" & A${i} & "&name=" & ENCODEURL(B${i}), "Enlace para " & B${i})`;
    formulas.push([formula]);
  }
  
  range.setFormulas(formulas);
  SpreadsheetApp.getUi().alert('¡Enlaces personalizados generados!');
}


// =================================================================
// --- NUEVA FUNCIÓN: Enviar recordatorio a estudiantes pendientes ---
// =================================================================

/**
 * Envía un correo de recordatorio a los estudiantes que no han completado el diagnóstico.
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

  const allStudents = studentsSheet.getRange('A2:B' + studentsSheet.getLastRow()).getValues();
  const respondedEmails = responsesSheet.getRange('B2:B' + responsesSheet.getLastRow()).getValues().flat();
  const respondedSet = new Set(respondedEmails);

  const pendingStudents = allStudents.filter(student => student[0] && !respondedSet.has(student[0]));

  if (pendingStudents.length === 0) {
    ui.alert('¡Todos los estudiantes han respondido! No se enviaron recordatorios.');
    return;
  }

  // --- PLANTILLA HTML DE RECORDATORIO ACTUALIZADA ---
  const emailTemplate = `
<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"><title>Tu Etapa de Especialización Comienza Ahora</title></head>
<body style="margin:0;padding:0;background-color:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
<center style="width:100%;table-layout:fixed;background-color:#f5f5f5;padding-bottom:60px;">
<table style="background-color:#ffffff;margin:0 auto;width:100%;max-width:600px;border-spacing:0;color:#1a1a1a;">
<tr><td style="padding:0;"><div style="background-color:#e16f7c;color:white;padding:30px;border-radius:12px 12px 0 0;text-align:center;">
<h1 style="margin:0;font-size:28px;color:white;line-height:1.2;">Tu Etapa de Especialización te espera</h1>
<p style="margin:10px 0 0 0;font-size:18px;color:white;">Aún estás a tiempo de prepararte</p>
</div></td></tr>
<tr><td style="padding:30px 20px;">
<p style="font-size:18px;color:#1a1a1a;">¡Hola, {{nombre_alumno}}!</p>
<p style="line-height:1.6;">Solo paso para recordarte que completes tu <strong>diagnóstico de especialización</strong>. Estamos en un momento clave de tu carrera y quiero asegurarme de darte el mejor acompañamiento.</p>
<div style="background-color:white;border-radius:12px;padding:20px;margin:25px 0;box-shadow:0 2px 6px rgba(0,0,0,0.1);border-left:4px solid #79858B;">
<h3 style="margin-top:0;color:#5a6469;font-size:20px;">🧭 Tu perspectiva es muy importante</h3>
<p style="line-height:1.6;">Tus respuestas son el primer paso para que platiquemos en el <strong>Café de Mentoría</strong>. ¡No te quedes fuera!</p>
<div style="text-align:center;margin-top:20px;"><a href="{{enlace_personalizado}}" style="display:inline-block;padding:12px 24px;background-color:#e16f7c;color:#ffffff;text-decoration:none;border-radius:20px;font-weight:bold;">Completar Diagnóstico (2 min)</a></div>
</div>
<div style="background-color:#fff3cd;border:2px solid #ffeaa7;border-radius:8px;padding:20px;margin:30px 0;text-align:center;">
<h3 style="margin:0;color:#856404;font-size:20px;">☕️🍩 ¡Nos vemos en el Café de Mentoría!</h3>
<div style="background-color:white;padding:15px;border-radius:8px;margin-top:15px;">
<p style="margin:0;font-size:16px;"><strong>Viernes 5 de septiembre:</strong> 9:00 AM - 3:00 PM</p>
<p style="margin:10px 0 0 0;font-size:14px;color:#5a6469;">📍 Área de Mentores, Centrales Sur 3er piso</p>
</div></div>
<p style="line-height:1.6;">¡Gracias y espero verte pronto!</p>
</td></tr>
<tr><td style="padding:0 20px 30px 20px;"><div style="border-top:2px solid #79858B;margin-top:20px;padding-top:20px;">
<p style="margin:0 0 5px 0;font-size:14px;color:#5a6469;font-weight:600;">Karen Ariadna Guzmán Vega</p>
<p style="margin:0 0 12px 0;font-size:12px;color:#666;">Mentora Estudiantil • Tecnológico de Monterrey • Comunidad Krei</p>
<p style="margin:0 0 15px 0;font-size:11px;color:#333;font-style:italic;">"Somos un equipo y estoy aquí para apoyarte" ✨</p>
<p style="margin:0;font-size:11px;">💬 <strong>WhatsApp:</strong> <a href="https://wa.me/5218128612913" style="color:#25D366;text-decoration:none;">+52 81 2861 2913</a></p>
</div></td></tr>
</table></center></body></html>
  `;

  pendingStudents.forEach(student => {
    const email = student[0];
    const name = student[1].split(' ')[0];
    const link = CONFIG.WEB_APP_URL + `?email=${email}&name=${encodeURIComponent(student[1])}`;
    
    let personalizedBody = emailTemplate.replace('{{nombre_alumno}}', name);
    personalizedBody = personalizedBody.replace('{{enlace_personalizado}}', link);
    
    MailApp.sendEmail({
      to: email,
      subject: `👋 ${name}, un recordatorio para tu diagnóstico de especialización`,
      htmlBody: personalizedBody
    });
    Utilities.sleep(1000);
  });

  ui.alert(`Se enviaron ${pendingStudents.length} recordatorios.`);
}

// =================================================================
// --- FUNCIONES PARA LA APLICACIÓN WEB INTERACTIVA ---
// =================================================================

function doGet(e) {
  const params = e.parameter;
  // Esta lógica es para el clic en los botones del correo de resultados.
  if (params.action === 'register') {
    const email = params.email;
    const topic = params.topic;
    if (email && topic) {
      try {
        const sheet = SpreadsheetApp.openById(CONFIG.SHEET_ID).getSheetByName(CONFIG.PROCESSED_SHEET_NAME);
        const data = sheet.getDataRange().getValues();
        const emailColumnIndex = data[0].indexOf('email');
        const interestColumnIndex = data[0].indexOf('interest_topic');
        
        for (let i = data.length - 1; i > 0; i--) {
          if (data[i][emailColumnIndex] === email) {
            sheet.getRange(i + 1, interestColumnIndex + 1).setValue(topic);
            Logger.log(`Interés '${topic}' registrado para ${email} en la fila ${i + 1}.`);
            break;
          }
        }
        return HtmlService.createHtmlOutput(`<body style="font-family: sans-serif; text-align: center; padding-top: 50px;"><h1>¡Gracias, ${params.name}!</h1><p>He registrado tu interés en el tema "<strong>${topic}</strong>". ¡Espero verte en nuestra sesión de mentoría!</p></body>`);
      } catch (error) {
        Logger.log(`Error al registrar interés para ${email}: ${error.toString()}`);
        return HtmlService.createHtmlOutput('<h1>Error</h1><p>No se pudo registrar tu interés. Por favor, intenta de nuevo.</p>');
      }
    }
  }

  // Lógica para mostrar la página web del cuestionario.
  const email = params.email;
  const name = params.name;
  if (!email || !name) {
    return HtmlService.createHtmlOutput('<h1>Error de Acceso</h1><p>Utiliza el enlace personalizado que recibiste por correo.</p>');
  }
  const template = HtmlService.createTemplateFromFile('index.html');
  template.email = email;
  template.name = name;
  return template.evaluate().setTitle('Plan de Vuelo de Especialización').addMetaTag('viewport', 'width=device-width, initial-scale=1.0');
}

function processWebAppSubmission(payload) {
  try {
    const student = payload.student;
    const answers = payload.answers;
    const scores = {
      score_servicio: answers.servicio_social || 0,
      score_semestre: answers.semestre_tec || 0,
      score_idioma: answers.idioma || 0,
      score_practicas: answers.practicas || 0
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
      ...scores,
      interest_topic: '',
      profile_scenario: scenario,
      version: CONFIG.VERSION
    };
    
    writeToProcessedSheet_(processedRecord);
    sendStudentEmail_(processedRecord);
    return {status: 'success'};
  } catch (error) {
    Logger.log(`Error en processWebAppSubmission: ${error.toString()}`);
    throw new Error('No se pudieron procesar los datos: ' + error.message);
  }
}

function sendStudentEmail_(record) {
  const webAppUrl = ScriptApp.getService().getUrl();
  const studentName = record.name.split(' ')[0];
  const scoreEntries = Object.entries({
    score_servicio: record.score_servicio,
    score_semestre: record.score_semestre,
    score_idioma: record.score_idioma,
    score_practicas: record.score_practicas
  }).sort(([, a], [, b]) => a - b);

  const opportunities = scoreEntries.slice(0, 2);
  const topic1 = getTopicName(opportunities[0][0]);
  const topic2 = getTopicName(opportunities[1][0]);
  const link1 = `${webAppUrl}?action=register&email=${record.email}&name=${encodeURIComponent(studentName)}&topic=${encodeURIComponent(topic1)}`;
  const link2 = `${webAppUrl}?action=register&email=${record.email}&name=${encodeURIComponent(studentName)}&topic=${encodeURIComponent(topic2)}`;

  let subject = '';
  let body = '';
  
  // --- IMPORTANTE: Crea el nuevo evento del 5 de Septiembre y pega su ID aquí ---
  const calendarEventId = PropertiesService.getScriptProperties().getProperty('calendarEventId');
  
  const calendarBlock = `
    <div style="background-color: #f8f9fa; border-radius: 12px; padding: 20px; margin: 30px 0; border: 2px solid #79858B; text-align: center;">
        <h3 style="margin: 0; color: #5a6469; font-size: 20px;">☕️🍩 Tu invitación al Café de Mentoría</h3>
        <p style="font-size: 16px; margin: 15px 0; line-height: 1.6;">He reservado un lugar para ti. Por favor, revisa tu calendario para ver y aceptar la invitación al evento.</p>
        <div style="background-color: white; padding: 15px; border-radius: 8px; margin-top: 15px;">
            <p style="margin: 0; font-size: 16px;"><strong>Viernes 5 de septiembre:</strong> 9:00 AM - 3:00 PM</p>
            <p style="margin: 10px 0 0 0; font-size: 14px; color: #5a6469;">📍 Área de Mentores, Centrales Sur 3er piso</p>
        </div>
    </div>
  `;

  switch (record.profile_scenario) {
    case 'Consolidado':
      subject = `🚀 ${studentName}, ¡felicidades por tu excelente preparación! Hablemos de tus próximos retos`;
      body = `
        <div style="background-color: #a5c882; color: white; padding: 25px; border-radius: 12px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px; color: white;">¡Excelente Preparación!</h1>
        </div>
        <p style="margin-top: 20px;">¡Hola, ${studentName}!</p>
        <p>¡Los resultados de tu diagnóstico son excelentes! Es muy emocionante ver que tienes un plan claro y un gran avance en tu preparación para la <strong>Etapa de Especialización</strong>. Te felicito mucho por tu gran trabajo y autonomía.</p>
        <p>Tener una preparación tan destacada como la tuya es una oportunidad increíble. Por favor, apenas tengas oportunidad, mándame un mensaje contándome más sobre tus planes. Quisiera saber cómo puedo ayudarte a potenciar aún más tu perfil y explorar los siguientes retos.</p>
        <div style="text-align: center; margin: 25px 0;">
            <a href="https://wa.me/521812612913" style="display: inline-block; padding: 12px 24px; background-color: #25D366; color: #ffffff; text-decoration: none; border-radius: 20px; font-weight: bold;">💬 Contarme por WhatsApp</a>
        </div>
        ${calendarBlock}
      `;
      break;

    case 'Oportunidad':
      subject = `🎯 ${studentName}, definamos tus prioridades para tu Etapa de Especialización`;
      body = `
        <div style="background-color: #e16f7c; color: white; padding: 25px; border-radius: 12px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px; color: white;">¡Es Momento de Trazar el Plan!</h1>
        </div>
        <p style="margin-top: 20px;">¡Hola, ${studentName}!</p>
        <p>Gracias por tu honestidad en el diagnóstico. ¡Estás justo a tiempo para fortalecer algunas áreas clave antes de que inicie tu <strong>Etapa de Especialización</strong>!</p>
        <p>He identificado que <strong>${topic1}</strong> y <strong>${topic2}</strong> son dos puntos excelentes para que empecemos a trabajar. El primer paso es que acudas al <strong>Café de Mentoría</strong> conmigo para que platiquemos de estas oportunidades. Para prepararlo mejor, por favor, elige cuál de estos dos temas es tu prioridad ahora mismo:</p>
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="text-align:center; margin: 25px 0;"><tr><td>
          <a href="${link1}" style="background-color: #79858B; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; margin: 5px; display: inline-block;">Me interesa más "${topic1}"</a>
          <a href="${link2}" style="background-color: #A8B0B4; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; margin: 5px; display: inline-block;">Me interesa más "${topic2}"</a>
        </td></tr></table>
        ${calendarBlock}
      `;
      break;

    default: // Desarrollo
      subject = `🧭 ${studentName}, tus resultados del diagnóstico para la Etapa de Especialización`;
      body = `
        <div style="background-color: #333c87; color: white; padding: 25px; border-radius: 12px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px; color: white;">Resultados de tu Diagnóstico</h1>
        </div>
        <p style="margin-top: 20px;">¡Hola, ${studentName}!</p>
        <p>Gracias por completar tu diagnóstico. He revisado tus resultados y veo que tienes áreas muy bien desarrolladas y otras donde podemos trazar un plan juntos para fortalecer tu entrada a la <strong>Etapa de Especialización</strong>.</p>
        <p>Las principales oportunidades que he identificado para ti son <strong>${topic1}</strong> y <strong>${topic2}</strong>. Para que el <strong>Café de Mentoría</strong> sea lo más relevante para ti, por favor, dime, ¿cuál de estos dos temas es tu prioridad para que platiquemos?</p>
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="text-align:center; margin: 25px 0;"><tr><td>
          <a href="${link1}" style="background-color: #79858B; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; margin: 5px; display: inline-block;">Me interesa más "${topic1}"</a>
          <a href="${link2}" style="background-color: #A8B0B4; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; margin: 5px; display: inline-block;">Me interesa más "${topic2}"</a>
        </td></tr></table>
        ${calendarBlock}
      `;
      break;
  }

  const footer = `
    <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;">
    <div style="border-top: 2px solid #79858B; margin-top: 20px; padding-top: 15px; font-size: 12px; color: #777;">
        <p style="margin: 0 0 5px 0; font-size: 14px; color: #5a6469; font-weight: 600;">Karen Ariadna Guzmán Vega</p>
        <p style="margin: 0 0 12px 0; font-size: 12px; color: #666;">Mentora Estudiantil • Tecnológico de Monterrey • Comunidad Krei</p>
        <p style="margin: 0 0 15px 0; font-size: 11px; color: #333; font-style: italic;">"Somos un equipo y estoy aquí para apoyarte" ✨</p>
        <p style="margin: 0; font-size: 11px;">
          💬 <strong>WhatsApp:</strong> <a href="https://wa.me/5218128612913" style="color: #25D366; text-decoration: none;">+52 81 2861 2913</a>
        </p>
    </div>
  `;
  
  const finalHtml = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 30px;">${body}${footer}</div>`;
  
  addCalendarInvitation_(calendarEventId, record.email);
  MailApp.sendEmail({ to: record.email, subject: subject, htmlBody: finalHtml });
}

function getTopicName(scoreKey) {
  const names = {
    'score_servicio': 'Avance de Servicio Social',
    'score_semestre': 'Decisión de Semestre Tec',
    'score_idioma': 'Certificación de Idioma',
    'score_practicas': 'Preparación para Prácticas'
  };
  return names[scoreKey] || 'Tema General';
}

function writeToProcessedSheet_(record) {
  const sheet = SpreadsheetApp.openById(CONFIG.SHEET_ID).getSheetByName(CONFIG.PROCESSED_SHEET_NAME);
  const headers = ["submission_ts", "email", "name", "score_servicio", "score_semestre", "score_idioma", "score_practicas", "interest_topic", "profile_scenario", "version"];
  if (sheet.getLastRow() === 0) {
      sheet.appendRow(headers);
  }
  const row = headers.map(header => record[header] !== undefined ? record[header] : '');
  sheet.appendRow(row);
}

function addCalendarInvitation_(eventId, studentEmail) {
  try {
    // CORRECCIÓN: La comprobación ahora busca el texto del placeholder.
    if (!eventId || eventId.startsWith('c_6bdaa96c76dd5a2fe5329fc119a27103562f5875b26f6ea0f3cccda80dffef31@group.calendar.google.com')) {
        Logger.log(`ID de evento no válido o es un placeholder: ${eventId}. No se enviará invitación a ${studentEmail}.`);
        return;
    }
    const event = CalendarApp.getEventById(eventId);
    if (event) {
      const guests = event.getGuestList();
      let isAlreadyInvited = guests.some(guest => guest.getEmail() === studentEmail);
      
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
// =================================================================
// --- FUNCIÓN DE CONFIGURACIÓN: EJECUTAR SOLO UNA VEZ ---
// =================================================================
/**
 * Crea el evento del Café de Mentoría y guarda su ID para uso futuro.
 */
function setupCalendarEvent() {
  // 1. Pega aquí el ID de tu CALENDARIO "Eventos Mentoría".
  // Este ID SÍ es el correcto y lo obtuvimos antes.
  const CALENDAR_ID = 'c_6bdaa96c76dd5a2fe5329fc119a27103562f5875b26f6ea0f3cccda80dffef31@group.calendar.google.com';

  // 2. Define los detalles de tu evento.
  const eventTitle = 'Café de Mentoría: Plan de Vuelo';
  const startTime = new Date('September 5, 2025 09:00:00 CST');
  const endTime = new Date('September 5, 2025 15:00:00 CST');
  const eventOptions = {
    description: 'Sesión abierta de mentoría para hablar sobre tu Plan de Vuelo de Especialización.',
    location: 'Área de Mentores, Centrales Sur 3er piso'
  };

  try {
    const calendar = CalendarApp.getCalendarById(CALENDAR_ID);
    if (!calendar) {
      SpreadsheetApp.getUi().alert(`Error: No se encontró el calendario con ID: ${CALENDAR_ID}`);
      return;
    }

    // Crea el evento
    const newEvent = calendar.createEvent(eventTitle, startTime, endTime, eventOptions);
    const eventId = newEvent.getId();

    // Guarda el ID del evento para que el script lo pueda usar siempre
    PropertiesService.getScriptProperties().setProperty('calendarEventId', eventId);

    SpreadsheetApp.getUi().alert('¡Éxito!', `El evento "${eventTitle}" fue creado y su ID ha sido guardado correctamente. Ya no necesitas ejecutar esto de nuevo.`, SpreadsheetApp.getUi().ButtonSet.OK);
    Logger.log(`ID del Evento guardado: ${eventId}`);

  } catch (e) {
    SpreadsheetApp.getUi().alert(`Ocurrió un error: ${e.toString()}`);
  }
}