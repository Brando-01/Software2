const NotificationService = require('../services/NotificationService');

function makeFakeModel() {
  const rows = [];
  let seq = 1;
  return {
    rows,
    async create(data) {
      const row = { id: seq++, createdAt: new Date(), ...data };
      rows.push(row);
      return row;
    },
    async findAll({ where, order }) {
      return rows.filter((r) => {
        if (r.userId !== where.userId) return false;
        if (where.read !== undefined && r.read !== where.read) return false;
        return true;
      });
    },
    async update(values, { where }) {
      let affected = 0;
      rows.forEach((r) => {
        const matchUser = r.userId === where.userId;
        const matchId = where.id === undefined || r.id === where.id;
        const matchRead = where.read === undefined || r.read === where.read;
        if (matchUser && matchId && matchRead) {
          Object.assign(r, values);
          affected++;
        }
      });
      return [affected];
    }
  };
}

describe('NotificationService (HU-12)', () => {
  let model;
  let service;

  beforeEach(() => {
    model = makeFakeModel();
    service = new NotificationService(model);
  });

  test('onRiskEvent(RISK_ALERT_HIGH) crea notificaciones no leídas para borrower y lender', async () => {
    await service.onRiskEvent({
      type: 'RISK_ALERT_HIGH', loanId: 1, borrowerId: 10, lenderId: 20, ltv: 92
    });
    expect(model.rows.length).toBe(2);
    expect(model.rows.every((n) => n.read === false)).toBe(true);
    expect(model.rows[0].type).toBe('RISK_ALERT_HIGH');
  });

  test('onRiskEvent ignora eventos que no son de riesgo alto/crítico', async () => {
    const result = await service.onRiskEvent({ type: 'RISK_EVALUATION', loanId: 1, borrowerId: 10 });
    expect(result).toBeNull();
    expect(model.rows.length).toBe(0);
  });

  test('notify persiste una notificación in_app por defecto', async () => {
    const n = await service.notify(10, 'PAYMENT', 'Pago', 'Pago aplicado');
    expect(n.channel).toBe('in_app');
    expect(n.read).toBe(false);
    expect(model.rows.length).toBe(1);
  });

  test('Strategy de canal: notify por email usa el canal email simulado', async () => {
    const n = await service.notify(10, 'MATCH', 'Match', 'Match!', { channel: 'email' });
    expect(n.channel).toBe('email');
    expect(service.email.sent.length).toBe(1);
  });

  test('getForUser filtra solo no leídas con onlyUnread=true', async () => {
    await service.notify(10, 'PAYMENT', 'a', 'a');
    await service.notify(10, 'PAYMENT', 'b', 'b');
    await service.notify(10, 'PAYMENT', 'c', 'c');
    model.rows[0].read = true;

    const unread = await service.getForUser(10, true);
    expect(unread.length).toBe(2);
  });

  test('markAsRead y markAllAsRead actualizan el estado', async () => {
    const n1 = await service.notify(10, 'PAYMENT', 'a', 'a');
    await service.notify(10, 'PAYMENT', 'b', 'b');

    const affected = await service.markAsRead(n1.id, 10);
    expect(affected).toBe(1);
    expect(model.rows.find((r) => r.id === n1.id).read).toBe(true);

    const all = await service.markAllAsRead(10);
    expect(all).toBe(1);
  });
});
