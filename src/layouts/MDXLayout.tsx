import type { ReactNode } from 'react';
import ChildrenListRenderer from '../components/ChildrenListRenderer';

interface Props {
  children: ReactNode;
}

/**
 * MDX layout that provides components to markdown content
 * This wrapper ensures ChildrenListRenderer is available in MDX
 */
export default function MDXLayout({ children }: Props) {
  return <>{children}</>;
}

export { ChildrenListRenderer };
