import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  createSecureId,
  MAX_FEEDBACK_LENGTH,
  sanitizeInput,
  saveSecureFeedback,
} from '../utils/security';

type ChatAuthor = 'bot' | 'user';
type ChatMode = 'root' | 'ods' | 'feedback';

type ChatMessage = {
  id: string;
  author: ChatAuthor;
  text: string;
};

type QuickAction = {
  label: string;
  onClick: () => void;
};

const FEEDBACK_RATE_LIMIT_MS = 5000;

function createMessage(author: ChatAuthor, text: string): ChatMessage {
  return {
    id: createSecureId(),
    author,
    text,
  };
}

export default function AboutChat() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<ChatMode>('root');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [lastFeedbackAt, setLastFeedbackAt] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const messagesRef = useRef<HTMLDivElement | null>(null);

  const resetChat = () => {
    setMode('root');
    setInput('');
    setMessages([createMessage('bot', 'Olá! Escolha uma opção.')]);
  };

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      resetChat();
    }
  }, [isOpen, messages.length]);

  useEffect(() => {
    messagesRef.current?.scrollTo({
      top: messagesRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const showOdsDetails = () => {
    setMode('ods');
    setMessages((current) => [
      ...current,
      createMessage(
        'bot',
        'As ODS são os Objetivos de Desenvolvimento Sustentável da ONU. Elas formam a Agenda 2030 e conectam justiça social, economia e proteção ambiental.',
      ),
    ]);
  };

  const startFeedback = () => {
    setMode('feedback');
    setMessages((current) => [
      ...current,
      createMessage(
        'bot',
        `Digite seu feedback (até ${MAX_FEEDBACK_LENGTH} caracteres) e clique em Enviar. Obrigado por contribuir com o projeto.`,
      ),
    ]);
  };

  const submitFeedback = async () => {
    const now = Date.now();

    if (now - lastFeedbackAt < FEEDBACK_RATE_LIMIT_MS) {
      setMessages((current) => [
        ...current,
        createMessage('bot', 'Aguarde alguns segundos antes de enviar outro feedback.'),
      ]);
      return;
    }

    const value = sanitizeInput(input);

    if (!value) {
      setMessages((current) => [
        ...current,
        createMessage('bot', 'O feedback está vazio ou inválido. Revise e tente novamente.'),
      ]);
      return;
    }

    setIsSubmitting(true);

    try {
      await saveSecureFeedback({
        text: value,
        at: new Date().toISOString(),
      });

      setMessages((current) => [
        ...current,
        createMessage('user', value),
        createMessage('bot', 'Recebido com segurança. Valeu pelo feedback!'),
      ]);

      setLastFeedbackAt(now);
      setInput('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const actions = useMemo<QuickAction[]>(() => {
    if (mode === 'ods') {
      return [
        {
          label: 'Ver as 17 ODS',
          onClick: () =>
            setMessages((current) => [
              ...current,
              createMessage(
                'bot',
                '1. Erradicação da pobreza\n2. Fome zero e agricultura sustentável\n3. Saúde e bem-estar\n4. Educação de qualidade\n5. Igualdade de gênero\n6. Água potável e saneamento\n7. Energia acessível e limpa\n8. Trabalho decente e crescimento econômico\n9. Indústria, inovação e infraestrutura\n10. Redução das desigualdades\n11. Cidades e comunidades sustentáveis\n12. Consumo e produção responsáveis\n13. Ação contra a mudança do clima\n14. Vida na água\n15. Vida terrestre\n16. Paz, justiça e instituições eficazes\n17. Parcerias e meios de implementação',
              ),
            ]),
        },
        {
          label: 'Por que importam?',
          onClick: () =>
            setMessages((current) => [
              ...current,
              createMessage(
                'bot',
                'As ODS ajudam a transformar conscientização em metas concretas. Elas orientam governos, empresas, escolas e comunidades a agir com foco em qualidade de vida, redução das desigualdades e preservação do planeta.',
              ),
            ]),
        },
        {
          label: 'Voltar',
          onClick: resetChat,
        },
      ];
    }

    if (mode === 'feedback') {
      return [
        {
          label: 'Voltar ao menu',
          onClick: resetChat,
        },
      ];
    }

    return [
      {
        label: 'Conhecer a PROCONSVATE',
        onClick: () => {
          setIsOpen(false);
          navigate('/proconsvate');
        },
      },
      {
        label: 'Conhecer as ODS',
        onClick: showOdsDetails,
      },
      {
        label: 'Deixar um feedback',
        onClick: startFeedback,
      },
    ];
  }, [mode, navigate]);

  return (
    <>
      <button
        type="button"
        className={`chat-launcher${isOpen ? ' chat-launcher--active' : ''}`}
        aria-expanded={isOpen}
        aria-controls="sobre-chat"
        onClick={() => setIsOpen((current) => !current)}
      >
        Chat
      </button>

      <aside
        id="sobre-chat"
        className={`chat${isOpen ? ' open' : ''}`}
        role="dialog"
        aria-label="Sobre o projeto PROCONSVATE"
        aria-modal="false"
      >
        <header className="chat-header">
          <strong>Sobre o projeto</strong>
          <button
            type="button"
            className="chat-close"
            aria-label="Fechar chat"
            onClick={() => setIsOpen(false)}
          >
            ×
          </button>
        </header>

        <div ref={messagesRef} className="messages" aria-live="polite">
          {messages.map((message) => (
            <div key={message.id} className={`msg ${message.author}`}>
              {message.text}
            </div>
          ))}
        </div>

        <div className="quick">
          {actions.map((action) => (
            <button
              key={action.label}
              type="button"
              className="quick-button"
              onClick={action.onClick}
            >
              {action.label}
            </button>
          ))}
        </div>

        {mode === 'feedback' ? (
          <div className="chat-footer">
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !isSubmitting) {
                  void submitFeedback();
                }
              }}
              type="text"
              placeholder="Digite seu feedback..."
              autoComplete="off"
              maxLength={MAX_FEEDBACK_LENGTH}
            />
            <button type="button" onClick={() => void submitFeedback()} disabled={isSubmitting}>
              {isSubmitting ? 'Enviando...' : 'Enviar'}
            </button>
          </div>
        ) : null}
      </aside>
    </>
  );
}
