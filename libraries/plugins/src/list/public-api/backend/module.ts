import {Global, Module} from '@nestjs/common';

@Global()
@Module({
  imports: [],
  controllers: [],
  providers: [],
  get exports() {
    return [...this.imports];
  }
})
export default class PublicApiModule {}
