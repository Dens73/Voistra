import type { AppNotification, Language } from '../app/types';
import { ActionIcon } from './app-primitives';

type NotificationCenterProps = {
  language: Language;
  notifications: AppNotification[];
  open: boolean;
  onClear: () => void;
  onToggle: () => void;
};

export function NotificationCenter({
  language,
  notifications,
  open,
  onClear,
  onToggle,
}: NotificationCenterProps) {
  const title = language === 'ru' ? 'Уведомления' : 'Notifications';
  const clearLabel = language === 'ru' ? 'Очистить' : 'Clear';
  const emptyLabel = language === 'ru' ? 'Пока ничего нового.' : 'Nothing new yet.';

  return (
    <div className="relative">
      <button
        className={open
          ? 'relative inline-grid h-11 w-11 place-items-center rounded-2xl bg-emerald-500 text-white'
          : 'relative inline-grid h-11 w-11 place-items-center rounded-2xl border border-white/6 bg-white/[0.03] text-slate-300 hover:bg-white/[0.06]'}
        type="button"
        onClick={onToggle}
        title={title}
      >
        <ActionIcon kind="bell" />
        {notifications.length > 0 ? (
          <span className="absolute -right-1 -top-1 inline-grid min-h-[20px] min-w-[20px] place-items-center rounded-full bg-red-500 px-1 text-[11px] font-bold text-white">
            {Math.min(notifications.length, 9)}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 top-14 z-[95] w-[320px] rounded-[24px] border border-white/6 bg-[#151a1d] p-3 shadow-[0_24px_64px_rgba(0,0,0,0.4)]">
          <div className="mb-2 flex items-center justify-between">
            <strong className="text-sm text-white">{title}</strong>
            {notifications.length > 0 ? (
              <button className="text-xs text-slate-400 hover:text-white" type="button" onClick={onClear}>
                {clearLabel}
              </button>
            ) : null}
          </div>
          <div className="grid max-h-[320px] gap-2 overflow-y-auto pr-1">
            {notifications.length === 0 ? (
              <div className="rounded-[18px] border border-white/6 bg-white/[0.03] p-3 text-sm text-slate-500">
                {emptyLabel}
              </div>
            ) : notifications.map((notification) => (
              <div key={notification.id} className="rounded-[18px] border border-white/6 bg-white/[0.03] p-3">
                <strong className="block text-sm text-white">{notification.title}</strong>
                <p className="mt-1 text-sm leading-5 text-slate-400">{notification.body}</p>
                <span className="mt-2 block text-[11px] text-slate-500">
                  {new Date(notification.createdAt).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
