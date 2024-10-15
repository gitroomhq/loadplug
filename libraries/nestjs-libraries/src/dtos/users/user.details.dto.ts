import { IsOptional, IsString, MinLength } from 'class-validator';

export class UserDetailDto {
  @IsString()
  @MinLength(3)
  fullname: string;

  @IsString()
  @IsOptional()
  bio: string;
}