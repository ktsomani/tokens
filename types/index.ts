// types/index.ts
export type TokenTier = 'primitives' | 'semantics';

export interface Token {
  id: string;
  name: string;
  value: string; 
}

export type TokenSystem = Record<TokenTier, Record<string, Token>>;