import { motion } from 'framer-motion';
import { scrollTo } from '../lib/useSmoothScroll.js';
import './sections.css';

const EASE = [0.16, 1, 0.3, 1];

const TelegramGlyph = (
  <svg viewBox="0 0 24 24" aria-hidden>
    <path
      d="M21.9 4.3 18.6 20c-.2 1.1-.9 1.4-1.8.9l-5-3.7-2.4 2.3c-.3.3-.5.5-1 .5l.4-5.1 9.3-8.4c.4-.4-.1-.6-.6-.2L6 12.9l-4.9-1.5c-1.1-.3-1.1-1 .2-1.5l19.2-7.4c.9-.3 1.7.2 1.4 1.8z"
      fill="currentColor"
    />
  </svg>
);

const plans = [
  {
    name: 'Лендинг',
    price: 'от 60 000 ₸',
    tagline: 'Одностраничный сайт под запуск',
    features: ['Дизайн под ключ', 'Адаптив + анимации', 'Запуск за 3–5 дней', 'Форма заявок'],
    cls: 'plan--minimal',
    cta: 'Выбрать',
  },
  {
    name: 'Telegram-бот',
    price: 'от 90 000 ₸',
    tagline: 'Бот для продаж и автоматизации',
    features: ['Сценарии и меню', 'Оплаты и CRM', 'Рассылки и воронки', 'Аналитика'],
    cls: 'plan--telegram',
    icon: TelegramGlyph,
    cta: 'Выбрать',
  },
  {
    name: 'Бизнес-сайт',
    price: 'от 150 000 ₸',
    tagline: 'Многостраничный сайт с 3D',
    features: ['Уникальный дизайн', 'WebGL / 3D-сцены', 'CMS и интеграции', 'SEO', 'Поддержка 1 мес'],
    cls: 'plan--featured',
    badge: 'Популярный',
    cta: 'Обсудить проект',
  },
  {
    name: 'Индивидуальная\nразработка',
    price: 'индивидуально',
    tagline: 'Веб-приложение или платформа',
    features: ['Проектирование', 'Сложная логика', 'Личный кабинет', 'Долгосрочное развитие'],
    cls: 'plan--custom',
    cta: 'Обсудить',
  },
];

const reveal = {
  hidden: { opacity: 0, y: 70, scale: 0.96, filter: 'blur(16px)' },
  show: (i) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    filter: 'blur(0px)',
    transition: { duration: 0.95, delay: i * 0.1, ease: EASE },
  }),
};

export default function Pricing() {
  return (
    <section id="pricing" className="section pricing">
      <div className="container">
        <motion.div
          className="section__head"
          initial={{ opacity: 0, y: 30, filter: 'blur(8px)' }}
          whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          viewport={{ once: true, margin: '-15% 0px' }}
          transition={{ duration: 0.9, ease: EASE }}
        >
          <p className="eyebrow">Цены</p>
          <h2 className="section__title">Прозрачные тарифы</h2>
        </motion.div>

        {/* the whole group flies up on exit (useStory) */}
        <div id="pricing-cards" className="pricing__grid">
          {plans.map((p, i) => (
            <motion.article
              key={p.name}
              className={`plan ${p.cls}`}
              custom={i}
              variants={reveal}
              initial="hidden"
              whileInView="show"
              whileHover={{ y: -10, transition: { duration: 0.5, ease: EASE } }}
              viewport={{ once: true, margin: '-8% 0px' }}
            >
              <span className="plan__glow" aria-hidden />
              <div className="plan__top">
                {p.icon && <span className="plan__icon">{p.icon}</span>}
                {p.badge && <span className="plan__badge">{p.badge}</span>}
                <h3 className="plan__name">{p.name}</h3>
                <p className="plan__tagline">{p.tagline}</p>
              </div>

              <p className="plan__price">{p.price}</p>

              <ul className="plan__features">
                {p.features.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>

              <button className="plan__cta" onClick={() => scrollTo('#act-contact')}>
                {p.cta}
              </button>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
