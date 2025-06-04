import { PartialType } from '@nestjs/swagger';
import { CreateLocaleDto } from './create-local.dto';

export class UpdateLocalDto extends PartialType(CreateLocaleDto) {
  // All properties from CreateLocalDto are now optional for updates
}
