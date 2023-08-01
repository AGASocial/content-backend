import { Module } from '@nestjs/common';
import { AuthorizationController } from './authorization.controller';
import { AuthorizationService } from './authorization.service';
import { RolesGuard } from './roles.guard';
import { FirebaseService } from 'src/firebase/firebase.service';
import { AuthService } from 'src/auth/auth.service';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule } from '@nestjs/config';
import { HashService } from 'src/utils/hash.service';
import { SessionSerializer } from 'src/auth/session.serializer';
import { JwtStrategy } from 'src/auth/strategies/jwt.strategy';
import { HttpModule } from '@nestjs/axios';
import { jwtSecret, jwtTime } from 'src/utils/constants';
import { StageGuard } from './stage.guard';
import { UsersModule } from 'src/users/users.module';
import { RolesModule } from 'src/roles/roles.module';
import { SessionModule } from 'src/session/session.module';
import { DataControlInterceptor } from './interceptor/dataControl.interceptor';
import { DataFiltererService } from 'src/utils/dataFilterer.service';
import { OtpValidatorGuard } from 'src/auth/otpValidator.guard';

@Module({
  controllers: [AuthorizationController],
  imports: [UsersModule, RolesModule, SessionModule,PassportModule.register({session: true}),ConfigModule.forRoot(), JwtModule.register({
    secret: jwtSecret,
    signOptions: {expiresIn: jwtTime}
  }), HttpModule, UsersModule],
  providers: [AuthorizationService, DataControlInterceptor, DataFiltererService, OtpValidatorGuard, RolesGuard, HashService,SessionSerializer, JwtStrategy, FirebaseService, AuthService, JwtService, StageGuard],
  exports: [AuthorizationService]
})
export class AuthorizationModule {}
