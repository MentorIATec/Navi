// API Client for interacting with the Google Apps Script Backend

// URL OFICIAL DE DESPLIEGUE (PRODUCCIÓN)
const DEFAULT_API_URL = 'https://script.google.com/macros/s/AKfycbySV0558WApICc3gFJGeOkdtfBjrPnDWgWHwC5IiNaOT7Gxt-d-knzvM0oXClH_b4jtZw/exec';

function getApiUrl() {
  return localStorage.getItem('navi_api_url') || DEFAULT_API_URL;
}

function isMockUrl(url) {
  return url.includes('AKfycbz');
}

export const apiClient = {
  /**
   * Obtiene datos del backend (doGet)
   */
  async get() {
    try {
      const apiUrl = getApiUrl();
      if (isMockUrl(apiUrl)) return this.mockRespuesta('getData');

      const response = await fetch(apiUrl);
      const result = await response.json();
      if (result.status === 'error') throw new Error(result.message);
      return result.data;
    } catch (error) {
      console.error('API Error (GET):', error);
      throw error;
    }
  },

  /**
   * Envía datos al backend (doPost)
   */
  async post(action, data = {}) {
    try {
      const apiUrl = getApiUrl();
      if (isMockUrl(apiUrl)) return this.mockRespuesta(action, data);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify({ action, data })
      });

      const result = await response.json();
      if (result.status === 'error') throw new Error(result.message);
      return result.data ?? result;
    } catch (error) {
      console.error(`API Error (POST) [${action}]:`, error);
      throw error;
    }
  },

  /**
   * Mock Data para pruebas del Frontend sin Backend
   */
  mockRespuesta(action, data) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        switch (action) {
          case 'getData': {
            const savedStudents = localStorage.getItem('navi_students');
            const savedMentors = localStorage.getItem('navi_mentors');
            resolve({
              students: savedStudents ? JSON.parse(savedStudents) : [],
              mentors: savedMentors ? JSON.parse(savedMentors) : []
            });
            break;
          }
          case 'findStudent': {
            const savedStudents = JSON.parse(localStorage.getItem('navi_students') || '[]');
            const savedMentors = JSON.parse(localStorage.getItem('navi_mentors') || '[]');
            const student = savedStudents.find(
              (item) => item.matricula?.toUpperCase() === data.matricula?.toUpperCase()
            );
            const mentor = student
              ? savedMentors.find((item) => item.nickname === student.mentor) || null
              : null;
            if (!student) {
              reject(new Error('Alumno no encontrado'));
              return;
            }
            resolve({ student, mentor });
            break;
          }
          case 'getMetas':
            resolve({
              prioritarias: [
                { id: 'prio-1', text: 'Regularizar mis materias clave para mantener mi avance', dimension: 'academica' },
                { id: 'prio-2', text: 'Fortalecer mi plan de prácticas profesionales para este semestre', dimension: 'profesional' },
                { id: 'prio-3', text: 'Avanzar con servicio social e inglés para no frenar mi graduación', dimension: 'cumplimiento' }
              ],
              complementarias: [
                { id: 'comp-1', text: 'Construir hábitos de estudio sostenibles durante el semestre', dimension: 'bienestar' },
                { id: 'comp-2', text: 'Mejorar mi organización personal y gestión del tiempo', dimension: 'autogestion' },
                { id: 'comp-3', text: 'Cuidar mi energía con rutinas de descanso y actividad física', dimension: 'bienestar' }
              ]
            });
            break;
          case 'saveMetasConfig':
          case 'saveGoalSelection':
            resolve(data);
            break;
          case 'updateStudent':
            console.log('Mock Update Student:', data);
            resolve({ status: 'success' });
            break;
          default:
            resolve({ status: 'success' });
        }
      }, 800);
    });
  }
};
