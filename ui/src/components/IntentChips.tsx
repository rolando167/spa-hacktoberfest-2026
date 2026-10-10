import { iconForTag } from './icons';

export function IntentChips({ tags, small = false }: { tags: string[]; small?: boolean }) {
  return (
    <ul className={`chips ${small ? 'chips--small' : ''}`}>
      {tags.map((t) => {
        const Icon = iconForTag(t);
        return (
          <li key={t} className="chip">
            {!small && <Icon size={16} />}
            {t}
          </li>
        );
      })}
    </ul>
  );
}
