// src/hooks/useFirebase.ts
import { useState, useEffect } from 'react';
import {
  collection, query, addDoc, updateDoc,
  doc, deleteDoc, orderBy, getDocs, where
} from 'firebase/firestore';
import { db, getAvailableSlots as fetchSlots, getUserAppointments, checkAndRemoveSlot } from '../services/firebase';

export interface Service {
  id: string;
  nome: string;
  description: string;
  price: number;
  valor: number;
  duration: number;
  duracao: number;
  category: string;
  imageUrl?: string;
  promoPrice?: number;
}

const DEFAULT_SERVICES: Service[] = [
  { id: '1', nome: 'Corte Tradicional', description: 'Corte feito na tesoura ou máquina com acabamento premium.', price: 50, valor: 50, duration: 30, duracao: 30, category: 'Cabelo' },
  { id: '2', nome: 'Barba de Lenhador', description: 'Design de barba com toalha quente e óleos essenciais.', price: 40, valor: 40, duration: 25, duracao: 25, category: 'Barba' },
  { id: '3', nome: 'Combo Premium', description: 'Cabelo + Barba + Lavagem especial.', price: 80, valor: 80, duration: 60, duracao: 60, category: 'Combo', promoPrice: 70 },
];

export function useFirebase() {

  const getServicos = async (): Promise<Service[]> => {
    try {
      const q = query(collection(db, 'services'), orderBy('name', 'asc'));
      const snapshot = await getDocs(q);
      if (snapshot.empty) return DEFAULT_SERVICES;
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          nome: data.nome || data.name || 'Sem nome',
          description: data.description || '',
          price: data.price || data.valor || 0,
          valor: data.price || data.valor || 0,
          duration: data.duration || 30,
          duracao: data.duration || 30,
          category: data.category || 'Geral',
          imageUrl: data.imageUrl,
          promoPrice: data.promoPrice,
        } as Service;
      });
    } catch (err) {
      console.warn('Fallback para serviços locais:', err);
      return DEFAULT_SERVICES;
    }
  };

  const createAgendamento = async (agendamento: any) => {
    return await addDoc(collection(db, 'appointments'), {
      ...agendamento,
      createdAt: new Date(),
    });
  };

  const getAvailableSlots = async (date: string): Promise<string[]> => {
    return fetchSlots(date);
  };

  const addService = async (service: any) => {
    await addDoc(collection(db, 'services'), { ...service, name: service.nome });
  };

  const updateService = async (id: string, data: any) => {
    await updateDoc(doc(db, 'services', id), { ...data, name: data.nome || data.name });
  };

  const deleteService = async (id: string) => {
    await deleteDoc(doc(db, 'services', id));
  };

  const getUserAgendamentos = async (userId: string) => {
    return getUserAppointments(userId);
  };

  const removeSlotAfterBooking = async (date: string, time: string) => {
    return checkAndRemoveSlot(date, time);
  };

  return { getServicos, createAgendamento, getAvailableSlots, addService, updateService, deleteService, getUserAgendamentos, removeSlotAfterBooking };
}

export const useServices = () => {
  const { getServicos } = useFirebase();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getServicos().then(data => {
      setServices(data);
      setLoading(false);
    });
  }, []);

  return { services, loading };
};

export const useAppointments = () => {
  const { createAgendamento, getUserAgendamentos, removeSlotAfterBooking } = useFirebase();
  return { createAppointment: createAgendamento, getUserAppointments: getUserAgendamentos, removeSlot: removeSlotAfterBooking };
};

export const useUserAppointments = (userId: string | undefined) => {
  const { getUserAgendamentos } = useFirebase();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      getUserAgendamentos(userId).then(data => {
        setAppointments(data);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [userId]);

  return { appointments, loading };
};
