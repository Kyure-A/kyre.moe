type ListProps = {
  items: string[];
  className?: string;
};

/**
 * Simple bulleted list.
 * Usage:
 *   <List items={['foo', 'bar']} />
 */
const List = ({ items, className = "" }: ListProps) => {
  return (
    <ul className={`list-disc pl-5 space-y-1 ${className}`}>
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
};

export default List;
