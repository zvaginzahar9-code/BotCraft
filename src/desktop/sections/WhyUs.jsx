import { useInView } from '../hooks/useInView.js';
import './sections.css';

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

export default function WhyUs() {
  const [headRef, headIn] = useInView({ rootMargin: '-15% 0px' });
  const [gridRef, cardsIn] = useInView({ rootMargin: '-8% 0px' });

  return (
    <section id="why" className="section why">
      <div className="container">
        <div ref={headRef} className={`section__head reveal reveal--head${headIn ? ' is-in' : ''}`}>
          <p className="eyebrow">Почему выбирают нас</p>
          <h2 className="section__title">Причины работать с&nbsp;BotCraft</h2>
        </div>

        <div ref={gridRef} className="why__bento">
          {reasons.map((r, i) => (
            <article
              key={r.n}
              className={`why__card reveal ${r.cls || ''}${cardsIn ? ' is-in' : ''}`}
              style={{ transitionDelay: `${i * 90}ms` }}
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
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
