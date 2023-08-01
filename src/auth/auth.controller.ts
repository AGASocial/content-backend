import { Body, Controller,Get,Post,Put,Req,Res,UseGuards } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { LocalAuthGuard } from './strategies/local-auth.guard';
import { SignUpDto } from "./dto/signup.dto";
import { LogInDto } from "./dto/login.dto";
import { RecoverPasswordDto } from "./dto/recoverPassword.dto";
import { ChangePasswordDto } from "./dto/changePassword.dto"; 
import { LogInResponseDto } from "./dto/loginResponse.dto";
import { SignUpDtoResponse } from "./dto/signupResponse.dto";
import { RecoverPasswordDtoResponse } from "./dto/recoverPasswordResponse.dto";
import { ChangePasswordDtoResponse } from "./dto/changePasswordResponse.dto";
import { Request, Response } from "express";
import { LogOutResponseDto } from "./dto/logoutResponse.dto";
import { JwtAuthGuard } from "./strategies/jwt-auth.guard";
import { JwtRefreshGuard } from "./strategies/jwtRefresh.guard";
import { RefreshDto } from "./dto/refresh.dto";
//import { Throttle } from "@nestjs/throttler";
import { csrfCookieName, freezeLimit, freezeTime } from "src/utils/constants";
import { FreezedGuard } from "src/session/freezed.guard";
import * as qrcode from 'qrcode'
import { OtpValidatorGuard } from "./otpValidator.guard";
import { RecoverOtpDto } from "./dto/recoverOtp.dto";


@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService){}

    @Post('firebase/signup')
    async firebaseSignup(@Body() signUpDto: SignUpDto, @Res() res: Response) {

        let signUpDtoResponse: SignUpDtoResponse = await this.authService.firebaseSignUp(signUpDto);

        res.send ({
            statusCode: signUpDtoResponse.statusCode,
            message: signUpDtoResponse.message,
            otp_url: await qrcode.toDataURL(signUpDtoResponse.otp)
        })

    }

    @UseGuards(LocalAuthGuard, FreezedGuard)
    @Post('firebase/login')
    async firebaseLogin(@Body() logInDto: LogInDto, @Res() res: Response, @Req() req) {

       
        const loginResponseDto: LogInResponseDto = await this.authService.firebaseLogin(logInDto, req.user); //Here

        const { statusCode, message, bearer_token, authCookieAge, refresh_token, refreshCookieAge } = loginResponseDto;

        res.cookie('bearer_token', bearer_token, { signed: true, maxAge: authCookieAge });
        res.cookie('refresh_token', refresh_token, { signed: true, maxAge: refreshCookieAge });
        res.send({
            statusCode,
            message,
        })
    }

    @UseGuards(JwtAuthGuard,JwtRefreshGuard)
    @Put('firebase/session')
    async firebaseRefresh(@Res() res: Response, @Req() req){
        const jwtRefreshToken: string = req.signedCookies.refresh_token;
        const refreshDto: RefreshDto = {refresh_token: jwtRefreshToken}
        const {statusCode, message, bearer_token} = await this.authService.firebaseRefresh(refreshDto);
        res.cookie('bearer_token',bearer_token, {signed: true});
        res.send({
            statusCode,
            message
        })
    }

  
    
    @Post('firebase/credentials')
    firebaseRecoverPassword(@Body() recoverPasswordDto: RecoverPasswordDto): Promise<RecoverPasswordDtoResponse>{
        return this.authService.firebaseRecoverPassword(recoverPasswordDto);
    }

    @Put('firebase/credentials/otp')
    async firebaseRecoverOtp(@Body() recoverOtpDto: RecoverOtpDto, @Req() req: Request, @Res() res: Response) {
        let recoverOtpResponseDto = await this.authService.firebaseRecoverOtp(recoverOtpDto);

        res.send ({
            statusCode: recoverOtpResponseDto.statusCode,
            message: recoverOtpResponseDto.message,
            otp_url: await qrcode.toDataURL(recoverOtpResponseDto.otp)
        })
    }
    
    @UseGuards(JwtAuthGuard, OtpValidatorGuard)
    @Put('firebase/credentials')
    firebaseChangePassword(@Body() changePasswordDto: ChangePasswordDto, @Req() req: Request): Promise<ChangePasswordDtoResponse>{

        const jwtToken = req.signedCookies.refresh_token;
        return this.authService.firebaseChangePassword(changePasswordDto, jwtToken);
    }


    @UseGuards(JwtAuthGuard)
    @Get('firebase/logout')
    async logout(@Res() res: Response) {
        const logoutResponseDto: LogOutResponseDto = await this.authService.firebaseLogout();
        res.clearCookie('connect.sid');
        res.clearCookie('bearer_token');
        res.clearCookie('refresh_token');
        res.clearCookie(csrfCookieName);
        
        res.send(logoutResponseDto);
    }
}   