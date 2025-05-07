import React from "react";

type ListProps = {
  items: React.ReactNode[];
  className?: string;
};

/**
 * Simple bulleted list.
 * Usage:
 *   <List items={['foo', 'bar']} />
 */
export default function List({ items, className = "" }: ListProps) {
  return (
    <ul className={`list-disc pl-5 space-y-1 ${className}`}>
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}
