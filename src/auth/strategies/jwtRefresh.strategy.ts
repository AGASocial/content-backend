import { Injectable, Req } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Request } from "express";
import { ExtractJwt, Strategy } from "passport-jwt";
import { refreshSecret } from "src/utils/constants";

//Refreshes/Renovates the JWT Token used for users' access
@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'refresh'){
    constructor(){
        super({
            jwtFromRequest: ExtractJwt.fromExtractors([
                JwtRefreshStrategy.extractJWT 
            ]),
            ignoreExpiration: false,
            secretOrKey: refreshSecret,
            passReqToCallback: true
        })
    }

    async validate(payload: any){
        return {
            email: payload.name,
            id: payload.sub
        }
    }

    private static extractJWT(@Req() req: Request): string | null {
        if (req.signedCookies && 'refresh_token' in req.signedCookies) {
            return req.signedCookies.refresh_token;
        }
        else {
            return null
        }
    }
}