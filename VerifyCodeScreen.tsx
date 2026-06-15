// src/services/firebase.ts
// Camada de acesso ao Firebase/Firestore. Centraliza toda a comunicação com
// o banco de dados: autenticação (cadastro/login), agendamentos, horários
// disponíveis, estatísticas do admin, financeiro e gerenciamento de usuários.
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection, query, where, getDocs, doc, setDoc,
  addDoc, deleteDoc, orderBy, getDoc, updateDoc, arrayRemove,
} from 'firebase/firestore';

// Configuração do projeto Firebase.
// As credenciais são carregadas via variáveis de ambiente (.env).
// Copie o arquivo .env.example para .env e preencha com os valores do seu
// projeto no console do Firebase (Configurações do projeto > Geral > Seus apps).
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Evita inicializar o app do Firebase mais de uma vez (importante no Expo,
// que pode recarregar este módulo durante o desenvolvimento)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);
export default app;

// Credenciais fixas do administrador da barbearia.
// Quem fizer login com este e-mail/senha entra como "admin" e acessa o
// painel administrativo em vez do app normal de cliente.
const ADMIN_EMAIL    = 'joao_admin@gmail.com';
const ADMIN_PASSWORD = '123456';

// ─── Autenticação ────────────────────────────────────────────────

// Cadastra um novo cliente no Firestore (coleção "users").
// Observação: a senha é salva em texto puro nesta versão. Para produção,
// recomenda-se migrar para o Firebase Authentication.
export async function registerUser(name: string, email: string, password: string) {
  try {
    const normalizedEmail = email.trim().toLowerCase();

    // Verifica se já existe um usuário com este e-mail
    const q = query(collection(db, 'users'), where('email', '==', normalizedEmail));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) return { success: false, error: 'Este e-mail já está cadastrado.' };

    // Gera um ID único baseado no timestamp atual
    const uid = `user_${Date.now()}`;
    await setDoc(doc(db, 'users', uid), {
      id: uid, name: name.trim(), email: normalizedEmail,
      phone: '', password, createdAt: new Date().toISOString(), role: 'client',
    });
    return { success: true, user: { id: uid, name: name.trim(), phone: '', email: normalizedEmail, role: 'client' } };
  } catch (err) {
    console.error('registerUser:', err);
    return { success: false, error: 'Erro ao cadastrar. Tente novamente.' };
  }
}

// Faz login do usuário comparando e-mail/senha com os dados salvos no Firestore.
// Caso as credenciais sejam as do admin fixo (constantes acima), retorna o
// usuário com role "admin" sem precisar consultar o banco.
export async function loginUser(email: string, password: string) {
  try {
    const normalizedEmail = email.trim().toLowerCase();

    // Login do administrador (credenciais fixas, sem registro no Firestore)
    if (normalizedEmail === ADMIN_EMAIL.toLowerCase() && password === ADMIN_PASSWORD) {
      return { success: true, user: { id: 'admin_joao', name: 'João Admin', phone: '', email: normalizedEmail, role: 'admin' as const } };
    }

    // Login de cliente: busca o usuário pelo e-mail
    const q = query(collection(db, 'users'), where('email', '==', normalizedEmail));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return { success: false, error: 'E-mail não encontrado. Cadastre-se primeiro.' };

    const data = snapshot.docs[0].data();
    if (data.password !== password) return { success: false, error: 'Senha incorreta.' };

    return { success: true, user: { id: data.id, name: data.name, phone: data.phone || '', email: data.email, role: (data.role || 'client') as 'client' | 'admin' } };
  } catch (err) {
    console.error('loginUser:', err);
    return { success: false, error: 'Erro ao fazer login. Tente novamente.' };
  }
}

// ─── Agendamentos ──────────────────────────────────────────────

// Retorna todos os agendamentos de uma data específica (usado no painel admin)
export async function getAppointmentsByDate(date: string) {
  try {
    const q = query(collection(db, 'appointments'), where('data', '==', date));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch { return []; }
}

// Remove um agendamento e devolve o horário liberado para a lista de
// horários disponíveis daquele dia
export async function deleteAppointment(id: string) {
  try {
    const snap = await getDoc(doc(db, 'appointments', id));
    if (snap.exists()) {
      const { data, horario } = snap.data();
      await deleteDoc(doc(db, 'appointments', id));
      // Restaurar o horário quando cancelar agendamento
      if (data && horario) {
        await restoreSlot(data, horario);
      }
    }
  } catch (err) {
    console.error('Erro ao deletar agendamento:', err);
  }
}

// Retorna o histórico de agendamentos de um usuário específico, do mais
// recente para o mais antigo (usado na tela de Perfil do cliente)
export async function getUserAppointments(userId: string) {
  try {
    const q = query(collection(db, 'appointments'), where('userId', '==', userId), orderBy('data', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as any));
  } catch { return []; }
}

// ─── Horários disponíveis ──────────────────────────────────────

// Retorna a lista de horários disponíveis (ainda não agendados) para uma
// determinada data. Esses horários são definidos pelo admin.
export async function getAvailableSlots(date: string): Promise<string[]> {
  try {
    const ref = doc(db, 'slots', date);
    const snap = await getDoc(ref);
    if (!snap.exists()) return [];
    return snap.data().times || [];
  } catch { return []; }
}

// Salva (substitui) a lista completa de horários disponíveis de uma data.
// Usado pelo admin ao "abrir" os horários do dia.
export async function saveAvailableSlots(date: string, times: string[]) {
  await setDoc(doc(db, 'slots', date), { times });
}

// Verifica se um horário ainda está disponível e, em caso positivo,
// remove-o da lista (impede que dois clientes agendem o mesmo horário).
// Retorna true se o horário foi removido com sucesso, false se já não
// estava mais disponível.
export async function checkAndRemoveSlot(date: string, time: string) {
  try {
    const ref = doc(db, 'slots', date);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const times = snap.data().times || [];
      if (times.includes(time)) {
        const updatedTimes = times.filter((t: string) => t !== time);
        await setDoc(ref, { times: updatedTimes });
        return true;
      }
    }
    return false;
  } catch (err) {
    console.error('Erro ao verificar e remover slot:', err);
    return false;
  }
}

