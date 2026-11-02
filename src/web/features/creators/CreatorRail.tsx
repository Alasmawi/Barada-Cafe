import { Link } from 'react-router-dom';
import { useCreators } from '../../api/queries';
import { Ring } from '../rings/Ring';

const RAIL_SIZE = 8;

/** Most experienced first. Hidden until it has creators, so a failed load leaves no gap. */
export function CreatorRail() {
  const creators = useCreators('');
  const shown = [...(creators.data?.creators ?? [])]
    .sort((a, b) => b.servedCount - a.servedCount)
    .slice(0, RAIL_SIZE);

  if (shown.length === 0) return null;

  return (
    <section>
      <h2 className="group-label">Creators to invite</h2>
      <ul className="creator-rail">
        {shown.map((creator) => (
          <li key={creator.id}>
            <Link className="creator-rail__item" to="/business/creators">
              <Ring tags={creator.tags} size={68} name={creator.name} />
              <span className="creator-rail__name">{creator.name}</span>
              <span className="creator-rail__tag">{creator.tags[0]}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
