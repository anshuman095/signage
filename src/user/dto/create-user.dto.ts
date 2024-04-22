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
  @IsNotEmpty()
  @IsString()
  fName: string;

  @IsNotEmpty()
  @IsString()
  lName: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsOptional()
  @IsPhoneNumber('IN')
  phone_number: string;

  confirm_password: string;

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

  role: Role;
}
