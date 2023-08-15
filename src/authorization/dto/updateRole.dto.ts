import { IsNotEmpty, IsOptional, IsString, IsBoolean } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";


export class UpdateRoleDto {

    @ApiProperty({
        description: 'Role name',
        example: 'Subscriber, Publisher or Admin',
    })
    @IsNotEmpty()
    @IsString()
    @IsOptional()
    public name: string;

    @ApiProperty({
        description: 'Describes the role and its nature',
        example: 'Subscribers are user that can buy courses and e-books offered by Publishers',
    })
    @IsNotEmpty()
    @IsString()
    @IsOptional()
    public description?: string;

    @ApiProperty({
        description: 'Indicates if the role is the default for new users. Subscriber is, Publisher and Admin are not',
        example: true,
    })
    @IsNotEmpty()
    @IsBoolean()
    @IsOptional()
    public isDefault?: boolean;

    @ApiProperty({
        description: 'Indicates if the role is enabled or disabled',
        example: true,
    })
    @IsNotEmpty()
    @IsBoolean()
    @IsOptional()
    public isActive?: boolean;


}