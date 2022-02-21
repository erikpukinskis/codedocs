import React from 'react';

type DocProps = {
  path: string
  order?: number
  children: React.ReactNode
}

export const Doc = ({ children }: DocProps) => <>{children}</>