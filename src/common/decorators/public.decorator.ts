import { SetMetadata } from '@nestjs/common';

// Metadatos para marcar endpoints públicos
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
