import { motion } from 'framer-motion';
import './sections.css';

const EASE = [0.16, 1, 0.3, 1];

const reasons = [
  {
    n: '01',
    t: 'Скорость',
    d: 'Запуск за дни, а не недели. Отлаженный процесс без бесконечных согласований.',
    cls: 'why__card--feature',
    stat: '7 дней',
    statLabel: 'средний срок',
  },
  {
    n: '02',
    t: 'Дизайн уровня продукта',
    d: 'Сетки, типографика и ритм как у Apple, Linear и Stripe. Каждый пиксель на месте.',
    cls: 'why__card--wide',
  },
  { n: '03', t: 'Инженерия', d: 'React, WebGL и анимации. Чистый код, 98+ PageSpeed, 60 fps.' },
  {
    n: '04',
    t: 'Адаптивность',
    d: 'Идеально на десктопе и в кармане. Один выверенный опыт на любом экране.',
    cls: 'why__card--tall',
  },
  { n: '05', t: 'Прозрачность', d: 'Понятные этапы, фиксированные сроки и цена.' },
  { n: '06', t: 'Партнёрство', d: 'Не пропадаем после релиза: аналитика, итерации и рост.' },
];

const reveal = {
  hidden: { opacity: 0, y: 64, scale: 0.965, filter: 'blur(16px)' },
  show: (i) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    filter: 'blur(0px)',
    transition: { duration: 0.95, delay: i * 0.09, ease: EASE },
  }),
};

export default function WhyUs() {
  return (
    <section id="why" className="section why">
      <div className="container">
        <motion.div
          className="section__head"
          initial={{ opacity: 0, y: 30, filter: 'blur(8px)' }}
          whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          viewport={{ once: true, margin: '-15% 0px' }}
          transition={{ duration: 0.9, ease: EASE }}
        >
          <p className="eyebrow">Почему выбирают нас</p>
          <h2 className="section__title">Причины работать с&nbsp;BotCraft</h2>
        </motion.div>

        <div className="why__bento">
          {reasons.map((r, i) => (
            <motion.article
              key={r.n}
              className={`why__card ${r.cls || ''}`}
              custom={i}
              variants={reveal}
              initial="hidden"
              whileInView="show"
              whileHover={{ y: -7, transition: { duration: 0.5, ease: EASE } }}
              viewport={{ once: true, margin: '-8% 0px' }}
            >
              <span className="why__glow" aria-hidden />
              <span className="why__num">{r.n}</span>
              <div className="why__body">
                <h3 className="why__title">{r.t}</h3>
                <p className="why__desc">{r.d}</p>
              </div>
              {r.stat && (
                <div className="why__stat">
                  <span className="why__stat-value">{r.stat}</span>
                  <span className="why__stat-label">{r.statLabel}</span>
                </div>
              )}
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