// Devolve um horário para a lista de disponíveis (usado quando um
// agendamento é cancelado/excluído)
export async function restoreSlot(date: string, time: string) {
  try {
    const ref = doc(db, 'slots', date);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const times = snap.data().times || [];
      if (!times.includes(time)) {
        const updatedTimes = [...times, time].sort();
        await setDoc(ref, { times: updatedTimes });
      }
    }
  } catch (err) {
    console.error('Erro ao restaurar slot:', err);
  }
}

// ─── Estatísticas admin ────────────────────────────────────────

// Calcula os números exibidos nos cards do topo do painel administrativo:
// agendamentos de hoje, receita de hoje, total de usuários cadastrados e
// agendamentos da última semana.
export async function getAdminStats() {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Busca em paralelo: agendamentos de hoje, todos os usuários e todos os agendamentos
    const [todaySnap, usersSnap, weekSnap] = await Promise.all([
      getDocs(query(collection(db, 'appointments'), where('data', '==', today))),
      getDocs(collection(db, 'users')),
      getDocs(collection(db, 'appointments')),
    ]);

    const agendamentosHoje = todaySnap.size;
    const receitaHoje = todaySnap.docs.reduce((acc, d) => acc + (d.data().valor || 0), 0);
    const totalUsuarios = usersSnap.size;

    // Filtra os agendamentos feitos nos últimos 7 dias
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const agendamentosSemana = weekSnap.docs.filter(d => {
      const data = d.data().data;
      return data && data >= weekAgo.toISOString().split('T')[0];
    }).length;

    return { agendamentosHoje, receitaHoje, totalUsuarios, agendamentosSemana };
  } catch { return { agendamentosHoje: 0, receitaHoje: 0, totalUsuarios: 0, agendamentosSemana: 0 }; }
}

// ─── Financeiro ────────────────────────────────────────────────

// Retorna os dados financeiros (agendamentos, receita total e dados para o
// gráfico) filtrados pelo período escolhido: dia, semana, mês ou ano.
export async function getFinanceiroData(periodo: 'dia' | 'semana' | 'mes' | 'ano') {
  try {
    const today = new Date();
    let startDate = new Date();

    // Define a data inicial do período de busca de acordo com o filtro escolhido
    if (periodo === 'dia')    startDate.setDate(today.getDate());
    if (periodo === 'semana') startDate.setDate(today.getDate() - 7);
    if (periodo === 'mes')    startDate.setMonth(today.getMonth() - 1);
    if (periodo === 'ano')    startDate.setFullYear(today.getFullYear() - 1);

    const startStr = startDate.toISOString().split('T')[0];
    const q = query(collection(db, 'appointments'), where('data', '>=', startStr));
    const snapshot = await getDocs(q);

    const appointments = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as any));
    const total = appointments.reduce((acc: number, a: any) => acc + (a.valor || 0), 0);

    // Agrupa o valor total por data, para montar o gráfico de evolução
    const grouped: Record<string, number> = {};
    appointments.forEach((a: any) => {
      grouped[a.data] = (grouped[a.data] || 0) + (a.valor || 0);
    });
    // Pega as últimas 7 datas com movimento, em ordem cronológica
    const labels = Object.keys(grouped).sort().slice(-7);
    const values = labels.map(l => grouped[l]);

    return { appointments, total, labels, values };
  } catch { return { appointments: [], total: 0, labels: [], values: [] }; }
}

// ─── Usuários ──────────────────────────────────────────────────

// Retorna todos os usuários cadastrados (usado na tela "Usuários" do admin)
export async function getAllUsers() {
  try {
    const snapshot = await getDocs(collection(db, 'users'));
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as any));
  } catch { return []; }
}

// Exclui um usuário do Firestore pelo ID
export async function deleteUser(id: string) {
  await deleteDoc(doc(db, 'users', id));
}

// Marca um agendamento como "confirmado" pelo admin, registrando a data da
// confirmação e reiniciando a flag de notificação (para o cliente ser avisado)
export async function confirmAppointment(id: string) {
  try {
    await updateDoc(doc(db, 'appointments', id), {
      status: 'confirmado',
      confirmedAt: new Date().toISOString(),
      notified: false // Para o sistema de notificação do usuário
    });
    return true;
  } catch (err) {
    console.error('Erro ao confirmar agendamento:', err);
    return false;
  }
}

// Marca a notificação de um agendamento como já vista pelo usuário,
// evitando que o aviso apareça novamente
export async function markNotificationAsRead(appointmentId: string) {
  try {
    await updateDoc(doc(db, 'appointments', appointmentId), {
      notified: true
    });
    return true;
  } catch (err) {
    console.error('Erro ao marcar notificação:', err);
    return false;
  }
}
