import { getResourceEmoji } from '../game/EmojiMap';

interface ResourceDisplayProps {
  resources: Record<string, number>;
}

export function ResourceDisplay({ resources }: ResourceDisplayProps) {
  return (
    <div>
      {Object.keys(resources).length === 0 ? (
        <p>No resources yet...</p>
      ) : (
        Object.entries(resources).map(([resource, amount]) => (
          <div key={resource}>
            {getResourceEmoji(resource)} {resource}: {amount.toFixed(2)}
          </div>
        ))
      )}
    </div>
  );
}
