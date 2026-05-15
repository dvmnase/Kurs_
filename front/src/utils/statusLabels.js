export const STATUS_LABELS = {
  NEW: 'Новая',
  PENDING: 'Ожидает рассмотрения',
  ACCEPTED: 'Принята',
  DECLINED: 'Отклонена',
  CANCELLED: 'Отменена',
  CANCELED: 'Отменена',
  IN_PROGRESS: 'В работе',
  COMPLETED: 'Завершена',
  APPROVED: 'Одобрена',
  REJECTED: 'Отклонена',
  ACTIVE: 'Активен',
  BLOCKED: 'Заблокирован',
  CLOSED: 'Закрыт',
  OPEN: 'Открыт',
  DRAFT: 'Черновик',
  PROCESSING: 'В обработке',
  IN_REVIEW: 'На проверке',
  SUBMITTED: 'Отправлена',
  ARCHIVED: 'В архиве',
  PAID: 'Оплачен',
  UNPAID: 'Не оплачен',
  ENABLED: 'Включён',
  DISABLED: 'Отключён',
  SUCCESS: 'Успешно',
  FAILED: 'Ошибка',
  ERROR: 'Ошибка',
};

export const getStatusKey = (status) => String(status || '').toUpperCase().trim();

export const getStatusLabel = (status) => {
  const key = getStatusKey(status);
  if (!key) return 'Не указан';
  return STATUS_LABELS[key] || 'Неизвестный статус';
};
