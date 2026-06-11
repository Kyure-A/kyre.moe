import { css, cx } from "styled-system/css";

type ListProps = {
  items: string[];
  className?: string;
};

/**
 * Simple bulleted list.
 * Usage:
 *   <List items={['foo', 'bar']} />
 */
const listClass = css({
  listStyleType: "disc",
  pl: "5",
  spaceY: "1",
});

const List = ({ items, className = "" }: ListProps) => {
  return (
    <ul className={cx(listClass, className)}>
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
};

export default List;
