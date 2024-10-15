import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Public')
@Controller('/public')
export class PublicController {

}
