import { IsOptional, IsString, ValidateIf, ValidationArguments, registerDecorator, ValidationOptions } from 'class-validator';

// Decorador personalizado para validar que al menos uno de los campos esté presente
function IsAtLeastOnePresent(property: string, validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isAtLeastOnePresent',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [property],
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const [relatedPropertyName] = args.constraints;
          const relatedValue = (args.object as any)[relatedPropertyName];
          return value || relatedValue;
        },
        defaultMessage(args: ValidationArguments) {
          const [relatedPropertyName] = args.constraints;
          return `Debe proporcionar al menos ${args.property} o ${relatedPropertyName}`;
        },
      },
    });
  };
}

export class GetConsultaECDto {
  @IsOptional()
  @IsString()
  @IsAtLeastOnePresent('dni', {
    message: 'Debe proporcionar al menos claveCatastral o dni'
  })
  claveCatastral?: string;

  @IsOptional()
  @IsString()
  dni?: string;
}