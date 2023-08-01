import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { AuthController } from './auth/auth.controller';
import { FirebaseService } from './firebase/firebase.service';
import { ConfigModule } from '@nestjs/config';
import { AuthorizationModule } from './authorization/authorization.module';
import { APP_GUARD } from '@nestjs/core';
import { RolesGuard } from './authorization/roles.guard';
import { AuthorizationController } from './authorization/authorization.controller';
import { AbilityModule } from './ability/ability.module';
import { PoliciesGuard } from './authorization/policies.guard';
import { StageGuard } from './authorization/stage.guard';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { throttlerLimit, timeToLive } from './utils/constants';
import { SessionModule } from './session/session.module';
import { RolesModule } from './roles/roles.module';
import { UnauthenticatedMiddleware } from './session/middleware/unauthenticated.middleware';
import { DataControlInterceptor } from './authorization/interceptor/dataControl.interceptor';
import { DataFiltererService } from './utils/dataFilterer.service';
import { HashService } from './utils/hash.service';
import { CsrfValidationMiddleware } from './session/middleware/csrfValidation.middleware';
import { CsrfProtectionMiddleware } from './session/middleware/csrfProtection.middleware';
import { AuthenticatedGuard } from './auth/authenticated.guard';


@Module({
    imports: [UsersModule, AuthModule, ConfigModule.forRoot(), AuthorizationModule, AbilityModule, ThrottlerModule.forRoot({
        ttl: timeToLive,
        limit: throttlerLimit
    }), SessionModule, RolesModule],
    controllers: [AppController, AuthController, AuthorizationController],
    providers: [
        AppService,
        DataControlInterceptor,
        DataFiltererService,
        StageGuard,
        PoliciesGuard,
        FirebaseService,
        HashService,
        
        {
            provide: APP_GUARD,
            useClass: RolesGuard,
        },
       
        {
            provide: APP_GUARD,
            useClass: ThrottlerGuard,
        },
    ],
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer
            .apply(CsrfProtectionMiddleware)
            .forRoutes({ path: '*', method: RequestMethod.ALL });

        consumer
            .apply(CsrfValidationMiddleware)
            .exclude(
                { path: 'auth/firebase/login', method: RequestMethod.POST },
                { path: 'auth/firebase/signup', method: RequestMethod.POST },
                { path: 'auth/firebase/credentials', method: RequestMethod.POST },
                { path: 'auth/firebase/credentials/otp', method: RequestMethod.PUT }
            )
            .forRoutes({ path: '*', method: RequestMethod.ALL });

        consumer
            .apply(UnauthenticatedMiddleware)
            .exclude({ path: 'auth/firebase/logout', method: RequestMethod.GET })
            .forRoutes({ path: '*', method: RequestMethod.ALL });

    }
}