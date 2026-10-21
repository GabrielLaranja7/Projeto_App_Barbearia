# ✂️ App Barbearia do João

Aplicativo mobile de agendamento e gestão para barbearia, com área do cliente e painel administrativo para o barbeiro. Projeto desenvolvido com React Native, Expo e Firebase Firestore.

## 🎯 Objetivo

Permitir que clientes escolham serviços e marquem horários pelo celular, e que o barbeiro gerencie serviços, agenda, finanças e cadastro de clientes em um só lugar.

## ✨ Funcionalidades

### Área do cliente

- Login e cadastro com validação de dados
- Tela inicial com saudação personalizada e ações rápidas
- Catálogo de serviços com descrição, duração e preço (original e promocional)
- Fluxo de agendamento em 3 passos: serviço, data (calendário mensal) e horário (12h às 19h)
- Tela de revisão e modal de confirmação do agendamento
- Perfil com histórico de agendamentos (pendente/confirmado)
- Menu lateral (drawer) personalizado
- Tema claro/escuro e 4 tamanhos de fonte, salvos com AsyncStorage

### Painel administrativo

- Dashboard com agendamentos do dia, receita do dia, clientes e agendamentos da semana
- CRUD de serviços (cadastrar, editar e excluir, com preço, preço promocional, duração e categoria)
- Agenda: acompanhamento de agendamentos pendentes e abertura de horários disponíveis
- Financeiro mensal e diário, com gráfico de evolução
- Lista de clientes cadastrados, com busca por nome, e-mail ou telefone

## 🛠️ Tecnologias

| Tecnologia | Uso |
|---|---|
| React Native 0.81 + Expo SDK 54 | Aplicativo mobile |
| TypeScript | Tipagem estática |
| Zustand | Estado global (`authStore`, `themeStore`) |
| React Navigation v7 | Native Stack, Bottom Tabs e Drawer |
| Firebase Firestore | Banco NoSQL para usuários, serviços e agendamentos |
| AsyncStorage | Persistência das preferências de aparência |

## 🏗️ Estrutura do projeto

```
components/   # CustomDrawer, CustomAlert
hooks/        # useFirebase, useTheme
navigation/   # Rotas e configuração
screens/      # Telas (app/ e auth/)
services/     # Configuração do Firebase
store/        # Zustand (auth, theme)
theme/        # Tema dinâmico claro/escuro
```

A navegação usa Native Stack para autenticação, Bottom Tabs para a navegação principal e um Drawer personalizado à direita.

## ▶️ Como executar

> Confira os comandos abaixo com o `package.json` do repositório antes de publicar.

1. Instale o Node.js e o Git.
2. Clone o repositório:
   ```bash
   git clone https://github.com/GabrielLaranja7/Projeto_App_Barbearia.git
   cd Projeto_App_Barbearia
   ```
3. Instale as dependências:
   ```bash
   npm install
   ```
4. Configure o seu projeto no Firebase (Firestore) e preencha as credenciais no arquivo de configuração em `services/`.
5. Inicie o app:
   ```bash
   npx expo start
   ```
6. Abra no celular com o app Expo Go ou em um emulador.

## 📷 Demonstração

Adicione aqui capturas de tela da pasta `screenshots/`: login, home, serviços, agendamento, confirmação e painel administrativo.

## ⚠️ Limitações conhecidas e próximos passos

- **Autenticação:** atualmente as senhas são armazenadas em texto puro no Firestore. Esta versão é um projeto de estudo e **não deve ser usada em produção** sem antes migrar para o Firebase Authentication.
- Recuperação de senha por e-mail
- Notificações push (confirmações e lembretes)
- Suporte a múltiplas unidades
- Avaliações e comentários dos clientes
- Pagamento integrado

> Os dados exibidos nas telas (avaliação 4.9, clientes atendidos, anos de experiência e valores) são fictícios, usados para demonstração.

## 👨‍💻 Autor

Gabriel Laranja · [GitHub](https://github.com/GabrielLaranja7)
****
