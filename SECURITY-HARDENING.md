# Plano de Correção de Segurança — PROCONSVATE

## 1) Ações imediatas (aplicadas neste patch)

- Sanitização e limitação de tamanho de input de feedback (`MAX_FEEDBACK_LENGTH = 500`).
- IDs de mensagens com entropia forte usando `crypto.randomUUID`/`crypto.getRandomValues`.
- Persistência sensível migrada para `sessionStorage` com criptografia AES-GCM via Web Crypto API.
- Controle básico de abuso (rate limiting no envio de feedback no chat).
- CSP básica adicionada no `index.html` para reduzir superfície de XSS e injeções.

## 2) Ações prioritárias de arquitetura (próxima sprint)

1. **Back-end dedicado para chat/feedback**
   - Remover persistência de dados sensíveis no navegador.
   - Expor endpoint autenticado para submissão de feedback.
2. **Autenticação e autorização**
   - Implementar login obrigatório para perfis internos (chefia/supervisoras).
   - Aplicar RBAC (Role-Based Access Control).
3. **Validação server-side obrigatória**
   - Revalidar todos os inputs no servidor.
   - Normalização e bloqueio de payloads maliciosos.
4. **Auditoria e rastreabilidade**
   - Criar trilha de auditoria (usuário, ação, timestamp, IP, user-agent).

## 3) Ações de segurança de plataforma

- HTTPS obrigatório com redirecionamento forçado.
- Cabeçalhos de segurança adicionais (HSTS, X-Content-Type-Options, Referrer-Policy, Permissions-Policy).
- Rate limiting no gateway/API (por IP + por identidade).
- Monitoramento e alertas para padrões de abuso.

## 4) Governança de dados

- Anonimização de feedback sempre que possível.
- Definir política de retenção e descarte seguro.
- Implementar base legal e consentimento (LGPD), com revisão jurídica.

## 5) Critérios de aceite de segurança

- [ ] Testes de XSS refletem bloqueio consistente.
- [ ] Inputs acima do limite não chegam ao servidor.
- [ ] Operações críticas exigem usuário autenticado.
- [ ] Logs de auditoria cobrindo ações críticas.
- [ ] Varredura SAST/DAST sem achados críticos.
