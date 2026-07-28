import { registerAs } from '@nestjs/config';

export default registerAs('validation', () => ({
  whitelist: true,
  transform: true,
}));
