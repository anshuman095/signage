import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';

export enum Role {
  SUPERADMIN = 'SUPERADMIN',
  ADMIN = 'ADMIN',
  USER = 'USER',
}
export class CreateUserDto {
  @ApiProperty({
    description: 'First name of the user',
    example: 'Jhon',
  })
  @IsNotEmpty()
  @IsString()
  fName: string;

  @ApiProperty({
    description: 'Last name of the user',
    example: 'Doe',
  })
  @IsNotEmpty()
  @IsString()
  lName: string;

  @ApiProperty({
    description: 'Email of the user',
    example: 'jhon@gmail.com',
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Phone number of the user',
    example: '+919876543210',
  })
  @IsOptional()
  @IsPhoneNumber('IN')
  phone_number: string;

  @ApiProperty({
    description: 'Confirm Password of the user',
    example: 'Jhon@12345',
  })
  confirm_password: string;

  @ApiProperty({
    description: 'Password of the user',
    example: 'Jhon@12345',
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(5)
  @Matches(/^(?=.*[A-Z]).{6,}$/, {
    message: 'Password must contain at least one uppercase letter.',
  })
  @Matches(/^(?=.*[0-9]).{6,}$/, {
    message: 'Password must contain at least one number.',
  })
  @Matches(/^(?=.*[^A-Za-z0-9]).{6,}$/, {
    message: 'Password must contain at least one special character.',
  })
  @Matches(/^[^\s]*$/, {
    message: 'Password should not contain any spaces.',
  })
  password: string;

  @ApiProperty({
    description: 'Role of the user',
    example: 'SUPERADMIN',
  })
  role: Role;
}
