import LogoMark from '../components/Logo.jsx';
import './screens.css';

const Icon = {
  telegram: (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path
        d="M21.9 4.3 18.6 20c-.2 1.1-.9 1.4-1.8.9l-5-3.7-2.4 2.3c-.3.3-.5.5-1 .5l.4-5.1 9.3-8.4c.4-.4-.1-.6-.6-.2L6 12.9l-4.9-1.5c-1.1-.3-1.1-1 .2-1.5l19.2-7.4c.9-.3 1.7.2 1.4 1.8z"
        fill="currentColor"
      />
    </svg>
  ),
  whatsapp: (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path
        d="M12 2a10 10 0 0 0-8.6 15l-1.3 4.8 4.9-1.3A10 10 0 1 0 12 2zm5.5 14c-.2.6-1.2 1.1-1.7 1.2-.5.1-1 .1-1.6-.1-.4-.1-.9-.3-1.5-.6-2.6-1.1-4.3-3.7-4.4-3.9-.1-.2-1-1.4-1-2.6s.6-1.8.9-2.1c.2-.2.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 1.9c.1.2.1.3 0 .5-.3.6-.6.8-.4 1.1.5.9 1.1 1.4 1.9 1.9.2.1.4.1.5 0l.9-1c.2-.2.3-.2.6-.1l1.8.9c.3.1.4.2.5.3.1.3.1.9-.1 1.4z"
        fill="currentColor"
      />
    </svg>
  ),
  email: (
    <svg viewBox="0 0 24 24" aria-hidden>
      <rect x="3" y="5" width="18" height="14" rx="2.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="m4 7 8 6 8-6" fill="none" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  ),
};

const buttons = [
  {
    id: 'telegram',
    label: 'Telegram',
    handle: '@Trust7002',
    href: 'https://t.me/Trust7002',
    primary: true,
  },
  { id: 'whatsapp', label: 'WhatsApp', handle: '+7 707 291 123', href: 'https://wa.me/7707291123' },
  { id: 'email', label: 'Email', handle: 'botcraft.kz@gmail.com', href: 'mailto:botcraft.kz@gmail.com' },
];

/** The cinematic finale screen shown inside the final MacBook. */
export default function ContactOS() {
  return (
    <div className="finale">
      <div className="finale__grid-lines" aria-hidden />
      <div className="finale__glow" aria-hidden />

      <div className="finale__inner">
        <div className="finale__brand">
          <LogoMark className="finale__logo" filled />
          <span className="finale__wordmark">BotCraft</span>
        </div>

        <div className="finale__center">
          <p className="finale__eyebrow">Готовы начать?</p>
          <h2 className="finale__slogan">
            Давайте создадим ваш
            <br />
            следующий проект
          </h2>
          <p className="finale__sub">Ответим в течение часа в удобном для вас канале.</p>
        </div>

        <div className="finale__actions">
          {buttons.map((b, i) => (
            <a
              key={b.id}
              className={`finale__btn${b.primary ? ' finale__btn--primary' : ''}${
                b.id === 'telegram' ? ' finale__btn--tg' : ''
              }`}
              style={{ '--d': `${0.5 + i * 0.14}s` }}
              href={b.href}
              target="_blank"
              rel="noreferrer noopener"
            >
              <span className="finale__btn-icon">{Icon[b.id]}</span>
              <span className="finale__btn-text">
                <span className="finale__btn-label">{b.label}</span>
                <span className="finale__btn-handle">{b.handle}</span>
              </span>
              <span className="finale__btn-arrow">↗</span>
            </a>
          ))}
        </div>

        <div className="finale__foot">
          <span>© BotCraft</span>
          <a href="https://instagram.com/botc_raft" target="_blank" rel="noreferrer noopener">
            Instagram · botc_raft
          </a>
          <span>Ваш сайт за дни, а не недели</span>
        </div>
      </div>
    </div>
  );
}
